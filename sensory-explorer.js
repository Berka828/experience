// Bronx Children's Museum - Sensory Explorer
// Full replacement script with better hands, finger outlines, feet, sun/moon, F fullscreen, and level customization.

let video;
let videoReady = false;
let cameraError = "";

let currentScene = 1;
let score = 0;
let isEnglish = true;

let isWiping = false;
let wipeX = -2000;
let nextScene = 1;

let skyColor = [135, 206, 235];
let isNightMode = false;

let mpHands = null;
let mpPose = null;
let trackedHandsData = [];
let trackedPoseData = null;

let prevHandPositions = [];
let handVelocity = 0;

let activePointers = [];
let activeBouncers = [];
let activeFeet = [];

let particles = [];
let playerColors = [
  [0, 255, 255],
  [255, 0, 255],
  [255, 230, 0]
];

let smogGraphics;
let smogCleared = 0;
let trashItems = [];
let fishes = [];
let clouds = [];
let raindrops = [];
let flowers = [];
let grass = [];

let artStrokes = [];
let artEnergy = 0;
let stars = [];

let popBubbles = [];
let bubblesPopped = 0;
let ripples = [];
let fireflies = [];
let sunPulse = 0;

let levelSettings = {
  level1Goal: 1200,
  level2Trash: 10,
  level3Flowers: 20,
  level4Energy: 2000,
  level5Bubbles: 30,
  grabAssist: 1.8,
  showHands: true,
  showFeet: true,
  showSkeletonLines: true
};

const textDict = {
  EN: {
    title: "Bronx Explorer 🌱",
    lvl1: "Level 1: Wave your hands to clear the smog.",
    lvl2: "Level 2: Grab trash from the river and lift it out!",
    lvl3: "Level 3: Touch clouds to make rain. Grow the garden!",
    lvl4: "Level 4: Magic Canvas! Draw in the air with light.",
    lvl5: "Level 5: Pop red coral bubbles. Bounce the rest.",
    win: "Beautiful job! Thank you!",
    lvlText: "Level:",
    btn: "Español"
  },
  ES: {
    title: "Explorador 🌱",
    lvl1: "Nivel 1: Usa tus manos para limpiar el smog.",
    lvl2: "Nivel 2: Agarra basura del río y sácala.",
    lvl3: "Nivel 3: Toca las nubes. ¡Crece el jardín!",
    lvl4: "Nivel 4: ¡Dibuja en el aire con luz!",
    lvl5: "Nivel 5: Explota burbujas rojas. Rebota las demás.",
    win: "¡Hermoso trabajo! ¡Gracias!",
    lvlText: "Nivel:",
    btn: "English"
  }
};

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style("z-index", "0");

  determineDayNight();
  ensureCustomizationPanel();
  updateUI();
  initScene1();

  try {
    video = createCapture(
      {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      },
      () => {
        videoReady = true;
        setupHandsTracking();
        setupPoseTracking();
        startTrackingLoop();
      }
    );

    video.elt.setAttribute("playsinline", "true");
    video.hide();
  } catch (err) {
    cameraError = err.message || String(err);
  }
}

function draw() {
  drawSky();

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

  drawTrackedBodyParts();

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

function determineDayNight() {
  const hour = new Date().getHours();
  isNightMode = hour < 6 || hour >= 18;

  if (isNightMode) {
    skyColor = [18, 24, 58];
  } else {
    skyColor = [135, 206, 235];
  }
}

function drawSky() {
  background(skyColor[0], skyColor[1], skyColor[2]);

  if (isNightMode) {
    drawNightSky();
  } else {
    drawSun(width - 160, 150, 95);
  }
}

function drawSun(x, y, baseSize) {
  const touched = activePointers.concat(activeBouncers, activeFeet).some(p => dist(p.x, p.y, c.x, c.y) < c.w * 0.65);
  if (touched) {
    sunPulse = 28;
    if (frameCount % 4 === 0 && !safeGetChecked("calm-mode")) {
      spawnExplosion(x, y, [255, 230, 80]);
    }
  }

  if (sunPulse > 0) sunPulse *= 0.9;

  const size = baseSize + sin(frameCount * 0.04) * 5 + sunPulse;

  push();
  translate(x, y);

  stroke(255, 220, 60, 165);
  strokeWeight(6);
  for (let a = 0; a < TWO_PI; a += PI / 12) {
    const r1 = size * 0.65;
    const r2 = size * 1.1 + sin(frameCount * 0.05 + a) * 8;
    line(cos(a) * r1, sin(a) * r1, cos(a) * r2, sin(a) * r2);
  }

  noStroke();
  fill(255, 215, 40, 130);
  circle(0, 0, size * 1.7);

  fill(255, 235, 80, 230);
  circle(0, 0, size);

  if (safeGetChecked("whimsical-mode")) {
    fill(0);
    arc(-18, -10, 24, 24, 0, PI);
    arc(18, -10, 24, 24, 0, PI);
    noFill();
    stroke(0);
    strokeWeight(3);
    arc(0, 16, 36, 24, 0, PI);
  }

  pop();
}

function drawNightSky() {
  if (stars.length < 120) {
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: random(width),
        y: random(height * 0.7),
        size: random(1, 4),
        twinkle: random(TWO_PI)
      });
    }
  }

  for (const s of stars) {
    fill(255, 255, 255, 110 + sin(frameCount * 0.05 + s.twinkle) * 90);
    noStroke();
    circle(s.x, s.y, s.size);
  }

  const moonX = width - 170;
  const moonY = 145;
  const touched = activePointers.concat(activeBouncers).some(p => dist(p.x, p.y, moonX, moonY) < 90);

  if (touched && frameCount % 5 === 0 && !safeGetChecked("calm-mode")) {
    spawnExplosion(moonX, moonY, [220, 230, 255]);
  }

  noStroke();
  fill(235, 235, 220, 230);
  circle(moonX, moonY, touched ? 125 : 105);
  fill(skyColor[0], skyColor[1], skyColor[2]);
  circle(moonX + 32, moonY - 14, touched ? 116 : 96);
}

function setupHandsTracking() {
  if (!window.Hands) {
    console.warn("MediaPipe Hands did not load.");
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

function setupPoseTracking() {
  if (!window.Pose) {
    console.warn("MediaPipe Pose did not load. Feet tracking skipped.");
    return;
  }

  mpPose = new window.Pose({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  mpPose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.35,
    minTrackingConfidence: 0.35
  });

  mpPose.onResults(results => {
    trackedPoseData = results.poseLandmarks || null;
  });
}

function startTrackingLoop() {
  let isProcessing = false;

  async function processFrame() {
    if (video && video.elt && video.elt.readyState >= 2 && !isProcessing) {
      isProcessing = true;

      try {
        if (mpHands) await mpHands.send({ image: video.elt });
        if (mpPose) await mpPose.send({ image: video.elt });
      } catch (e) {
        console.warn("Tracking frame skipped", e);
      }

      isProcessing = false;
    }

    requestAnimationFrame(processFrame);
  }

  processFrame();
}

function drawTrackedBodyParts() {
  handVelocity = 0;
  activePointers = [];
  activeBouncers = [];
  activeFeet = [];

  drawFeetFromPose();
  drawHandsFromMediaPipe();
}

function drawFeetFromPose() {
  if (!trackedPoseData || !levelSettings.showFeet) return;

  const footIndices = [27, 28, 31, 32];

  for (let i = 0; i < footIndices.length; i++) {
    const lm = trackedPoseData[footIndices[i]];
    if (!lm || lm.visibility < 0.35) continue;

    const x = width - lm.x * width;
    const y = lm.y * height;

    activeFeet.push({ x, y });

    fill(255, 255, 255, 140);
    stroke(0, 255, 255, 190);
    strokeWeight(4);
    ellipse(x, y, 82, 42);

    fill(0, 255, 255, 200);
    noStroke();
    circle(x, y, 18);
  }
}

function drawHandsFromMediaPipe() {
  const zoneWidth = width / 3;

  for (let k = 0; k < trackedHandsData.length; k++) {
    const landmarks = trackedHandsData[k];
    const mapped = [];

    for (let i = 0; i < landmarks.length; i++) {
      mapped.push([width - landmarks[i].x * width, landmarks[i].y * height]);
    }

    const wrist = mapped[0];
    const indexBase = mapped[5];
    const indexTip = mapped[8];
    const middleTip = mapped[12];
    const ringTip = mapped[16];
    const pinkyTip = mapped[20];
    const thumbTip = mapped[4];

    const palmCenter = averagePoints([mapped[0], mapped[5], mapped[9], mapped[13], mapped[17]]);
    const playerIndex = constrain(floor(palmCenter[0] / zoneWidth), 0, 2);
    const pColor = playerColors[playerIndex];

    if (prevHandPositions[k]) {
      handVelocity += dist(indexTip[0], indexTip[1], prevHandPositions[k][0], prevHandPositions[k][1]);
    }
    prevHandPositions[k] = indexTip;

    const palmSize = dist(wrist[0], wrist[1], indexBase[0], indexBase[1]);
    const fingertipAvg = averagePoints([thumbTip, indexTip, middleTip, ringTip, pinkyTip]);
    const grabDistance = dist(fingertipAvg[0], fingertipAvg[1], palmCenter[0], palmCenter[1]);
    const isGrabbing = grabDistance < palmSize * levelSettings.grabAssist;

    if (levelSettings.showHands) {
      drawBetterHand(mapped, pColor, isGrabbing);
    }

    const handTargets = [
  thumbTip,
  indexTip,
  middleTip,
  ringTip,
  pinkyTip,
  palmCenter
];

for (const target of handTargets) {
  activePointers.push({
    x: target[0],
    y: target[1],
    color: pColor
  });
}

activeBouncers.push({
  x: palmCenter[0],
  y: palmCenter[1],
  id: k,
  color: pColor
});

if (palmCenter[1] > height * 0.7) {
  activeFeet.push({ x: palmCenter[0], y: palmCenter[1] });
}

if (isGrabbing) {
  handleTrashDragging(k, palmCenter);
} else {
  releaseTrash(k);
}
  }
}

function drawBetterHand(lm, color, isGrabbing) {
  const palm = [0, 5, 9, 13, 17];
  const fingers = [
    [0, 1, 2, 3, 4],
    [0, 5, 6, 7, 8],
    [0, 9, 10, 11, 12],
    [0, 13, 14, 15, 16],
    [0, 17, 18, 19, 20]
  ];

  const palmCenter = averagePoints([lm[0], lm[5], lm[9], lm[13], lm[17]]);

  if (levelSettings.showSkeletonLines) {
    stroke(color[0], color[1], color[2], 95);
    strokeWeight(4);
    strokeCap(ROUND);

    for (const finger of fingers) {
      for (let i = 0; i < finger.length - 1; i++) {
        const a = lm[finger[i]];
        const b = lm[finger[i + 1]];
        line(a[0], a[1], b[0], b[1]);
      }
    }

    noFill();
    stroke(255, 255, 255, 90);
    strokeWeight(3);
    beginShape();
    for (const idx of palm) vertex(lm[idx][0], lm[idx][1]);
    endShape(CLOSE);
  }

  fill(color[0], color[1], color[2], isGrabbing ? 55 : 35);
  stroke(255, 255, 255, 110);
  strokeWeight(2);
  ellipse(palmCenter[0], palmCenter[1], isGrabbing ? 78 : 62, isGrabbing ? 70 : 54);

  const tips = [4, 8, 12, 16, 20];
  for (const idx of tips) {
    fill(255, 255, 255, 150);
    stroke(color[0], color[1], color[2], 130);
    strokeWeight(2);
    circle(lm[idx][0], lm[idx][1], 18);
  }
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

  for (let i = 0; i < levelSettings.level2Trash; i++) {
    trashItems.push({
      x: random(100, width - 100),
      y: height * 0.72 + random(-30, 30),
      radius: random(24, 38),
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
    fill(80, 85, 95, 150);
    rect(width * 0.1, height - 300, 150, 300);
    rect(width * 0.3, height - 400, 120, 400);
    rect(width * 0.6, height - 250, 200, 250);
    rect(width * 0.8, height - 350, 100, 350);
  }

  if (currentScene === 2 || currentScene === 3) {
    fill(34, 139, 34, 90);
    ellipse(width * 0.3, height, width * 0.8, 600);
    fill(34, 139, 34, 120);
    ellipse(width * 0.8, height, width, 500);
  }
}

function drawScene1() {
  if (handVelocity > 5 && !isWiping && smogGraphics) {
    const erasers = activePointers.concat(activeBouncers, activeFeet);
    smogGraphics.erase();

    for (const pt of erasers) {
      smogGraphics.circle(pt.x, pt.y, 240);
      smogCleared += 0.55;
    }

    smogGraphics.noErase();
  }

  if (smogGraphics) image(smogGraphics, 0, 0);

  if (smogCleared > levelSettings.level1Goal && !isWiping) {
    triggerWipeTransition(2);
  }
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
      if (dist(b.x, b.y, f.x, f.y) < 90) {
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

    fill(220, 50, 50, 215);
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

      if (!safeGetChecked("calm-mode")) spawnExplosion(t.x, t.y, [220, 50, 50]);
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

    if (touched && frameCount % 6 === 0) {
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

      if (!watered && flowers.length < 30) {
        flowers.push({
          x: r.x,
          size: 5,
          maxSize: random(45, 80),
          type: floor(random(3))
        });
      }
    }
  }

  let grownFlowers = 0;

  for (const f of flowers) {
    const fy = height - 80 - f.size;

    if (f.size >= f.maxSize) grownFlowers++;
    const flowerTouched = activePointers.concat(activeBouncers, activeFeet).some(
  p => dist(p.x, p.y, f.x, fy - 10) < 65
);

if (flowerTouched) {
  f.size = min(f.maxSize, f.size + 1.5);

  if (frameCount % 8 === 0 && !safeGetChecked("calm-mode")) {
    spawnExplosion(f.x, fy - 20, [255, 215, 0]);
  }
}

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

  if (grownFlowers >= levelSettings.level3Flowers && !isWiping) {
    triggerWipeTransition(4);
  }
}

function drawScene4() {
  background(20, 10, 40, 150);

  for (let i = 0; i < 90; i++) {
    fill(255, 255, 255, 80 + sin(frameCount * 0.03 + i) * 70);
    noStroke();
    circle((i * 97) % width, (i * 53) % height, 2);
  }

  fill(50, 50, 50, 210);
  rect(width / 2 - 200, 30, 400, 30, 15);

  fill(255, 204, 0);
  rect(width / 2 - 200, 30, constrain(map(artEnergy, 0, levelSettings.level4Energy, 0, 400), 0, 400), 30, 15);

  const brushes = activePointers.concat(activeBouncers, activeFeet);

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

  if (artEnergy >= levelSettings.level4Energy && !isWiping) {
    triggerWipeTransition(5);
  }
}

function drawScene5() {
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

    for (const kicker of activeBouncers.concat(activeFeet)) {
      if (dist(kicker.x, kicker.y, b.x, b.y) < b.radius + 50) {
        const angle = atan2(b.y - kicker.y, b.x - kicker.x);
        b.vx = cos(angle) * 7;
        b.vy = sin(angle) * 7 - 2;
        ripples.push({ x: b.x, y: b.y, radius: b.radius, alpha: 200 });
      }
    }

    const touchedByHand = activePointers.concat(activeBouncers).some(
  p => dist(p.x, p.y, b.x, b.y) < b.radius + 22
);

const touchedByFoot = activeFeet.some(
  foot => dist(foot.x, foot.y, b.x, b.y) < b.radius + 65
);

if (touchedByHand || touchedByFoot) {
  if (b.isRed) {
    popBubble(b);
  } else {
    const hitter = activeFeet.find(foot => dist(foot.x, foot.y, b.x, b.y) < b.radius + 65);
    if (hitter) {
      const angle = atan2(b.y - hitter.y, b.x - hitter.x);
      b.vx = cos(angle) * 8;
      b.vy = -8;
    } else {
      b.vy = -4;
    }

    ripples.push({ x: b.x, y: b.y, radius: b.radius, alpha: 200 });
  }
} else if (b.y > height - b.radius) {
  b.vy = -6;
}

    if (b.y > height + 100 || b.y < -150) {
      b.active = false;
      setTimeout(spawnBubble, 500);
    }
  }

  if (bubblesPopped >= levelSettings.level5Bubbles && !isWiping) {
    triggerWipeTransition(6);
  }
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
      if (t.active && t.draggedBy === null && dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 3.3) {
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
  const baseRadius = Number(safeGetValue("bubble-size", 45));
  const radius = random(baseRadius * 0.65, baseRadius * 1.45);
  const isRed = random() < 0.35;

  popBubbles.push({
    x: random(radius, width - radius),
    y: random(-120, height * 0.45),
    vx: random(-2.4, 2.4),
    vy: random(0.5, 2.2),
    radius,
    color: isRed ? [255, 80, 90] : random([
      [80, 220, 255],
      [180, 120, 255],
      [120, 255, 180],
      [255, 220, 80]
    ]),
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

function reinitCurrentScene() {
  if (currentScene === 1) initScene1();
  else if (currentScene === 2) initScene2();
  else if (currentScene === 3) initScene3();
  else if (currentScene === 4) initScene4();
  else if (currentScene === 5) initScene5();
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

function ensureCustomizationPanel() {
  const panel = document.getElementById("settings-panel");
  if (!panel) return;

  panel.innerHTML = `
    <h3>Exhibit Customization</h3>

    <label>Bubble Size:
      <input type="range" id="bubble-size" min="30" max="90" value="45">
    </label><br><br>

    <label>Level 1 Smog Goal:
      <input type="range" id="level1-goal" min="400" max="2500" value="${levelSettings.level1Goal}">
    </label><br><br>

    <label>Level 2 Trash Count:
      <input type="range" id="level2-trash" min="3" max="25" value="${levelSettings.level2Trash}">
    </label><br><br>

    <label>Level 3 Flower Goal:
      <input type="range" id="level3-flowers" min="5" max="30" value="${levelSettings.level3Flowers}">
    </label><br><br>

    <label>Level 4 Drawing Goal:
      <input type="range" id="level4-energy" min="500" max="5000" value="${levelSettings.level4Energy}">
    </label><br><br>

    <label>Level 5 Bubble Goal:
      <input type="range" id="level5-bubbles" min="5" max="60" value="${levelSettings.level5Bubbles}">
    </label><br><br>

    <label>Grab Assist:
      <input type="range" id="grab-assist" min="12" max="30" value="18">
    </label><br><br>

    <label>Show Hands:
      <input type="checkbox" id="show-hands" checked>
    </label><br><br>

    <label>Show Feet:
      <input type="checkbox" id="show-feet" checked>
    </label><br><br>

    <label>Show Skeleton Lines:
      <input type="checkbox" id="show-lines" checked>
    </label><br><br>

    <label>Calm Mode:
      <input type="checkbox" id="calm-mode">
    </label><br><br>

    <label>Whimsical Faces:
      <input type="checkbox" id="whimsical-mode" checked>
    </label><br><br>

    <button onclick="applyCustomization()">Apply Changes</button>
    <button onclick="toggleSettings()">Close</button>
  `;
}

function applyCustomization() {
  levelSettings.level1Goal = Number(safeGetValue("level1-goal", 1200));
  levelSettings.level2Trash = Number(safeGetValue("level2-trash", 10));
  levelSettings.level3Flowers = Number(safeGetValue("level3-flowers", 20));
  levelSettings.level4Energy = Number(safeGetValue("level4-energy", 2000));
  levelSettings.level5Bubbles = Number(safeGetValue("level5-bubbles", 30));
  levelSettings.grabAssist = Number(safeGetValue("grab-assist", 18)) / 10;
  levelSettings.showHands = safeGetChecked("show-hands");
  levelSettings.showFeet = safeGetChecked("show-feet");
  levelSettings.showSkeletonLines = safeGetChecked("show-lines");

  reinitCurrentScene();
}

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

function averagePoints(points) {
  let x = 0;
  let y = 0;

  for (const p of points) {
    x += p[0];
    y += p[1];
  }

  return [x / points.length, y / points.length];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  reinitCurrentScene();
}

function resetGame() {
  score = 0;
  currentScene = 1;
  updateScore();
  updateUI();
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

function keyPressed() {
  if (key === "f" || key === "F") {
    toggleFullscreen();
  }

  if (key >= "1" && key <= "6") {
    currentScene = Number(key);
    updateUI();
    reinitCurrentScene();
  }
}
