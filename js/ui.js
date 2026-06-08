let currentScene = 1;
let score = 0;
let isEnglish = true;
let globalFlowers = localStorage.getItem('bxcm_flowers') || 0;

const textDict = {
  EN: {
    title: "Bronx Explorer 🌍",
    lvl1: "Level 1: WAVE YOUR ARMS fast to clear the urban smog!",
    lvl2: "Level 2: GRAB the pollution and throw it away!",
    lvl3: "Level 3: TEAM UP! Touch the clouds to water the seeds!",
    lvl4: "Level 4: RAINBOW POP! Swat the floating animals to make them pop!",
    win: "🎉 YOU SAVED THE BRONX! SMILE FOR THE CAMERA! 📸",
    lvlText: "Level:", scoreText: "Team Score:", btn: "Switch to Español",
    qr: "Scan to download your Explorer Photo!"
  },
  ES: {
    title: "Explorador del Bronx 🌍",
    lvl1: "Nivel 1: ¡AGITA TUS BRAZOS para limpiar el smog!",
    lvl2: "Nivel 2: ¡AGARRA la contaminación y tírala!",
    lvl3: "Nivel 3: ¡EQUIPO! ¡Toca las nubes para regar!",
    lvl4: "Nivel 4: ¡POP ARCOÍRIS! ¡Golpea los animales flotantes!",
    win: "🎉 ¡SALVASTE EL BRONX! ¡SONRÍE! 📸",
    lvlText: "Nivel:", scoreText: "Puntaje de Equipo:", btn: "Cambiar a English",
    qr: "¡Escanea para descargar tu foto!"
  }
};

function updateScore() { 
  document.getElementById('score').innerText = score; 
}

function updateGlobalLeaderboard(flowersToAdd) {
  globalFlowers = parseInt(globalFlowers) + flowersToAdd;
  localStorage.setItem('bxcm_flowers', globalFlowers);
  document.getElementById('global-score').innerText = globalFlowers;
}

function updateUI() {
  let lang = isEnglish ? textDict.EN : textDict.ES;
  document.getElementById('level-display').innerText = currentScene;
  document.getElementById('global-score').innerText = globalFlowers;
  
  if (currentScene === 1) document.getElementById('instructions').innerText = lang.lvl1;
  if (currentScene === 2) document.getElementById('instructions').innerText = lang.lvl2;
  if (currentScene === 3) document.getElementById('instructions').innerText = lang.lvl3;
  if (currentScene === 4) document.getElementById('instructions').innerText = lang.lvl4;
  if (currentScene === 5) document.getElementById('instructions').innerText = lang.win;
}

function toggleLanguage() {
  isEnglish = !isEnglish;
  let lang = isEnglish ? textDict.EN : textDict.ES;
  document.getElementById('title-text').innerText = lang.title;
  document.getElementById('level-text').innerText = lang.lvlText;
  document.getElementById('score-text').innerText = lang.scoreText;
  document.getElementById('lang-btn').innerText = lang.btn + " (Spacebar)";
  document.getElementById('qr-text').innerText = lang.qr;
  updateUI();
}

function keyPressed() {
  if (key === ' ') toggleLanguage();
}
