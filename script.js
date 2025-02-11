
const API_KEY = "XXXXXXXXXXXXXXXXXXXXXXXXX";
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/EUR`;

let exchangeRates = {};

// get realtime exchange rates 
async function fetchExchangeRates() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.result === "success") {
            exchangeRates = data.conversion_rates;
            console.log("Exchange rates updated:", exchangeRates);
            populateCurrencyDropdown();
            updateOverview();
        } else {
            console.error("Failed to fetch exchange rates:", data["error-type"]);
        }
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
    }
}

const allCurrencies = [];
const form = document.querySelector('#biljet-form');
const currencySelect = document.querySelector('#currency');
const amountInput = document.querySelector('#amount');
const totalDisplay = document.querySelector('#total');
const overviewTable = document.querySelector('#overview tbody');

let biljetCollection = JSON.parse(localStorage.getItem('biljetCollection')) || {};

// dropdown
function populateCurrencyDropdown() {
    currencySelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = 'Search or select currency...';
    currencySelect.appendChild(defaultOption);

    // dropdown
    Object.keys(exchangeRates).forEach((code) => {
        const name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || code;

        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${code} - ${name}`;
        currencySelect.appendChild(option);
    });
}



function updateOverview() {
    overviewTable.innerHTML = '';
    let total = 0;

    Object.entries(biljetCollection).forEach(([currency, data]) => {
        const rate = exchangeRates[currency];

        if (!rate) {
            console.error(`Exchange rate for ${currency} not found.`);
            return;
        }

        // get value in euro
        const valueInEUR = data.amount / rate;
        total += valueInEUR;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.name}</td>
            <td>${data.amount}</td>
            <td>€${valueInEUR.toFixed(2)}</td>
            <td>
                <button class="action-btn edit" onclick="editBiljet('${currency}')">Edit</button>
                <button class="action-btn" onclick="deleteBiljet('${currency}')">Delete</button>
            </td>
        `;
        overviewTable.appendChild(row);
    });

    totalDisplay.textContent = total.toFixed(2);
    localStorage.setItem('biljetCollection', JSON.stringify(biljetCollection));
}


function addBiljet(e) {
    e.preventDefault();

    const currency = currencySelect.value;
    const amount = parseFloat(amountInput.value);

    if (!currency || isNaN(amount) || amount <= 0) return alert('Please enter valid details.');

    const currencyName = allCurrencies.find((c) => c.startsWith(currency))?.split(' - ')[1] || currency;

    // Add the biljet to the collection
    biljetCollection[currency] = {
        name: currencyName,
        amount: (biljetCollection[currency]?.amount || 0) + amount
    };

    // reset
    form.reset();
    updateOverview();
}


function editBiljet(currency) {
    const newAmount = prompt('Enter the new amount:', biljetCollection[currency].amount);
    if (newAmount === null || isNaN(newAmount) || newAmount <= 0) return;

    biljetCollection[currency].amount = parseFloat(newAmount);
    updateOverview();
}

function deleteBiljet(currency) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    delete biljetCollection[currency];
    updateOverview();
}

// initialize
fetchExchangeRates();
form.addEventListener('submit', addBiljet);


const addCurrencyForm = document.querySelector('#add-currency-form');
const newCurrencyInput = document.querySelector('#new-currency');
const exchangeRateInput = document.querySelector('#exchange-rate');


// add a new currency
function addNewCurrency(e) {
    e.preventDefault();

    const newCurrencyCode = newCurrencyInput.value.toUpperCase().trim();
    const exchangeRate = parseFloat(exchangeRateInput.value);

    if (!newCurrencyCode || !/^[A-Z]{3}$/.test(newCurrencyCode)) {
        return alert('Please enter a valid 3-letter currency code.');
    }

    if (isNaN(exchangeRate) || exchangeRate <= 0) {
        return alert('Please enter a valid exchange rate.');
    }

    if (exchangeRates[newCurrencyCode]) {
        return alert('This currency already exists in the list.');
    }

    // Add to exchangeRates 
    exchangeRates[newCurrencyCode] = exchangeRate;

    // update dropdown 
    populateCurrencyDropdown();

    // reset 
    addCurrencyForm.reset();

    alert(`Currency ${newCurrencyCode} with exchange rate ${exchangeRate} added successfully!`);
}


// event listener for add currency
addCurrencyForm.addEventListener('submit', addNewCurrency);
