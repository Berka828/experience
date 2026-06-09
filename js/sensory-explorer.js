// ==========================================
// 1. GLOBAL VARIABLES & STATE
// ==========================================
let video;
let videoReady = false;
let currentScene = 1;
let score = 0;
let isEnglish = true;
let globalFlowers = localStorage.getItem('bxcm_flowers') || 0;

let fadeState = 0; 
let fadeAlpha = 0;
let nextScene = 1;

let skyColor = [135, 206, 235]; 
let isRainingInBronx = false;
let particles = [];

// AI Tracking Globals
let mpHands;
let trackedHandsData = [];
let poses = []; 
let prevHandPositions = [];
let handVelocity = 0;
let activePointers = []; 
let activeBouncers = []; 

let playerColors = [ [0, 255, 255], [255, 0, 255], [255, 255, 0] ];

// Level Objects
let smogGraphics; let smogCleared = 0;
let trashItems = []; let clouds = []; let raindrops = []; 
let flowers = []; let insects = []; let scene3Timer = 0;
let popBubbles = []; let bubblesPopped = 0; let sunSize = 180;
let rainbowAlpha = 0; let ripples = []; let fireflies = []; 

// Bilingual System
const textDict = {
  EN: {
    title: "Bronx Explorer 🌱",
    lvl1: "Level 1: Wave your arms slowly to clear the smog.",
    lvl2: "Level 2: Grab the pollution to clean the river.",
    lvl3: "Level 3: Touch the clouds to water. Play with the butterflies!",
    lvl4: "Level 4: Pop the RED bubbles! Bounce the rest gently.",
    win: "🎉 Beautiful job! Thank you! 🎉",
    lvlText: "Level:", btn: "Español"
  },
  ES: {
    title: "Explorador 🌱",
    lvl1: "Nivel 1: Agita tus brazos para limpiar el smog.",
    lvl2: "Nivel 2: Agarra la contaminación del río.",
    lvl3: "Nivel 3: Toca las nubes. ¡Juega con las mariposas!",
    lvl4: "Nivel 4: ¡Explota las rojas! Rebota las demás suavemente.",
    win: "🎉 ¡Hermoso trabajo! ¡Gracias! 🎉",
    lvlText: "Nivel:", btn: "English"
  }
};

// ==========================================
// CRASH-PROOF SAFETY SHIELD
// ==========================================
function safeSetText(id, txt) {
  let el = document.getElementById(id);
  if (el) el.innerText = txt;
}

function safeGetChecked(id) {
  let el = document.getElementById(id);
  return el ? el.checked : false;
}

function safeGetValue(id, defaultVal) {
  let el = document.getElementById(id);
  return el ? el.value : defaultVal;
}

// ==========================================
// 2. MAIN P5.JS SETUP & DRAW
// ==========================================
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);

  // Initialize UI & Scenery early
  fetchLiveWeather(); 
  updateUI(); 
  initScene1(); 
  
  // Start Camera - Wait for it to be fully ready before booting AI
  video = createCapture(VIDEO, () => { 
    video.elt.width = 640;  
    video.elt.height = 480; 
    
    // Camera is guaranteed on and streaming now!
    setupTracking(video); 
    startMediaPipeTracker(video);
    videoReady = true; 
  });
  video.hide(); 
}

function draw() {
  background(skyColor[0], skyColor[1], skyColor[2], 120); 

  if (!videoReady) {
    fill(255); noStroke(); textAlign(CENTER, CENTER); textSize(32);
    text("Waking up the AI... Please wait.", width/2, height/2);
    return; 
  }

  // Mirror the camera
  push();
  translate(width, 0); scale(-1, 1);
  image(video, 0, 0, width, height); 
  pop();
  
  // Level Renderer
  if (currentScene === 1) drawScene1();
  else if (currentScene === 2) drawScene2();
  else if (currentScene === 3) drawScene3();
  else if (currentScene === 4) drawScene4(); 
  else if (currentScene === 5) {
    if (frameCount % 30 === 0 && !safeGetChecked('calm-mode')) {
      spawnExplosion(random(width), random(height), [255, 255, 255]); 
    }
    if (frameCount % 720 === 0 && fadeState === 0) {
      triggerTransition(1); 
    }
  }

  drawSkeletonsAndInteractions();
  
  if(!safeGetChecked('calm-mode')) {
    drawParticles(); 
  }

  // Transitions
  if (fadeState > 0) {
    noStroke();
    fill(255, 255, 255, fadeAlpha); 
    rect(0, 0, width, height);

    if (fadeState === 1) {
      fadeAlpha += 4; 
      if (fadeAlpha >= 255) {
        currentScene = nextScene;
        updateUI();
        if (currentScene === 1) initScene1();
        if (currentScene === 2) initScene2();
        if (currentScene === 3) initScene3();
        if (currentScene === 4) initScene4();
        fadeState = 2; 
      }
    } else if (fadeState === 2) {
      fadeAlpha -= 4; 
      if (fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeState = 0; 
      }
    }
  }
}

function triggerTransition(targetScene) {
  if (fadeState === 0) { fadeState = 1; nextScene = targetScene; }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (currentScene === 1) initScene1();
  if (currentScene === 2) initScene2();
  if (currentScene === 3) initScene3();
  if (currentScene === 4) initScene4();
}

function resetGame() {
  score = 0; updateScore();
}

// ==========================================
// 3. WEATHER & API SYSTEM
// ==========================================
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
  } catch(e) {
    console.log("Weather API failed, using default day sky.");
  }
}

// ==========================================
// 4. PARTICLES ENGINE
// ==========================================
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = random(-5, 5); this.vy = random(-5, 5);
    this.life = 255; this.color = color; 
  }
  update() { this.x += this.vx; this.y += this.vy; this.life -= 10; }
  show() {
    noStroke(); fill(this.color[0], this.color[1], this.color[2], this.life);
    circle(this.x, this.y, 8);
  }
}

function spawnExplosion(x, y, color) {
  for (let i = 0; i < 20; i++) particles.push(new Particle(x, y, color));
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(); particles[i].show();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

// ==========================================
// 5. AI TRACKING & COORDINATE MAPPING
// ==========================================
function setupTracking(videoElement) {
  mpHands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
  mpHands.setOptions({
    maxNumHands: 6, modelComplexity: 1, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3
  });
  mpHands.onResults(onHandResults);

  let poseNet = ml5.poseNet(videoElement, () => console.log('Body tracking ready!'));
  poseNet.on('pose', results => poses = results);
}

async function startMediaPipeTracker(videoElement) {
  let isProcessing = false;
  async function processFrame() {
    if (!isProcessing && videoElement.elt.readyState >= 2) {
      isProcessing = true;
      try { await mpHands.send({ image: videoElement.elt }); } catch (e) {}
      isProcessing = false;
    }
    requestAnimationFrame(processFrame); 
  }
  processFrame();
}

function onHandResults(results) { trackedHandsData = results.multiHandLandmarks || []; }

function drawSkeletonsAndInteractions() {
  handVelocity = 0; activePointers = []; activeBouncers = [];
  
  let vw = video.width || 640; let vh = video.height || 480;
  let zoneWidth = width / 3;

  for (let k = 0; k < trackedHandsData.length; k++) {
    let landmarks = trackedHandsData[k];
    let mappedLm = landmarks.map(lm => [width - map(lm.x, 0, 1, 0, width), map(lm.y, 0, 1, 0, height)]);
    
    let wrist = mappedLm[0]; let indexBase = mappedLm[5]; let indexTip = mappedLm[8]; let palmCenter = mappedLm[9];
    let playerIndex = constrain(Math.floor(palmCenter[0] / zoneWidth), 0, 2);
    let pColor = playerColors[playerIndex];

    stroke(pColor[0], pColor[1], pColor[2], 120); strokeWeight(6); noFill();
    beginShape(); for (let j = 0; j < 21; j++) vertex(mappedLm[j][0], mappedLm[j][1]); endShape();
    
    if (prevHandPositions[k]) handVelocity += dist(indexTip[0], indexTip[1], prevHandPositions[k][0], prevHandPositions[k][1]);
    prevHandPositions[k] = indexTip;

    let palmSize = dist(wrist[0], wrist[1], indexBase[0], indexBase[1]);
    let indexExt = dist(wrist[0], wrist[1], indexTip[0], indexTip[1]);
    let isGrabbing = (indexExt < palmSize * 1.5); 

    if (isGrabbing) {
      fill(255, 255, 255, 100); noStroke(); circle(palmCenter[0], palmCenter[1], 50); 
      activeBouncers.push({ x: palmCenter[0], y: palmCenter[1], id: k }); 
      
      if (currentScene === 2) {
        let holding = false;
        for (let t of trashItems) { if (t.active && t.draggedBy === k) { t.x = palmCenter[0]; t.y = palmCenter[1]; holding = true; } }
        if (!holding) {
          for (let t of trashItems) { if (t.active && !t.draggedBy && dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 2.5) { t.draggedBy = k; break; } }
        }
      }
    } else {
      fill(255); noStroke(); circle(indexTip[0], indexTip[1], 15);
      activePointers.push({ x: indexTip[0], y: indexTip[1] }); 
      if (currentScene === 2) { for (let t of trashItems) if (t.draggedBy === k) t.draggedBy = null; }
    }
  }

  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    let attackPoints = [pose.leftWrist, pose.rightWrist, pose.leftAnkle, pose.rightAnkle];
    for (let pt of attackPoints) {
      if (pt && pt.confidence > 0.2) {
        let px = width - map(pt.x, 0, vw, 0, width); let py = map(pt.y, 0, vh, 0, height);
        activeBouncers.push({ x: px, y: py, id: 'body' });
      }
    }
  }
}

function checkHover(targetX, targetY, radius) {
  for (let k = 0; k < trackedHandsData.length; k++) {
    let rawIndexTip = trackedHandsData[k][8]; 
    let ix = width - map(rawIndexTip.x, 0, 1, 0, width); let iy = map(rawIndexTip.y, 0, 1, 0, height);
    if (dist(ix, iy, targetX, targetY) < radius + 25) return true;
  }
  return false;
}

function checkBodyHits(targetX, targetY, radius) {
  let vw = video.width || 640; let vh = video.height || 480;
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    let attackPoints = [pose.leftWrist, pose.rightWrist, pose.leftAnkle, pose.rightAnkle];
    for (let pt of attackPoints) {
      if (pt && pt.confidence > 0.2) {
        let px = width - map(pt.x, 0, vw, 0, width); let py = map(pt.y, 0, vh, 0, height);
        if (dist(px, py, targetX, targetY) < radius + 40) return true;
      }
    }
  }
  return false;
}

// ==========================================
// 6. SCENE & LEVEL DRAW FUNCTIONS
// ==========================================
function initScene1() { smogGraphics = createGraphics(width, height); smogGraphics.background(150, 150, 150, 240); smogCleared = 0; }
function initScene2() { trashItems = []; for(let i=0; i<10; i++) trashItems.push({ x: random(100, width - 100), y: random(height/2 + 50, height - 100), radius: 35, active: true, draggedBy: null }); }
function initScene3() { clouds = [{ x: width*0.2, y: 150, w: 140, h: 80 }, { x: width*0.5, y: 120, w: 160, h: 90 }, { x: width*0.8, y: 150, w: 140, h: 80 }]; raindrops = []; flowers = []; insects = []; scene3Timer = 2400; }
function initScene4() { rainbowAlpha = 0; popBubbles = []; bubblesPopped = 0; ripples = []; fireflies = []; for(let i=0; i<8; i++) spawnBubble(); for(let i=0; i<30; i++) fireflies.push({x: random(width), y: random(height), vx: random(-0.5, 0.5), vy: random(-0.5, 0.5)}); }

function spawnBubble() { 
  let baseSize = parseInt(safeGetValue('bubble-size', 45));
  let isGold = random() < 0.08; 
  let isRed = !isGold && random() < 0.4; 
  let bColor = isRed ? [220, 60, 60] : (isGold ? [255, 215, 0] : [random(100, 150), random(200, 255), random(200, 255)]);
  let bRadius = isGold ? baseSize + 30 : baseSize + random(-10, 10);
  
  popBubbles.push({ 
    x: random(100, width-100), y: height + 100, 
    vx: random(-1, 1), vy: random(-2, -4), 
    radius: bRadius, isRed: isRed, isGold: isGold, color: bColor, active: true 
  }); 
}

function drawScene1() {
  if (handVelocity > 5 && fadeState === 0) { 
    smogGraphics.erase();
    for (let k = 0; k < activePointers.length; k++) {
      smogGraphics.circle(activePointers[k].x, activePointers[k].y, 100); 
      smogCleared += 0.5;
    }
    smogGraphics.noErase();
  }
  image(smogGraphics, 0, 0);
  if (smogCleared > 1000 && fadeState === 0) { triggerTransition(2); }
}

function drawScene2() {
  noStroke(); fill(0, 100, 200, 120); rect(0, height/2, width, height/2);
  let activeCount = 0;
  for (let t of trashItems) {
    if (t.active) {
      activeCount++;
      fill(220, 50, 50, 180); noStroke(); circle(t.x, t.y, t.radius * 2);
      if (t.y < height/2 && t.draggedBy !== null) {
        t.active = false; t.draggedBy = null; score += 20; updateScore();
        if(!safeGetChecked('calm-mode')) spawnExplosion(t.x, t.y, [220, 50, 50]); 
      }
    }
  }
  if (activeCount === 0 && fadeState === 0) { triggerTransition(3); }
}

function drawScene3() {
  noStroke(); fill(101, 67, 33, 120); rect(0, height - 150, width, 150);
  for (let c of clouds) {
    fill(220, 220, 220, 200); noStroke();
    ellipse(c.x, c.y, c.w, c.h); ellipse(c.x-30, c.y+10, c.w*.7, c.h*.8); ellipse(c.x+30, c.y+10, c.w*.7, c.h*.8);
    
    let isTouched = false;
    for(let p of activePointers) if(dist(p.x, p.y, c.x, c.y) < c.w/2) isTouched = true;
    for(let b of activeBouncers) if(dist(b.x, b.y, c.x, c.y) < c.w/2) isTouched = true;
    
    if (isTouched || isRainingInBronx) {
      if (frameCount % 8 === 0) raindrops.push({ x: c.x + random(-30,30), y: c.y + 30, active: true });
    }
  }

  for (let r of raindrops) {
    if (r.active) {
      fill(0, 150, 255, 150); circle(r.x, r.y, 12); r.y += 6; 
      if (r.y > height - 100) { 
        r.active = false; score += 2; updateScore(); 
        if (flowers.length < 20) { flowers.push({ x: r.x, y: height - 100, size: 0, cooldown: 0 }); }
      }
    }
  }

  let grownFlowers = 0;
  for (let f of flowers) {
    if (f.size < 55) f.size += 0.3; 
    else {
      grownFlowers++;
      let fTouched = false; let fCenterY = height - 100 - f.size;
      for(let p of activePointers) if(dist(p.x, p.y, f.x, fCenterY) < 40) fTouched = true;
      for(let b of activeBouncers) if(dist(b.x, b.y, f.x, fCenterY) < 40) fTouched = true;

      if (fTouched && f.cooldown <= 0) {
        insects.push({ x: f.x, y: fCenterY, vx: random(-2, 2), vy: random(-2, -5), emoji: random(['🦋', '🐝']), life: 255 });
        f.cooldown = 120; 
      }
    }
    if (f.cooldown > 0) f.cooldown--;
    fill(46, 204, 113, 200); rect(f.x - 3, height - 100 - f.size, 6, f.size); 
    fill(255, 180, 200, 220); circle(f.x, height - 100 - f.size, f.size/1.5); 
  }

  for (let i = insects.length - 1; i >= 0; i--) {
    let ins = insects[i];
    ins.x += ins.vx + sin(frameCount * 0.1); ins.y += ins.vy; ins.life -= 1.5;
    textSize(35); textAlign(CENTER, CENTER); text(ins.emoji, ins.x, ins.y);
    if (ins.life <= 0 || ins.y < -50) insects.splice(i, 1);
  }

  if (grownFlowers >= 20) {
    scene3Timer--;
    if (scene3Timer <= 0 && fadeState === 0) { triggerTransition(4); }
  }
}

function drawScene4() {
  if (rainbowAlpha < 150) rainbowAlpha += 0.5; 
  noFill(); strokeWeight(40); 
  let pastelColors = [ [255, 182, 193], [255, 228, 181], [255, 255, 224], [152, 251, 152], [173, 216, 230] ];
  for (let i = 0; i < pastelColors.length; i++) {
    stroke(pastelColors[i][0], pastelColors[i][1], pastelColors[i][2], rainbowAlpha);
    arc(width / 2, height + 50, width * 0.9 - (i * 40), height * 1.5 - (i * 40), PI, TWO_PI);
  }

  let sunX = width - 180; let sunY = 180;
  sunSize = 180 + sin(frameCount * 0.02) * 8; 
  noStroke(); fill(255, 204, 0, 100); circle(sunX, sunY, sunSize);
  fill(255, 255, 0, 180); circle(sunX, sunY, sunSize - 30);

  for (let f of fireflies) {
    f.x += f.vx + sin(frameCount * 0.05) * 0.5; f.y += f.vy + cos(frameCount * 0.05) * 0.5;
    fill(255, 255, 150, 180); noStroke(); circle(f.x, f.y, 4);
    if (f.x < 0) f.x = width; if (f.x > width) f.x = 0;
    if (f.y < 0) f.y = height; if (f.y > height) f.y = 0;
  }

  for (let r of ripples) {
    noFill(); stroke(255, 255, 255, r.alpha); strokeWeight(3); circle(r.x, r.y, r.radius);
    r.radius += 3; r.alpha -= 5;
  }

  for (let i = popBubbles.length - 1; i >= 0; i--) {
    let b = popBubbles[i];
    if (b.active) {
      b.vy -= 0.015; 
      b.x += b.vx; b.y += b.vy;

      stroke(255, 255, 255, (b.isRed || b.isGold) ? 200 : 120); strokeWeight((b.isRed || b.isGold) ? 4 : 2); 
      fill(b.color[0], b.color[1], b.color[2], 160); circle(b.x, b.y, b.radius * 2);
      
      if (b.isGold) {
        fill(255, 255, 255, random(100, 255)); noStroke(); circle(b.x - 10, b.y - 10, 8);
      }
      if (b.x < b.radius || b.x > width - b.radius) b.vx *= -1;

      for (let kicker of activeBouncers) {
        if (dist(kicker.x, kicker.y, b.x, b.y) < b.radius + 40) {
          let angle = atan2(b.y - kicker.y, b.x - kicker.x);
          b.vx = cos(angle) * 7; b.vy = sin(angle) * 7 - 2; 
          ripples.push({x: b.x, y: b.y, radius: b.radius, alpha: 200});
        }
      }

      let squashed = (b.y > height - b.radius);
      let pointed = false;
      for (let pointer of activePointers) {
        if (dist(pointer.x, pointer.y, b.x, b.y) < b.radius) pointed = true;
      }

      if (squashed || pointed) {
        if (b.isRed || b.isGold) {
          popBubble(b); 
        } else if (pointed) {
          b.vy -= 2; 
        } else if (squashed) {
          b.vy = -6; ripples.push({x: b.x, y: height, radius: b.radius, alpha: 150});
        }
      }
      if (b.y < -150) { b.active = false; setTimeout(spawnBubble, 500); }
    }
  }

  if (bubblesPopped >= 35 && fadeState === 0) { triggerTransition(5); }
}

function popBubble(b) {
  b.active = false; 
  if (b.isGold) {
    score += 200; 
    for(let i=0; i<3; i++) spawnExplosion(b.x + random(-20,20), b.y + random(-20,20), [255, 215, 0]);
  } else {
    bubblesPopped++; score += 50; 
    if(!safeGetChecked('calm-mode')) spawnExplosion(b.x, b.y, b.color);
  }
  updateScore();
  setTimeout(spawnBubble, 800);
}

// ==========================================
// 7. USER INTERFACE & BILINGUAL LOGIC
// ==========================================
function updateScore() { document.getElementById('score').innerText = score; }

function updateUI() {
  let lang = isEnglish ? textDict.EN : textDict.ES;
  
  safeSetText('level-display', currentScene);
  safeSetText('global-score', globalFlowers);
  
  if (currentScene === 1) safeSetText('instructions', lang.lvl1);
  if (currentScene === 2) safeSetText('instructions', lang.lvl2);
  if (currentScene === 3) safeSetText('instructions', lang.lvl3);
  if (currentScene === 4) safeSetText('instructions', lang.lvl4);
  if (currentScene === 5) safeSetText('instructions', lang.win);
}

function updateGlobalLeaderboard(flowersToAdd) {
  globalFlowers = parseInt(globalFlowers) + flowersToAdd;
  localStorage.setItem('bxcm_flowers', globalFlowers);
  safeSetText('global-score', globalFlowers);
}

function toggleLanguage() {
  isEnglish = !isEnglish;
  let lang = isEnglish ? textDict.EN : textDict.ES;
  
  safeSetText('title-text', lang.title);
  safeSetText('level-text', lang.lvlText);
  safeSetText('lang-btn', lang.btn);
  
  updateUI();
}

function toggleSettings() {
  let panel = document.getElementById('settings-panel');
  if (panel) {
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
  }
}

function keyPressed() { 
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}
