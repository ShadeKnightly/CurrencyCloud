//--------------------Constants & In-Memory Cache-------------------//

const cache = {};
const TARGET_CURRENCIES = ['CAD','USD','EUR','JPY','GBP','AUD','CHF','HKD','SGD','SEK'];
const THIRTY_MINUTES = 30 * 60 * 1000;

//--------------------Cache Cleanup-------------------//

// Remove expired exchange rate data from localStorage
export function clearOldCache(minutes = 30) {
  const expiryTime = minutes * 60 * 1000;
  const now = Date.now();

  for (let key in localStorage) {
    if (key.startsWith('rates_') || key.startsWith('rateLimit_rates_')) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (value?.timestamp && now - value.timestamp > expiryTime) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Ignore malformed values
      }
    }
  }
}

clearOldCache(); // Run immediately on load

//--------------------Fetch & Cache Exchange Rates-------------------//

// Fetch the exchange rate between the base currency and the target currencies
export async function getRateBetween(base) {
  // Check in-memory cache
  if (cache[base]) {
    console.log("Using in-memory cache");
    return cache[base];
  }

  // Check localStorage cache
  const cached = localStorage.getItem(`rates_${base}`);
  if (cached) {
    const { timestamp, rates } = JSON.parse(cached);
    const now = Date.now();
    if (now - timestamp < THIRTY_MINUTES) {
      console.log("Using cached exchange rates from localStorage");
      cache[base] = rates; // Save to memory
      return rates;
    }
  }

  // If not in cache, fetch from API
  const symbols = TARGET_CURRENCIES.join(',');
  const res = await fetch(`/api/rates?base=${base}&symbols=${symbols}`);
  const data = await res.json();

  // Cache in both memory and localStorage
  cache[base] = data.rates;
  localStorage.setItem(`rates_${base}`, JSON.stringify({
    timestamp: Date.now(),
    rates: data.rates
  }));

  console.log("Fetched fresh rates from API");
  return data.rates;
}

//--------------------Rate-Limited Wrapper-------------------//

// Wrapper to avoid calling the API more than once every 30 minutes
export async function rateLimitedFetchRates(base) {
  const rateLimitKey = `rateLimit_rates_${base}`;
  const now = Date.now();
  const lastRequest = localStorage.getItem(rateLimitKey);

  if (lastRequest && now - parseInt(lastRequest) < THIRTY_MINUTES) {
    throw new Error('Rate limit: Please wait a bit before refreshing rates.');
  }

  const data = await getRateBetween(base);
  localStorage.setItem(rateLimitKey, now.toString());
  return data;
}

//--------------------DOM Update for Exchange Display-------------------//

// Function to update exchange rates in the DOM for each target currency
export function updateExchangeRates(base, rates) {
  TARGET_CURRENCIES.forEach(currency => {
    const currencyElement = document.querySelector(`#${currency}`);

    if (currencyElement) {
      const exchangeRateElement = currencyElement.querySelector('.exchange-rate');
      const convertedAmountElement = currencyElement.querySelector('.converted-amount');

      const rate = rates[currency];
      exchangeRateElement.textContent = `1 ${base} = ${rate} ${currency}`;

      const fromAmount = document.querySelector('#fromAmount').value;
      if (fromAmount) {
        const convertedAmount = (fromAmount * rate).toFixed(2);
        convertedAmountElement.textContent = `${fromAmount} ${base} = ${convertedAmount} ${currency}`;
      }
    }
  });
}
