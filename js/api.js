let skyColor = [135, 206, 235]; 
let isRainingInBronx = false;

async function fetchLiveWeather() {
  try {
    let response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.8448&longitude=-73.8648&current_weather=true');
    let data = await response.json();
    let weatherCode = data.current_weather.weathercode;
    let isDay = data.current_weather.is_day;

    if (isDay === 0) {
      skyColor = [20, 24, 82]; 
    } else if (weatherCode >= 50 && weatherCode <= 67) {
      skyColor = [150, 160, 170]; 
      isRainingInBronx = true;
    } else if (data.current_weather.time.includes("18:") || data.current_weather.time.includes("19:")) {
      skyColor = [253, 94, 83]; 
    }
    console.log("Live Weather Synced! Sky Color:", skyColor);
  } catch(e) {
    console.log("Weather API failed, using default day sky.");
  }
}
