//-------------------- CACHE CLEANUP --------------------//

function clearOldCache(hours = 1) {
  const ONE_HOUR = 60 * 60 * 1000;
  const expiryTime = hours * ONE_HOUR;
  const now = Date.now();

  for (let key in localStorage) {
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

clearOldCache(); // Run immediately on load

console.log('weather.js loaded!');

//-------------------- DOM ELEMENT REFERENCES --------------------//

const select = document.getElementById('citySelect');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const timestampElement = document.getElementById('timestamp');
const locationElement = document.getElementById('cityHeading');

//-------------------- FETCH & CACHE WEATHER DATA --------------------//

// Function to get weather data with localStorage cache support
async function getWeather(city) {
  const ONE_HOUR = 60 * 60 * 1000;
  const cacheKey = `weather_${city}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    const now = Date.now();
    if (now - timestamp < ONE_HOUR) {
      console.log('Using cached weather data');
      return data;
    }
  }

  const response = await fetch(`/api/weather?city=${city}`);
  const data = await response.json();

  localStorage.setItem(cacheKey, JSON.stringify({
    timestamp: Date.now(),
    data
  }));

  return data;
}

//-------------------- RATE LIMITING --------------------//

// Function to avoid calling the weather API more than once per hour
async function rateLimitedFetchWeather(city) {
  const ONE_HOUR = 60 * 60 * 1000;
  const rateLimitKey = `rateLimit_weather_${city}`;
  const lastRequest = localStorage.getItem(rateLimitKey);
  const now = Date.now();

  if (lastRequest && now - parseInt(lastRequest) < ONE_HOUR) {
    throw new Error('Rate limit: Wait at least an hour before trying again.');
  }

  const data = await getWeather(city);
  localStorage.setItem(rateLimitKey, now.toString());

  return data;
}

//-------------------- DISPLAY WEATHER INFO --------------------//

// Function to update DOM with weather data
function updateWeatherDisplay(data) {
  if (!data || data.error) {
    console.error('Error in weather data:', data?.error || 'Unknown error');
    alert('Could not fetch weather data. Please try again.');
    return;
  }

  locationElement.textContent = data.name;
  temperatureElement.textContent = `Temperature: ${Math.round(data.main.temp)}°C`;
  descriptionElement.textContent = `Forecast: ${data.weather[0].description}`;
  timestampElement.textContent = `Last updated: ${new Date(data.dt * 1000).toLocaleString()}`;
}

//-------------------- CITY SELECTION + INITIAL LOAD --------------------//

// On city dropdown change, fetch and display weather
select.addEventListener('change', async () => {
  const city = select.value;
  console.log('City selected:', city);
  if (city !== 'Select') {
    try {
      const data = await rateLimitedFetchWeather(city);
      updateWeatherDisplay(data);
    } catch (err) {
      console.warn(err.message);
    }
  }
});

// Fetch default city weather on page load
const defaultCity = select.value;
if (defaultCity !== 'Select') {
  rateLimitedFetchWeather(defaultCity)
    .then(updateWeatherDisplay)
    .catch(err => console.warn(err.message));
}
