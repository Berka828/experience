let handpose, facemesh;
let handPredictions = [];
let facePredictions = [];
let draggedTrash = null;

let playerColors = [ [0, 255, 255], [255, 0, 255], [255, 255, 0] ];

function setupTracking(videoElement) {
  handpose = ml5.handpose(videoElement, () => console.log('Hand tracking ready!'));
  handpose.on('predict', results => handPredictions = results);

  facemesh = ml5.facemesh(videoElement, () => console.log('Face tracking ready!'));
  facemesh.on('predict', results => facePredictions = results);
}

function drawSkeletonsAndInteractions() {
  let isPinchingThisFrame = false;

  for (let k = 0; k < handPredictions.length; k++) {
    let hand = handPredictions[k];
    let pColor = playerColors[k % playerColors.length];

    // 1. Draw Skeleton Bones
    let fingers = ['thumb', 'indexFinger', 'middleFinger', 'ringFinger', 'pinky'];
    for (let i = 0; i < fingers.length; i++) {
      let finger = hand.annotations[fingers[i]];
      noFill(); 
      stroke(pColor[0], pColor[1], pColor[2], 180); 
      strokeWeight(5);
      beginShape();
      
      // Calculate mirrored palm root
      let palmX = width - hand.landmarks[0][0];
      let palmY = hand.landmarks[0][1];
      vertex(palmX, palmY);
      
      for (let j = 0; j < finger.length; j++) {
        let fx = width - finger[j][0]; // Mirror X coordinate
        let fy = finger[j][1];
        vertex(fx, fy);
      }
      endShape();
    }

    // 2. Draw Skeleton Joints
    for (let j = 0; j < hand.landmarks.length; j++) {
      let jx = width - hand.landmarks[j][0]; // Mirror X coordinate
      let jy = hand.landmarks[j][1];
      fill(255); 
      stroke(pColor[0], pColor[1], pColor[2]); 
      strokeWeight(2);
      ellipse(jx, jy, 12, 12);
    }

    // 3. Pinch Mechanics
    let thumbTip = hand.annotations.thumb[3];
    let indexTip = hand.annotations.indexFinger[3];
    
    // Map raw tips to mirrored coordinates
    let tx = width - thumbTip[0];
    let ty = thumbTip[1];
    let ix = width - indexTip[0];
    let iy = indexTip[1];

    let pinchDist = dist(tx, ty, ix, iy);

    if (pinchDist < 40) { 
      isPinchingThisFrame = true;
      let pinchX = (tx + ix) / 2;
      let pinchY = (ty + iy) / 2;
      
      fill(255, 255, 255, 200); 
      circle(pinchX, pinchY, 30); 

      if (currentScene === 1) {
        if (!draggedTrash) { 
          for (let t of trashItems) {
            if (t.active && dist(pinchX, pinchY, t.x, t.y) < t.radius * 2) {
              draggedTrash = t; 
              break;
            }
          }
        } else { 
          draggedTrash.x = pinchX; 
          draggedTrash.y = pinchY;
        }
      }
    }
  }
  
  if (!isPinchingThisFrame) {
    draggedTrash = null; 
  }
}

function checkHover(targetX, targetY, radius) {
  for (let k = 0; k < handPredictions.length; k++) {
    let indexTip = handPredictions[k].annotations.indexFinger[3]; 
    let ix = width - indexTip[0]; // Mirror X coordinate
    let iy = indexTip[1];
    
    if (dist(ix, iy, targetX, targetY) < radius + 25) return true;
  }
  return false;
}

function drawFaceMasks() {
  for (let i = 0; i < facePredictions.length; i++) {
    let face = facePredictions[i];
    let nose = face.annotations.noseTip[0]; 
    let nx = width - nose[0]; // Mirror X coordinate
    let ny = nose[1];
    
    fill(46, 204, 113, 180); 
    stroke('#2c5e4f'); 
    strokeWeight(3);
    ellipse(nx, ny - 60, 140, 90); 
    
    fill(255); 
    noStroke(); 
    textAlign(CENTER); 
    textSize(14);
    text("Bronx Explorer", nx, ny - 60);
  }
}
