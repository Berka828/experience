let smogGraphics; let smogCleared = 0;
let trashItems = []; let clouds = []; let raindrops = []; let flowers = [];
let popBubbles = []; let bubbleAnimals = ['🐻', '🐢', '🦫', '🐸', '🦉', '🦋'];
let bubblesPopped = 0; let sunSize = 140;

function initScene1() { smogGraphics = createGraphics(width, height); smogGraphics.background(150, 150, 150, 240); smogCleared = 0; }
function initScene2() {
  trashItems = [];
  for(let i=0; i<6; i++) trashItems.push({ x: random(100, width - 100), y: random(height/2 + 50, height - 100), radius: 35, active: true, draggedBy: null });
}
function initScene3() { clouds = [{ x: width*0.2, y: 150, w: 140, h: 80 }, { x: width*0.5, y: 120, w: 160, h: 90 }, { x: width*0.8, y: 150, w: 140, h: 80 }]; raindrops = []; flowers = []; }
function initScene4() { popBubbles = []; bubblesPopped = 0; for(let i=0; i<8; i++) spawnBubble(); }
function spawnBubble() { popBubbles.push({ x: random(100, width-100), y: height + random(50, 300), radius: 45, speed: random(3, 6), animal: random(bubbleAnimals), color: [random(100, 255), random(100, 255), random(255)], active: true }); }

function drawScene1() {
  if (handVelocity > 30) {
    smogGraphics.erase();
    for (let k = 0; k < trackedHandsData.length; k++) {
      let x = width - map(trackedHandsData[k][8].x, 0, 1, 0, width); let y = map(trackedHandsData[k][8].y, 0, 1, 0, height);
      smogGraphics.circle(x, y, 180); smogCleared += 1.5;
    }
    smogGraphics.noErase();
  }
  image(smogGraphics, 0, 0);
  if (smogCleared > 200) { currentScene = 2; updateUI(); initScene2(); }
}

function drawScene2() {
  noStroke(); fill(0, 100, 200, 150); rect(0, height/2, width, height/2);
  let activeCount = 0;
  for (let t of trashItems) {
    if (t.active) {
      activeCount++;
      fill(220, 50, 50, 200); noStroke(); circle(t.x, t.y, t.radius * 2);
      if (t.y < height/2 && t.draggedBy !== null) {
        t.active = false; t.draggedBy = null; score += 20; updateScore();
        spawnExplosion(t.x, t.y, [220, 50, 50]); 
      }
    }
  }
  if (activeCount === 0) { currentScene = 3; updateUI(); initScene3(); }
}

function drawScene3() {
  noStroke(); fill(101, 67, 33, 150); rect(0, height - 150, width, 150);
  for (let c of clouds) {
    fill(220, 220, 220, 230); noStroke();
    ellipse(c.x, c.y, c.w, c.h); ellipse(c.x-30, c.y+10, c.w*.7, c.h*.8); ellipse(c.x+30, c.y+10, c.w*.7, c.h*.8);
    
    // Water cloud with fingers OR fists/head!
    if (checkHover(c.x, c.y, c.w/2) || checkBodyHits(c.x, c.y, c.w/2) || isRainingInBronx) {
      if (frameCount % 6 === 0) raindrops.push({ x: c.x + random(-30,30), y: c.y + 30, active: true });
    }
  }

  for (let r of raindrops) {
    if (r.active) {
      fill(0, 150, 255, 200); circle(r.x, r.y, 12); r.y += 8; 
      if (r.y > height - 100) { r.active = false; score += 2; updateScore(); if (flowers.length < 15) flowers.push({ x: r.x, y: height - 100, size: 0 }); }
    }
  }
  let grownFlowers = 0;
  for (let f of flowers) {
    if (f.size < 55) f.size += 0.5; else grownFlowers++;
    fill(46, 204, 113); rect(f.x - 3, f.y - f.size, 6, f.size); fill(255, 150, 200); circle(f.x, f.y - f.size, f.size/1.5); 
  }
  if (grownFlowers >= 15) { currentScene = 4; updateUI(); initScene4(); }
}

function drawScene4() {
  // 1. Gorgeous Sky Rainbow (Arches from the sides)
  noFill(); strokeWeight(25);
  let colors = [ [255, 0, 0, 150], [255, 127, 0, 150], [255, 255, 0, 150], [0, 255, 0, 150], [0, 0, 255, 150], [75, 0, 130, 150] ];
  for (let i = 0; i < colors.length; i++) {
    stroke(colors[i]);
    arc(width / 2, height / 1.2, width * 0.9 - (i * 50), width * 0.9 - (i * 50), PI, TWO_PI);
  }

  // 2. The Interactive Sun with Rotating Rays
  let sunX = width - 150; let sunY = 150;
  sunSize = 140 + sin(frameCount * 0.05) * 15;

  push();
  translate(sunX, sunY); rotate(frameCount * 0.01); // Spin rays
  stroke(255, 200, 0, 150); strokeWeight(10);
  for(let a = 0; a < TWO_PI; a += PI/4) { line(0, 0, cos(a)*120, sin(a)*120); }
  pop();

  noStroke(); fill(255, 204, 0); circle(sunX, sunY, sunSize);
  fill(255, 255, 0); circle(sunX, sunY, sunSize - 30);

  // Touching the sun drops golden light particles!
  if (checkHover(sunX, sunY, sunSize/2) || checkBodyHits(sunX, sunY, sunSize/2)) {
    if (frameCount % 4 === 0) spawnExplosion(sunX, sunY + 80, [255, 255, 0]);
  }

  // 3. Animal Bubbles (Pop with fingers OR Kicks!)
  for (let i = popBubbles.length - 1; i >= 0; i--) {
    let b = popBubbles[i];
    if (b.active) {
      b.y -= b.speed;
      stroke(255, 255, 255, 180); strokeWeight(3); fill(b.color[0], b.color[1], b.color[2], 120); circle(b.x, b.y, b.radius * 2);
      noStroke(); textAlign(CENTER, CENTER); textSize(45); text(b.animal, b.x, b.y);

      // Hit detection includes FEET/ANKLES!
      if (checkHover(b.x, b.y, b.radius) || checkBodyHits(b.x, b.y, b.radius)) {
        b.active = false; bubblesPopped++; score += 50; updateScore();
        spawnExplosion(b.x, b.y, b.color);
        setTimeout(spawnBubble, 800); 
      }
      if (b.y < -100) { popBubbles.splice(i, 1); spawnBubble(); }
    }
  }

  if (bubblesPopped >= 15) {
    currentScene = 5; updateUI(); updateGlobalLeaderboard(15);
    setTimeout(resetGame, 8000); // Wait 8 seconds of celebration, then auto reset!
  }
}
