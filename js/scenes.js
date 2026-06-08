let trashItems = [];
let clouds = [];
let raindrops = [];
let flowers = [];
let instruments = [];
let communityEnergy = 0;

function initScene1() {
  trashItems = [];
  for(let i = 0; i < 6; i++){
    trashItems.push({
      x: random(100, width - 100), 
      y: random(height/2 + 50, height - 100),
      radius: 35, 
      active: true,
      draggedBy: null // Tracks which kid is holding this item
    });
  }
}

function initScene2() {
  clouds = [
    { x: width * 0.2, y: height * 0.2, w: 140, h: 80 },
    { x: width * 0.5, y: height * 0.15, w: 160, h: 90 },
    { x: width * 0.8, y: height * 0.2, w: 140, h: 80 }
  ];
  raindrops = []; flowers = [];
}

function initScene3() {
  instruments = [
    { x: width * 0.2, y: height * 0.6, radius: 70, type: 'Drum', color: [255, 100, 100] },
    { x: width * 0.5, y: height * 0.6, radius: 80, type: 'Turntable', color: [100, 255, 100] },
    { x: width * 0.8, y: height * 0.6, radius: 70, type: 'Horn', color: [100, 100, 255] }
  ];
  communityEnergy = 0;
}

function drawScene1() {
  noStroke(); fill(0, 100, 200, 90); 
  rect(0, height/2 + 50, width, height/2 - 50);

  let activeCount = 0;
  for (let t of trashItems) {
    if (t.active) {
      activeCount++;
      fill(220, 50, 50, 200); noStroke(); 
      circle(t.x, t.y, t.radius * 2);
      
      // If a kid pulls the trash up out of the water, it counts as cleaned!
      if (t.y < height/2 && t.draggedBy !== null) {
        t.active = false; 
        t.draggedBy = null; 
        score += 20; 
        updateScore();
      }
    }
  }

  if (activeCount === 0) { currentScene = 2; updateUI(); initScene2(); }
}

function drawScene2() {
  noStroke(); fill(101, 67, 33, 130); rect(0, height - 150, width, 150);

  for (let c of clouds) {
    fill(220, 220, 220, 230); noStroke();
    ellipse(c.x, c.y, c.w, c.h); ellipse(c.x - 30, c.y + 10, c.w*0.7, c.h*0.8); ellipse(c.x + 30, c.y + 10, c.w*0.7, c.h*0.8);

    // POINTING Interaction: Touching the cloud makes it rain
    if (checkHover(c.x, c.y, c.w/2) && frameCount % 6 === 0) {
      raindrops.push({ x: c.x + random(-30,30), y: c.y + 30, active: true });
    }
  }

  for (let r of raindrops) {
    if (r.active) {
      fill(0, 150, 255, 200); circle(r.x, r.y, 12);
      r.y += 8; 
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

  if (grownFlowers >= 15) { currentScene = 3; updateUI(); initScene3(); }
}

function drawScene3() {
  fill(50, 50, 50, 200); rect(width/2 - 200, 30, 400, 30, 15);
  fill(255, 215, 0); rect(width/2 - 200, 30, map(communityEnergy, 0, 1000, 0, 400), 30, 15);

  for (let inst of instruments) {
    fill(inst.color[0], inst.color[1], inst.color[2], 200); circle(inst.x, inst.y, inst.radius * 2);
    fill(255); textAlign(CENTER, CENTER); textSize(20); text(inst.type, inst.x, inst.y);

    // POINTING Interaction: Touching instruments plays them
    if (checkHover(inst.x, inst.y, inst.radius)) { 
      communityEnergy += 4; 
    }
  }

  if (communityEnergy >= 1000) { currentScene = 4; updateUI(); }
}
