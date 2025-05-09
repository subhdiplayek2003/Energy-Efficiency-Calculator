// Sample Indian states and cities
const indianStates = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
  "Delhi": ["New Delhi", "Noida", "Gurgaon"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"]
};

// Populate states dropdown
const stateSelect = document.getElementById("state");
stateSelect.innerHTML = '<option value="">Select State</option>' +
  Object.keys(indianStates).map(state => `<option value="${state}">${state}</option>`).join("");

// Populate cities dropdown based on selected state
stateSelect.addEventListener("change", () => {
  const citySelect = document.getElementById("city");
  const selectedState = stateSelect.value;
  citySelect.innerHTML = '<option value="">Select City</option>' +
    (indianStates[selectedState] || []).map(city => `<option value="${city}">${city}</option>`).join("");
});

// Fetch weather data using WeatherAPI
async function fetchWeather(city) {
  const apiKey = '229ddb5457d940b387e70820252003'; // Replace with your API key
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

// Add appliance to the list
function addAppliance() {
  const applianceSelect = document.getElementById("appliance");
  const wattageInput = document.getElementById("wattage");
  const quantityInput = document.getElementById("quantity");

  const appliance = {
    name: applianceSelect.value,
    wattage: parseFloat(wattageInput.value),
    quantity: parseInt(quantityInput.value),
  };

  if (!appliance.name || !appliance.wattage || !appliance.quantity) {
    alert("Please fill all fields");
    return;
  }

  const applianceItem = document.createElement("li");
  applianceItem.className = "list-group-item";
  applianceItem.innerHTML = `
    <span>${appliance.name} (${appliance.wattage}W) x ${appliance.quantity}</span>
    <button class="btn btn-danger btn-sm" onclick="removeAppliance(this)">Remove</button>
  `;
  document.getElementById("appliances").appendChild(applianceItem);

  // Clear inputs
  applianceSelect.value = "";
  wattageInput.value = "";
  quantityInput.value = "1";
}

// Remove appliance from the list
function removeAppliance(button) {
  button.parentElement.remove();
}

// Smooth scroll to results
function scrollToResults() {
  const resultsSection = document.getElementById("results");
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Suggest efficient timings based on weather and appliance usage
function suggestEfficientTimings(appliances, temperature, weatherCondition) {
  const suggestions = [];

  appliances.forEach(appliance => {
    if (appliance.wattage > 1000 && temperature > 30) {
      suggestions.push(`Avoid using ${appliance.name} between 12 PM - 4 PM.`);
    } else if (appliance.wattage > 500) {
      suggestions.push(`Use ${appliance.name} during off-peak hours (early morning or late evening).`);
    }

    // Add more rules
    if (weatherCondition === "Sunny" && appliance.name === "Geyser") {
      suggestions.push(`Use solar energy to power ${appliance.name} during the day.`);
    }
  });

  return suggestions;
}

// Reset the form
function resetForm() {
  document.getElementById("energyForm").reset();
  document.getElementById("appliances").innerHTML = "";
  document.getElementById("results").style.display = "none";
}

// Calculate efficiency
async function calculateEfficiency() {
  const city = document.getElementById("city").value;

  if (!city) {
    alert("Please select a city.");
    return;
  }

  // Show loading spinner without overwriting the chart
  const savingsInfo = document.getElementById("savingsInfo");
  savingsInfo.innerHTML = `<div class="spinner-border text-primary" role="status"></div>`;

  const weatherData = await fetchWeather(city);

  if (!weatherData || weatherData.error) {
    alert("Failed to fetch weather data. Please check the city name and try again.");
    savingsInfo.innerHTML = ""; // Clear spinner
    return;
  }

  const temperature = weatherData.current.temp_c; // Temperature in Celsius
  const weatherCondition = weatherData.current.condition.text; // e.g., "Sunny", "Rainy"
  console.log("Temperature:", temperature);
  console.log("Weather Condition:", weatherCondition);

  const appliances = [];
  document.querySelectorAll(".list-group-item").forEach(item => {
    const text = item.querySelector("span").textContent;
    const [name, details] = text.split(" (");
    const [wattage, quantity] = details.split("W) x ");
    appliances.push({
      name: name.trim(),
      wattage: parseFloat(wattage),
      quantity: parseInt(quantity),
    });
  });

  if (appliances.length === 0) {
    alert("Please add at least one appliance.");
    savingsInfo.innerHTML = ""; // Clear spinner
    return;
  }

  // Display results
  const resultsDiv = document.getElementById("results");
  resultsDiv.style.display = "block";

  // Scroll to results
  scrollToResults();

  // Render chart
  const ctx = document.getElementById('energyChart').getContext('2d');
  const colors = appliances.map((_, index) => `hsl(${index * 360 / appliances.length}, 70%, 50%)`);

  const energyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: appliances.map(app => app.name),
      datasets: [{
        label: 'Energy Usage (W)',
        data: appliances.map(app => app.wattage * app.quantity),
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuad'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  });

  // Display savings information
  const totalWattage = appliances.reduce((sum, app) => sum + app.wattage * app.quantity, 0);
  const rate = parseFloat(document.getElementById("rate").value);
  const dailyCost = (totalWattage * 24 * rate) / 1000; // Assuming 24 hours usage
  savingsInfo.innerHTML = `
    <h5>Total Wattage: ${totalWattage}W</h5>
    <h5>Estimated Daily Cost: INR ${dailyCost.toFixed(2)}</h5>
    <h5>Weather Condition: ${weatherCondition}</h5>
  `;

  // Add AI suggestions
  const suggestions = suggestEfficientTimings(appliances, temperature, weatherCondition);
  savingsInfo.innerHTML += `
    <h5>Efficient Timings:</h5>
    <ul>
      ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join("")}
    </ul>
  `;
}