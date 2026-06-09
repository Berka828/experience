// Bronx Children's Museum - Sensory Explorer
// Calm sensory exhibit version with day-to-night journey,
// smoother transitions, animated sun/moon, dynamic light drawing,
// subtle hand/feet tracking, flowers, bubbles, and sensory effects.

let video, videoReady = false, cameraError = "";

let appStarted = false;
let introAlpha = 255;

let currentScene = 1;
let score = 0;
let isEnglish = true;

let isWiping = false;
let nextScene = 1;
let transitionAlpha = 0;

let sceneCompleteHold = 0;
let sceneCompleteMessage = "";

let skyColor = [135, 206, 235];
let dayNightBlend = 0;
let targetNightBlend = 0;

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
let gentleCreatures = [];

let moonPulse = 0;
let skyRings = [];
let shootingStars = [];
let constellationDots = [];
let sunBeams = [];

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
  level1Goal: 1600,
  level2Trash: 8,
  level3Flowers: 14,
  level4Energy: 3600,
  level5Bubbles: 24,

  grabAssist: 1.8,

  transitionSpeed: 0.011,
  transitionHold: 120,

  flowerSensitivity: 0.45,
  creatureAmount: 1,
  particleAmount: 0.7,

  bubbleSpeed: 0.75,
  bubbleSizeVariance: 1.25,

  showHands: true,
  showFeet: true,
  showSkeletonLines: true,
  hideAdminFullscreen: true
};

const textDict = {
  EN: {
    title: "Bronx Explorer 🌱",
    lvl1: "Level 1: Gently wave to clear the colorful smog.",
    lvl2: "Level 2: Slowly lift the river trash away.",
    lvl3: "Level 3: Touch clouds to make rain. Help the garden grow.",
    lvl4: "Level 4: Point one finger to paint stars in the night sky.",
    lvl5: "Level 5: Touch, kick, and bounce the bubbles.",
    win: "Beautiful job. Thank you.",
    lvlText: "Level:",
    btn: "Español"
  },
  ES: {
    title: "Explorador 🌱",
    lvl1: "Nivel 1: Mueve tus manos suavemente para limpiar el smog.",
    lvl2: "Nivel 2: Levanta lentamente la basura del río.",
    lvl3: "Nivel 3: Toca las nubes. Ayuda al jardín a crecer.",
    lvl4: "Nivel 4: Dibuja estrellas con un dedo de luz.",
    lvl5: "Nivel 5: Toca, patea y rebota las burbujas.",
    win: "Hermoso trabajo. Gracias.",
    lvlText: "Nivel:",
    btn: "English"
  }
};

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style("z-index", "0");

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

  drawGentleCreatures();
  drawTrackedBodyParts();
  drawSceneEndingCue();

  if (!safeGetChecked("calm-mode")) drawParticles();

  if (!appStarted) {
    drawLandingOverlay();
    return;
  }

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

function drawLandingOverlay() {
  fill(20, 30, 45, introAlpha * 0.78);
  noStroke();
  rect(0, 0, width, height);

  fill(255, introAlpha);
  textAlign(CENTER, CENTER);
  textSize(54);
  text("Bronx Explorer", width / 2, height / 2 - 90);

  textSize(26);
  text("Move your hands gently to begin", width / 2, height / 2 - 25);

  textSize(18);
  text(
    "A calm sensory journey through air, water, garden, light, and bubbles",
    width / 2,
    height / 2 + 20
  );

  fill(255, 230, 90, introAlpha * 0.9);
  circle(width / 2, height / 2 + 95, 16 + sin(frameCount * 0.05) * 4);

  const startingMotion = handVelocity > 8 || activePointers.length > 0;

  if (startingMotion || mouseIsPressed) {
    appStarted = true;
    triggerWipeTransition(1);
  }
}

function drawSky() {
  const day = [135, 206, 235];
  const night = [18, 24, 58];

  dayNightBlend = lerp(dayNightBlend, targetNightBlend, 0.01);

  const r = lerp(day[0], night[0], dayNightBlend);
  const g = lerp(day[1], night[1], dayNightBlend);
  const b = lerp(day[2], night[2], dayNightBlend);

  background(r, g, b);
  skyColor = [r, g, b];

  if (dayNightBlend > 0.25) drawNightSky();
  if (dayNightBlend < 0.9) drawSun(width - 160, 145, 100);
}

function drawSun(x, y, baseSize) {
  const touched = activePointers
    .concat(activeBouncers)
    .some(p => dist(p.x, p.y, x, y) < baseSize * 1.45);

  if (touched) {
    sunPulse = 34;

    if (frameCount % 8 === 0) {
      sunBeams.push({
        x,
        y,
        radius: baseSize,
        alpha: 170
      });
    }

    if (frameCount % 14 === 0 && !safeGetChecked("calm-mode")) {
      spawnExplosion(x, y, [255, 230, 80], 8);
    }
  }

  if (sunPulse > 0) sunPulse *= 0.92;

  for (let i = sunBeams.length - 1; i >= 0; i--) {
    const beam = sunBeams[i];

    noFill();
    stroke(255, 230, 90, beam.alpha);
    strokeWeight(4);
    circle(beam.x, beam.y, beam.radius * 2);

    beam.radius += 9;
    beam.alpha -= 5;

    if (beam.alpha <= 0) sunBeams.splice(i, 1);
  }

  const size = baseSize + sin(frameCount * 0.035) * 7 + sunPulse;

  push();
  translate(x, y);
  rotate(sin(frameCount * 0.01) * 0.12);

  stroke(255, 220, 60, 145);
  strokeWeight(5);

  for (let a = 0; a < TWO_PI; a += PI / 16) {
    const r1 = size * 0.62;
    const r2 = size * 1.25 + sin(frameCount * 0.045 + a) * 12;
    line(cos(a) * r1, sin(a) * r1, cos(a) * r2, sin(a) * r2);
  }

  noStroke();
  fill(255, 215, 40, 95);
  circle(0, 0, size * 1.9);

  fill(255, 235, 80, 230);
  circle(0, 0, size);

  if (safeGetChecked("whimsical-mode")) {
    fill(0, 130);
    arc(-18, -10, 24, 24, 0, PI);
    arc(18, -10, 24, 24, 0, PI);

    noFill();
    stroke(0, 130);
    strokeWeight(3);
    arc(0, 16, 38, 26, 0, PI);
  }

  pop();
}

function drawNightSky() {
  if (stars.length < 130) {
    stars = [];
    for (let i = 0; i < 130; i++) {
      stars.push({
        x: random(width),
        y: random(height * 0.72),
        size: random(1, 4),
        twinkle: random(TWO_PI)
      });
    }
  }

  for (const s of stars) {
    fill(255, 255, 255, 100 + sin(frameCount * 0.04 + s.twinkle) * 80);
    noStroke();
    circle(s.x, s.y, s.size + sin(frameCount * 0.06 + s.twinkle) * 0.8);
  }

  if (frameCount % 190 === 0 && currentScene >= 4) {
    shootingStars.push({
      x: random(width * 0.15, width * 0.8),
      y: random(70, height * 0.35),
      vx: random(5, 8),
      vy: random(1.5, 3),
      life: 255
    });
  }

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const st = shootingStars[i];

    stroke(255, 255, 230, st.life);
    strokeWeight(3);
    line(st.x, st.y, st.x - 60, st.y - 18);

    st.x += st.vx;
    st.y += st.vy;
    st.life -= 5;

    if (st.life <= 0 || st.x > width + 100) shootingStars.splice(i, 1);
  }

  const moonX = width - 170;
  const moonY = 145;

  const touched = activePointers
    .concat(activeBouncers)
    .some(p => dist(p.x, p.y, moonX, moonY) < 110);

  if (touched) {
    moonPulse = 28;

    if (frameCount % 10 === 0) {
      skyRings.push({
        x: moonX,
        y: moonY,
        radius: 80,
        alpha: 165
      });

      for (let i = 0; i < 6; i++) {
        constellationDots.push({
          x: moonX + random(-80, 80),
          y: moonY + random(-80, 80),
          size: random(3, 7),
          life: 255
        });
      }
    }

    if (frameCount % 16 === 0 && !safeGetChecked("calm-mode")) {
      spawnExplosion(moonX, moonY, [220, 230, 255], 6);
    }
  }

  if (moonPulse > 0) moonPulse *= 0.92;

  for (let i = skyRings.length - 1; i >= 0; i--) {
    const r = skyRings[i];

    noFill();
    stroke(220, 230, 255, r.alpha);
    strokeWeight(3);
    circle(r.x, r.y, r.radius * 2);

    r.radius += 6;
    r.alpha -= 4;

    if (r.alpha <= 0) skyRings.splice(i, 1);
  }

  for (let i = constellationDots.length - 1; i >= 0; i--) {
    const d = constellationDots[i];

    fill(255, 255, 230, d.life);
    noStroke();
    circle(d.x, d.y, d.size);

    d.life -= 2.5;

    if (d.life <= 0) constellationDots.splice(i, 1);
  }

  const moonSize = 105 + sin(frameCount * 0.035) * 4 + moonPulse;

  noStroke();
  fill(235, 235, 220, 225);
  circle(moonX, moonY, moonSize);

  fill(skyColor[0], skyColor[1], skyColor[2]);
  circle(moonX + 32, moonY - 14, moonSize * 0.92);
}

function setupHandsTracking() {
  if (!window.Hands) return;

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
    console.warn("Pose not loaded. Add MediaPipe Pose script to index.html for feet tracking.");
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
      } catch (e) {}

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

  for (const idx of footIndices) {
    const lm = trackedPoseData[idx];
    if (!lm || lm.visibility < 0.28) continue;

    const x = width - lm.x * width;
    const y = lm.y * height;

    activeFeet.push({ x, y });

    fill(255, 255, 255, 65);
    stroke(0, 255, 255, 95);
    strokeWeight(3);
    ellipse(x, y, 90, 44);

    fill(0, 255, 255, 120);
    noStroke();
    circle(x, y, 14);
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

    const thumbTip = mapped[4];
    const indexTip = mapped[8];
    const middleTip = mapped[12];
    const ringTip = mapped[16];
    const pinkyTip = mapped[20];

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

    if (levelSettings.showHands) drawBetterHand(mapped, pColor, isGrabbing);

    const handTargets = [
      { pt: thumbTip, isIndexFinger: false },
      { pt: indexTip, isIndexFinger: true },
      { pt: middleTip, isIndexFinger: false },
      { pt: ringTip, isIndexFinger: false },
      { pt: pinkyTip, isIndexFinger: false },
      { pt: palmCenter, isIndexFinger: false }
    ];

    for (const target of handTargets) {
      activePointers.push({
        x: target.pt[0],
        y: target.pt[1],
        color: pColor,
        isIndexFinger: target.isIndexFinger
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

    if (isGrabbing) handleTrashDragging(k, palmCenter);
    else releaseTrash(k);
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
    stroke(color[0], color[1], color[2], 75);
    strokeWeight(3);
    strokeCap(ROUND);

    for (const finger of fingers) {
      for (let i = 0; i < finger.length - 1; i++) {
        const a = lm[finger[i]];
        const b = lm[finger[i + 1]];
        line(a[0], a[1], b[0], b[1]);
      }
    }

    noFill();
    stroke(255, 255, 255, 70);
    strokeWeight(2);
    beginShape();
    for (const idx of palm) vertex(lm[idx][0], lm[idx][1]);
    endShape(CLOSE);
  }

  fill(color[0], color[1], color[2], isGrabbing ? 45 : 26);
  stroke(255, 255, 255, 85);
  strokeWeight(2);
  ellipse(palmCenter[0], palmCenter[1], isGrabbing ? 76 : 60, isGrabbing ? 66 : 52);

  for (const idx of [4, 8, 12, 16, 20]) {
    fill(255, 255, 255, 115);
    stroke(color[0], color[1], color[2], 90);
    strokeWeight(2);
    circle(lm[idx][0], lm[idx][1], 16);
  }
}

function initScene1() {
  smogCleared = 0;
  sceneCompleteHold = 0;
  targetNightBlend = 0;

  smogGraphics = createGraphics(width, height);
  smogGraphics.noStroke();

  smogGraphics.fill(35, 45, 70, 190);
  smogGraphics.rect(0, 0, width, height);

  const smogColors = [
    [120, 190, 210],
    [180, 150, 220],
    [255, 200, 120],
    [140, 210, 170],
    [230, 130, 150]
  ];

  for (let i = 0; i < 150; i++) {
    const c = random(smogColors);
    smogGraphics.fill(c[0], c[1], c[2], random(28, 70));
    smogGraphics.ellipse(
      random(width),
      random(height),
      random(120, 450),
      random(80, 280)
    );
  }

  smogGraphics.fill(40, 40, 55, 80);
  smogGraphics.rect(0, 0, width, height);
}

function initScene2() {
  sceneCompleteHold = 0;
  targetNightBlend = 0;

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
      vx: random([-1, 1]) * random(0.8, 2.1)
    });
  }
}

function initScene3() {
  sceneCompleteHold = 0;
  targetNightBlend = 0.15;

  clouds = [];
  raindrops = [];
  flowers = [];
  grass = [];
  gentleCreatures = [];

  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: width * (0.15 + i * 0.18),
      y: random(120, 260),
      w: random(170, 240),
      h: random(70, 110),
      pulse: 0
    });
  }

  for (let x = 0; x < width; x += 18) {
    grass.push({
      x,
      h: random(15, 55),
      maxH: random(65, 130)
    });
  }
}

function initScene4() {
  sceneCompleteHold = 0;
  targetNightBlend = 1;

  artStrokes = [];
  artEnergy = 0;
  constellationDots = [];
  shootingStars = [];
  skyRings = [];
}

function initScene5() {
  sceneCompleteHold = 0;
  targetNightBlend = 1;

  popBubbles = [];
  bubblesPopped = 0;
  ripples = [];
  fireflies = [];

  for (let i = 0; i < 12; i++) spawnBubble();

  for (let i = 0; i < 90; i++) {
    fireflies.push({
      x: random(width),
      y: random(height),
      vx: random(-0.35, 0.35),
      vy: random(-0.35, 0.35)
    });
  }
}

function drawScenicBackground() {
  noStroke();

  if (currentScene === 1) {
    fill(80, 85, 95, 135);
    rect(width * 0.1, height - 300, 150, 300);
    rect(width * 0.3, height - 400, 120, 400);
    rect(width * 0.6, height - 250, 200, 250);
    rect(width * 0.8, height - 350, 100, 350);
  }

  if (currentScene === 2 || currentScene === 3) {
    fill(34, 139, 34, 75);
    ellipse(width * 0.3, height, width * 0.8, 600);
    fill(34, 139, 34, 105);
    ellipse(width * 0.8, height, width, 500);
  }
}

function drawScene1() {
  if (handVelocity > 4 && !isWiping && smogGraphics) {
    const erasers = activePointers.concat(activeBouncers, activeFeet);

    smogGraphics.erase();

    for (const pt of erasers) {
      smogGraphics.circle(pt.x, pt.y, 210);
      smogCleared += 0.34;
    }

    smogGraphics.noErase();
  }

  if (smogGraphics) image(smogGraphics, 0, 0);

  const progress = constrain(smogCleared / levelSettings.level1Goal, 0, 1);
  drawProgressBar(progress);

  if (progress >= 1) beginSceneCompletion(2, "The air is clearing...");
}

function drawScene2() {
  drawSun(width - 165, 145, 95);

  fill(0, 100, 200, 135);
  noStroke();

  beginShape();
  vertex(0, height);

  for (let x = 0; x <= width; x += 50) {
    vertex(x, height * 0.7 + sin(frameCount * 0.035 + x * 0.01) * 12);
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

    textSize(42);
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
      t.y = height * 0.72 + sin(frameCount * 0.04 + t.x * 0.01) * 12;
    }

    fill(220, 50, 50, 190);
    noStroke();
    circle(t.x, t.y, t.radius * 2);

    fill(255, 220);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("×", t.x, t.y - 1);

    if (t.y < height * 0.5 && t.draggedBy !== null) {
      t.active = false;
      t.draggedBy = null;
      score += 20;
      updateScore();

      if (!safeGetChecked("calm-mode")) {
        spawnExplosion(t.x, t.y, [220, 50, 50], 8);
      }
    }
  }

  drawProgressBar(1 - activeCount / max(1, trashItems.length));

  if (activeCount === 0) beginSceneCompletion(3, "The river feels lighter...");
}

function drawScene3() {
  noStroke();
  fill(101, 67, 33, 130);
  rect(0, height - 120, width, 120);

  stroke(46, 204, 113, 180);
  strokeWeight(4);

  for (const g of grass) {
    line(g.x, height, g.x + sin(frameCount * 0.018 + g.x) * 5, height - g.h);
  }

  for (const c of clouds) {
    const touched = activePointers
      .concat(activeBouncers, activeFeet)
      .some(p => dist(p.x, p.y, c.x, c.y) < c.w * 0.72);

    if (touched) c.pulse = 18;

    if (touched && frameCount % 24 === 0) {
      ripples.push({ x: c.x, y: c.y, radius: 30, alpha: 120 });
    }

    if (c.pulse > 0) c.pulse *= 0.92;

    fill(225, 225, 225, 210);
    noStroke();

    ellipse(c.x, c.y, c.w + c.pulse, c.h + c.pulse * 0.4);
    ellipse(c.x - 60, c.y + 20, c.w * 0.7, c.h * 0.8);
    ellipse(c.x + 60, c.y + 20, c.w * 0.7, c.h * 0.8);

    if (touched && frameCount % 12 === 0) {
      raindrops.push({
        x: c.x + random(-100, 100),
        y: c.y + 50,
        active: true
      });
    }
  }

  drawRipples();

  for (const r of raindrops) {
    if (!r.active) continue;

    fill(0, 150, 255, 135);
    noStroke();
    circle(r.x, r.y, 10);

    r.y += 4.2;

    if (r.y > height - 100) {
      r.active = false;
      score += 1;
      updateScore();

      for (const g of grass) {
        if (abs(g.x - r.x) < 30 && g.h < g.maxH) {
          g.h += 0.6;
        }
      }

      let watered = false;

      for (const f of flowers) {
        if (abs(f.x - r.x) < 50 && f.size < f.maxSize) {
          f.size += 2;
          watered = true;
          break;
        }
      }

      if (!watered && flowers.length < 26) {
        flowers.push({
          x: r.x,
          size: 5,
          maxSize: random(42, 72),
          type: floor(random(3)),
          cooldown: 0
        });
      }
    }
  }

  let grownFlowers = 0;

  for (const f of flowers) {
    const fy = height - 80 - f.size;

    if (f.cooldown > 0) f.cooldown--;

    const flowerTouched = activePointers
      .concat(activeBouncers)
      .some(p => dist(p.x, p.y, f.x, fy - 10) < 55);

    if (flowerTouched && f.cooldown <= 0) {
      f.size = min(f.maxSize, f.size + levelSettings.flowerSensitivity);
      f.cooldown = 16;

      if (random() < 0.45 * levelSettings.creatureAmount) {
        spawnGentleCreature(f.x, fy - 25);
      }

      if (!safeGetChecked("calm-mode") && random() < 0.35) {
        spawnExplosion(f.x, fy - 20, [255, 215, 0], 3);
      }
    }

    if (f.size >= f.maxSize) grownFlowers++;

    fill(46, 204, 113, 205);
    noStroke();
    rect(f.x - 3, fy, 6, f.size);

    if (f.type === 0) {
      fill(255, 105, 180, 215);
      ellipse(f.x, fy - 10, f.size / 1.5, f.size);
    } else if (f.type === 1) {
      fill(255, 215, 0, 215);
      for (let a = 0; a < TWO_PI; a += PI / 4) {
        ellipse(f.x + cos(a) * 13, fy - 15 + sin(a) * 13, 13, 13);
      }
      fill(139, 69, 19, 210);
      circle(f.x, fy - 15, 18);
    } else {
      fill(200, 100, 255, 215);
      for (let a = 0; a < TWO_PI; a += PI / 3) {
        ellipse(f.x + cos(a) * 11, fy - 10 + sin(a) * 11, 11, 11);
      }
      fill(255, 255, 0, 210);
      circle(f.x, fy - 10, 13);
    }
  }

  const progress = constrain(grownFlowers / levelSettings.level3Flowers, 0, 1);
  drawProgressBar(progress);

  if (progress >= 1) beginSceneCompletion(4, "The garden is blooming...");
}

function drawScene4() {
  targetNightBlend = 1;

  background(
    lerp(20, 18, dayNightBlend),
    lerp(10, 24, dayNightBlend),
    lerp(40, 58, dayNightBlend),
    115
  );

  drawNightSky();

  const brushes = activePointers.filter(p => p.isIndexFinger);

  for (const brush of brushes) {
    if (frameCount % 2 === 0 && handVelocity > 1.2) {
      const strokeSize = random(10, 28);

      artStrokes.push({
        x: brush.x + random(-6, 6),
        y: brush.y + random(-6, 6),
        color: brush.color || [255, 255, 255],
        life: 255,
        size: strokeSize,
        drift: random(-0.7, 0.7)
      });

      if (random() < 0.08) {
        constellationDots.push({
          x: brush.x + random(-30, 30),
          y: brush.y + random(-30, 30),
          size: random(4, 8),
          life: 255
        });
      }
    }

    artEnergy += 0.75;
  }

  push();
  blendMode(ADD);

  for (let i = artStrokes.length - 1; i >= 0; i--) {
    const pt = artStrokes[i];

    pt.life -= 1.8;
    pt.y -= 0.45;
    pt.x += pt.drift;

    fill(pt.color[0], pt.color[1], pt.color[2], pt.life);
    noStroke();
    circle(pt.x, pt.y, pt.size * (pt.life / 255));

    fill(255, 255, 255, pt.life * 0.55);
    circle(pt.x, pt.y, pt.size * 0.35);

    if (pt.life <= 0) artStrokes.splice(i, 1);
  }

  pop();

  if (frameCount % 140 === 0) {
    skyRings.push({
      x: random(width * 0.2, width * 0.8),
      y: random(height * 0.2, height * 0.65),
      radius: 30,
      alpha: 120
    });
  }

  const progress = constrain(artEnergy / levelSettings.level4Energy, 0, 1);
  drawProgressBar(progress);

  fill(255, 255, 255, 120);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(20);
  text("Point one finger to paint stars in the night sky", width / 2, height - 82);

  if (progress >= 1) {
    beginSceneCompletion(5, "Your light drawing is becoming night...");
  }
}

function drawScene5() {
  targetNightBlend = 1;

  for (const f of fireflies) {
    f.x += f.vx + sin(frameCount * 0.035) * 0.35;
    f.y += f.vy + cos(frameCount * 0.035) * 0.35;

    fill(255, 255, 150, 150);
    noStroke();
    circle(f.x, f.y, 4);

    if (f.x < 0) f.x = width;
    if (f.x > width) f.x = 0;
    if (f.y < 0) f.y = height;
    if (f.y > height) f.y = 0;
  }

  drawRipples();

  for (const b of popBubbles) {
    if (!b.active) continue;

    b.vy += 0.012 * levelSettings.bubbleSpeed;
    b.x += b.vx * levelSettings.bubbleSpeed;
    b.y += b.vy * levelSettings.bubbleSpeed;

    noStroke();
    fill(b.color[0], b.color[1], b.color[2], 175);
    circle(b.x, b.y, b.radius * 2);

    fill(255, 255, 255, 45);
    circle(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.45);

    if (b.x < b.radius || b.x > width - b.radius) {
      b.vx *= -1;
    }

    for (const kicker of activeBouncers.concat(activeFeet)) {
      if (dist(kicker.x, kicker.y, b.x, b.y) < b.radius + 65) {
        const angle = atan2(b.y - kicker.y, b.x - kicker.x);
        b.vx = cos(angle) * 6;
        b.vy = -7;
        ripples.push({
          x: b.x,
          y: b.y,
          radius: b.radius,
          alpha: 160
        });
      }
    }

    const touchedByHand = activePointers
      .concat(activeBouncers)
      .some(p => dist(p.x, p.y, b.x, b.y) < b.radius + 22);

    const touchedByFoot = activeFeet.some(
      foot => dist(foot.x, foot.y, b.x, b.y) < b.radius + 72
    );

    if (touchedByHand || touchedByFoot) {
      if (b.isRed) {
        popBubble(b);
      } else {
        b.vy = -4;
        ripples.push({
          x: b.x,
          y: b.y,
          radius: b.radius,
          alpha: 150
        });
      }
    } else if (b.y > height - b.radius) {
      b.vy = -5;
    }

    if (b.y > height + 120 || b.y < -170) {
      b.active = false;
      setTimeout(spawnBubble, 700);
    }
  }

  const progress = constrain(bubblesPopped / levelSettings.level5Bubbles, 0, 1);
  drawProgressBar(progress);

  if (progress >= 1) beginSceneCompletion(6, "The bubbles are floating away...");
}

function drawWinScene() {
  targetNightBlend = 1;

  background(44, 94, 79, 190);

  drawNightSky();

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(54);
  text(isEnglish ? textDict.EN.win : textDict.ES.win, width / 2, height / 2);

  if (frameCount % 50 === 0 && !safeGetChecked("calm-mode")) {
    spawnExplosion(random(width), random(height), [255, 255, 255], 8);
  }

  beginSceneCompletion(1, "Starting again gently...");
}

function beginSceneCompletion(target, message) {
  if (isWiping) return;

  sceneCompleteHold++;
  sceneCompleteMessage = message;

  if (sceneCompleteHold > levelSettings.transitionHold) {
    triggerWipeTransition(target);
    sceneCompleteHold = 0;
  }
}

function drawSceneEndingCue() {
  if (sceneCompleteHold <= 0 || isWiping) return;

  const a = map(sceneCompleteHold, 0, levelSettings.transitionHold, 0, 165);

  fill(255, 245, 220, a * 0.45);
  noStroke();
  rect(0, 0, width, height);

  fill(30, 30, 40, constrain(a + 25, 0, 190));
  textAlign(CENTER, CENTER);
  textSize(34);
  text(sceneCompleteMessage, width / 2, height / 2);

  textSize(18);
  text("Next scene coming soon...", width / 2, height / 2 + 46);
}

function drawProgressBar(progress) {
  const w = min(520, width * 0.42);
  const h = 14;
  const x = width / 2 - w / 2;
  const y = height - 44;

  noStroke();
  fill(255, 255, 255, 75);
  rect(x, y, w, h, h / 2);

  fill(255, 230, 90, 150);
  rect(x, y, w * progress, h, h / 2);
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
      if (
        t.active &&
        t.draggedBy === null &&
        dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 3.4
      ) {
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
  const variance = levelSettings.bubbleSizeVariance;
  const radius = random(baseRadius * 0.65, baseRadius * variance);
  const isRed = random() < 0.35;

  popBubbles.push({
    x: random(radius, width - radius),
    y: random(-140, height * 0.45),
    vx: random(-2.2, 2.2),
    vy: random(0.4, 1.8),
    radius,
    color: isRed
      ? [255, 80, 90]
      : random([
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
    spawnExplosion(b.x, b.y, b.color, 8);
  }

  setTimeout(spawnBubble, 900);
}

function spawnGentleCreature(x, y) {
  const isButterfly = random() < 0.65;

  gentleCreatures.push({
    x,
    y,
    vx: random(-1.2, 1.2),
    vy: random(-2.2, -0.8),
    size: isButterfly ? random(24, 46) : random(18, 30),
    emoji: isButterfly ? "🦋" : "🐝",
    life: 255,
    phase: random(TWO_PI)
  });
}

function drawGentleCreatures() {
  for (let i = gentleCreatures.length - 1; i >= 0; i--) {
    const c = gentleCreatures[i];

    c.x += c.vx + sin(frameCount * 0.08 + c.phase) * 0.9;
    c.y += c.vy + cos(frameCount * 0.05 + c.phase) * 0.35;
    c.life -= 1.2;

    textAlign(CENTER, CENTER);
    textSize(c.size);
    tint(255, c.life);
    text(c.emoji, c.x, c.y);
    noTint();

    if (c.life <= 0 || c.y < -60) gentleCreatures.splice(i, 1);
  }
}

function drawRipples() {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];

    noFill();
    stroke(255, 255, 255, r.alpha);
    strokeWeight(3);
    circle(r.x, r.y, r.radius);

    r.radius += 2;
    r.alpha -= 3;

    if (r.alpha <= 0) ripples.splice(i, 1);
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = random(-2.5, 2.5);
    this.vy = random(-2.5, 2.5);
    this.life = 220;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 5;
  }

  show() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.life);
    circle(this.x, this.y, 6);
  }
}

function spawnExplosion(x, y, color, count = 12) {
  const amount = floor(count * levelSettings.particleAmount);

  for (let i = 0; i < amount; i++) {
    particles.push(new Particle(x, y, color));
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();

    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

function triggerWipeTransition(targetScene) {
  if (!isWiping) {
    isWiping = true;
    nextScene = targetScene;
    transitionAlpha = 0;
  }
}

function drawWipeIfNeeded() {
  if (!isWiping) return;

  transitionAlpha = min(210, transitionAlpha + 255 * levelSettings.transitionSpeed);

  fill(255, 255, 255, transitionAlpha * 0.42);
  noStroke();
  rect(0, 0, width, height);

  fill(255, 245, 210, transitionAlpha * 0.28);
  ellipse(width * 0.3, height * 0.45, width * 0.9, height * 1.1);
  ellipse(width * 0.7, height * 0.55, width * 0.9, height * 1.1);

  if (transitionAlpha >= 185 && currentScene !== nextScene) {
    currentScene = nextScene;

    if (currentScene >= 4) targetNightBlend = 1;
    else if (currentScene === 3) targetNightBlend = 0.15;
    else targetNightBlend = 0;

    updateUI();
    reinitCurrentScene();
  }

  if (transitionAlpha >= 210) {
    isWiping = false;
    transitionAlpha = 0;
  }
}

function reinitCurrentScene() {
  sceneCompleteHold = 0;

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

    <label>Bubble Size: <input type="range" id="bubble-size" min="25" max="100" value="45"></label><br><br>
    <label>Bubble Speed: <input type="range" id="bubble-speed" min="3" max="15" value="8"></label><br><br>
    <label>Bubble Size Variety: <input type="range" id="bubble-variety" min="10" max="22" value="13"></label><br><br>

    <label>Level 1 Smog Goal: <input type="range" id="level1-goal" min="500" max="3500" value="${levelSettings.level1Goal}"></label><br><br>
    <label>Level 2 Trash Count: <input type="range" id="level2-trash" min="3" max="25" value="${levelSettings.level2Trash}"></label><br><br>
    <label>Level 3 Flower Goal: <input type="range" id="level3-flowers" min="5" max="30" value="${levelSettings.level3Flowers}"></label><br><br>
    <label>Level 4 Drawing Goal: <input type="range" id="level4-energy" min="1500" max="9000" value="${levelSettings.level4Energy}"></label><br><br>
    <label>Level 5 Bubble Goal: <input type="range" id="level5-bubbles" min="5" max="70" value="${levelSettings.level5Bubbles}"></label><br><br>

    <label>Transition Hold: <input type="range" id="transition-hold" min="60" max="360" value="${levelSettings.transitionHold}"></label><br><br>
    <label>Transition Speed: <input type="range" id="transition-speed" min="5" max="40" value="11"></label><br><br>

    <label>Flower Sensitivity: <input type="range" id="flower-sensitivity" min="1" max="12" value="5"></label><br><br>
    <label>Butterflies / Bees: <input type="range" id="creature-amount" min="0" max="20" value="10"></label><br><br>
    <label>Particle Amount: <input type="range" id="particle-amount" min="0" max="20" value="7"></label><br><br>

    <label>Grab Assist: <input type="range" id="grab-assist" min="12" max="30" value="18"></label><br><br>

    <label>Show Hands: <input type="checkbox" id="show-hands" checked></label><br><br>
    <label>Show Feet: <input type="checkbox" id="show-feet" checked></label><br><br>
    <label>Show Skeleton Lines: <input type="checkbox" id="show-lines" checked></label><br><br>

    <label>Calm Mode: <input type="checkbox" id="calm-mode"></label><br><br>
    <label>Whimsical Faces: <input type="checkbox" id="whimsical-mode" checked></label><br><br>
    <label>Hide Admin in Fullscreen: <input type="checkbox" id="hide-admin-fullscreen" checked></label><br><br>

    <button onclick="applyCustomization()">Apply Changes</button>
    <button onclick="toggleSettings()">Close</button>
  `;
}

function applyCustomization() {
  levelSettings.level1Goal = Number(safeGetValue("level1-goal", 1600));
  levelSettings.level2Trash = Number(safeGetValue("level2-trash", 8));
  levelSettings.level3Flowers = Number(safeGetValue("level3-flowers", 14));
  levelSettings.level4Energy = Number(safeGetValue("level4-energy", 3600));
  levelSettings.level5Bubbles = Number(safeGetValue("level5-bubbles", 24));

  levelSettings.transitionHold = Number(safeGetValue("transition-hold", 120));
  levelSettings.transitionSpeed = Number(safeGetValue("transition-speed", 11)) / 1000;

  levelSettings.flowerSensitivity = Number(safeGetValue("flower-sensitivity", 5)) / 10;
  levelSettings.creatureAmount = Number(safeGetValue("creature-amount", 10)) / 10;
  levelSettings.particleAmount = Number(safeGetValue("particle-amount", 7)) / 10;

  levelSettings.bubbleSpeed = Number(safeGetValue("bubble-speed", 8)) / 10;
  levelSettings.bubbleSizeVariance = Number(safeGetValue("bubble-variety", 13)) / 10;
  levelSettings.grabAssist = Number(safeGetValue("grab-assist", 18)) / 10;

  levelSettings.showHands = safeGetChecked("show-hands");
  levelSettings.showFeet = safeGetChecked("show-feet");
  levelSettings.showSkeletonLines = safeGetChecked("show-lines");
  levelSettings.hideAdminFullscreen = safeGetChecked("hide-admin-fullscreen");

  reinitCurrentScene();
}

function setAdminVisibilityForFullscreen() {
  const shouldHide = fullscreen() && levelSettings.hideAdminFullscreen;

  const controls = document.getElementById("controls");
  const ui = document.getElementById("ui-container");
  const panel = document.getElementById("settings-panel");

  if (controls) controls.style.opacity = shouldHide ? "0" : "1";
  if (ui) ui.style.opacity = shouldHide ? "0.15" : "1";
  if (panel && shouldHide) panel.style.display = "none";
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
  targetNightBlend = 0;
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
  if (panel) {
    panel.style.display = panel.style.display === "block" ? "none" : "block";
  }
}

function toggleFullscreen() {
  fullscreen(!fullscreen());
  setTimeout(setAdminVisibilityForFullscreen, 300);
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
