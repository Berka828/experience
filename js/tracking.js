let mpHands;
let trackedHandsData = [];
let poses = []; 
let prevHandPositions = [];
let handVelocity = 0;

// Centralized hit-boxes for physics interactions
let activePointers = []; // Pointed index fingers (For Popping)
let activeBouncers = []; // Palms, Fists, Ankles (For Bouncing)

let playerColors = [ [0, 255, 255], [255, 0, 255], [255, 255, 0] ];

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
  activePointers = [];
  activeBouncers = [];
  
  let vw = video.width || 640; let vh = video.height || 480;
  let zoneWidth = width / 3;

  // 1. Process Hands
  for (let k = 0; k < trackedHandsData.length; k++) {
    let landmarks = trackedHandsData[k];
    let mappedLm = landmarks.map(lm => [width - map(lm.x, 0, 1, 0, width), map(lm.y, 0, 1, 0, height)]);
    
    let wrist = mappedLm[0]; let indexBase = mappedLm[5]; let indexTip = mappedLm[8]; let palmCenter = mappedLm[9];
    let playerIndex = constrain(Math.floor(palmCenter[0] / zoneWidth), 0, 2);
    let pColor = playerColors[playerIndex];

    // Draw Sensory-Friendly Soft Skeleton
    stroke(pColor[0], pColor[1], pColor[2], 120); strokeWeight(6); noFill();
    beginShape(); for (let j = 0; j < 21; j++) vertex(mappedLm[j][0], mappedLm[j][1]); endShape();
    
    if (prevHandPositions[k]) handVelocity += dist(indexTip[0], indexTip[1], prevHandPositions[k][0], prevHandPositions[k][1]);
    prevHandPositions[k] = indexTip;

    let palmSize = dist(wrist[0], wrist[1], indexBase[0], indexBase[1]);
    let indexExt = dist(wrist[0], wrist[1], indexTip[0], indexTip[1]);
    let isGrabbing = (indexExt < palmSize * 1.5); // Fist / Palm mode

    if (isGrabbing) {
      fill(255, 255, 255, 100); noStroke(); circle(palmCenter[0], palmCenter[1], 50); 
      activeBouncers.push({ x: palmCenter[0], y: palmCenter[1], id: k }); // Add to Bouncers
      
      // Level 2 Dragging
      if (currentScene === 2) {
        let holding = false;
        for (let t of trashItems) { if (t.active && t.draggedBy === k) { t.x = palmCenter[0]; t.y = palmCenter[1]; holding = true; } }
        if (!holding) {
          for (let t of trashItems) { if (t.active && !t.draggedBy && dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 2.5) { t.draggedBy = k; break; } }
        }
      }
    } else {
      fill(255); noStroke(); circle(indexTip[0], indexTip[1], 15);
      activePointers.push({ x: indexTip[0], y: indexTip[1] }); // Add to Pointers
      if (currentScene === 2) { for (let t of trashItems) if (t.draggedBy === k) t.draggedBy = null; }
    }
  }

  // 2. Process Full Body (Ankles for kicking, wrists for backup bouncing)
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
