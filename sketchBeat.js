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
}

function draw() {
  background(0, 30);

  let level = meter.getValue();

  detectBeat(level);

  fill(255);
  textSize(32);
  text("Beats: " + beatCount, 10, 100);

  for (let i = circles.length - 1; i >= 0; i--) {
    let circle = circles[i];

    noStroke();
    fill(255, 0, 0, 150);
    ellipse(circle.x, circle.y, circle.radius, circle.radius);

    //shrink circles
    circle.radius -= 2;

    // remove the circle
    if (circle.radius <= 0) {
      circles.splice(i, 1);
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
    beatVisualRadius = 100; // Pulse effect on beat

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
