class Wave {
  constructor(amp, period, phase) {
    this.amplitude = amp;
    this.period = period;
    this.phase = phase;
  }

  evaluate(x) {
    return sin(this.phase + (TWO_PI * x) / this.period) * this.amplitude;
  }

  update() {
    // CORRECTION?
    // phase should change relative to period?
    // this.phase += (10.0 / period);
    this.phase += 0.05;
  }
}

let startButton = document.getElementById("startButton");
let freqValues = [];
let waves = [];
let isPlaying = false;

// Set up the canvas and audio analysis
window.addEventListener("load", () => {
  song = new Tone.Player("houdini.mp3");
  analyser = new Tone.Analyser("fft", 1024);

  song.connect(analyser);
  song.toDestination();
  
  startButton.addEventListener("click", startAudio);
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
  for (let i = 0; i < 5; i++) {
    waves[i] = new Wave(random(20, 80), random(), random(TWO_PI));
  }
}

function draw() {
  background(0);

  if (isPlaying) {
    freqValues = analyser.getValue();
  }

for (let x = 0; x < freqValues.length; x++) {
  let v = map(freqValues[x], -100, 0, height / 2, 0);
  let y = 0;
  //rect(x * 1, 0, 1, v); // waveform: * 100
  noStroke();
  ellipse(x * 1, v, 4);
  for(let wave of waves) {
    y += wave.evaluate(x);
  }
 
  }

  for (let wave of waves) {
    wave.update();
  }
}
