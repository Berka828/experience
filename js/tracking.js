let mpHands;
let trackedHandsData = [];
let facePredictions = [];
let prevHandPositions = [];
let handVelocity = 0;

let playerColors = [
  [0, 255, 255],   // Player 1: Cyan pair
  [255, 0, 255],   // Player 2: Magenta pair
  [255, 255, 0],   // Player 3: Yellow pair
  [50, 255, 50]    // Player 4: Lime pair
];

function setupTracking(videoElement) {
  // 1. Initialize MediaPipe Hands
  mpHands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  mpHands.setOptions({
    maxNumHands: 6,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  mpHands.onResults(onHandResults);

  // Hook camera utilities to stream video frames to MediaPipe
  const camera = new Camera(videoElement.elt, {
    onFrame: async () => {
      await mpHands.send({ image: videoElement.elt });
    },
    width: 640,
    height: 480
  });
  camera.start();

  // 2. Initialize Facemesh for AR Masks
  facemesh = ml5.facemesh(videoElement, () => console.log('Face ready!'));
  facemesh.on('predict', results => facePredictions = results);
}

function onHandResults(results) {
  trackedHandsData = results.multiHandLandmarks || [];
}

function drawSkeletonsAndInteractions() {
  if (trackedHandsData.length === 0) return;

  handVelocity = 0;
  let mappedHands = [];

  // Map all coordinates tightly to screen size
  for (let k = 0; k < trackedHandsData.length; k++) {
    let landmarks = trackedHandsData[k];
    let mappedLm = landmarks.map(lm => {
      let mx = map(lm.x, 0, 1, 0, width);
      let my = map(lm.y, 0, 1, 0, height);
      return [width - mx, my]; // Mirror X axis
    });
    mappedHands.push(mappedLm);
  }

  // PAIRING ALGORITHM: Cluster hands into players based on screen proximity
  let playerAssignments = [];
  for (let i = 0; i < mappedHands.length; i++) {
    let assigned = false;
    let handCenter = mappedHands[i][9]; // Palm middle

    for (let j = 0; j < i; j++) {
      let otherCenter = mappedHands[j][9];
      // If two hands are within 350 pixels of each other, they are a pair!
      if (dist(handCenter[0], handCenter[1], otherCenter[0], otherCenter[1]) < 350) {
        playerAssignments[i] = playerAssignments[j]; // Assign same player ID
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      // Find the next available player ID
      let usedIds = playerAssignments.slice(0, i);
      let nextId = 0;
      while (usedIds.includes(nextId)) { nextId++; }
      playerAssignments[i] = nextId;
    }
  }

  // Draw and process interactions for all clustered pairs
  for (let k = 0; k < mappedHands.length; k++) {
    let landmarks = mappedHands[k];
    let playerId = playerAssignments[k] % playerColors.length;
    let pColor = playerColors[playerId];

    // Draw lines between bones
    stroke(pColor[0], pColor[1], pColor[2], 180);
    strokeWeight(4);
    noFill();
    // Simple hand drawing loop
    beginShape();
    for (let j = 0; j < 21; j++) {
      vertex(landmarks[j][0], landmarks[j][1]);
    }
    endShape();

    // Draw joints
    for (let j = 0; j < 21; j++) {
      fill(255); stroke(pColor[0], pColor[1], pColor[2]); strokeWeight(2);
      circle(landmarks[j][0], landmarks[j][1], 10);
    }

    // Velocity / Swiping calculation
    let indexTip = landmarks[8];
    if (prevHandPositions[k]) {
      let d = dist(indexTip[0], indexTip[1], prevHandPositions[k][0], prevHandPositions[k][1]);
      handVelocity += d;
    }
    prevHandPositions[k] = indexTip;

    // Grab Logic
    let wrist = landmarks[0];
    let indexBase = landmarks[5];
    let palmCenter = landmarks[9];
    let palmSize = dist(wrist[0], wrist[1], indexBase[0], indexBase[1]);
    let indexExt = dist(wrist[0], wrist[1], indexTip[0], indexTip[1]);

    let isGrabbing = (indexExt < palmSize * 1.5);

    if (isGrabbing) {
      fill(255, 255, 255, 200); circle(palmCenter[0], palmCenter[1], 40); 
      if (currentScene === 2) {
        let holdingSomething = false;
        for (let t of trashItems) {
          if (t.active && t.draggedBy === k) { t.x = palmCenter[0]; t.y = palmCenter[1]; holdingSomething = true; }
        }
        if (!holdingSomething) {
          for (let t of trashItems) {
            if (t.active && !t.draggedBy && dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 2.5) {
              t.draggedBy = k; break;
            }
          }
        }
      }
    } else {
      if (currentScene === 2) {
        for (let t of trashItems) if (t.draggedBy === k) t.draggedBy = null;
      }
    }
  }
}

function checkHover(targetX, targetY, radius) {
  for (let k = 0; k < trackedHandsData.length; k++) {
    let rawIndexTip = trackedHandsData[k][8]; 
    let ix = width - map(rawIndexTip.x, 0, 1, 0, width);
    let iy = map(rawIndexTip.y, 0, 1, 0, height);

    if (dist(ix, iy, targetX, targetY) < radius + 25) return true;
  }
  return false;
}

function drawFaceMasks() {
  let vw = video.width || 640; let vh = video.height || 480;
  for (let i = 0; i < facePredictions.length; i++) {
    let nose = facePredictions[i].annotations.noseTip[0]; 
    let nx = width - map(nose[0], 0, vw, 0, width); 
    let ny = map(nose[1], 0, vh, 0, height);
    
    let animal = animalMasks[i % animalMasks.length];
    
    fill(255, 255, 255, 200); stroke('#2c5e4f'); strokeWeight(3);
    ellipse(nx, ny - 70, 150, 60); 
    fill(0); noStroke(); textAlign(CENTER); textSize(18);
    text(animal, nx, ny - 65);
  }
}

function trackGreenProp() {
  video.loadPixels();
  if (video.pixels.length > 0) {
    for (let y = 0; y < video.height; y+=20) {
      for (let x = 0; x < video.width; x+=20) {
        let i = (y * video.width + x) * 4;
        let r = video.pixels[i]; let g = video.pixels[i+1]; let b = video.pixels[i+2];
        
        if (g > 150 && r < 100 && b < 100) {
          let mappedX = width - map(x, 0, video.width, 0, width);
          let mappedY = map(y, 0, video.height, 0, height);
          spawnExplosion(mappedX, mappedY, [46, 204, 113]);
          return { x: mappedX, y: mappedY };
        }
      }
    }
  }
  return null;
}
