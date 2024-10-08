let song;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let meter;
let analyser;
let beatMin = 10; // Minimum amplitude to consider as a beat
let beatDetected = false;
let beatCount = 0;
let beatAmplitudes = []; // Detect peaks
//let beatRadius = 0;
//let circles = [];
let graphRadius;
let phase = 0;
let fftValues = [];

let pageOpenTime = Date.now();

// Set up audio analysis
window.addEventListener("load", () => {
  song = new Tone.Player("houdini.mp3");
  song.toDestination();
  
  startButton.addEventListener("click", startAudio);

  // Analyze the amplitude and fft
  meter = new Tone.Meter();
  analyser = new Tone.Analyser("fft", 1024);
  song.connect(meter);
  song.connect(analyser);

  Tone.start();
});

function startAudio() {
  if (!isPlaying) {
    song.start();
    //Tone.Transport.start(); // use to synchronize events (rythm, loop)
    startButton.innerHTML = "Stop";
  } else {
    song.stop();
    //Tone.Transport.stop();
    startButton.innerHTML = "Start";
  }
  isPlaying = !isPlaying;
}

//the value needs to be b/w 50 and 400
let seed = (pageOpenTime % 1000) / 80;

function setup() {
  createCanvas(innerWidth, innerHeight);
  // I want this to be infuenced by time
  graphRadius = width / seed;
  console.log("time:", graphRadius);
}

function draw() {
  background(0, 30);
  translate(width / 2, height / 2);

  if (isPlaying){
  // Current level of volume
  let level = meter.getValue();
  detectBeat(level);
  // FFT values
  fftValues = analyser.getValue();
}

  // Visualize the beat count
  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Beat count: " + beatCount, 0, 0);

  stroke(255);
  strokeWeight(2);
  noFill();

  // Draw wave influenced by FFT values
  beginShape();
  
  let numFftValues = fftValues.length / 2;
  let increment = TWO_PI / numFftValues; // Angle increment based on FFT size
  
  for (let i = 0; i < numFftValues; i++) {
    let a = i * increment; // Current angle

    let mappedFFT = map(fftValues[i], -100, 0, -50, 50); 
    
    // Multiply sin by higher number = larger movement (not calm)
    let r1 = graphRadius + mappedFFT + sin(a * 10 + phase) * beatCount; // FFT influences the outer shape; beat influence the flower like shape

    let x = r1 * cos(a);
    let y = r1 * sin(a);
    curveVertex(x, y);
  }
  endShape(CLOSE);

  // Animate the phase
  phase += 0.1 * beatCount / 100;

//  // Handle shrinking and removing circles (optional)
//   for (let i = circles.length - 1; i >= 0; i--) {
//     let circle = circles[i];
//     noStroke();
//     fill(255, 0, 0, 150);
//     ellipse(circle.x, circle.y, circle.radius, circle.radius);

//     circle.radius -= 2;
//     if (circle.radius <= 0) {
//       circles.splice(i, 1); // Remove the circle
//     }
//   }
 }

// Detects beats based on amplitude peaks
function detectBeat(level) {
  beatAmplitudes.push(level);

  if (beatAmplitudes.length > 10) {
    beatAmplitudes.shift();
  }

  // https://stackoverflow.com/questions/1230233/how-to-find-the-sum-of-an-array-of-numbers 
  // https://www.codecademy.com/forum_questions/52c4a7bb7c82ca6610005d5a 
  let average = beatAmplitudes.reduce((sum, val) => sum + val, 0) / beatAmplitudes.length;

  if (level > average + beatMin && !beatDetected) {
    beatCount++;
    beatDetected = true;
   // beatRadius = 500; // Pulse effect on beat

    //
    // circles.push({
    //   x: random(width),
    //   y: random(height),
    //   radius: 100
    // });
  }
  if (level < average) {
    beatDetected = false;
  }
}
