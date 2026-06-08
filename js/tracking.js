let mpHands;
let trackedHandsData = [];
let poses = []; // Tracks full bodies!
let prevHandPositions = [];
let handVelocity = 0;

let playerColors = [ [0, 255, 255], [255, 0, 255], [255, 255, 0] ];
let animalEmojis = ['🦊', '🐸', '🐼', '🐯', '🐰'];

function setupTracking(videoElement) {
  mpHands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
  mpHands.setOptions({
    maxNumHands: 6,
    modelComplexity: 1,
    minDetectionConfidence: 0.3, // Lowered so it tracks fists better!
    minTrackingConfidence: 0.3
  });
  mpHands.onResults(onHandResults);

  // Initialize Body Tracking (Handles faces, wrists, and feet!)
  let poseNet = ml5.poseNet(videoElement, () => console.log('PoseNet Body Tracking ready!'));
  poseNet.on('pose', results => poses = results);
}

async function startMediaPipeTracker(videoElement) {
  async function processFrame() {
    if (videoElement.elt.readyState >= 2) {
      try { await mpHands.send({ image: videoElement.elt }); } catch (e) {}
    }
    requestAnimationFrame(processFrame); 
  }
  processFrame();
}

function onHandResults(results) { trackedHandsData = results.multiHandLandmarks || []; }

function drawSkeletonsAndInteractions() {
  handVelocity = 0;
  let zoneWidth = width / 3;

  for (let k = 0; k < trackedHandsData.length; k++) {
    let landmarks = trackedHandsData[k];
    let mappedLm = landmarks.map(lm => [width - map(lm.x, 0, 1, 0, width), map(lm.y, 0, 1, 0, height)]);
    let palmCenter = mappedLm[9]; 

    let playerIndex = constrain(Math.floor(palmCenter[0] / zoneWidth), 0, 2);
    let pColor = playerColors[playerIndex];

    stroke(pColor[0], pColor[1], pColor[2], 180); strokeWeight(5); noFill();
    beginShape(); for (let j = 0; j < 21; j++) vertex(mappedLm[j][0], mappedLm[j][1]); endShape();
    for (let j = 0; j < 21; j++) {
      fill(255); stroke(pColor[0], pColor[1], pColor[2]); strokeWeight(2);
      circle(mappedLm[j][0], mappedLm[j][1], 10);
    }

    let indexTip = mappedLm[8];
    if (prevHandPositions[k]) handVelocity += dist(indexTip[0], indexTip[1], prevHandPositions[k][0], prevHandPositions[k][1]);
    prevHandPositions[k] = indexTip;

    let wrist = mappedLm[0]; let indexBase = mappedLm[5]; let middleTip = mappedLm[12];
    let isGrabbing = (dist(wrist[0], wrist[1], indexTip[0], indexTip[1]) < dist(wrist[0], wrist[1], indexBase[0], indexBase[1]) * 1.5);

    if (isGrabbing) {
      fill(255, 255, 255, 200); circle(palmCenter[0], palmCenter[1], 50); 
      if (currentScene === 2) {
        let holding = false;
        for (let t of trashItems) { if (t.active && t.draggedBy === k) { t.x = palmCenter[0]; t.y = palmCenter[1]; holding = true; } }
        if (!holding) {
          for (let t of trashItems) {
            if (t.active && !t.draggedBy && dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 2.5) { t.draggedBy = k; break; }
          }
        }
      }
    } else {
      fill(255); stroke(pColor[0], pColor[1], pColor[2]); strokeWeight(4); circle(indexTip[0], indexTip[1], 20);
      if (currentScene === 2) { for (let t of trashItems) if (t.draggedBy === k) t.draggedBy = null; }
    }
  }
}

// Hover Check for detailed fingers
function checkHover(targetX, targetY, radius) {
  for (let k = 0; k < trackedHandsData.length; k++) {
    let rawIndexTip = trackedHandsData[k][8]; 
    let ix = width - map(rawIndexTip.x, 0, 1, 0, width); let iy = map(rawIndexTip.y, 0, 1, 0, height);
    if (dist(ix, iy, targetX, targetY) < radius + 25) return true;
  }
  return false;
}

// NEW: Body Check for Fists, Wrists, and Feet! (Kicking)
function checkBodyHits(targetX, targetY, radius) {
  let vw = video.width || 640; let vh = video.height || 480;
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    // Check wrists (fists) and ankles (kicks)
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

// GIANT AR Animal Masks anchored to the nose!
function drawFaceMasks() {
  let vw = video.width || 640; let vh = video.height || 480;
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    if (pose.nose && pose.score > 0.2) {
      let nx = width - map(pose.nose.x, 0, vw, 0, width); 
      let ny = map(pose.nose.y, 0, vh, 0, height);
      
      let animal = animalEmojis[i % animalEmojis.length];
      textAlign(CENTER, CENTER);
      textSize(120); // Massive and hilarious!
      text(animal, nx, ny - 30); 
    }
  }
}

function trackGreenProp() { return null; } // Kept empty for structure, implement if needed.
