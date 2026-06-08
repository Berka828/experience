let video;
let videoReady = false;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  
  // Set up Webcam with explicit dimensions to prevent AI freezing
  video = createCapture(VIDEO, () => { 
    video.elt.width = 640;  // Force intrinsic width for MediaPipe
    video.elt.height = 480; // Force intrinsic height for MediaPipe
    videoReady = true; 
    
    // Start tracking loop ONLY after the camera is fully physically ready
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

  drawFaceMasks(); 

  if (currentScene === 1) drawScene1();
  else if (currentScene === 2) drawScene2();
  else if (currentScene === 3) drawScene3();
  else if (currentScene === 4) drawScene4(); 
  else if (currentScene === 5) {
    textSize(40); textAlign(CENTER); fill(255);
    text("📸 Say Cheese!", width/2, 100);
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
  document.getElementById('qr-container').style.display = 'none';
  currentScene = 1;
  score = 0; updateScore(); updateUI();
  initScene1();
}
