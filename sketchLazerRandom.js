let song;
let analyser;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let freqValues = [];
let pageOpenTime = Date.now();
let gridColumns = 3; // Number of grid columns
let gridRows = 3; // Number of grid rows
let gridSizeX, gridSizeY;
let vectorPositions = []; // Store the static starting positions

// Set up the canvas and audio analysis
window.addEventListener("load", () => {
  song = new Tone.Player("houdini.mp3");
  analyser = new Tone.Analyser("fft", 1024);

  song.connect(analyser);
  song.toDestination();
  
  startButton.addEventListener("click", startAudio);
  
  gridSizeX = innerWidth / gridColumns; // Calculate grid cell size
  gridSizeY = innerHeight / gridRows; // Calculate grid cell size

  // Calculate the starting positions of the vectors once based on pageOpenTime
  initializeVectorPositions();
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

  // Get FFT values if audio is playing
  if (isPlaying) {
    freqValues = analyser.getValue();
  }
  
  // Create a flow field with vectors that don't change their starting position
  for (let x = 0; x < gridColumns; x++) {
    for (let y = 0; y < gridRows; y++) {
      // Retrieve the precomputed starting positions
      let posX = vectorPositions[x][y].x;
      let posY = vectorPositions[x][y].y;

      // Generate a direction angle based on Perlin noise
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
}

// This function calculates the starting positions of the vectors based on pageOpenTime
function initializeVectorPositions() {
  let seed = (pageOpenTime % 10000) / 1000; // A seed derived from the time when the page was opened
  
  // Initialize positions based on the grid
  for (let x = 0; x < gridColumns; x++) {
    vectorPositions[x] = [];
    for (let y = 0; y < gridRows; y++) {
      // Use Perlin noise combined with the seed to determine the starting positions
      let posX = noise(x * 0.1 + seed) * width;  // Use Perlin noise to vary X start position
      let posY = noise(y * 0.1 + seed) * height; // Use Perlin noise to vary Y start position
      
      // Store the calculated position
      vectorPositions[x][y] = createVector(posX, posY);
    }
  }
}
