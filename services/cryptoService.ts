// services/cryptoService.ts

// FIX: Use relative paths for local modules
import { CryptoCurrency } from '../types';
import { get, set } from '../utils/storage';

const HISTORY_LENGTH = 100; // Increased history length for better chart context
const CACHE_KEY = 'cryptoPriceCache';
const CACHE_TTL_MS = 60 * 1000; // 60 seconds. Aligned with App.tsx refresh interval.

// Defines the structure for our cached data in localStorage.
interface CachedCryptoData {
  timestamp: number;
  // Using a Record for quick lookups by currency ID.
  data: Record<string, { price: number; change24h: number }>;
}

// Defines the structure of the relevant fields from the CoinGecko API response.
interface CoinGeckoMarketData {
    id: string;
    current_price: number;
    price_change_percentage_24h: number;
}

/**
 * Fetches the latest prices, 24h change, and updates price history for given cryptocurrencies.
 * This version uses the more robust CoinGecko '/coins/markets' endpoint and implements
 * localStorage caching to improve performance and reduce API calls.
 *
 * @param currencies The current array of CryptoCurrency objects.
 * @returns A promise that resolves to an updated array of CryptoCurrency objects.
 */
export const fetchCryptoPrices = async (currencies: CryptoCurrency[]): Promise<CryptoCurrency[]> => {
  if (currencies.length === 0) {
    return [];
  }

  const ids = currencies.map(c => c.id).join(',');
  const cachedData: CachedCryptoData | null = get(CACHE_KEY, null);

  // 1. Check for valid, fresh data in the cache.
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL_MS)) {
    // Ensure all requested currencies are present in the cached data.
    const allCurrenciesInCache = currencies.every(c => cachedData.data[c.id]);
    if (allCurrenciesInCache) {
      console.info("Using cached crypto prices.");
      return currencies.map(currency => {
        const cached = cachedData.data[currency.id];
        const newPriceHistory = [...(currency.priceHistory || []), cached.price];
        if (newPriceHistory.length > HISTORY_LENGTH) {
          newPriceHistory.shift();
        }
        return {
          ...currency,
          price: cached.price,
          change24h: cached.change24h,
          priceHistory: newPriceHistory,
        };
      });
    }
  }

  // 2. If cache is stale or missing data, fetch from the API.
  // Using '/coins/markets' for more comprehensive data.
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`;

  try {
    console.info("Fetching fresh crypto prices from API.");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API request failed: ${response.statusText} (${response.status})`);
    }
    // The '/coins/markets' endpoint returns an array of objects.
    const apiResult: CoinGeckoMarketData[] = await response.json();

    const newCachePayload: Record<string, { price: number; change24h: number }> = {};
    const apiDataMap = new Map(apiResult.map(item => [item.id, item]));

    const updatedCurrencies = currencies.map(currency => {
      const apiData = apiDataMap.get(currency.id);
      if (!apiData) {
        return currency; // Return original data if API response is missing this coin
      }

      const newPrice = apiData.current_price ?? currency.price;
      const newChange24h = apiData.price_change_percentage_24h ?? 0;

      // Prepare data for the new cache entry.
      newCachePayload[currency.id] = { price: newPrice, change24h: newChange24h };

      // Update price history.
      const newPriceHistory = [...(currency.priceHistory || []), newPrice];
      if (newPriceHistory.length > HISTORY_LENGTH) {
        newPriceHistory.shift();
      }

      return {
        ...currency,
        price: newPrice,
        change24h: newChange24h,
        priceHistory: newPriceHistory,
      };
    });

    // 3. Save the fresh data to the cache in localStorage.
    set<CachedCryptoData>(CACHE_KEY, {
        timestamp: Date.now(),
        data: newCachePayload
    });

    return updatedCurrencies;

  } catch (error) {
    console.error("Failed to fetch crypto prices:", error);
    
    // 4. Fallback strategy: If API fails, try to use stale cache to avoid showing zero values.
    if (cachedData) {
        const allCurrenciesInCache = currencies.every(c => cachedData.data[c.id]);
        if (allCurrenciesInCache) {
            console.warn("API fetch failed. Falling back to stale cache data.");
            return currencies.map(currency => {
                const cached = cachedData.data[currency.id];
                // When falling back, we don't add to price history to avoid stale/duplicate points.
                return {
                    ...currency,
                    price: cached.price,
                    change24h: cached.change24h,
                };
            });
        }
    }
    
    // If API fails and there's no usable cache, return the existing data to prevent a crash.
    return currencies;
  }
};
