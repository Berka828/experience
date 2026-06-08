let video;

function setup() {
  // Create a canvas that fills the browser viewport
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  
  // Set up the webcam feed to fill the canvas bounds
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); 

  // Initialize ML5 Tracking (from tracking.js)
  setupTracking(video);

  // Load Level 1 (from scenes.js)
  initScene1();
}

function draw() {
  // Programmatically mirror the camera feed to match the coordinate space
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();
  
  // Light white tint overlay for modern, high-contrast look
  background(255, 255, 255, 40);

  // Render Face Masks (from tracking.js)
  drawFaceMasks(); 

  // Render Current Level (from scenes.js)
  if (currentScene === 1) {
    drawScene1();
  } else if (currentScene === 2) {
    drawScene2();
  } else if (currentScene === 3) {
    drawScene3();
  }

  // Draw Skeletons & Check Collisions last
  drawSkeletonsAndInteractions();
}

// Adjusts the canvas scale instantly if the museum window/browser changes size
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(width, height);
  
  // Re-initialize layouts to match new screen boundary coordinates
  if (currentScene === 1) initScene1();
  if (currentScene === 2) initScene2();
  if (currentScene === 3) initScene3();
}
