let handpose, facemesh;
let handPredictions = [];
let facePredictions = [];
let draggedTrash = null;

// Multi-player skeleton colors (Cyan, Magenta, Yellow)
let playerColors = [ [0, 255, 255], [255, 0, 255], [255, 255, 0] ];

function setupTracking(videoElement) {
  // Initialize Handpose
  handpose = ml5.handpose(videoElement, () => console.log('Hand tracking ready!'));
  handpose.on('predict', results => handPredictions = results);

  // Initialize Facemesh for AR Masks
  facemesh = ml5.facemesh(videoElement, () => console.log('Face tracking ready!'));
  facemesh.on('predict', results => facePredictions = results);
}

function drawSkeletonsAndInteractions() {
  let isPinchingThisFrame = false;

  for (let k = 0; k < handPredictions.length; k++) {
    let hand = handPredictions[k];
    let pColor = playerColors[k % playerColors.length];

    // Draw Skeleton Joints
    for (let j = 0; j < hand.landmarks.length; j++) {
      fill(pColor[0], pColor[1], pColor[2], 200); 
      noStroke(); 
      ellipse(hand.landmarks[j][0], hand.landmarks[j][1], 10, 10);
    }

    // PINCH PHYSICS (Measure Thumb to Index)
    let thumbTip = hand.annotations.thumb[3];
    let indexTip = hand.annotations.indexFinger[3];
    let pinchDist = dist(thumbTip[0], thumbTip[1], indexTip[0], indexTip[1]);

    if (pinchDist < 40) { 
      isPinchingThisFrame = true;
      let pinchCenter = { x: (thumbTip[0] + indexTip[0])/2, y: (thumbTip[1] + indexTip[1])/2 };
      
      // Visual feedback for pinching
      fill(255, 255, 255, 200); 
      circle(pinchCenter.x, pinchCenter.y, 30); 

      // Level 1 Grab Logic
      if (currentScene === 1) {
        if (!draggedTrash) { 
          // Try to grab something
          for (let t of trashItems) {
            if (t.active && dist(pinchCenter.x, pinchCenter.y, t.x, t.y) < t.radius * 2) {
              draggedTrash = t; 
              break;
            }
          }
        } else { 
          // Hold and Drag it
          draggedTrash.x = pinchCenter.x; 
          draggedTrash.y = pinchCenter.y;
        }
      }
    }
  }
  
  // If no one is pinching, drop the object
  if (!isPinchingThisFrame) {
    draggedTrash = null; 
  }
}

// Hover collision check for Levels 2 & 3
function checkHover(targetX, targetY, radius) {
  for (let k = 0; k < handPredictions.length; k++) {
    let indexTip = handPredictions[k].annotations.indexFinger[3]; 
    if (dist(indexTip[0], indexTip[1], targetX, targetY) < radius + 20) return true;
  }
  return false;
}

// AR Face Masks
function drawFaceMasks() {
  for (let i = 0; i < facePredictions.length; i++) {
    let face = facePredictions[i];
    let nose = face.annotations.noseTip[0]; 
    
    // Draw AR "Explorer Hat / Mask" anchored to the nose
    fill(46, 204, 113, 180); 
    stroke('#2c5e4f'); 
    strokeWeight(3);
    ellipse(nose[0], nose[1] - 50, 120, 80); 
    
    fill(255); 
    noStroke(); 
    textAlign(CENTER); 
    textSize(14);
    text("Bronx Explorer", nose[0], nose[1] - 50);
  }
}
