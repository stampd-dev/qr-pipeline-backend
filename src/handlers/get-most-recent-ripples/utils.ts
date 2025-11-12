export function shortenLocation(input: string, maxLen = 12): string {
  const cleaned = input.trim().replace(/\s+/g, " ");
  const [rawCity = "", rawCountry = ""] = cleaned
    .split(",")
    .map((s) => s?.trim() ?? "");
  if (!rawCity) return cleaned.slice(0, maxLen);

  const country = shortCountry(rawCountry || "");
  const sep = ", ";
  const keep = (s: string) =>
    s.length <= maxLen ? s : s.slice(0, Math.max(0, maxLen - 1)) + "…";

  const base = `${rawCity}${rawCountry ? sep + country : ""}`;
  if (base.length <= maxLen) return base;

  // 1) Try city with common substitutions (St, Ft, Mt)
  const city1 = citySubs(rawCity);
  const v1 = `${city1}${rawCountry ? sep + country : ""}`;
  if (v1.length <= maxLen) return v1;

  // 2) Try acronym of city words (skip stopwords): "New York" -> "NY", "Ho Chi Minh City" -> "HCMC"
  const acro = cityAcronym(city1);
  if (acro.length) {
    const v2 = `${acro}${rawCountry ? sep + country : ""}`;
    if (v2.length <= maxLen) return v2;
  }

  // 3) Consonant squeeze for city: remove interior vowels to compress (keep first char & vowels at word starts)
  const squeezed = squeezeCity(city1);
  const v3 = `${squeezed}${rawCountry ? sep + country : ""}`;
  if (v3.length <= maxLen) return v3;

  // 4) Final fallback: truncate city to fit with country (prefer keeping country)
  const tail = rawCountry ? sep + country : "";
  const roomForCity = Math.max(0, maxLen - tail.length);
  return keep(city1).slice(0, roomForCity) + tail;
}

function shortCountry(country: string): string {
  if (!country) return "";
  const c = country.trim();
  if (/^[A-Z]{2}$/.test(c)) return c; // already ISO-like (US, UK, FR)
  const map: Record<string, string> = {
    "United States": "US",
    "United States of America": "US",
    USA: "US",
    "United Kingdom": "UK",
    "Great Britain": "UK",
    England: "UK",
    "Viet Nam": "VN",
    Vietnam: "VN",
    "South Korea": "KR",
    "Republic of Korea": "KR",
    "North Korea": "KP",
    China: "CN",
    Taiwan: "TW",
    "Hong Kong": "HK",
    Macau: "MO",
    Japan: "JP",
    Canada: "CA",
    Mexico: "MX",
    Brazil: "BR",
    Argentina: "AR",
    Chile: "CL",
    Colombia: "CO",
    Peru: "PE",
    Spain: "ES",
    Portugal: "PT",
    France: "FR",
    Germany: "DE",
    Italy: "IT",
    Netherlands: "NL",
    Belgium: "BE",
    Luxembourg: "LU",
    Switzerland: "CH",
    Austria: "AT",
    Poland: "PL",
    "Czech Republic": "CZ",
    Greece: "GR",
    Turkey: "TR",
    Israel: "IL",
    "United Arab Emirates": "AE",
    "Saudi Arabia": "SA",
    Qatar: "QA",
    Kuwait: "KW",
    "South Africa": "ZA",
    Nigeria: "NG",
    Kenya: "KE",
    Egypt: "EG",
    Australia: "AU",
    "New Zealand": "NZ",
    India: "IN",
    Pakistan: "PK",
    Bangladesh: "BD",
    Indonesia: "ID",
    Malaysia: "MY",
    Singapore: "SG",
    Norway: "NO",
    Sweden: "SE",
    Finland: "FI",
    Denmark: "DK",
    Ireland: "IE",
    Iceland: "IS",
    Russia: "RU",
    Ukraine: "UA",
  };
  return (
    map[c] ?? (c.length <= 3 ? c.toUpperCase() : c.slice(0, 2).toUpperCase())
  );
}

function citySubs(city: string): string {
  // Common compressions
  return city
    .replace(/\bSaint\b/gi, "St")
    .replace(/\bSainte\b/gi, "Ste")
    .replace(/\bMount\b/gi, "Mt")
    .replace(/\bFort\b/gi, "Ft")
    .replace(/\bSankt\b/gi, "Skt")
    .replace(/\bCidade\b/gi, "Cda")
    .replace(/\bCity\b/gi, "Cty")
    .replace(/\s+/g, " ")
    .trim();
}

function cityAcronym(city: string): string {
  const stop = new Set([
    "of",
    "de",
    "da",
    "do",
    "das",
    "dos",
    "the",
    "la",
    "le",
    "du",
    "des",
    "del",
    "di",
    "e",
  ]);
  const words = city.split(/\s+/).filter(Boolean);
  const letters = words
    .filter((w) => !stop.has(w.toLowerCase()))
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return letters.length >= 2 ? letters : "";
}

function squeezeCity(city: string): string {
  // Remove interior vowels from each word, keep first letter; ensure min 3 chars overall
  const vowels = /[aeiou]/i;
  const words = city
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      if (w.length <= 3) return w;
      const head = w[0];
      const tail = w.slice(1).replace(/[aeiou]/gi, "");
      return (head + tail).slice(0, Math.max(3, w.length)); // allow some shortening
    });
  const joined = words.join(" ");
  return joined.length >= 3 ? joined : city.slice(0, 3);
}
