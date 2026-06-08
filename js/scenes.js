let smogGraphics; let smogCleared = 0;
let trashItems = []; let clouds = []; let raindrops = []; 
let flowers = []; let insects = []; let scene3Timer = 0;
let popBubbles = []; let bubblesPopped = 0; let sunSize = 180;

function initScene1() { 
  smogGraphics = createGraphics(width, height); 
  smogGraphics.background(150, 150, 150, 240); 
  smogCleared = 0; 
}

function initScene2() { 
  trashItems = []; 
  for(let i=0; i<5; i++) trashItems.push({ x: random(100, width - 100), y: random(height/2 + 50, height - 100), radius: 35, active: true, draggedBy: null }); 
}

function initScene3() { 
  clouds = [{ x: width*0.2, y: 150, w: 140, h: 80 }, { x: width*0.5, y: 120, w: 160, h: 90 }, { x: width*0.8, y: 150, w: 140, h: 80 }]; 
  raindrops = []; flowers = []; insects = []; scene3Timer = 500; // About 8 seconds of free-play
}

function initScene4() { 
  popBubbles = []; bubblesPopped = 0; 
  for(let i=0; i<6; i++) spawnBubble(); 
}

function spawnBubble() { 
  let baseSize = parseInt(document.getElementById('bubble-size').value) || 45;
  // 40% chance it's a poppable RED bubble. Otherwise, indestructible calm pastel bubble.
  let isRed = random() < 0.4; 
  let bColor = isRed ? [220, 60, 60] : [random(100, 150), random(200, 255), random(200, 255)];
  
  popBubbles.push({ 
    x: random(100, width-100), y: height + 100, // Float UP from bottom
    vx: random(-1, 1), vy: random(-2, -4), // Natural upward buoyancy
    radius: baseSize + random(-10, 10), 
    isRed: isRed, color: bColor, active: true 
  }); 
}

function drawScene1() {
  if (handVelocity > 5 && fadeState === 0) { 
    smogGraphics.erase();
    for (let k = 0; k < activePointers.length; k++) {
      smogGraphics.circle(activePointers[k].x, activePointers[k].y, 100); // Smaller brush takes longer
      smogCleared += 0.5;
    }
    smogGraphics.noErase();
  }
  image(smogGraphics, 0, 0);
  
  // Requires much more clearing before transitioning
  if (smogCleared > 350 && fadeState === 0) { triggerTransition(2); }
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
        if (flowers.length < 15) { flowers.push({ x: r.x, y: height - 100, size: 0, cooldown: 0 }); }
      }
    }
  }

  let grownFlowers = 0;
  for (let f of flowers) {
    if (f.size < 55) f.size += 0.3; 
    else {
      grownFlowers++;
      // FLOWER INTERACTION -> SPAWN BUGS!
      let fTouched = false;
      let fCenterY = height - 100 - f.size;
      for(let p of activePointers) if(dist(p.x, p.y, f.x, fCenterY) < 40) fTouched = true;
      for(let b of activeBouncers) if(dist(b.x, b.y, f.x, fCenterY) < 40) fTouched = true;

      if (fTouched && f.cooldown <= 0) {
        insects.push({ x: f.x, y: fCenterY, vx: random(-2, 2), vy: random(-2, -5), emoji: random(['🦋', '🐝']), life: 255 });
        f.cooldown = 120; // Wait a moment before this flower can spawn another bug
      }
    }
    if (f.cooldown > 0) f.cooldown--;
    
    fill(46, 204, 113, 200); rect(f.x - 3, height - 100 - f.size, 6, f.size); 
    fill(255, 180, 200, 220); circle(f.x, height - 100 - f.size, f.size/1.5); 
  }

  // Draw and float insects
  for (let i = insects.length - 1; i >= 0; i--) {
    let ins = insects[i];
    ins.x += ins.vx + sin(frameCount * 0.1); // Fluttering motion
    ins.y += ins.vy;
    ins.life -= 1.5;
    textSize(35); textAlign(CENTER, CENTER); text(ins.emoji, ins.x, ins.y);
    if (ins.life <= 0 || ins.y < -50) insects.splice(i, 1);
  }

  // Transition after flowers are grown AND free-play timer runs out
  if (grownFlowers >= 15) {
    scene3Timer--;
    if (scene3Timer <= 0 && fadeState === 0) { triggerTransition(4); }
  }
}

function drawScene4() {
  // Gentle, Calming Sun
  let sunX = width - 180; let sunY = 180;
  sunSize = 180 + sin(frameCount * 0.02) * 8; // Ultra slow, soft pulse
  noStroke(); fill(255, 204, 0, 100); circle(sunX, sunY, sunSize);
  fill(255, 255, 0, 180); circle(sunX, sunY, sunSize - 30);

  // Advanced Bubble Physics
  for (let i = popBubbles.length - 1; i >= 0; i--) {
    let b = popBubbles[i];
    if (b.active) {
      b.vy -= 0.02; // Constant gentle upward buoyancy
      b.x += b.vx; b.y += b.vy;

      stroke(255, 255, 255, b.isRed ? 180 : 120); 
      strokeWeight(b.isRed ? 4 : 2); 
      fill(b.color[0], b.color[1], b.color[2], 160); 
      circle(b.x, b.y, b.radius * 2);

      if (b.x < b.radius || b.x > width - b.radius) b.vx *= -1;

      // BOUNCE OFF PALMS, FISTS & FEET (Affects ALL bubbles)
      for (let kicker of activeBouncers) {
        if (dist(kicker.x, kicker.y, b.x, b.y) < b.radius + 40) {
          let angle = atan2(b.y - kicker.y, b.x - kicker.x);
          b.vx = cos(angle) * 7; 
          b.vy = sin(angle) * 7 - 2; 
        }
      }

      // POINTERS & GROUND SQUASHING
      let squashed = (b.y > height - b.radius);
      let pointed = false;
      for (let pointer of activePointers) {
        if (dist(pointer.x, pointer.y, b.x, b.y) < b.radius) pointed = true;
      }

      if (squashed || pointed) {
        if (b.isRed) {
          popBubble(b); // Red = POP!
        } else if (pointed) {
          b.vy -= 2; // Pastels just gently float away when pointed at
        } else if (squashed) {
          b.vy = -5; // Pastels bounce gracefully off the floor
        }
      }

      // Float off top of screen
      if (b.y < -150) { b.active = false; setTimeout(spawnBubble, 500); }
    }
  }

  if (bubblesPopped >= 12 && fadeState === 0) {
    triggerTransition(5); 
    setTimeout(resetGame, 8000); 
  }
}

function popBubble(b) {
  b.active = false; bubblesPopped++; score += 50; updateScore();
  if(!document.getElementById('calm-mode').checked) spawnExplosion(b.x, b.y, b.color);
  setTimeout(spawnBubble, 800);
}
