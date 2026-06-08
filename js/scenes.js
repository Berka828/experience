let smogGraphics;
let smogCleared = 0;

let trashItems = [];
let clouds = []; let raindrops = []; let flowers = [];

// Level 4: Rainbow Pops
let popBubbles = [];
let bubbleAnimals = ['🐟', '🐢', '🦫', '🐸', '🦉', '🦊'];
let bubblesPopped = 0;
let sunSize = 120;

function initScene1() {
  smogGraphics = createGraphics(width, height);
  smogGraphics.background(150, 150, 150, 240); 
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

function initScene4() {
  popBubbles = [];
  bubblesPopped = 0;
  for(let i = 0; i < 6; i++) {
    spawnBubble();
  }
}

function spawnBubble() {
  popBubbles.push({
    x: random(100, width - 100),
    y: height + random(50, 200),
    radius: 40,
    speed: random(2, 5),
    animal: random(bubbleAnimals),
    color: [random(100, 255), random(100, 255), random(100, 255)],
    active: true
  });
}

function drawScene1() {
  if (handVelocity > 30) {
    smogGraphics.erase();
    for (let k = 0; k < trackedHandsData.length; k++) {
      let rawTip = trackedHandsData[k][8];
      let x = width - map(rawTip.x, 0, 1, 0, width);
      let y = map(rawTip.y, 0, 1, 0, height);
      smogGraphics.circle(x, y, 160);
      smogCleared += 1.5;
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

  let wandLoc = trackGreenProp(); 

  for (let c of clouds) {
    fill(220, 220, 220, 230); noStroke();
    ellipse(c.x, c.y, c.w, c.h); ellipse(c.x-30, c.y+10, c.w*.7, c.h*.8); ellipse(c.x+30, c.y+10, c.w*.7, c.h*.8);

    let isTouched = false;
    for(let k=0; k<trackedHandsData.length; k++){
       let rawTip = trackedHandsData[k][8];
       let x = width - map(rawTip.x, 0, 1, 0, width);
       let y = map(rawTip.y, 0, 1, 0, height);
       if(dist(x,y,c.x,c.y) < c.w/2) isTouched = true;
    }
    if (wandLoc && dist(wandLoc.x, wandLoc.y, c.x, c.y) < c.w/2) isTouched = true;
    
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
    currentScene = 4; updateUI(); initScene4();
  }
}

// --- NEW LEVEL 4: RAINBOWS AND ANIMAL BUBBLES ---
function drawScene4() {
  // 1. Draw a Gorgeous Procedural Rainbow across the sky
  noFill();
  let colors = [
    [255, 0, 0, 150],     // Red
    [255, 127, 0, 150],   // Orange
    [255, 255, 0, 150],   // Yellow
    [0, 255, 0, 150],     // Green
    [0, 0, 255, 150],     // Blue
    [75, 0, 130, 150],    // Indigo
    [148, 0, 211, 150]    // Violet
  ];
  strokeWeight(15);
  for (let i = 0; i < colors.length; i++) {
    stroke(colors[i][0], colors[i][1], colors[i][2], colors[i][3]);
    arc(width / 2, height, 700 - (i * 30), 700 - (i * 30), PI, TWO_PI);
  }

  // 2. Draw the Glowing Sun
  noStroke();
  fill(255, 200, 0, 180);
  circle(width - 100, 100, sunSize);
  fill(255, 255, 0, 225);
  circle(width - 100, 100, sunSize - 20);

  // Pulse the sun gently
  sunSize = 120 + sin(frameCount * 0.05) * 10;

  // 3. Render and Update Animal Bubbles
  for (let i = popBubbles.length - 1; i >= 0; i--) {
    let b = popBubbles[i];
    if (b.active) {
      b.y -= b.speed; // Float upwards

      // Draw bubble
      stroke(255, 255, 255, 180);
      strokeWeight(2);
      fill(b.color[0], b.color[1], b.color[2], 120);
      circle(b.x, b.y, b.radius * 2);

      // Draw animal emoji inside the bubble
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(32);
      text(b.animal, b.x, b.y);

      // 4. Hit Detection (Swatting/Popping)
      if (checkHover(b.x, b.y, b.radius)) {
        b.active = false;
        bubblesPopped++;
        score += 50;
        updateScore();

        // Explosion gets the color of the popped bubble!
        spawnExplosion(b.x, b.y, b.color);
        setTimeout(spawnBubble, 1000); // Spawn next bubble
      }

      // If bubble floats off screen, reset it at bottom
      if (b.y < -100) {
        popBubbles.splice(i, 1);
        spawnBubble();
      }
    }
  }

  // Once they pop 15 animals, they win!
  if (bubblesPopped >= 15) {
    currentScene = 5; 
    updateUI(); 
    updateGlobalLeaderboard(15); 
    setTimeout(generateMemoryQR, 2000); 
  }
}
