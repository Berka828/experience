let smogGraphics; let smogCleared = 0;
let trashItems = []; let clouds = []; let raindrops = []; let flowers = [];
let popBubbles = []; let bubbleAnimals = ['🐻', '🐢', '🦊', '🐸', '🦉', '🦋'];
let bubblesPopped = 0; let sunSize = 140;
let rainbowAlpha = 0; // For gradual fade in

function initScene1() { smogGraphics = createGraphics(width, height); smogGraphics.background(150, 150, 150, 240); smogCleared = 0; }
function initScene2() { trashItems = []; for(let i=0; i<5; i++) trashItems.push({ x: random(100, width - 100), y: random(height/2 + 50, height - 100), radius: 35, active: true, draggedBy: null }); }
function initScene3() { clouds = [{ x: width*0.2, y: 150, w: 140, h: 80 }, { x: width*0.5, y: 120, w: 160, h: 90 }, { x: width*0.8, y: 150, w: 140, h: 80 }]; raindrops = []; flowers = []; }
function initScene4() { rainbowAlpha = 0; popBubbles = []; bubblesPopped = 0; for(let i=0; i<6; i++) spawnBubble(); }

function spawnBubble() { 
  let baseSize = document.getElementById('bubble-size').value; // Hooks to settings
  popBubbles.push({ 
    x: random(100, width-100), y: -100, // Fall from sky
    vx: random(-2, 2), vy: random(2, 4), // Physics vectors
    radius: parseInt(baseSize) + random(-10, 10), 
    animal: random(bubbleAnimals), 
    color: [random(150, 255), random(150, 255), random(150, 255)], // Sensory pastel
    active: true 
  }); 
}

function drawScene1() {
  if (handVelocity > 10) { // Slower, softer requirement
    smogGraphics.erase();
    for (let k = 0; k < activePointers.length; k++) {
      smogGraphics.circle(activePointers[k].x, activePointers[k].y, 180); smogCleared += 1;
    }
    smogGraphics.noErase();
  }
  image(smogGraphics, 0, 0);
  if (smogCleared > 200) { currentScene = 2; updateUI(); initScene2(); }
}

function drawScene2() {
  noStroke(); fill(0, 100, 200, 120); rect(0, height/2, width, height/2);
  let activeCount = 0;
  for (let t of trashItems) {
    if (t.active) {
      activeCount++;
      fill(220, 50, 50, 180); noStroke(); circle(t.x, t.y, t.radius * 2);
      if (t.y < height/2 && t.draggedBy !== null) {
        t.active = false; t.draggedBy = null; score += 20; updateScore();
        if(!document.getElementById('calm-mode').checked) spawnExplosion(t.x, t.y, [220, 50, 50]); 
      }
    }
  }
  if (activeCount === 0) { currentScene = 3; updateUI(); initScene3(); }
}

function drawScene3() {
  noStroke(); fill(101, 67, 33, 120); rect(0, height - 150, width, 150);
  for (let c of clouds) {
    fill(220, 220, 220, 200); noStroke();
    ellipse(c.x, c.y, c.w, c.h); ellipse(c.x-30, c.y+10, c.w*.7, c.h*.8); ellipse(c.x+30, c.y+10, c.w*.7, c.h*.8);
    
    let isTouched = false;
    for(let p of activePointers) if(dist(p.x, p.y, c.x, c.y) < c.w/2) isTouched = true;
    for(let b of activeBouncers) if(dist(b.x, b.y, c.x, c.y) < c.w/2) isTouched = true;
    
    if (isTouched || isRainingInBronx) {
      if (frameCount % 8 === 0) raindrops.push({ x: c.x + random(-30,30), y: c.y + 30, active: true });
    }
  }

  for (let r of raindrops) {
    if (r.active) {
      fill(0, 150, 255, 150); circle(r.x, r.y, 12); r.y += 6; 
      if (r.y > height - 100) { r.active = false; score += 2; updateScore(); if (flowers.length < 15) flowers.push({ x: r.x, y: height - 100, size: 0 }); }
    }
  }
  let grownFlowers = 0;
  for (let f of flowers) {
    if (f.size < 50) f.size += 0.3; else grownFlowers++;
    fill(46, 204, 113, 200); rect(f.x - 3, f.y - f.size, 6, f.size); fill(255, 180, 200, 220); circle(f.x, f.y - f.size, f.size/1.5); 
  }
  if (grownFlowers >= 15) { currentScene = 4; updateUI(); initScene4(); }
}

function drawScene4() {
  // 1. Sensory Rainbow (Slowly fades in, soft pastel colors, wide arcs)
  if (rainbowAlpha < 150) rainbowAlpha += 0.5; 
  noFill(); strokeWeight(40); // Much softer and thicker
  let pastelColors = [ [255, 182, 193], [255, 228, 181], [255, 255, 224], [152, 251, 152], [173, 216, 230] ];
  
  for (let i = 0; i < pastelColors.length; i++) {
    stroke(pastelColors[i][0], pastelColors[i][1], pastelColors[i][2], rainbowAlpha);
    arc(width / 2, height + 50, width * 0.9 - (i * 40), height * 1.5 - (i * 40), PI, TWO_PI);
  }

  // 2. Interactive Sun
  let sunX = width - 150; let sunY = 150;
  sunSize = 140 + sin(frameCount * 0.03) * 10; // Slower pulsing
  noStroke(); fill(255, 204, 0, 150); circle(sunX, sunY, sunSize);
  fill(255, 255, 0, 200); circle(sunX, sunY, sunSize - 30);

  // 3. Advanced Bubble Physics
  for (let i = popBubbles.length - 1; i >= 0; i--) {
    let b = popBubbles[i];
    if (b.active) {
      // Gravity & Movement
      b.vy += 0.05; // Soft gravity
      b.x += b.vx; b.y += b.vy;

      // Draw bubble
      stroke(255, 255, 255, 120); strokeWeight(2); fill(b.color[0], b.color[1], b.color[2], 180); circle(b.x, b.y, b.radius * 2);
      noStroke(); textAlign(CENTER, CENTER); textSize(b.radius); text(b.animal, b.x, b.y);

      // Bounce off screen edges
      if (b.x < b.radius || b.x > width - b.radius) b.vx *= -1;

      // A) KICK / PALM -> BOUNCE
      for (let kicker of activeBouncers) {
        if (dist(kicker.x, kicker.y, b.x, b.y) < b.radius + 30) {
          let angle = atan2(b.y - kicker.y, b.x - kicker.x);
          b.vx = cos(angle) * 8; // Force away horizontally
          b.vy = sin(angle) * 8 - 4; // Force away and UP
        }
      }

      // B) POINTER -> POP
      for (let pointer of activePointers) {
        if (dist(pointer.x, pointer.y, b.x, b.y) < b.radius) {
          popBubble(b, i); break;
        }
      }

      // C) TOUCH GROUND -> SQUASH / POP
      if (b.y > height - b.radius) {
        popBubble(b, i);
      }
    }
  }

  if (bubblesPopped >= 15) {
    currentScene = 5; updateUI(); 
    setTimeout(resetGame, 6000); // Gentle reset
  }
}

function popBubble(b, index) {
  b.active = false; bubblesPopped++; score += 50; updateScore();
  if(!document.getElementById('calm-mode').checked) spawnExplosion(b.x, b.y, b.color);
  setTimeout(spawnBubble, 1000);
}
