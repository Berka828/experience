// Game State Globals (Accessible across all files)
let currentScene = 1;
let score = 0;
let isEnglish = true;

// Bilingual Dictionary
const textDict = {
  EN: {
    title: "Bronx Explorer 🌍",
    lvl1: "Level 1: PINCH the red pollution and drag it up to clean the River!",
    lvl2: "Level 2: Team up! Touch the clouds to water the seeds!",
    lvl3: "Level 3: The Bronx Beats! Play the instruments together!",
    lvlText: "Level:", 
    scoreText: "Team Score:",
    btn: "Switch to Español (Spacebar)",
    win: "🎉 YOU SAVED THE BRONX!"
  },
  ES: {
    title: "Explorador del Bronx 🌍",
    lvl1: "Nivel 1: ¡PELLIZCA la contaminación roja y arrástrala hacia arriba!",
    lvl2: "Nivel 2: ¡Trabajo en equipo! ¡Toca las nubes para regar las semillas!",
    lvl3: "Nivel 3: ¡Ritmos del Bronx! ¡Toca los instrumentos juntos!",
    lvlText: "Nivel:", 
    scoreText: "Puntaje de Equipo:",
    btn: "Cambiar a English (Spacebar)",
    win: "🎉 ¡SALVASTE EL BRONX!"
  }
};

function updateScore() { 
  document.getElementById('score').innerText = score; 
}

function updateUI() {
  let lang = isEnglish ? textDict.EN : textDict.ES;
  document.getElementById('level-display').innerText = currentScene;
  
  if (currentScene === 1) document.getElementById('instructions').innerText = lang.lvl1;
  if (currentScene === 2) document.getElementById('instructions').innerText = lang.lvl2;
  if (currentScene === 3) document.getElementById('instructions').innerText = lang.lvl3;
  if (currentScene === 4) document.getElementById('instructions').innerText = lang.win;
}

function toggleLanguage() {
  isEnglish = !isEnglish;
  let lang = isEnglish ? textDict.EN : textDict.ES;
  
  document.getElementById('title-text').innerText = lang.title;
  document.getElementById('level-text').innerText = lang.lvlText;
  document.getElementById('score-text').innerText = lang.scoreText;
  document.getElementById('lang-btn').innerText = lang.btn;
  
  updateUI();
}

// Makey Makey / Keyboard Integration
function keyPressed() {
  if (key === ' ') { 
    toggleLanguage(); 
  }
}
