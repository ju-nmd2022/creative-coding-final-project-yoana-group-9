let song;
let analyser;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let freqValues = [];
let pageOpenTime = Date.now();
let gridColumns = 2; // Number of grid columns
let gridRows = 2; // Number of grid rows
let gridSizeX, gridSizeY;

// Set up the canvas and audio analysis
window.addEventListener("load", () => {
  song = new Tone.Player("houdini.mp3");
  analyser = new Tone.Analyser("fft", 1024);

  song.connect(analyser);
  song.toDestination();
  
  startButton.addEventListener("click", startAudio);
  
  gridSizeX = innerWidth / gridColumns; // Calculate grid cell size
  gridSizeY = innerHeight / gridRows; // Calculate grid cell size
});

function startAudio() {
  if (!isPlaying) {
    song.start();
    Tone.Transport.start();
    startButton.innerHTML = "Stop";
  } else {
    song.stop();
    Tone.Transport.stop();
    startButton.innerHTML = "Start";
    freqValues = [];
  }
  isPlaying = !isPlaying;
}

function setup() {
  createCanvas(innerWidth, innerHeight);
}

function draw() {
  background(0, 30); // Clear the canvas with some transparency

  // Capture current time and generate a seed for noise
  let currentTime = Date.now();
  let seed = currentTime % 10000 + Math.random() * 1000;
  let timeFactor = map(seed, 0, 11000, 1, 10);

  // Get FFT values if audio is playing
  if (isPlaying) {
    freqValues = analyser.getValue();
    console.log("fft:", freqValues)
  }
  
  // Create a flow field with fewer vectors
  for (let x = 0; x < gridColumns; x++) {
    for (let y = 0; y < gridRows; y++) {
      // Set starting points at corners of the screen
      let posX = (x === 0 ? 0 : width); // Start at left or right edge
      let posY = (y === 0 ? 0 : height); // Start at top or bottom edge

      // Generate a direction angle based on static  and Perlin noise
      let angle = noise(x * 0.1 + frameCount * 0.02, y * 0.1 + frameCount * 0.02) * TWO_PI;
      
      // Modulate vector length using FFT values
      let index = (x + y * gridColumns) % freqValues.length;  // Wrap index for FFT values
      let freqMod = map(freqValues[index], -1, 1, 0, 100);    // Map FFT value to a range
      let vectorLength = map(freqMod, 0, 100, 50, gridSizeX * 1.2); // Map length based on FFT
      
      // Create a vector using p5.js
      let x1 = posX + cos(angle) * vectorLength;
      let y1 = posY + sin(angle) * vectorLength;
      
      stroke(255, 150); // Set stroke color and transparency
      strokeWeight(3);
      line(posX, posY, x1, y1); // Draw the vector line
    }
  }

//   // Optionally: Draw a frame for the grid
//   noFill();
//   stroke(255, 50); // Slightly transparent for the grid
//   for (let i = 0; i < gridColumns; i++) {
//     line(i * gridSizeX, 0, i * gridSizeX, height);
//   }
//   for (let j = 0; j < gridRows; j++) {
//     line(0, j * gridSizeY, width, j * gridSizeY);
//   }
}
