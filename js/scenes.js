let smogGraphics;
let smogCleared = 0;

let trashItems = [];
let clouds = []; let raindrops = []; let flowers = [];

function initScene1() {
  // Create a digital canvas of gray smog
  smogGraphics = createGraphics(width, height);
  smogGraphics.background(150, 150, 150, 240); // Thick gray smog
  smogCleared = 0;
}

function initScene2() {
  trashItems = [];
  for(let i = 0; i < 6; i++){
    trashItems.push({
      x: random(100, width - 100), y: random(height/2 + 50, height - 100),
      radius: 35, active: true, draggedBy: null 
    });
  }
}

function initScene3() {
  clouds = [
    { x: width * 0.2, y: height * 0.2, w: 140, h: 80 },
    { x: width * 0.5, y: height * 0.15, w: 160, h: 90 },
    { x: width * 0.8, y: height * 0.2, w: 140, h: 80 }
  ];
  raindrops = []; flowers = [];
}

function drawScene1() {
  // If hands are waving fast (velocity > 30), erase the smog!
  if (handVelocity > 30) {
    smogGraphics.erase();
    for(let k=0; k < handPredictions.length; k++){
      let lm = handPredictions[k].landmarks[8];
      let vw = video.width || 640; let vh = video.height || 480;
      let x = width - map(lm[0], 0, vw, 0, width);
      let y = map(lm[1], 0, vh, 0, height);
      smogGraphics.circle(x, y, 150); // Big eraser brush
      smogCleared += 1;
    }
    smogGraphics.noErase();
  }
  image(smogGraphics, 0, 0); // Draw smog over screen

  // If they waved enough, move to level 2!
  if (smogCleared > 150) { currentScene = 2; updateUI(); initScene2(); }
}

function drawScene2() {
  noStroke(); fill(0, 100, 200, 150); rect(0, height/2, width, height/2);

  let activeCount = 0;
  for (let t of trashItems) {
    if (t.active) {
      activeCount++;
      fill(220, 50, 50, 200); noStroke(); circle(t.x, t.y, t.radius * 2);
      
      // If thrown into the sky
      if (t.y < height/2 && t.draggedBy !== null) {
        t.active = false; t.draggedBy = null; score += 20; updateScore();
        spawnExplosion(t.x, t.y, [220, 50, 50]); // Particle Explosion!
      }
    }
  }
  if (activeCount === 0) { currentScene = 3; updateUI(); initScene3(); }
}

function drawScene3() {
  noStroke(); fill(101, 67, 33, 150); rect(0, height - 150, width, 150);

  // Wand can water plants too!
  let wandLoc = trackGreenProp(); 

  for (let c of clouds) {
    fill(220, 220, 220, 230); noStroke();
    ellipse(c.x, c.y, c.w, c.h); ellipse(c.x-30, c.y+10, c.w*.7, c.h*.8); ellipse(c.x+30, c.y+10, c.w*.7, c.h*.8);

    let isTouched = false;
    // Check hands
    for(let k=0; k<handPredictions.length; k++){
       let vw = video.width||640; let vh = video.height||480;
       let lm = handPredictions[k].landmarks[8];
       let x = width - map(lm[0], 0, vw, 0, width); let y = map(lm[1], 0, vh, 0, height);
       if(dist(x,y,c.x,c.y) < c.w/2) isTouched = true;
    }
    // Check physical Wand
    if (wandLoc && dist(wandLoc.x, wandLoc.y, c.x, c.y) < c.w/2) isTouched = true;
    
    // Auto rain if it's actually raining in the Bronx!
    if (isTouched || isRainingInBronx) {
      if (frameCount % 6 === 0) raindrops.push({ x: c.x + random(-30,30), y: c.y + 30, active: true });
    }
  }

  for (let r of raindrops) {
    if (r.active) {
      fill(0, 150, 255, 200); circle(r.x, r.y, 12); r.y += 8; 
      if (r.y > height - 100) {
        r.active = false; score += 2; updateScore();
        if (flowers.length < 15) flowers.push({ x: r.x, y: height - 100, size: 0 });
      }
    }
  }

  let grownFlowers = 0;
  for (let f of flowers) {
    if (f.size < 55) f.size += 0.5; else grownFlowers++;
    fill(46, 204, 113); rect(f.x - 3, f.y - f.size, 6, f.size); 
    fill(255, 150, 200); circle(f.x, f.y - f.size, f.size/1.5); 
  }

  if (grownFlowers >= 15) { 
    currentScene = 4; updateUI(); 
    updateGlobalLeaderboard(15); // Add to Daily Impact!
    setTimeout(generateMemoryQR, 2000); // Wait 2 secs, then show photo QR
  }
}
