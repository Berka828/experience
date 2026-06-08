let handpose, facemesh;
let handPredictions = [];
let facePredictions = [];

let playerColors = [ [0, 255, 255], [255, 0, 255], [255, 255, 0], [50, 255, 50] ];

function setupTracking(videoElement) {
  // FORCE maxHands to 4 so it picks up both hands for multiple kids!
  const options = { maxHands: 4 };
  
  handpose = ml5.handpose(videoElement, options, () => console.log('Hand tracking ready!'));
  handpose.on('predict', results => handPredictions = results);

  facemesh = ml5.facemesh(videoElement, () => console.log('Face tracking ready!'));
  facemesh.on('predict', results => facePredictions = results);
}

function drawSkeletonsAndInteractions() {
  let vw = video.width || 640; 
  let vh = video.height || 480;

  for (let k = 0; k < handPredictions.length; k++) {
    let hand = handPredictions[k];
    let pColor = playerColors[k % playerColors.length];

    // 1. TIGHT ALIGNMENT: Map raw camera coordinates to the exact screen size
    let mappedLandmarks = hand.landmarks.map(lm => {
      let mx = map(lm[0], 0, vw, 0, width);
      let my = map(lm[1], 0, vh, 0, height);
      return [width - mx, my]; // Mirror the X axis
    });

    // 2. DRAW SKELETON
    for (let j = 0; j < mappedLandmarks.length; j++) {
      fill(pColor[0], pColor[1], pColor[2], 180); 
      noStroke();
      ellipse(mappedLandmarks[j][0], mappedLandmarks[j][1], 10, 10);
    }

    // 3. GRAB vs POINT LOGIC
    let wrist = mappedLandmarks[0];
    let indexBase = mappedLandmarks[5];
    let indexTip = mappedLandmarks[8];
    let middleTip = mappedLandmarks[12];
    let palmCenter = mappedLandmarks[9]; // Middle of the hand

    // Calculate how open the hand is (relative to the kid's palm size)
    let palmSize = dist(wrist[0], wrist[1], indexBase[0], indexBase[1]);
    let indexExt = dist(wrist[0], wrist[1], indexTip[0], indexTip[1]);
    let middleExt = dist(wrist[0], wrist[1], middleTip[0], middleTip[1]);

    // If fingers are pulled in close to the wrist, it's a GRAB!
    let isGrabbing = (indexExt < palmSize * 1.6 && middleExt < palmSize * 1.6);

    if (isGrabbing) {
      // Visual feedback: Glowing Palm
      fill(255, 255, 255, 200); 
      circle(palmCenter[0], palmCenter[1], 40); 

      // Level 1 Grab Logic
      if (currentScene === 1) {
        let holdingSomething = false;
        
        // Is this hand already dragging something?
        for (let t of trashItems) {
          if (t.active && t.draggedBy === k) {
            t.x = palmCenter[0]; 
            t.y = palmCenter[1];
            holdingSomething = true;
          }
        }

        // If not, try to grab nearby trash
        if (!holdingSomething) {
          for (let t of trashItems) {
            if (t.active && !t.draggedBy && dist(palmCenter[0], palmCenter[1], t.x, t.y) < t.radius * 2.5) {
              t.draggedBy = k; // Attach to this specific hand!
              break;
            }
          }
        }
      }
    } else {
      // Visual feedback: Glowing Pointer on Index Finger
      fill(pColor[0], pColor[1], pColor[2], 255);
      circle(indexTip[0], indexTip[1], 20);

      // Release any grabbed items
      if (currentScene === 1) {
        for (let t of trashItems) {
          if (t.draggedBy === k) t.draggedBy = null;
        }
      }
    }
  }
}

// Hover checking for Levels 2 & 3 (Using perfectly aligned coordinates)
function checkHover(targetX, targetY, radius) {
  let vw = video.width || 640; 
  let vh = video.height || 480;

  for (let k = 0; k < handPredictions.length; k++) {
    let rawIndexTip = handPredictions[k].annotations.indexFinger[3]; 
    let mx = map(rawIndexTip[0], 0, vw, 0, width);
    let my = map(rawIndexTip[1], 0, vh, 0, height);
    let ix = width - mx; 

    if (dist(ix, my, targetX, targetY) < radius + 25) return true;
  }
  return false;
}

// AR Face Masks
function drawFaceMasks() {
  let vw = video.width || 640; 
  let vh = video.height || 480;

  for (let i = 0; i < facePredictions.length; i++) {
    let nose = facePredictions[i].annotations.noseTip[0]; 
    let mx = map(nose[0], 0, vw, 0, width);
    let my = map(nose[1], 0, vh, 0, height);
    let nx = width - mx; 
    
    fill(46, 204, 113, 180); 
    stroke('#2c5e4f'); strokeWeight(3);
    ellipse(nx, my - 60, 140, 90); 
    
    fill(255); noStroke(); textAlign(CENTER); textSize(14);
    text("Bronx Explorer", nx, my - 60);
  }
}
