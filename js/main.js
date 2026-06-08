let video;
let videoReady = false;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  
  // Setup Webcam
  video = createCapture(VIDEO, () => {
    videoReady = true; // Wait until camera is physically on
  });
  video.hide(); 

  // Initialize ML5 Tracking (from tracking.js)
  setupTracking(video);

  initScene1();
}

function draw() {
  // Draw the camera feed stretched to fill the screen
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();
  
  background(255, 255, 255, 40); // Light contrast overlay

  if (!videoReady) return; // Don't draw game until camera is ready

  drawFaceMasks(); 

  if (currentScene === 1) drawScene1();
  else if (currentScene === 2) drawScene2();
  else if (currentScene === 3) drawScene3();

  // Draw Skeletons & Check Interactions
  drawSkeletonsAndInteractions();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (currentScene === 1) initScene1();
  if (currentScene === 2) initScene2();
  if (currentScene === 3) initScene3();
}
