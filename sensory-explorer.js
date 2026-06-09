// Bronx Children's Museum - Sensory Explorer
// Replace your current sensory-explorer.js with this full file.

let video;
let videoReady = false;
let cameraError = "";
let currentScene = 1;
let score = 0;
let isEnglish = true;
let globalFlowers = Number(localStorage.getItem("bxcm_flowers") || 0);

let isWiping = false;
let wipeX = -2000;
let nextScene = 1;

let skyColor = [135, 206, 235];
let isRainingInBronx = false;
let particles = [];

let mpHands = null;
let trackedHandsData = [];
let prevHandPositions = [];
let handVelocity = 0;
let activePointers = [];
let activeBouncers = [];
let activeFeet = [];

let playerColors = [[0, 255, 255], [255, 0, 255], [255, 255, 0]];

let smogGraphics;
let smogCleared = 0;
let trashItems = [];
let fishes = [];
let clouds = [];
let raindrops = [];
let flowers = [];
let grass = [];
let scene3Timer = 240;
let artStrokes = [];
let artEnergy = 0;
let stars = [];
let popBubbles = [];
let bubblesPopped = 0;
let sunSize = 180;
let ripples = [];
let fireflies = [];

const textDict = {
  EN: {
    title: "Bronx Explorer 🌱",
    lvl1: "Level 1: Wave your arms slowly to clear the smog.",
    lvl2: "Level 2: Clean the river! Play with the fish!",
    lvl3: "Level 3: Touch clouds to make rain. Grow the garden!",
    lvl4: "Level 4: MAGIC CANVAS! Draw in the air with light!",
    lvl5: "Level 5: Pop coral bubbles! Bounce the rest.",
    win: "🎉 Beautiful job! Thank you! 🎉",
    lvlText: "Level:",
    btn: "Español"
  },
  ES: {
    title: "Explorador 🌱",
    lvl1: "Nivel 1: Agita tus brazos para limpiar el smog.",
    lvl2: "Nivel 2: ¡Limpia el río! ¡Juega con los peces!",
    lvl3: "Nivel 3: Toca las nubes. ¡Crece el jardín!",
    lvl4: "Nivel 4: ¡LIENZO MÁGICO! ¡Dibuja en el aire con luz!",
    lvl5: "Nivel 5: ¡Explota las burbujas rojas! Rebota las demás.",
    win: "🎉 ¡Hermoso trabajo! ¡Gracias! 🎉",
    lvlText: "Nivel:",
    btn: "English"
  }
};

function safeSetText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.innerText = txt;
}

function safeGetChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function safeGetValue(id, defaultVal) {
  const el = document.getElementById(id);
  return el ? el.value : defaultVal;
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style("z-index", "0");

  safeSetText("global-score", globalFlowers);
  updateUI();
  initScene1();

  const constraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user"
    },
    audio: false
  };

  try {
    video = createCapture(constraints, () => {
      videoReady = true;
      setupTracking();
      startMediaPipeTracker();
    });
    video.elt.setAttribute("playsinline", "true");
    video.hide();
  } catch (err) {
    cameraError = err.message || String(err);
  }
}

function draw() {
  background(skyColor[0], skyColor[1], skyColor[2]);

  if (!videoReady || !video || !video.elt || video.elt.readyState < 2) {
    drawWaitingScreen();
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
  else drawWinScene();

  drawSkeletonsAndInteractions();

  if (!safeGetChecked("calm-mode")) drawParticles();
  drawWipeIfNeeded();
}

function drawWaitingScreen() {
  background(20, 20, 40);
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(34);
  text("Starting camera...", width / 2, height / 2 - 35);
  textSize(18);
  text("Allow camera access when Chrome asks.", width / 2, height / 2 + 8);
  if (cameraError) text("Camera error: " + cameraError, width / 2, height / 2 + 45);
}

function setupTracking() {
  if (!window.Hands) {
    console.error("MediaPipe Hands did not load. Check hands.js in index.html.");
    return;
  }

  mpHands = new window.Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  mpHands.setOptions({
    maxNumHands: 4,
    modelComplexity: 1,
    minDetectionConfidence: 0.35,
    minTrackingConfidence: 0.35
  });

  mpHands.onResults(results => {
    trackedHandsData = results.multiHandLandmarks || [];
  });
}

function startMediaPipeTracker() {
  let isProcessing = false;

  async function processFrame() {
    if (mpHands && video && video.elt && video.elt.readyState >= 2 && !isProcessing) {
      isProcessing = true;
      try {
        await mpHands.send({ image: video.elt });
      } catch (e) {
        console.warn("MediaPipe frame skipped", e);
      }
      isProcessing = false;
    }
    requestAnimationFrame(processFrame);
  }

  processFrame();
}

function drawSkeletonsAndInteractions() {
  handVelocity = 0;
  activePointers = [];
  activeBouncers = [];
  activeFeet = [];

  const zoneWidth = width / 3;

  for (let k = 0; k < trackedHandsData.length; k++) {
    const landmarks = trackedHandsData[k];
    const mappedLm = [];

    for (let i = 0; i < landmarks.length; i++) {
      const mx = landmarks[i].x * width;
      const my = landmarks[i].y * height;
      mappedLm.push([width - mx, my]);
    }

    const wrist = mappedLm[0];
    const indexBase = mappedLm[5];
    const indexTip = mappedLm[8];
    const palmCenter = averagePoints([mappedLm[0], mappedLm[5], mappedLm[9], mappedLm[13], mappedLm[17]]);
    const playerIndex = constrain(floor(palmCenter[0] / zoneWidth), 0, 2);
    const pColor = playerColors[playerIndex];

    stroke(pColor[0], pColor[1], pColor[2], 180);
    strokeWeight(8);
    noFill();
    line(wrist[0], wrist[1], indexTip[0], indexTip[1]);

    fill(pColor[0], pColor[1], pColor[2], 190);
    noStroke();
    circle(indexTip[0], indexTip[1], 28);
    circle(palmCenter[0], palmCenter[1], 42);

    if (prevHandPositions[k]) {
      handVelocity += dist(indexTip[0], indexTip[1], prevHandPositions[k][0], prevHandPositions[k][1]);
    }
    prevHandPositions[k] = indexTip;

    const palmSize = dist(wrist[0], wrist[1], indexBase[0], indexBase[1]);
    const indexExt = dist(wrist[0], wrist[1], indexTip[0], indexTip[1]);
    const isGrabbing = indexExt < palmSize * 1.7;

    if (isGrabbing) {
      activeBouncers.push({ x: palmCenter[0], y: palmCenter[1], id: k, color: pColor });
      if (palmCenter[1] > height * 0.7) activeFeet.push({ x: palmCenter[0], y: palmCenter[1] });
      handleTrashDragging(k, palmCenter);
    } else {
      activePointers.push({ x: indexTip[0], y: indexTip[1], color: pColor });
      releaseTrash(k);
    }
  }
}

function averagePoints(points) {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p[0];
    y += p[1];
  }
  return [x / points.length, y / points.length];
}

function initScene1() {
  smogCleared = 0;
  smogGraphics = createGraphics(width, height);
  smogGraphics.noStroke();
  smogGraphics.fill(35, 35, 45, 215);
  smogGraphics.rect(0, 0, width, height);

  for (let i = 0; i < 120; i++) {
    smogGraphics.fill(120, 120, 130, random(40, 110));
    smogGraphics.ellipse(random(width), random(height), random(120, 420), random(80, 260));
  }
}

function initScene2() {
  trashItems = [];
  fishes = [];

  for (let i = 0; i < 10; i++) {
    trashItems.push({
      x: random(100, width - 100),
      y: height * 0.72 + random(-30, 30),
      radius: random(22, 36),
      active: true,
      draggedBy: null
    });
  }

  for (let i = 0; i < 7; i++) {
    fishes.push({
      x: random(width),
      y: random(height * 0.72, height - 80),
      vx: random([-1, 1]) * random(1.2, 3)
    });
  }
}

function initScene3() {
  clouds = [];
  raindrops = [];
  flowers = [];
  grass = [];
  scene3Timer = 240;

  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: width * (0.15 + i * 0.18),
      y: random(120, 260),
      w: random(170, 240),
      h: random(70, 110)
    });
  }

  for (let x = 0; x < width; x += 18) {
    grass.push({ x, h: random(15, 55), maxH: random(65, 130) });
  }
}

function initScene4() {
  artStrokes = [];
  artEnergy = 0;
  stars = [];

  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 5),
      twinkle: random(TWO_PI)
    });
  }
}

function initScene5() {
  popBubbles = [];
  bubblesPopped = 0;
  ripples = [];
  fireflies = [];

  for (let i = 0; i < 12; i++) spawnBubble();

  for (let i = 0; i < 90; i++) {
    fireflies.push({
      x: random(width),
      y: random(height),
      vx: random(-0.5, 0.5),
      vy: random(-0.5, 0.5)
    });
  }
}

function drawScenicBackground() {
  noStroke();

  if (currentScene === 1) {
    fill(80, 85, 95, 160);
    rect(width * 0.1, height - 300, 150, 300);
    rect(width * 0.3, height - 400, 120, 400);
    rect(width * 0.6, height - 250, 200, 250);
    rect(width * 0.8, height - 350, 100, 350);
  } else if (currentScene === 2 || currentScene === 3) {
    fill(34, 139, 34, 100);
    ellipse(width * 0.3, height, width * 0.8, 600);
    fill(34, 139, 34, 120);
    ellipse(width * 0.8, height, width, 500);
  }
}

function drawScene1() {
  if (handVelocity > 5 && !isWiping && smogGraphics) {
    const allErasers = activePointers.concat(activeBouncers);
    smogGraphics.erase();

    for (const pt of allErasers) {
      smogGraphics.circle(pt.x, pt.y, 220);
      smogCleared += 0.5;
    }

    smogGraphics.noErase();
  }

  if (smogGraphics) image(smogGraphics, 0, 0);
  if (smogCleared > 1200 && !isWiping) triggerWipeTransition(2);
}

function drawScene2() {
  fill(0, 100, 200, 150);
  noStroke();

  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 50) {
    vertex(x, height * 0.7 + sin(frameCount * 0.05 + x * 0.01) * 15);
  }
  vertex(width, height);
  endShape(CLOSE);

  for (const f of fishes) {
    f.x += f.vx;
    if (f.x < 20 || f.x > width - 20) f.vx *= -1;

    for (const b of activeBouncers) {
      if (dist(b.x, b.y, f.x, f.y) < 80) {
        f.vx = f.x > b.x ? abs(f.vx) : -abs(f.vx);
      }
    }

    textSize(44);
    textAlign(CENTER, CENTER);
    push();
    translate(f.x, f.y);
    scale(f.vx > 0 ? -1 : 1, 1);
    text("🐟", 0, 0);
    pop();
  }

  let activeCount = 0;

  for (const t of trashItems) {
    if (!t.active) continue;

    activeCount++;

    if (t.draggedBy === null) {
      t.y = height * 0.72 + sin(frameCount * 0.05 + t.x * 0.01) * 15;
    }

    fill(220, 50, 50, 210);
    noStroke();
    circle(t.x, t.y, t.radius * 2);

    fill(255);
    textSize(22);
    textAlign(CENTER, CENTER);
    text("×", t.x, t.y - 1);

    if (t.y < height * 0.5 && t.draggedBy !== null) {
      t.active = false;
      t.draggedBy = null;
      score += 20;
      updateScore();

      if (!safeGetChecked("calm-mode")) {
        spawnExplosion(t.x, t.y, [220, 50, 50]);
      }
    }
  }

  if (activeCount === 0 && !isWiping) triggerWipeTransition(3);
}

function drawScene3() {
  noStroke();
  fill(101, 67, 33, 150);
  rect(0, height - 120, width, 120);

  stroke(46, 204, 113, 200);
  strokeWeight(4);

  for (const g of grass) {
    line(g.x, height, g.x + sin(frameCount * 0.02 + g.x) * 5, height - g.h);
  }

  for (const c of clouds) {
    fill(225, 225, 225, 225);
    noStroke();
    ellipse(c.x, c.y, c.w, c.h);
    ellipse(c.x - 60, c.y + 20, c.w * 0.7, c.h * 0.8);
    ellipse(c.x + 60, c.y + 20, c.w * 0.7, c.h * 0.8);

    const touched = activePointers.concat(activeBouncers).some(p => dist(p.x, p.y, c.x, c.y) < c.w / 2);

    if ((touched || isRainingInBronx) && frameCount % 6 === 0) {
      raindrops.push({ x: c.x + random(-100, 100), y: c.y + 50, active: true });
    }
  }

  for (const r of raindrops) {
    if (!r.active) continue;

    fill(0, 150, 255, 170);
    noStroke();
    circle(r.x, r.y, 12);
    r.y += 6;

    if (r.y > height - 100) {
      r.active = false;
      score += 2;
      updateScore();

      for (const g of grass) {
        if (abs(g.x - r.x) < 30 && g.h < g.maxH) g.h += 1;
      }

      let watered = false;

      for (const f of flowers) {
        if (abs(f.x - r.x) < 50 && f.size < f.maxSize) {
          f.size += 5;
          watered = true;
          break;
        }
      }

      if (!watered && flowers.length < 25) {
        flowers.push({
          x: r.x,
          size: 5,
          maxSize: random(45, 80),
          type: floor(random(3)),
          cooldown: 0
        });
      }
    }
  }

  let grownFlowers = 0;

  for (const f of flowers) {
    const fy = height - 80 - f.size;

    if (f.size >= f.maxSize) grownFlowers++;

    fill(46, 204, 113, 220);
    noStroke();
    rect(f.x - 3, fy, 6, f.size);

    if (f.type === 0) {
      fill(255, 105, 180, 230);
      ellipse(f.x, fy - 10, f.size / 1.5, f.size);
    } else if (f.type === 1) {
      fill(255, 215, 0, 230);
      for (let a = 0; a < TWO_PI; a += PI / 4) {
        ellipse(f.x + cos(a) * 15, fy - 15 + sin(a) * 15, 15, 15);
      }
      fill(139, 69, 19);
      circle(f.x, fy - 15, 20);
    } else {
      fill(200, 100, 255, 230);
      for (let a = 0; a < TWO_PI; a += PI / 3) {
        ellipse(f.x + cos(a) * 12, fy - 10 + sin(a) * 12, 12, 12);
      }
      fill(255, 255, 0);
      circle(f.x, fy - 10, 15);
    }
  }

  if (grownFlowers >= 20) {
    scene3Timer--;
    if (scene3Timer <= 0 && !isWiping) triggerWipeTransition(4);
  }
}

function drawScene4() {
  background(20, 10, 40, 170);

  for (const s of stars) {
    fill(255, 255, 255, 100 + sin(frameCount * 0.05 + s.twinkle) * 100);
    noStroke();
    circle(s.x, s.y, s.size);
  }

  fill(50, 50, 50, 210);
  rect(width / 2 - 200, 30, 400, 30, 15);

  fill(255, 204, 0);
  rect(width / 2 - 200, 30, constrain(map(artEnergy, 0, 2000, 0, 400), 0, 400), 30, 15);

  const brushes = activePointers.concat(activeBouncers);

  for (const brush of brushes) {
    if (frameCount % 2 === 0 && handVelocity > 2) {
      artStrokes.push({
        x: brush.x + random(-15, 15),
        y: brush.y + random(-15, 15),
        color: brush.color || [255, 255, 255],
        life: 255,
        size: random(10, 30)
      });
    }
    artEnergy += 1;
  }

  push();
  blendMode(ADD);

  for (let i = artStrokes.length - 1; i >= 0; i--) {
    const pt = artStrokes[i];
    pt.life -= 3;
    pt.y -= 1;

    fill(pt.color[0], pt.color[1], pt.color[2], pt.life);
    noStroke();
    circle(pt.x, pt.y, pt.size * (pt.life / 255));

    if (pt.life <= 0) artStrokes.splice(i, 1);
  }

  pop();

  if (artEnergy >= 2000 && !isWiping) triggerWipeTransition(5);
}

function drawScene5() {
  const sunX = width - 180;
  const sunY = 180;

  sunSize = 180 + sin(frameCount * 0.02) * 8;

  noStroke();
  fill(255, 204, 0, 110);
  circle(sunX, sunY, sunSize);

  fill(255, 255, 0, 190);
  circle(sunX, sunY, sunSize - 30);

  if (safeGetChecked("whimsical-mode")) {
    fill(0);
    arc(sunX - 25, sunY - 10, 35, 35, 0, PI);
    arc(sunX + 25, sunY - 10, 35, 35, 0, PI);
    noFill();
    stroke(0);
    strokeWeight(4);
    arc(sunX, sunY + 20, 35, 30, 0, PI);
  }

  for (const f of fireflies) {
    f.x += f.vx + sin(frameCount * 0.05) * 0.5;
    f.y += f.vy + cos(frameCount * 0.05) * 0.5;

    fill(255, 255, 150, 180);
    noStroke();
    circle(f.x, f.y, 4);

    if (f.x < 0) f.x = width;
    if (f.x > width) f.x = 0;
    if (f.y < 0) f.y = height;
    if (f.y > height) f.y = 0;
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];

    noFill();
    stroke(255, 255, 255, r.alpha);
    strokeWeight(3);
    circle(r.x, r.y, r.radius);

    r.radius += 3;
    r.alpha -= 5;

    if (r.alpha <= 0) ripples.splice(i, 1);
  }

  for (const b of popBubbles) {
    if (!b.active) continue;

    b.vy += 0.015;
    b.x += b.vx;
    b.y += b.vy;

    stroke(255, 255, 255, 180);
    strokeWeight(b.isRed ? 4 : 2);
    fill(b.color[0], b.color[1], b.color[2], 180);
    circle(b.x, b.y, b.radius * 2);

    if (b.x < b.radius || b.x > width - b.radius) b.vx *= -1;

    for (const kicker of activeBouncers) {
      if (dist(kicker.x, kicker.y, b.x, b.y) < b.radius + 40) {
        const angle = atan2(b.y - kicker.y, b.x - kicker.x);
        b.vx = cos(angle) * 7;
        b.vy = sin(angle) * 7 - 2;
        ripples.push({ x: b.x, y: b.y, radius: b.radius, alpha: 200 });
      }
    }

    const pointed = activePointers.some(p => dist(p.x, p.y, b.x, b.y) < b.radius);
    const steppedOn = b.y > height - b.radius && activeFeet.some(foot => dist(foot.x, foot.y, b.x, b.y) < b.radius + 50);

    if (pointed || steppedOn) {
      if (b.isRed) popBubble(b);
      else if (pointed) b.vy = -3;
    } else if (b.y > height - b.radius) {
      b.vy = -6;
    }

    if (b.y > height + 100 || b.y < -150) {
      b.active = false;
      setTimeout(spawnBubble, 500);
    }
  }

  if (bubblesPopped >= 30 && !isWiping) triggerWipeTransition(6);
}

function drawWinScene() {
  background(44, 94, 79, 220);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(54);
  text(isEnglish ? textDict.EN.win : textDict.ES.win, width / 2, height / 2);

  if (frameCount % 30 === 0 && !safeGetChecked("calm-mode")) {
    spawnExplosion(random(width), random(height), [255, 255, 255]);
  }

  if (frameCount % 500 === 0 && !isWiping) {
    triggerWipeTransition(1);
  }
}

function handleTrashDragging(k, palmCenter) {
  if (currentScene !== 2) return;

  let holding = false;

  for (const t of trashItems) {
    if (t.active && t.draggedBy === k) {
      t.x = palmCenter[0];
      t.y = palmCenter[1];
      holding = true;
    }
  }

  if (!holding) {
    for (const t of trashItems) {
      if (t.active && t.draggedBy === null && dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 2.5) {
        t.draggedBy = k;
        break;
      }
    }
  }
}

function releaseTrash(k) {
  if (currentScene !== 2) return;

  for (const t of trashItems) {
    if (t.draggedBy === k) t.draggedBy = null;
  }
}

function spawnBubble() {
  const radius = Number(safeGetValue("bubble-size", 45));
  const isRed = random() < 0.35;

  popBubbles.push({
    x: random(radius, width - radius),
    y: random(-100, height * 0.4),
    vx: random(-2, 2),
    vy: random(0.5, 2),
    radius,
    color: isRed ? [255, 80, 90] : random([[80, 220, 255], [180, 120, 255], [120, 255, 180], [255, 220, 80]]),
    isRed,
    active: true
  });
}

function popBubble(b) {
  b.active = false;
  bubblesPopped++;
  score += 50;
  updateScore();

  if (!safeGetChecked("calm-mode")) {
    spawnExplosion(b.x, b.y, b.color);
  }

  setTimeout(spawnBubble, 800);
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = random(-5, 5);
    this.vy = random(-5, 5);
    this.life = 255;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 10;
  }

  show() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.life);
    circle(this.x, this.y, 8);
  }
}

function spawnExplosion(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y, color));
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();

    if (particles[i].life <= 0) {
      particles.splice(i, 1);
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

function drawWipeIfNeeded() {
  if (!isWiping) return;

  wipeX += 40;
  drawGiantCloudWipe(wipeX);

  if (wipeX > width / 2 && currentScene !== nextScene) {
    currentScene = nextScene;
    updateUI();
    reinitCurrentScene();
  }

  if (wipeX > width + 1000) {
    isWiping = false;
    wipeX = -2000;
  }
}

function drawGiantCloudWipe(xPos) {
  noStroke();
  fill(255, 255, 255, 245);
  ellipse(xPos, height / 2, 1200, 1500);
  ellipse(xPos - 300, height / 3, 1000, 1200);
  ellipse(xPos - 300, height * 0.7, 1000, 1200);
  ellipse(xPos - 600, height / 2, 1500, 2000);
}

function updateScore() {
  safeSetText("score", score);
}

function updateUI() {
  const lang = isEnglish ? textDict.EN : textDict.ES;

  safeSetText("title-text", lang.title);
  safeSetText("level-text", lang.lvlText);
  safeSetText("lang-btn", lang.btn);
  safeSetText("level-display", currentScene);

  if (currentScene === 1) safeSetText("instructions", lang.lvl1);
  else if (currentScene === 2) safeSetText("instructions", lang.lvl2);
  else if (currentScene === 3) safeSetText("instructions", lang.lvl3);
  else if (currentScene === 4) safeSetText("instructions", lang.lvl4);
  else if (currentScene === 5) safeSetText("instructions", lang.lvl5);
  else safeSetText("instructions", lang.win);
}

function reinitCurrentScene() {
  if (currentScene === 1) initScene1();
  else if (currentScene === 2) initScene2();
  else if (currentScene === 3) initScene3();
  else if (currentScene === 4) initScene4();
  else if (currentScene === 5) initScene5();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  reinitCurrentScene();
}

function resetGame() {
  score = 0;
  currentScene = 1;
  updateScore();
  initScene1();
}

function toggleLanguage() {
  isEnglish = !isEnglish;
  updateUI();
}

function toggleSettings() {
  const panel = document.getElementById("settings-panel");
  if (panel) panel.style.display = panel.style.display === "block" ? "none" : "block";
}

function toggleFullscreen() {
  const fs = fullscreen();
  fullscreen(!fs);

  const btn = document.getElementById("fs-btn");
  if (btn) btn.innerText = !fs ? "↙ Exit Fullscreen" : "⛶ Fullscreen";
}
