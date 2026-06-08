let smogGraphics; let smogCleared = 0;
let trashItems = []; let clouds = []; let raindrops = []; 
let flowers = []; let insects = []; let scene3Timer = 0;

// Level 4 Amenities Variables
let popBubbles = []; let bubblesPopped = 0; let sunSize = 180;
let rainbowAlpha = 0; 
let ripples = []; // Expanding rings when bubbles are bounced
let fireflies = []; // Ambient background particles

function initScene1() { 
  smogGraphics = createGraphics(width, height); 
  smogGraphics.background(150, 150, 150, 240); 
  smogCleared = 0; 
}

function initScene2() { 
  trashItems = []; 
  // Increased to 10 items for a longer cleanup phase
  for(let i=0; i<10; i++) trashItems.push({ x: random(100, width - 100), y: random(height/2 + 50, height - 100), radius: 35, active: true, draggedBy: null }); 
}

function initScene3() { 
  clouds = [{ x: width*0.2, y: 150, w: 140, h: 80 }, { x: width*0.5, y: 120, w: 160, h: 90 }, { x: width*0.8, y: 150, w: 140, h: 80 }]; 
  raindrops = []; flowers = []; insects = []; 
  scene3Timer = 2400; // ~40 seconds of free-play at 60fps!
}

function initScene4() { 
  rainbowAlpha = 0; popBubbles = []; bubblesPopped = 0; ripples = []; fireflies = [];
  for(let i=0; i<8; i++) spawnBubble(); 
  // Spawn 30 ambient fireflies
  for(let i=0; i<30; i++) fireflies.push({x: random(width), y: random(height), vx: random(-0.5, 0.5), vy: random(-0.5, 0.5)});
}

function spawnBubble() { 
  let baseSize = parseInt(document.getElementById('bubble-size').value) || 45;
  
  let isGold = random() < 0.08; // 8% chance for the Rare Golden Bubble!
  let isRed = !isGold && random() < 0.4; // 40% chance for standard Poppable Red
  
  let bColor = isRed ? [220, 60, 60] : (isGold ? [255, 215, 0] : [random(100, 150), random(200, 255), random(200, 255)]);
  let bRadius = isGold ? baseSize + 30 : baseSize + random(-10, 10);
  
  popBubbles.push({ 
    x: random(100, width-100), y: height + 100, 
    vx: random(-1, 1), vy: random(-2, -4), 
    radius: bRadius, isRed: isRed, isGold: isGold, color: bColor, active: true 
  }); 
}

function drawScene1() {
  if (handVelocity > 5 && fadeState === 0) { 
    smogGraphics.erase();
    for (let k = 0; k < activePointers.length; k++) {
      smogGraphics.circle(activePointers[k].x, activePointers[k].y, 100); 
      smogCleared += 0.5;
    }
    smogGraphics.noErase();
  }
  image(smogGraphics, 0, 0);
  
  // Tripled threshold: takes much longer to clear!
  if (smogCleared > 1000 && fadeState === 0) { triggerTransition(2); }
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
  if (activeCount === 0 && fadeState === 0) { triggerTransition(3); }
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
      if (r.y > height - 100) { 
        r.active = false; score += 2; updateScore(); 
        // Increased to 20 flowers
        if (flowers.length < 20) { flowers.push({ x: r.x, y: height - 100, size: 0, cooldown: 0 }); }
      }
    }
  }

  let grownFlowers = 0;
  for (let f of flowers) {
    if (f.size < 55) f.size += 0.3; 
    else {
      grownFlowers++;
      let fTouched = false;
      let fCenterY = height - 100 - f.size;
      for(let p of activePointers) if(dist(p.x, p.y, f.x, fCenterY) < 40) fTouched = true;
      for(let b of activeBouncers) if(dist(b.x, b.y, f.x, fCenterY) < 40) fTouched = true;

      if (fTouched && f.cooldown <= 0) {
        insects.push({ x: f.x, y: fCenterY, vx: random(-2, 2), vy: random(-2, -5), emoji: random(['🦋', '🐝']), life: 255 });
        f.cooldown = 120; 
      }
    }
    if (f.cooldown > 0) f.cooldown--;
    
    fill(46, 204, 113, 200); rect(f.x - 3, height - 100 - f.size, 6, f.size); 
    fill(255, 180, 200, 220); circle(f.x, height - 100 - f.size, f.size/1.5); 
  }

  for (let i = insects.length - 1; i >= 0; i--) {
    let ins = insects[i];
    ins.x += ins.vx + sin(frameCount * 0.1); 
    ins.y += ins.vy; ins.life -= 1.5;
    textSize(35); textAlign(CENTER, CENTER); text(ins.emoji, ins.x, ins.y);
    if (ins.life <= 0 || ins.y < -50) insects.splice(i, 1);
  }

  if (grownFlowers >= 20) {
    scene3Timer--;
    if (scene3Timer <= 0 && fadeState === 0) { triggerTransition(4); }
  }
}

function drawScene4() {
  if (rainbowAlpha < 150) rainbowAlpha += 0.5; 
  noFill(); strokeWeight(40); 
  let pastelColors = [ [255, 182, 193], [255, 228, 181], [255, 255, 224], [152, 251, 152], [173, 216, 230] ];
  for (let i = 0; i < pastelColors.length; i++) {
    stroke(pastelColors[i][0], pastelColors[i][1], pastelColors[i][2], rainbowAlpha);
    arc(width / 2, height + 50, width * 0.9 - (i * 40), height * 1.5 - (i * 40), PI, TWO_PI);
  }

  let sunX = width - 180; let sunY = 180;
  sunSize = 180 + sin(frameCount * 0.02) * 8; 
  noStroke(); fill(255, 204, 0, 100); circle(sunX, sunY, sunSize);
  fill(255, 255, 0, 180); circle(sunX, sunY, sunSize - 30);

  // AMENITY: Ambient Fireflies
  for (let f of fireflies) {
    f.x += f.vx + sin(frameCount * 0.05) * 0.5;
    f.y += f.vy + cos(frameCount * 0.05) * 0.5;
    fill(255, 255, 150, 180); noStroke(); circle(f.x, f.y, 4);
    if (f.x < 0) f.x = width; if (f.x > width) f.x = 0;
    if (f.y < 0) f.y = height; if (f.y > height) f.y = 0;
  }

  // AMENITY: Visual Ripples (Expanding Rings)
  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i];
    noFill(); stroke(255, 255, 255, r.alpha); strokeWeight(3);
    circle(r.x, r.y, r.radius);
    r.radius += 3; r.alpha -= 5;
    if (r.alpha <= 0) ripples.splice(i, 1);
  }

  // Advanced Bubble Physics
  for (let i = popBubbles.length - 1; i >= 0; i--) {
    let b = popBubbles[i];
    if (b.active) {
      b.vy -= 0.015; // Natural upward buoyancy
      b.x += b.vx; b.y += b.vy;

      stroke(255, 255, 255, (b.isRed || b.isGold) ? 200 : 120); 
      strokeWeight((b.isRed || b.isGold) ? 4 : 2); 
      fill(b.color[0], b.color[1], b.color[2], 160); 
      circle(b.x, b.y, b.radius * 2);
      
      if (b.isGold) {
        // Gold sparkles on the bubble itself
        fill(255, 255, 255, random(100, 255)); noStroke();
        circle(b.x - 10, b.y - 10, 8);
      }

      if (b.x < b.radius || b.x > width - b.radius) b.vx *= -1;

      // BOUNCE OFF PALMS, FISTS & FEET
      for (let kicker of activeBouncers) {
        if (dist(kicker.x, kicker.y, b.x, b.y) < b.radius + 40) {
          let angle = atan2(b.y - kicker.y, b.x - kicker.x);
          b.vx = cos(angle) * 7; 
          b.vy = sin(angle) * 7 - 2; 
          
          // Trigger Ripple Amenity on bounce!
          ripples.push({x: b.x, y: b.y, radius: b.radius, alpha: 200});
        }
      }

      let squashed = (b.y > height - b.radius);
      let pointed = false;
      for (let pointer of activePointers) {
        if (dist(pointer.x, pointer.y, b.x, b.y) < b.radius) pointed = true;
      }

      if (squashed || pointed) {
        if (b.isRed || b.isGold) {
          popBubble(b); 
        } else if (pointed) {
          b.vy -= 2; 
        } else if (squashed) {
          b.vy = -6; 
          ripples.push({x: b.x, y: height, radius: b.radius, alpha: 150});
        }
      }

      if (b.y < -150) { b.active = false; setTimeout(spawnBubble, 500); }
    }
  }

  // Increased target to 35 bubbles to make the finale last longer!
  if (bubblesPopped >= 35 && fadeState === 0) {
    triggerTransition(5); 
  }
}

function popBubble(b) {
  b.active = false; 
  if (b.isGold) {
    score += 200; 
    // Massive gold explosion
    for(let i=0; i<3; i++) spawnExplosion(b.x + random(-20,20), b.y + random(-20,20), [255, 215, 0]);
  } else {
    bubblesPopped++; score += 50; 
    if(!document.getElementById('calm-mode').checked) spawnExplosion(b.x, b.y, b.color);
  }
  updateScore();
  setTimeout(spawnBubble, 800);
}
