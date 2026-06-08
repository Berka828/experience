let video;
let videoReady = false;

// Fade Transition Engine
let fadeState = 0; // 0: Playing, 1: Fading Out, 2: Fading In
let fadeAlpha = 0;
let nextScene = 1;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  
  video = createCapture(VIDEO, () => { 
    video.elt.width = 640;  
    video.elt.height = 480; 
    videoReady = true; 
    startMediaPipeTracker(video);
  });
  video.hide(); 

  fetchLiveWeather(); 
  setupTracking(video); 
  updateUI(); 
  initScene1(); 
}

function draw() {
  if (!videoReady) return;

  push();
  translate(width, 0); scale(-1, 1);
  image(video, 0, 0, width, height); 
  pop();
  
  background(skyColor[0], skyColor[1], skyColor[2], 120); 

  // Render the current active level
  if (currentScene === 1) drawScene1();
  else if (currentScene === 2) drawScene2();
  else if (currentScene === 3) drawScene3();
  else if (currentScene === 4) drawScene4(); 
  else if (currentScene === 5) {
     else if (currentScene === 5) {
    if (frameCount % 30 === 0 && !document.getElementById('calm-mode').checked) {
      spawnExplosion(random(width), random(height), [255, 255, 255]); 
    }
    // Automatically fade to reset after ~12 seconds of celebration
    if (frameCount % 720 === 0 && fadeState === 0) {
        triggerTransition(1);
    }
  }


  // Draw interactions
  drawSkeletonsAndInteractions();
  
  if(!document.getElementById('calm-mode').checked) {
    drawParticles(); 
  }

  // SENSORY FADE OVERLAY (Handles the slow transitions)
  if (fadeState > 0) {
    noStroke();
    fill(255, 255, 255, fadeAlpha); // Soft white fade
    rect(0, 0, width, height);

    if (fadeState === 1) {
      fadeAlpha += 4; // Very slow fade out
      if (fadeAlpha >= 255) {
        currentScene = nextScene;
        updateUI();
        if (currentScene === 1) initScene1();
        if (currentScene === 2) initScene2();
        if (currentScene === 3) initScene3();
        if (currentScene === 4) initScene4();
        fadeState = 2; // Begin fade in
      }
    } else if (fadeState === 2) {
      fadeAlpha -= 4; // Very slow fade in
      if (fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeState = 0; // Resume play
      }
    }
  }
}

// Call this from scenes to trigger a slow transition
function triggerTransition(targetScene) {
  if (fadeState === 0) {
    fadeState = 1;
    nextScene = targetScene;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (currentScene === 1) initScene1();
  if (currentScene === 2) initScene2();
  if (currentScene === 3) initScene3();
  if (currentScene === 4) initScene4();
}

function resetGame() {
  score = 0; updateScore();
  // Scene transitions are now handled entirely by the triggerTransition() fade engine
}
