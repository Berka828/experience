// ==========================================
// 1. GLOBAL VARIABLES & STATE
// ==========================================
let video;
let videoReady = false;
let currentScene = 1;
let score = 0;
let isEnglish = true;
let globalFlowers = localStorage.getItem('bxcm_flowers') || 0;

let isWiping = false;
let wipeX = -2000;
let nextScene = 1;

let skyColor = [135, 206, 235]; 
let isRainingInBronx = false;
let particles = [];

// AI Tracking Globals
let mpHands;
let trackedHandsData = [];
let prevHandPositions = [];
let handVelocity = 0;
let activePointers = []; 
let activeBouncers = []; 
let activeFeet = []; 
// Brand Colors & Player Colors (Safer arrays without global Math dependencies)
let bxcmColors = [ [44, 94, 79],, [255, 204, 0], [255, 107, 107] ];
let playerColors = [ [0, 255, 255], [255, 0, 255], [255, 255, 0] ];

// Level Objects
let smogGraphics; 
let smogCleared = 0;
let trashItems = []; 
let fishes = []; 
let clouds = []; 
let raindrops = []; 
let flowers = []; 
let grass = []; 
let insects = []; 
let scene3Timer = 0;

// Level 4 (Magic Canvas) Objects
let artStrokes = []; 
let artEnergy = 0; 
let stars = [];

// Level 5 (Bubbles) Objects
let popBubbles = []; 
let bubblesPopped = 0; 
let sunSize = 180;
let ripples = []; 
let fireflies = []; 

// Bilingual System
const textDict = {
  EN: {
    title: "Bronx Explorer 🌱",
    lvl1: "Level 1: Wave your arms slowly to clear the smog.",
    lvl2: "Level 2: Clean the river! Play with the fish!",
    lvl3: "Level 3: Touch clouds to make rain. Grow the garden!",
    lvl4: "Level 4: MAGIC CANVAS! Draw in the air with light!",
    lvl5: "Level 5: Pop Coral bubbles! Bounce the rest.",
    win: "🎉 Beautiful job! Thank you! 🎉",
    lvlText: "Level:", btn: "Español"
  },
  ES: {
    title: "Explorador 🌱",
    lvl1: "Nivel 1: Agita tus brazos para limpiar el smog.",
    lvl2: "Nivel 2: ¡Limpia el río! ¡Juega con los peces!",
    lvl3: "Nivel 3: Toca las nubes. ¡Crece el jardín!",
    lvl4: "Nivel 4: ¡LIENZO MÁGICO! ¡Dibuja en el aire con luz!",
    lvl5: "Nivel 5: ¡Explota las corales! Rebota las demás.",
    win: "🎉 ¡Hermoso trabajo! ¡Gracias! 🎉",
    lvlText: "Nivel:", btn: "English"
  }
};

// ==========================================
// CRASH-PROOF SAFETY SHIELD
// ==========================================
function safeSetText(id, txt) { let el = document.getElementById(id); if (el) el.innerText = txt; }
function safeGetChecked(id) { let el = document.getElementById(id); return el ? el.checked : false; }
function safeGetValue(id, defaultVal) { let el = document.getElementById(id); return el ? el.value : defaultVal; }

// ==========================================
// 2. MAIN P5.JS SETUP & DRAW
// ==========================================
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);

  fetchLiveWeather(); 
  updateUI(); 
  initScene1(); 
  
  // Safe initialization callback
  video = createCapture(VIDEO, () => { 
    video.elt.width = 640; 
    video.elt.height = 480; 
    setupTracking(video); 
    startMediaPipeTracker(video);
    videoReady = true; 
  });
  video.hide(); 
}
function draw() {
  background(skyColor[0], skyColor[...](asc_slot://start-slot-6), skyColor, 120); 

  if (!videoReady) {
    fill(255); noStroke(); textAlign(CENTER, CENTER); textSize(32);
    text("Waking up the AI... Please wait.", width/2, height/2); 
    return; 
  }

  push(); 
  translate(width, 0); 
  scale(-1, 1); 
  image(video, 0, 0, width, height); 
  pop();
  
  drawScenicBackground(); 

  if (currentScene === 1) drawScene1();
  else if (currentScene === 2) drawScene2();
  else if (currentScene === 3) drawScene3();
  else if (currentScene === 4) drawScene4(); 
  else if (currentScene === 5) drawScene5();
  else if (currentScene === 6) {
    if (frameCount % 30 === 0 && !safeGetChecked('calm-mode')) {
      spawnExplosion(random(width), random(height), [255, 255, 255]); 
    }
    if (frameCount % 500 === 0 && !isWiping) {
      triggerWipeTransition(1); 
    }
  }

  drawSkeletonsAndInteractions();
  
  if(!safeGetChecked('calm-mode')) {
    drawParticles(); 
  }

  // SEAMLESS CLOUD WIPE TRANSITION
  if (isWiping) {
    wipeX += 40; 
    drawGiantCloudWipe(wipeX);

    if (wipeX > width / 2 && currentScene !== nextScene) {
      currentScene = nextScene; 
      updateUI();
      if (currentScene === 1) initScene1(); 
      if (currentScene === 2) initScene2();
      if (currentScene === 3) initScene3(); 
      if (currentScene === 4) initScene4();
      if (currentScene === 5) initScene5();
    }
    if (wipeX > width + 1000) { 
      isWiping = false; 
      wipeX = -2000; 
    }
  }
}

function triggerWipeTransition(targetScene) {
  if (!isWiping) { 
    isWiping = true; 
    wipeX = -2000; 
    nextScene = targetScene; 
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (currentScene === 1) initScene1(); 
  if (currentScene === 2) initScene2();
  if (currentScene === 3) initScene3(); 
  if (currentScene === 4) initScene4();
  if (currentScene === 5) initScene5();
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
    let code = data.current_weather.weathercode; 
    let isDay = data.current_weather.is_day;
    
    [...](asc_slot://start-slot-8)if (isDay === 0) {
      skyColor =; 
    } else if (code >= 50 && code <= 67) { 
      skyColor = [150, 160, 170]; 
      isRainingInBronx = true; 
    } else if (data.current_weather.time.includes("18:") || data.current_weather.time.includes("19:")) {
      skyColor = [253, 94, 83]; 
    }
  } catch(e) {}
}

function drawScenicBackground() {
  noStroke();
  if (currentScene === 1) { 
    fill(100, 100, 110, 150);
    rect(width*0.1, height-300, 150, 300); 
    rect(width*0.3, height-400, 120, 400);
    rect(width*0.6, height-250, 200, 250); 
    rect(width*0.8, height-350, 100, 350);
  } 
  else if (currentScene === 2 || currentScene === 3) { 
    fill(34, 139, 34, 100);
    ellipse(width*0.3, height, width*0.8, 600);
    fill(34, 139, 34, 120);
    ellipse(width*0.8, height, width, 500);
  }
}

function drawGiantCloudWipe(xPos) {
  noStroke(); fill(255, 255, 255, 240);
  ellipse(xPos, height/2, 1200, 1500);
  ellipse(xPos - 300, height/3, 1000, 1200);
  ellipse(xPos - 300, height*0.7, 1000, 1200);
  ellipse(xPos - 600, height/2, 1500, 2000); 
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
    noStroke(); 
    fill(this.color[0], this.[...](asc_slot://start-slot-10)color, this.[...](asc_slot://start-slot-12)color, this.life); 
    circle(this.x, this.y, 8); 
  }
}
function spawnExplosion(x, y, color) { 
  for (let i = 0; i < 20; i++) particles.push(new Particle(x, y, color)); 
}
function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(); 
    particles[i].show();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

// ==========================================
// 5. STABLE MEDIAPIPE TRACKING
// ==========================================
function setupTracking(videoElement) {
  // CRITICAL FIX: Safe global reference check for window.Hands
  let HandsConstructor = window.Hands || Hands;
  if (!HandsConstructor) {
    console.error("MediaPipe Hands script was not parsed correctly by the browser.");
    return;
  }
  
  mpHands = new HandsConstructor({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
  mpHands.setOptions({ maxNumHands: 6, modelComplexity: 1, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3 });
  mpHands.onResults(onHandResults);
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
  handVelocity = 0; 
  activePointers = []; 
  activeBouncers = []; 
  activeFeet = [];
  
  let vw = video.width || 640; 
  let vh = video.height || 480;
  let zoneWidth = width / 3;

  for (let k = 0; k < trackedHandsData.length; k++) {
    let landmarks = trackedHandsData[k];
    
    // SAFE PARSING: Iteratively map without the arrow function syntax parser error
    let mappedLm = [];
    for (let i = 0; i < landmarks.length; i++) {
      let mx = map(landmarks[i].x, 0, 1, 0, width);
      let my = map(landmarks[i].y, 0, 1, 0, height);
      mappedLm.push([width - mx, my]);
    }
    
    [...](asc_slot://start-slot-14)let wrist = mappedLm[0]; 
    let indexBase = mappedLm[...](asc_slot://start-slot-15); 
    let indexTip = mappedLm[...](asc_slot://start-slot-16); 
    let palmCenter = mappedLm;
    
    // Stable pairing based on palm location zones
    let playerIndex = constrain(Math.floor(palmCenter[0] / zoneWidth), 0, 2);
    let pColor = playerColors[playerIndex];

    [...](asc_slot://start-slot-18)stroke(pColor[0], pColor[...](asc_slot://start-slot-19), pColor[...](asc_slot://start-slot-20), 120); 
    strokeWeight(6); 
    noFill();
    beginShape(); 
    for (let j = 0; j < 21; j++) {
      vertex(mappedLm[j][0], mappedLm[j]); 
    }
    endShape();
    
    [...](asc_slot://start-slot-22)if (prevHandPositions[k]) {
      handVelocity += dist(indexTip[0], indexTip, prevHandPositions[k][0], prevHandPositions[k]);
    }
    prevHandPositions[k] = indexTip;

    [...](asc_slot://start-slot-24)let palmSize = dist(wrist[0], wrist, indexBase[0], indexBase);
    let indexExt = dist(wrist[0], wrist, indexTip[0], indexTip);
    let isGrabbing = (indexExt < palmSize * 1.5); 

    [...](asc_slot://start-slot-26)if (isGrabbing) {
      fill(255, 255, 255, 100); noStroke(); circle(palmCenter[0], palmCenter, 50); 
      activeBouncers.[...](asc_slot://start-slot-28)push({ x: palmCenter[0], y: palmCenter, id: k, color: pColor }); 
      
      [...](asc_slot://start-slot-30)// Fallback: Low hands in bubble level count as feet (stepping)
      if (palmCenter > height * 0.7) {
        activeFeet.[...](asc_slot://start-slot-32)push({ x: palmCenter[0], y: palmCenter });
      }

      if (currentScene === 2) {
        let holding = false;
        for (let t of trashItems) { 
          if (t.active && t.[...](asc_slot://start-slot-34)draggedBy === k) { 
            t.x = palmCenter[0]; t.y = palmCenter; holding = true; 
          } 
        }
        if (!holding) {
          for (let t of trashItems) { 
            if (t.active && !t.[...](asc_slot://start-slot-36)draggedBy && dist(palmCenter[0], palmCenter, t.x, t.y) < t.radius * 2.5) { 
              t.[...](asc_slot://start-slot-38)draggedBy = k; break; 
            } 
          }
        }
      }
    } else {
      fill(255); noStroke(); circle(indexTip[0], indexTip, 15);
      activePointers.[...](asc_slot://start-slot-40)push({ x: indexTip[0], y: indexTip, color: pColor }); 
      if (currentScene === 2) { 
        for (let t of trashItems) {
          if (t.draggedBy === k) t.draggedBy = null; 
        }
      }
    }
  }
}

// ==========================================
// 6. SCENE & LEVEL DRAW FUNCTIONS
// ==========================================
function drawScene1() {
  if (handVelocity > 5 && !isWiping) { 
    let allErasers = activePointers.concat(activeBouncers);
    smogGraphics.erase();
    for (let pt of allErasers) { 
      smogGraphics.circle(pt.x, pt.y, 220); 
      smogCleared += 0.5; 
    }
    smogGraphics.noErase();
  }
  image(smogGraphics, 0, 0);
  if (smogCleared > 1200 && !isWiping) triggerWipeTransition(2);
}

function drawScene2() {
  fill(0, 100, 200, 150); noStroke();
  beginShape(); vertex(0, height);
  for (let x = 0; x <= width; x += 50) { 
    let y = height * 0.7 + sin(frameCount * 0.05 + x * 0.01) * 15; 
    vertex(x, y); 
  }
  vertex(width, height); endShape(CLOSE);

  for (let f of fishes) {
    f.x += f.vx;
    if (f.x < 0 || f.x > width) f.vx *= -1; 
    for (let b of activeBouncers) {
      if (dist(b.x, b.y, f.x, f.y) < 80) f.vx = (f.x > b.x) ? abs(f.vx) : -abs(f.vx); 
    }
    textSize(40); textAlign(CENTER, CENTER);
    push(); translate(f.x, f.y); scale(f.vx > 0 ? -1 : 1, 1); text('🐟', 0, 0); pop();
  }

  let activeCount = 0;
  for (let t of trashItems) {
    if (t.active) {
      activeCount++;
      if (t.draggedBy === null) t.y = height * 0.72 + sin(frameCount * 0.05 + t.x * 0.01) * 15;
      fill(220, 50, 50, 180); noStroke(); circle(t.x, t.y, t.radius * 2);
      
      if (t.y < height * 0.5 && t.draggedBy !== null) {
        t.active = false; t.draggedBy = null; score += 20; safeSetText('score', score);
        if(!safeGetChecked('calm-mode')) spawnExplosion(t.x, t.y, [220, 50, 50]); 
      }
    }
  }
  if (activeCount === 0 && !isWiping) triggerWipeTransition(3);
}

function drawScene3() {
  noStroke(); fill(101, 67, 33, 150); rect(0, height - 120, width, 120); 
  
  stroke(46, 204, 113, 200); strokeWeight(4);
  for (let g of grass) line(g.x, height, g.x + sin(frameCount*0.02 + g.x)*5, height - g.h);

  for (let c of clouds) {
    fill(220, 220, 220, 220); noStroke();
    ellipse(c.x, c.y, c.w, c.h); ellipse(c.x-60, c.y+20, c.w*.7, c.h*.8); ellipse(c.x+60, c.y+20, c.w*.7, c.h*.8);
    
    let isTouched = false;
    for(let p of activePointers) if(dist(p.x, p.y, c.x, c.y) < c.w/2) isTouched = true;
    for(let b of activeBouncers) if(dist(b.x, b.y, c.x, c.y) < c.w/2) isTouched = true;
    
    if (isTouched || isRainingInBronx) {
      if (frameCount % 6 === 0) raindrops.push({ x: c.x + random(-100, 100), y: c.y + 50, active: true });
    }
  }

  for (let r of raindrops) {
    if (r.active) {
      fill(0, 150, 255, 150); noStroke(); circle(r.x, r.y, 12); r.y += 6; 
      if (r.y > height - 100) { 
        r.active = false; score += 2; safeSetText('score', score);
        for (let g of grass) { if (abs(g.x - r.x) < 30 && g.h < g.maxH) g.h += 1; }

        let watered = false;
        for (let f of flowers) {
          if (dist(f.x, 0, r.x, 0) < 50 && f.size < f.maxSize) { f.size += 5; watered = true; break; }
        }
        if (!watered && flowers.length < 25) flowers.push({ x: r.x, size: 5, maxSize: random(45, 80), type: floor(random(3)), cooldown: 0 });
      }
    }
  }

  let grownFlowers = 0;
  for (let f of flowers) {
    let fCenterY = height - 80 - f.size;
    if (f.size >= f.maxSize) {
      grownFlowers++;
      let fTouched = false; 
      for(let p of activePointers) if(dist(p.x, p.y, f.x, fCenterY) < 40) fTouched = true;
      for(let b of activeBouncers) if(dist(b.x, b.y, f.x, fCenterY) < 40) fTouched = true;

      if (fTouched && f.cooldown <= 0) {
        if (f.type === 0) insects.push({ x: f.x, y: fCenterY, vx: random(-2, 2), vy: random(-2, -5), emoji: '🦋', life: 255 });
        else if (f.type === 1) insects.push({ x: f.x, y: fCenterY, vx: random(-2, 2), vy: random(-2, -5), emoji: '🐝', life: 255 });
        else spawnExplosion(f.x, fCenterY, [255, 215, 0]); 
        f.cooldown = 150; 
      }
    }
    if (f.cooldown > 0) f.cooldown--;
    
    fill(46, 204, 113, 200); noStroke(); rect(f.x - 3, fCenterY, 6, f.size); 
    if (f.type === 0) { fill(255, 105, 180, 220); ellipse(f.x, fCenterY - 10, f.size/1.5, f.size); } 
    else if (f.type === 1) { fill(255, 215, 0, 220); for(let a=0; a<TWO_PI; a+=PI/4) ellipse(f.x + cos(a)*15, fCenterY - 15 + sin(a)*15, 15, 15); fill(139, 69, 19); circle(f.x, fCenterY - 15, 20); } 
    else { fill(200, 100, 255, 220); for(let a=0; a<TWO_PI; a+=PI/3) ellipse(f.x + cos(a)*12, fCenterY - 10 + sin(a)*12, 12, 12); fill(255, 255, 0); circle(f.x, fCenterY - 10, 15); }
  }

  for (let i = insects.length - 1; i >= 0; i--) {
    let ins = insects[i];
    ins.x += ins.vx + sin(frameCount * 0.1); ins.y += ins.vy; ins.life -= 1.5;
    textSize(35); textAlign(CENTER, CENTER); text(ins.emoji, ins.x, ins.y);
    if (ins.life <= 0 || ins.y < -50) insects.splice(i, 1);
  }

  if (grownFlowers >= 20) {
    scene3Timer--;
    if (scene3Timer <= 0 && !isWiping) triggerWipeTransition(4);
  }
}

// LEVEL 4: MAGIC CANVAS
function drawScene4() {
  background(20, 10, 40, 150); 

  for(let s of stars) {
    fill(255, 255, 255, 100 + sin(frameCount * 0.05 + s.twinkle) * 100);
    noStroke(); circle(s.x, s.y, s.size);
  }

  fill(50, 50, 50, 200); rect(width/2 - 200, 30, 400, 30, 15);
  fill(255, 204, 0); rect(width/2 - 200, 30, map(artEnergy, 0, 2000, 0, 400), 30, 15);

  let allBrushes = activePointers.concat(activeBouncers);
  for (let brush of allBrushes) {
    if (frameCount % 2 === 0 && handVelocity > 2) {
        artStrokes.push({
          x: brush.x + random(-15, 15), y: brush.y + random(-15, 15),
          color: brush.color || [255,255,255], life: 255, size: random(10, 30)
        });
    }
    artEnergy += 1; 
  }

  push();
  blendMode(ADD); 
  for (let i = artStrokes.length - 1; i >= 0; i--) {
    let pt = artStrokes[i];
    pt.life -= 3; pt.y -= 1; 
    fill(pt.color[0], pt.[...](asc_slot://start-slot-42)color, pt.[...](asc_slot://start-slot-44)color, pt.life); noStroke();
    circle(pt.x, pt.y, pt.size * (pt.life/255));
    if (pt.life <= 0) artStrokes.splice(i, 1);
  }
  pop();

  if (artEnergy >= 2000 && !isWiping) triggerWipeTransition(5);
}

// LEVEL 5: BUBBLES & WHIMSICAL SUN
function drawScene5() {
  let sunX = width - 180; let sunY = 180;
  sunSize = 180 + sin(frameCount * 0.02) * 8; 
  
  noStroke(); fill(255, 204, 0, 100); circle(sunX, sunY, sunSize);
  fill(255, 255, 0, 180); circle(sunX, sunY, sunSize - 30);
  
  if (safeGetChecked('whimsical-mode')) {
    fill(0); arc(sunX - 25, sunY - 10, 35, 35, 0, PI); arc(sunX + 25, sunY - 10, 35, 35, 0, PI);
    stroke(0); strokeWeight(4); line(sunX - 45, sunY - 10, sunX + 45, sunY - 10);
    noFill(); stroke(0); strokeWeight(4); arc(sunX, sunY + 20, 30, 30, 0, PI);
  }

  let sunTouched = false;
  for(let p of activePointers) if(dist(p.x, p.y, sunX, sunY) < sunSize/2) sunTouched = true;
  for(let b of activeBouncers) if(dist(b.x, b.y, sunX, sunY) < sunSize/2) sunTouched = true;
  if (sunTouched && frameCount % 4 === 0) {
    sunSize += 20; spawnExplosion(sunX, sunY + 80, [255, 255, 0]);
  }

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
      b.vy += 0.015; b.x += b.vx; b.y += b.vy;

      stroke(255, 255, 255, 180); strokeWeight(b.isRed ? 4 : 2); 
      fill(b.color[0], b.[...](asc_slot://start-slot-46)color, b.[...](asc_slot://start-slot-48)color, 180); circle(b.x, b.y, b.radius * 2);
      if (b.x < b.radius || b.x > width - b.radius) b.vx *= -1;

      for (let kicker of activeBouncers) {
        if (dist(kicker.x, kicker.y, b.x, b.y) < b.radius + 40) {
          let angle = atan2(b.y - kicker.y, b.x - kicker.x);
          b.vx = cos(angle) * 7; b.vy = sin(angle) * 7 - 2; 
          ripples.push({x: b.x, y: b.y, radius: b.radius, alpha: 200});
        }
      }

      let pointed = false;
      for (let p of activePointers) { if (dist(p.x, p.y, b.x, b.y) < b.radius) pointed = true; }
      
      let steppedOn = false;
      if (b.y > height - b.radius) {
        for (let foot of activeFeet) if (dist(foot.x, foot.y, b.x, b.y) < b.radius + 50) steppedOn = true;
      }

      if (pointed || steppedOn) {
        if (b.isRed) popBubble(b); 
        else if (pointed) b.vy = -3; 
      } else if (b.y > height - b.radius) {
        b.vy = -6; 
      }

      if (b.y > height + 100 || b.y < -150) { b.active = false; setTimeout(spawnBubble, 500); }
    }
  }

  if (bubblesPopped >= 30 && !isWiping) triggerWipeTransition(6);
}

function popBubble(b) {
  b.active = false; bubblesPopped++; score += 50; safeSetText('score', score);
  if(!safeGetChecked('calm-mode')) spawnExplosion(b.x, b.y, b.color);
  setTimeout(spawnBubble, 800);
}

// ==========================================
// 7. USER INTERFACE
// ==========================================
function updateUI() {
  let lang = isEnglish ? textDict.EN : textDict.ES;
  safeSetText('level-display', currentScene);
  if (currentScene === 1) safeSetText('instructions', lang.lvl1);
  if (currentScene === 2) safeSetText('instructions', lang.lvl2);
  if (currentScene === 3) safeSetText('instructions', lang.lvl3);
  if (currentScene === 4) safeSetText('instructions', lang.lvl4);
  if (currentScene === 5) safeSetText('instructions', lang.lvl5);
  if (currentScene === 6) safeSetText('instructions', lang.win);
}

function toggleLanguage() {
  isEnglish = !isEnglish; let lang = isEnglish ? textDict.EN : textDict.ES;
  safeSetText('title-text', lang.title); safeSetText('level-text', lang.lvlText); safeSetText('lang-btn', lang.btn);
  updateUI();
}

function toggleSettings() {
  let panel = document.getElementById('settings-panel');
  if (panel) panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);
  let btn = document.getElementById('fs-btn');
  if(btn) btn.innerText = !fs ? "↙ Exit Fullscreen" : "⛶ Fullscreen";
}
