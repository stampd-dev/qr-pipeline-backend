export type SplashLocation = {
  city: string;
  region?: string;
  country?: string;

  lat: number;
  lon: number;

  // Aggregates:
  totalScans: number; // how many scans from this city
  uniqueIps: number; // how many unique IPs from this city (optional but nice)

  firstSeenAt: string;
  lastSeenAt: string;
};

export type RefererStats = {
  PK: string; // REFERER
  SK: string; // referalCode
  referalCode: string;
  createdAt: string;
  updatedAt: string;
  totalScans: number;
  uniqueScans: number;
  ipUsage: { [ip: string]: number };
  splashLocations: SplashLocation[];
  referrerEmail: string;
  referrerName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  referrerTag: string;
  coinNumber: string;
  kickstarterUrl: string;
};
