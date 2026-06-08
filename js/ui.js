let currentScene = 1;
let score = 0;
let isEnglish = true;

const textDict = {
  EN: {
    title: "Bronx Explorer 🌱",
    lvl1: "Level 1: Wave your arms slowly to clear the smog.",
    lvl2: "Level 2: Grab the pollution to clean the river.",
    lvl3: "Level 3: Touch the clouds to water the seeds.",
    lvl4: "Level 4: Kick to bounce! Point to pop!",
    win: "🎉 Beautiful job! Thank you! 🎉",
    lvlText: "Level:", btn: "Español"
  },
  ES: {
    title: "Explorador 🌱",
    lvl1: "Nivel 1: Agita tus brazos para limpiar el smog.",
    lvl2: "Nivel 2: Agarra la contaminación del río.",
    lvl3: "Nivel 3: Toca las nubes para regar.",
    lvl4: "Nivel 4: ¡Patea para rebotar! ¡Señala para explotar!",
    win: "🎉 ¡Hermoso trabajo! ¡Gracias! 🎉",
    lvlText: "Nivel:", btn: "English"
  }
};

function updateScore() { document.getElementById('score').innerText = score; }

function updateUI() {
  let lang = isEnglish ? textDict.EN : textDict.ES;
  document.getElementById('level-display').innerText = currentScene;
  
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
  document.getElementById('lang-btn').innerText = lang.btn;
  updateUI();
}

function toggleSettings() {
  let panel = document.getElementById('settings-panel');
  panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

// FULLSCREEN TOGGLE
function keyPressed() { 
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}
