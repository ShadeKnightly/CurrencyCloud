//-------------------- SCRIPT INITIALIZATION --------------------//

console.log("script.js loaded");

import { getRateBetween } from './exchange.js';

//-------------------- DOM READY EVENT --------------------//

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded");

  // Grab core DOM elements
  const fromCurrency = document.getElementById('fromCurrency');
  const fromAmount = document.getElementById('fromAmount');
  const currencyElements = document.querySelectorAll('.card p');

  if (!fromCurrency || !fromAmount) {
    console.error("Either the fromCurrency or fromAmount element is missing!");
    return;
  }

  let currentRates = {};

  //-------------------- UPDATE DISPLAYED CONVERSIONS --------------------//

  function updateConvertedAmounts() {
    console.log("updateConvertedAmounts() triggered");
    const amount = parseFloat(fromAmount.value);
    if (isNaN(amount)) {
      console.log("Invalid amount:", fromAmount.value);
      return;
    }

    currencyElements.forEach(p => {
      const currencyCode = p.id;
      const convertedSpan = p.querySelector('.converted-amount');
      const rateSpan = p.querySelector('.exchange-rate');
      const rate = currentRates[currencyCode];

      if (rate) {
        const converted = (amount * rate).toFixed(2);
        convertedSpan.textContent = `${fromAmount.value} ${fromCurrency.value} = ${converted} ${currencyCode}`;
        rateSpan.textContent = `1 ${fromCurrency.value} = ${rate.toFixed(4)} ${currencyCode}`;
      } else {
        convertedSpan.textContent = '';
        rateSpan.textContent = '';
      }
    });
  }

  //-------------------- HOVER EFFECTS --------------------//

  function attachHoverListeners() {
    console.log("Attaching hover listeners");
    currencyElements.forEach(p => {
      const convertedSpan = p.querySelector('.converted-amount');
      p.addEventListener('mouseenter', () => {
        console.log("Hover enter on:", p.id);
        if (convertedSpan.textContent) {
          convertedSpan.style.opacity = '1';
        }
      });
      p.addEventListener('mouseleave', () => {
        convertedSpan.style.opacity = '0';
      });
    });
  }

  //-------------------- FETCH & UPDATE RATES --------------------//

  async function updateRates() {
    console.log("updateRates() triggered");
    const base = fromCurrency.value;
    if (!base) {
      console.log("updateRates aborted: base currency missing.");
      return;
    }

    try {
      currentRates = await getRateBetween(base);
      console.log("Rates updated:", currentRates);
      updateConvertedAmounts();
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    }
  }

  //-------------------- EVENT LISTENERS --------------------//

  fromCurrency.addEventListener('change', () => {
    console.log("Currency changed to:", fromCurrency.value);
    updateRates();
  });

  fromAmount.addEventListener('input', () => {
    console.log("Amount input changed to:", fromAmount.value);
    updateConvertedAmounts();
  });

  //-------------------- INITIALIZATION --------------------//

  attachHoverListeners();
});