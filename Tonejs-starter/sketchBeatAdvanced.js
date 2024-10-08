let song;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let meter;
let beatThreshold = 10; // Minimum amplitude to consider as a beat
let beatDetected = false;
let beatCount = 0;
let amplitudeHistory = []; 
let beatVisualRadius = 0;
let circles = []; 

let angle = 5;
let r;
let phase = 0;

window.addEventListener("load", () => {
  song = new Tone.Player("allofme.mp3");

  song.toDestination();
  
  startButton.addEventListener("click", startAudio);

  meter = new Tone.Meter();
  song.connect(meter);

  Tone.start();
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
  }
  isPlaying = !isPlaying;
}

function setup() {
  createCanvas(innerWidth, innerHeight);
  r = width / 4;
}

function draw() {
  background(0, 30);
  translate(width / 2, height / 2);

  let level = meter.getValue();
  detectBeat(level);

  fill(255);
  noStroke();
  textSize(32);
  text("Beats: " + beatCount, -0, 0);

  
  stroke(255);
  strokeWeight(8);
  noFill();

  let increment = TWO_PI / beatCount;
  beginShape();
  for (let a = 0; a < TWO_PI; a += increment) {
    //multiply by a higher number = larger movement (not calm)
    let r1 = r + sin(a * 10 + phase) * 50;
    let x = r1 * cos(a);
    let y = r1 * sin(a);
    curveVertex(x, y);
  }
  endShape(CLOSE);

  //intense, more sharp; if electronic music then higher
  phase += beatCount / 100;

  // Draw all circles stored in the array 
  for (let i = circles.length - 1; i >= 0; i--) {
    let circle = circles[i];

    noStroke();
    fill(255, 0, 0, 150);
    ellipse(circle.x, circle.y, circle.radius, circle.radius);

    //skrink circles
    circle.radius -= 2;

    //remove circle
    if (circle.radius <= 0) {
      circles.splice(i, 1); // Remove the circle from the array
    }
  }
}

function detectBeat(level) {
  amplitudeHistory.push(level);

  if (amplitudeHistory.length > 10) {
    amplitudeHistory.shift();
  }

  let average = amplitudeHistory.reduce((sum, val) => sum + val, 0) / amplitudeHistory.length;

  if (level > average + beatThreshold && !beatDetected) {
    beatCount++;
    beatDetected = true;
    beatVisualRadius = 100; 

    circles.push({
      x: random(width),
      y: random(height),
      radius: 100 
    });
  }

  if (level < average) {
    beatDetected = false;
  }
}