// @ts-ignore
import { SERVICE_API_KEY } from "@fileverse-dev/formulajs/crypto-constants";

export const API_KEY_PLACEHOLDER: Record<string, string> = Object.fromEntries(
  Object.values(SERVICE_API_KEY).map((key: any) => [
    key,
    `${key.replace(/_/g, " ").replace(/\bAPI\b/, "API key")}`,
  ])
);

export const COMIMG_SOON_FUNCTIONS = [
  "UNISWAP",
  "ARTEMIS",
  "AAVE",
  "AERODOME",
  "PENDLE",
];
