function shortenName(fullName: string): string {
  const trimmed = fullName.trim();
  if (trimmed.length <= 12) return trimmed;

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    // Single long name: just cut off with ellipsis
    return parts[0].slice(0, 9) + "...";
  }

  const first = parts[0];
  const last = parts[parts.length - 1];

  // Try "First L." pattern
  const short1 = `${first} ${last[0]}.`;
  if (short1.length <= 12) return short1;

  // Try "F. Last" pattern
  const short2 = `${first[0]}. ${last}`;
  if (short2.length <= 12) return short2;

  // Try initials only "F.L."
  const initials = parts.map((p) => p[0].toUpperCase()).join(".");
  const short3 = initials + ".";
  if (short3.length <= 12) return short3;

  // Final fallback: truncate + ellipsis
  return trimmed.slice(0, 9) + "...";
}

// Examples:
console.log(shortenName("Michael Johnson")); // "Michael J."
console.log(shortenName("Elizabeth Alexandra Mary Windsor")); // "E.A.M.W."
console.log(shortenName("Christopher")); // "Christop..."

export const getReferrerName = (referrer: string) => {
  if (!referrer || referrer === "Default Pirate Coin") {
    return shortenName("Noones Ark Organization");
  }
  if (referrer === "test code") {
    return shortenName("Scootz McGootz");
  }
  return shortenName(referrer);
};
