//-------------------- MODULES AND CONFIGURATION --------------------//

import express from 'express'; 
import fetch from 'node-fetch';
import dotenv from 'dotenv'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = 3000;
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;

app.use(express.static(path.join(__dirname, 'public')));


//-------------------- CLEAR CACHE --------------------//

document.getElementById('clearCacheBtn').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
});


//-------------------- WEATHER DATA CACHING --------------------//

// Load Cached weather data on page load
localStorage.setItem('weatherData', JSON.stringify(weatherData));
localStorage.setItem('weatherTimestamp', Date.now());

const weatherCache = localStorage.getItem('weatherData');
const weatherTimestamp = localStorage.getItem('weatherTimestamp');

if (weatherCache && Date.now() - weatherTimestamp < cacheExpiration) {
    const weather = JSON.parse(weatherCache);
    displayWeather(weather);
    console.log("Loaded weather from cache");
} else {
    fetchAndDisplayWeather(); // existing fetch logic
}


//-------------------- WEATHER API ROUTE --------------------//

// Weather endpoint to fetch data based on city
app.get('/api/weather', async (req, res) => {
    const city = req.query.city;
    const apiKey = process.env.API_KEY;

    try {
        console.log(`Fetching weather data for city: ${city}`);

        // Get geo data
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
        const geoData = await geoRes.json();

        if (!geoData || geoData.length === 0) {
            console.error(`City not found: ${city}`);
            return res.status(404).json({ error: 'City not found' });
        }

        const { lat, lon } = geoData[0];

        // Get weather data
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const weatherData = await weatherRes.json();

        if (!weatherData || weatherData.cod !== 200) {
            console.error(`Error fetching weather data: ${weatherData.message}`);
            return res.status(500).json({ error: 'Failed to fetch weather data' });
        }

        console.log('Weather data fetched:', weatherData);
        res.json(weatherData);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});


//-------------------- EXCHANGE RATE CACHING --------------------//

// Load Cached Exchange rates on page load
const cacheExpiration = 1000 * 60 * 30; // 30 minutes

const cachedRates = localStorage.getItem('exchangeRates');
const cachedBase = localStorage.getItem('exchangeBase');
const cachedTimestamp = localStorage.getItem('exchangeTimestamp');

if (cachedRates && cachedBase && cachedTimestamp) {
    const now = Date.now();
    if (now - cachedTimestamp < cacheExpiration) {
        currentRates = JSON.parse(cachedRates);
        fromCurrency.value = cachedBase;
        updateConvertedAmounts();
        console.log("Loaded exchange data from cache");
    } else {
        console.log("Exchange cache expired");
    }
}


//-------------------- EXCHANGE RATE API ROUTE --------------------//

// API route to fetch exchange rates
app.get('/api/rates', async (req, res) => {
  const { base, symbols } = req.query;

  if (!base || !symbols) {
    return res.status(400).json({ error: 'Missing base or symbols' });
  }

  const symbolList = symbols.split(','); // Turn CSV string into an array
  const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/${base}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const data = await response.json();

    // Dynamically filter rates
    const filteredRates = {};
    for (const symbol of symbolList) {
      if (data.conversion_rates[symbol]) {
        filteredRates[symbol] = data.conversion_rates[symbol];
      }
    }

    res.json({ rates: filteredRates });
  } catch (err) {
    console.error('Fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});


//-------------------- START SERVER --------------------//

// Start server and listen on PORT
app.listen(PORT, () => {
    console.log(`🌍 Server is running on http://localhost:${PORT}`);
});
