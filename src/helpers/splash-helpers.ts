import { SplashLocation } from "../types/dynamo";
import { ResolvedIpLocation } from "../types/ip";

type UpsertArgs = {
  existing: SplashLocation[];
  resolved: ResolvedIpLocation | null;
  isUniqueIp: boolean;
  nowIso: string;
};

export const upsertSplashLocation = ({
  existing,
  resolved,
  isUniqueIp,
  nowIso,
}: UpsertArgs): SplashLocation[] => {
  if (!resolved) return existing;

  const { city, region, country, lat, lon } = resolved;

  // Require at minimum a city + lat/lon to plot
  if (!city || lat == null || lon == null) {
    return existing;
  }

  const index = existing.findIndex(
    (loc) =>
      loc.city === city && loc.region === region && loc.country === country
  );

  // No existing location for this city -> create new one
  if (index === -1) {
    const newLocation: SplashLocation = {
      city,
      region,
      country,
      lat,
      lon,
      totalScans: 1,
      uniqueIps: isUniqueIp ? 1 : 0,
      firstSeenAt: nowIso,
      lastSeenAt: nowIso,
    };

    return [...existing, newLocation];
  }

  // Update existing location
  const updated = [...existing];
  const current = { ...updated[index] };

  current.totalScans = (current.totalScans ?? 0) + 1;

  if (isUniqueIp) {
    current.uniqueIps = (current.uniqueIps ?? 0) + 1;
  }

  // firstSeenAt = earliest of existing vs now
  if (!current.firstSeenAt) {
    current.firstSeenAt = nowIso;
  } else {
    const first = new Date(current.firstSeenAt);
    const nowDate = new Date(nowIso);
    if (nowDate < first) {
      current.firstSeenAt = nowIso;
    }
  }

  // lastSeenAt = latest of existing vs now
  if (!current.lastSeenAt) {
    current.lastSeenAt = nowIso;
  } else {
    const last = new Date(current.lastSeenAt);
    const nowDate = new Date(nowIso);
    if (nowDate > last) {
      current.lastSeenAt = nowIso;
    }
  }

  updated[index] = current;
  return updated;
};

const PRIVATE_IP_REGEX =
  /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.|::1)/;

export const resolveIpLocation = async (
  ip: string
): Promise<ResolvedIpLocation | null> => {
  // Ignore obviously local / private IPs
  if (!ip || PRIVATE_IP_REGEX.test(ip)) {
    return null;
  }

  const token = process.env.IPINFO_TOKEN;
  if (!token) {
    console.warn("resolveIpLocation: IPINFO_TOKEN is not set");
    return null;
  }

  const url = `https://ipinfo.io/${encodeURIComponent(
    ip
  )}/json?token=${encodeURIComponent(token)}`;

  try {
    // Node 18+ has global fetch; if TS complains, add "dom" lib or swap to node-fetch.
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(
        `resolveIpLocation: ipinfo request failed for ${ip} with status ${res.status}`
      );
      return null;
    }

    const data = (await res.json()) as {
      city?: string;
      region?: string;
      country?: string;
      loc?: string; // "lat,lon"
      [key: string]: unknown;
    };

    if (!data.loc) {
      // no coordinate info; not useful for the map
      return null;
    }

    const [latStr, lonStr] = data.loc.split(",");
    const lat = Number(latStr);
    const lon = Number(lonStr);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    const result: ResolvedIpLocation = {
      city: data.city,
      region: data.region,
      country: data.country,
      lat,
      lon,
    };

    return result;
  } catch (err) {
    console.error("resolveIpLocation: error resolving IP", { ip, err });
    return null;
  }
};
