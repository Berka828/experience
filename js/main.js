let video;

function setup() {
  let canvas = createCanvas(900, 650);
  
  // Set up Webcam
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); // Hide raw DOM video, we draw it manually in draw()

  // Initialize ML5 Tracking (from tracking.js)
  setupTracking(video);

  // Load Level 1 (from scenes.js)
  initScene1();
}

function draw() {
  // 1. Draw Webcam Feed First
  image(video, 0, 0, width, height);
  
  // 2. Add light overlay for visibility
  background(255, 255, 255, 40);

  // 3. Draw AR Masks (from tracking.js)
  drawFaceMasks(); 

  // 4. Render Current Scene (from scenes.js)
  if (currentScene === 1) {
    drawScene1();
  } else if (currentScene === 2) {
    drawScene2();
  } else if (currentScene === 3) {
    drawScene3();
  }

  // 5. Draw Player Skeletons & Check Collisions last so they render on top
  drawSkeletonsAndInteractions();
}
