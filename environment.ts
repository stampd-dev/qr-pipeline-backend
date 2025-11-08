export type Environment = {
  env: string;
  account_id: string;
  stackName: string;
  ipinfoToken: string;
};

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }

  return value;
};

export const environment: Environment = {
  env: getEnv("ENV_NAME"),
  account_id: getEnv("AWS_ACCOUNT_ID"),
  stackName: getEnv("STACK_NAME"),
  ipinfoToken: getEnv("IPINFO_TOKEN"),
};
