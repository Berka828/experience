let skyColor = [135, 206, 235]; // Default Day Blue
let isRainingInBronx = false;

// 1. Fetch Live Bronx Weather using Open-Meteo (No API Key Required!)
async function fetchLiveWeather() {
  try {
    // Coordinates for Bronx, NY
    let response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.8448&longitude=-73.8648&current_weather=true');
    let data = await response.json();
    let weatherCode = data.current_weather.weathercode;
    let isDay = data.current_weather.is_day;

    if (isDay === 0) {
      skyColor = [20, 24, 82]; // Night time Dark Blue
    } else if (weatherCode >= 50 && weatherCode <= 67) {
      skyColor = [150, 160, 170]; // Rainy/Overcast Gray
      isRainingInBronx = true;
    } else if (data.current_weather.time.includes("18:") || data.current_weather.time.includes("19:")) {
      skyColor = [253, 94, 83]; // Sunset Orange
    }
    console.log("Live Weather Synced! Sky Color:", skyColor);
  } catch(e) {
    console.log("Weather API failed, using default day sky.");
  }
}

// 2. Generate QR Code Memory
function generateMemoryQR() {
  document.getElementById('qr-container').style.display = 'block';
  document.getElementById('qrcode').innerHTML = ""; // Clear old QR
  
  // In a real production, you upload the canvas image to AWS/Firebase and QR link to that URL.
  // For this demo, we link to the Museum's website!
  new QRCode(document.getElementById("qrcode"), {
    text: "https://www.bronxchildrensmuseum.org/",
    width: 150, height: 150
  });
}
