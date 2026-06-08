let video;
let videoReady = false;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  
  video = createCapture(VIDEO, () => { videoReady = true; });
  video.hide(); 

  fetchLiveWeather(); // Fetch Bronx Weather from API
  setupTracking(video); // Init AI
  updateUI(); // Init Dictionary
  initScene1(); // Start Smog Level
}

function draw() {
  if (!videoReady) return;

  push();
  translate(width, 0); scale(-1, 1);
  image(video, 0, 0, width, height); // Mirror Camera
  pop();
  
  // Dynamic Weather Overlay
  background(skyColor[0], skyColor[1], skyColor[2], 120); 

  drawFaceMasks(); 

  // Render Current Level
  if (currentScene === 1) drawScene1();
  else if (currentScene === 2) drawScene2();
  else if (currentScene === 3) drawScene3();
  else if (currentScene === 4) {
    // Win Screen - Freeze frame for Photo
    textSize(40); textAlign(CENTER); fill(255);
    text("📸 Say Cheese!", width/2, 100);
  }

  drawSkeletonsAndInteractions();
  drawParticles(); // Render Physics Explosions
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (currentScene === 1) initScene1();
  if (currentScene === 2) initScene2();
  if (currentScene === 3) initScene3();
}

function resetGame() {
  document.getElementById('qr-container').style.display = 'none';
  currentScene = 1;
  score = 0; updateScore(); updateUI();
  initScene1();
}
