// Level Objects Data
let trashItems = [];
let clouds = [];
let raindrops = [];
let flowers = [];
let instruments = [];
let communityEnergy = 0;

function initScene1() {
  trashItems = [];
  for(let i = 0; i < 5; i++){
    trashItems.push({
      x: random(100, width - 100), 
      y: random(height/2 + 50, height - 80),
      radius: 30, 
      active: true
    });
  }
}

function initScene2() {
  clouds = [
    { x: width * 0.2, y: 120, w: 120, h: 70 },
    { x: width * 0.5, y: 100, w: 140, h: 80 },
    { x: width * 0.8, y: 120, w: 120, h: 70 }
  ];
}

function initScene3() {
  instruments = [
    { x: width * 0.2, y: height/2, radius: 60, type: 'Drum', color: [255, 100, 100] },
    { x: width * 0.5, y: height/2, radius: 70, type: 'Turntable', color: [100, 255, 100] },
    { x: width * 0.8, y: height/2, radius: 60, type: 'Horn', color: [100, 100, 255] }
  ];
}

function drawScene1() {
  // Draw Water
  noStroke(); 
  fill(0, 100, 200, 90); 
  rect(0, height/2 + 50, width, height/2 - 50);

  let activeCount = 0;
  for (let t of trashItems) {
    if (t.active) {
      activeCount++;
      fill(220, 50, 50, 200); 
      noStroke(); 
      circle(t.x, t.y, t.radius * 2);
      
      // Trash removal condition: dragged high into the "sky"
      if (t.y < 150 && draggedTrash === t) {
        t.active = false; 
        draggedTrash = null; 
        score += 20; 
        updateScore();
      }
    }
  }

  // Progress to Level 2
  if (activeCount === 0) {
    currentScene = 2; 
    updateUI(); 
    initScene2();
  }
}

function drawScene2() {
  // Draw Soil
  noStroke(); 
  fill(101, 67, 33, 130); 
  rect(0, height - 120, width, 120);

  // Clouds and Rain Interaction
  for (let c of clouds) {
    fill(220, 220, 220, 230); 
    noStroke();
    ellipse(c.x, c.y, c.w, c.h); 
    ellipse(c.x - 30, c.y + 10, c.w*0.7, c.h*0.8); 
    ellipse(c.x + 30, c.y + 10, c.w*0.7, c.h*0.8);

    if (checkHover(c.x, c.y, c.w/2) && frameCount % 8 === 0) {
      raindrops.push({ x: c.x + random(-30,30), y: c.y + 30, active: true });
    }
  }

  // Render Rain
  for (let r of raindrops) {
    if (r.active) {
      fill(0, 150, 255, 200); 
      circle(r.x, r.y, 12);
      r.y += 6; // gravity
      
      if (r.y > height - 80) {
        r.active = false; 
        score += 2; 
        updateScore();
        if (flowers.length < 15) {
          flowers.push({ x: r.x, y: height - 80, size: 0 });
        }
      }
    }
  }

  // Grow Flowers
  let grownFlowers = 0;
  for (let f of flowers) {
    if (f.size < 45) f.size += 0.4; else grownFlowers++;
    fill(46, 204, 113); 
    rect(f.x - 3, f.y - f.size, 6, f.size); // Stem
    fill(255, 150, 200); 
    circle(f.x, f.y - f.size, f.size/1.5); // Petal
  }

  // Progress to Level 3
  if (grownFlowers >= 15) { 
    currentScene = 3; 
    updateUI(); 
    initScene3(); 
  }
}

function drawScene3() {
  // Energy Bar Background
  fill(50, 50, 50, 200); 
  rect(width/2 - 150, 30, 300, 25, 10);
  
  // Energy Bar Progress
  fill(255, 215, 0); 
  rect(width/2 - 150, 30, map(communityEnergy, 0, 1000, 0, 300), 25, 10);

  for (let inst of instruments) {
    fill(inst.color[0], inst.color[1], inst.color[2], 200); 
    circle(inst.x, inst.y, inst.radius * 2);
    fill(255); 
    textAlign(CENTER, CENTER); 
    textSize(18); 
    text(inst.type, inst.x, inst.y);

    // Play Instrument Collision
    if (checkHover(inst.x, inst.y, inst.radius)) { 
      communityEnergy += 2; 
    }
  }

  if (communityEnergy >= 1000) {
    currentScene = 4; // Win State
    updateUI();
  }
}
