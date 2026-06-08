let video;
let videoReady = false;

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

  drawFaceMasks(); // Draw AR masks behind the game UI but over the player

  if (currentScene === 1) drawScene1();
  else if (currentScene === 2) drawScene2();
  else if (currentScene === 3) drawScene3();
  else if (currentScene === 4) drawScene4(); 
  else if (currentScene === 5) {
    // Win Screen Celebration!
    if (frameCount % 10 === 0) {
      // Spawn random fireworks across the screen
      spawnExplosion(random(width), random(height), [random(255), random(255), random(255)]);
    }
  }

  drawSkeletonsAndInteractions();
  drawParticles(); 
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (currentScene === 1) initScene1();
  if (currentScene === 2) initScene2();
  if (currentScene === 3) initScene3();
  if (currentScene === 4) initScene4();
}

function resetGame() {
  currentScene = 1;
  score = 0; updateScore(); updateUI();
  initScene1();
}
