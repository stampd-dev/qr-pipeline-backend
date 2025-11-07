export type RefererStats = {
  PK: string; // REFERER
  SK: string; // referalCode
  referalCode: string;
  createdAt: string;
  updatedAt: string;
  totalScans: number;
  uniqueScans: number;
  ipUsage: { [ip: string]: number };
  referrerEmail: string;
  referrerName: string;
};
