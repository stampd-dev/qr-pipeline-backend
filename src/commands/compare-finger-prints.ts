export const compareFingerPrints = async ({
  fingerprint1,
  fingerprint2,
}: {
  fingerprint1: string;
  fingerprint2: string;
}) => {
  return fingerprint1 === fingerprint2;
};
