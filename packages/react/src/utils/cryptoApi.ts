// Utility for fetching and caching crypto prices from CoinGecko

const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";
const CACHE_DURATION = 60 * 1000; // 1 minute

// In-memory cache: { 'btc-usd': { price: number, timestamp: number } }
const priceCache: Record<string, { price: number; timestamp: number }> = {};

export async function getCryptoPrice(
  crypto: string,
  fiat: string
): Promise<number> {
  const key = `${crypto}-${fiat}`.toLowerCase();
  const now = Date.now();
  console.log(`Fetching crypto price for ${key}`, priceCache);
  if (priceCache[key] && now - priceCache[key].timestamp < CACHE_DURATION) {
    console.log(`Using cached price for ${key}`);
    return priceCache[key].price;
  }
  const url = `${COINGECKO_API}?ids=${crypto}&vs_currencies=${fiat}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Failed to fetch crypto price");
  const data = await resp.json();
  const price = data[crypto]?.[fiat];
  if (typeof price !== "number") throw new Error("Invalid price data");
  priceCache[key] = { price, timestamp: now };
  return price;
}

// Optionally, add a function to clear the cache (for testing or force refresh)
export function clearCryptoPriceCache() {
  Object.keys(priceCache).forEach((key) => delete priceCache[key]);
}
