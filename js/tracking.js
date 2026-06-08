let mpHands;
let trackedHandsData = [];
let facePredictions = [];
let prevHandPositions = [];
let handVelocity = 0;

// Player zones (Left = Cyan, Center = Magenta, Right = Yellow)
let playerColors = [
  [0, 255, 255],   
  [255, 0, 255],   
  [255, 255, 0]    
];

let animalMasks = ['🐟 Alewife', '🦩 Heron', '🐢 Turtle', '🐸 Frog'];

function setupTracking(videoElement) {
  // Initialize MediaPipe Hands
  mpHands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  mpHands.setOptions({
    maxNumHands: 6,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  mpHands.onResults(onHandResults);

  // Initialize FaceMesh
  facemesh = ml5.facemesh(videoElement, () => console.log('Face ready!'));
  facemesh.on('predict', results => facePredictions = results);
}

// THIS PREVENTS FREEZING: Custom manual loop instead of camera_utils
async function startMediaPipeTracker(videoElement) {
  async function processFrame() {
    if (videoElement.elt.readyState >= 2) {
      try {
        await mpHands.send({ image: videoElement.elt });
      } catch (e) {
        console.error("Tracking frame dropped:", e);
      }
    }
    requestAnimationFrame(processFrame); // Loop forever safely
  }
  processFrame();
}

function onHandResults(results) {
  trackedHandsData = results.multiHandLandmarks || [];
}

function drawSkeletonsAndInteractions() {
  if (trackedHandsData.length === 0) return;

  handVelocity = 0;
  
  // Create 3 invisible zones for kids to stand in
  let zoneWidth = width / 3;

  for (let k = 0; k < trackedHandsData.length; k++) {
    let landmarks = trackedHandsData[k];
    
    // Map raw AI coordinates tightly to the screen size
    let mappedLm = landmarks.map(lm => {
      let mx = map(lm.x, 0, 1, 0, width);
      let my = map(lm.y, 0, 1, 0, height);
      return [width - mx, my]; // Mirror X axis
    });

    let palmCenter = mappedLm[9]; // Middle of the hand

    // 1. ZONE-BASED PAIRING (Solves the mismatched colors!)
    // Which third of the screen is the hand in?
    let playerIndex = Math.floor(palmCenter[0] / zoneWidth);
    playerIndex = constrain(playerIndex, 0, 2); // Ensure it's 0, 1, or 2
    let pColor = playerColors[playerIndex];

    // 2. DRAW SKELETON
    stroke(pColor[0], pColor[1], pColor[2], 180);
    strokeWeight(5);
    noFill();
    
    // Draw bones
    beginShape();
    for (let j = 0; j < 21; j++) { vertex(mappedLm[j][0], mappedLm[j][1]); }
    endShape();

    // Draw joints
    for (let j = 0; j < 21; j++) {
      fill(255); stroke(pColor[0], pColor[1], pColor[2]); strokeWeight(2);
      circle(mappedLm[j][0], mappedLm[j][1], 10);
    }

    // 3. VELOCITY CALCULATION
    let indexTip = mappedLm[8];
    if (prevHandPositions[k]) {
      let d = dist(indexTip[0], indexTip[1], prevHandPositions[k][0], prevHandPositions[k][1]);
      handVelocity += d;
    }
    prevHandPositions[k] = indexTip;

    // 4. GRAB VS. POINT LOGIC
    let wrist = mappedLm[0];
    let indexBase = mappedLm[5];
    let middleTip = mappedLm[12];
    
    let palmSize = dist(wrist[0], wrist[1], indexBase[0], indexBase[1]);
    let indexExt = dist(wrist[0], wrist[1], indexTip[0], indexTip[1]);
    let middleExt = dist(wrist[0], wrist[1], middleTip[0], middleTip[1]);

    // If both index and middle fingers are pulled back toward wrist, it's a GRAB
    let isGrabbing = (indexExt < palmSize * 1.5 && middleExt < palmSize * 1.5);

    if (isGrabbing) {
      // Visual feedback: Glowing Palm
      fill(255, 255, 255, 200); 
      circle(palmCenter[0], palmCenter[1], 50); 
      
      if (currentScene === 2) {
        let holdingSomething = false;
        // Keep holding the item we already grabbed
        for (let t of trashItems) {
          if (t.active && t.draggedBy === k) { 
            t.x = palmCenter[0]; t.y = palmCenter[1]; holdingSomething = true; 
          }
        }
        // Grab a new item if we aren't holding one
        if (!holdingSomething) {
          for (let t of trashItems) {
            if (t.active && !t.draggedBy && dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 2.5) {
              t.draggedBy = k; break;
            }
          }
        }
      }
    } else {
      // Visual feedback: Glowing Pointer on finger
      fill(255); stroke(pColor[0], pColor[1], pColor[2]); strokeWeight(4);
      circle(indexTip[0], indexTip[1], 20);

      // Release grabbed items
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
