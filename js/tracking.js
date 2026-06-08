let handpose, facemesh;
let handPredictions = [], facePredictions = [];
let prevHandPositions = [];
let handVelocity = 0;

let playerColors = [ [0, 255, 255], [255, 0, 255], [255, 255, 0], [50, 255, 50] ];
let animalMasks = ['🐟 Alewife', '🦩 Blue Heron', '🐢 Bronx Turtle', '🐸 Bullfrog'];

function setupTracking(videoElement) {
  handpose = ml5.handpose(videoElement, { maxHands: 4 }, () => console.log('Hand ready!'));
  handpose.on('predict', results => handPredictions = results);

  facemesh = ml5.facemesh(videoElement, () => console.log('Face ready!'));
  facemesh.on('predict', results => facePredictions = results);
}

function drawSkeletonsAndInteractions() {
  let vw = video.width || 640; let vh = video.height || 480;
  handVelocity = 0; // Reset velocity per frame

  for (let k = 0; k < handPredictions.length; k++) {
    let hand = handPredictions[k];
    let pColor = playerColors[k % playerColors.length];
    let mappedLandmarks = hand.landmarks.map(lm => [width - map(lm[0], 0, vw, 0, width), map(lm[1], 0, vh, 0, height)]);

    // Draw Skeleton
    for (let j = 0; j < mappedLandmarks.length; j++) {
      fill(pColor[0], pColor[1], pColor[2], 180); noStroke(); ellipse(mappedLandmarks[j][0], mappedLandmarks[j][1], 10, 10);
    }

    // Velocity / Swiping Calculation (For Level 1 Smog)
    let indexTip = mappedLandmarks[8];
    if (prevHandPositions[k]) {
      let d = dist(indexTip[0], indexTip[1], prevHandPositions[k][0], prevHandPositions[k][1]);
      handVelocity += d; // Add up speed of all hands
    }
    prevHandPositions[k] = indexTip;

    // Grab Logic (For Level 2 River)
    let wrist = mappedLandmarks[0];
    let indexBase = mappedLandmarks[5];
    let palmSize = dist(wrist[0], wrist[1], indexBase[0], indexBase[1]);
    let indexExt = dist(wrist[0], wrist[1], indexTip[0], indexTip[1]);

    let isGrabbing = (indexExt < palmSize * 1.5);
    let palmCenter = mappedLandmarks[9];

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

// AR Animal Masks based on player index
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

// Magic Wand / Color Tracking (Searches camera pixels for a bright neon green prop)
function trackGreenProp() {
  video.loadPixels();
  if (video.pixels.length > 0) {
    // Sub-sample to keep performance high (check every 20th pixel)
    for (let y = 0; y < video.height; y+=20) {
      for (let x = 0; x < video.width; x+=20) {
        let i = (y * video.width + x) * 4;
        let r = video.pixels[i];
        let g = video.pixels[i+1];
        let b = video.pixels[i+2];
        
        // If it's very green (like a painted physical stick)
        if (g > 150 && r < 100 && b < 100) {
          let mappedX = width - map(x, 0, video.width, 0, width);
          let mappedY = map(y, 0, video.height, 0, height);
          spawnExplosion(mappedX, mappedY, [46, 204, 113]); // Sparkles!
          return {x: mappedX, y: mappedY}; // Return location of wand
        }
      }
    }
  }
  return null;
}
