let song;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let meter;
let analyser;
let beatMin = 10; // Minimum amplitude to consider as a beat
let beatDetected = false;
let beatCount = 0;
let beatAmplitudes = [];
let graphRadius;
let phase = 0;
let fftValues = [];
let numWaveforms; 
let waveformSpacing; 

let pageOpenTime = Date.now();
let date = new Date();


window.addEventListener("load", () => {
  song = new Tone.Player("allofme.mp3");
  song.toDestination();
  
  startButton.addEventListener("click", startAudio);

  meter = new Tone.Meter();
  analyser = new Tone.Analyser("fft", 1024);
  song.connect(meter);
  song.connect(analyser);

  Tone.start();
});

function startAudio() {
  if (!isPlaying) {
    song.start();
    startButton.innerHTML = "Stop";
  } else {
    song.stop();
    startButton.innerHTML = "Start";
  }
  isPlaying = !isPlaying;
}

let seed = (pageOpenTime % 1000) / 50;

function setup() {
  createCanvas(innerWidth, innerHeight);
  graphRadius = width / (seed * 3);  
  numWaveforms = 1 + floor(seed);  // number of waveforms
  waveformSpacing = random(15, 30);  // distance between waveforms

  console.log("time:", 1 + floor(seed));
  console.log(date.getDay()); // Current day Sunday - Monday : 0 - 6
  console.log("spacing:", waveformSpacing);
}

function draw() {
  background(0, 30); 
  translate(width / 2, height / 2);  

  if (isPlaying) {
    let level = meter.getValue();
    detectBeat(level);
    fftValues = analyser.getValue();
  }

  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Beat count: " + beatCount, 0, 0);

  stroke(255);
  noFill();

  let numFftValues = fftValues.length / 2;
  let increment = TWO_PI / numFftValues; 
  // Loop to create multiple waveforms
  for (let waveformIndex = 0; waveformIndex < numWaveforms; waveformIndex++) {
    let currentRadius = graphRadius + waveformIndex * waveformSpacing; // Spacing between waveforms

    for (let i = 0; i < numFftValues; i++) {
      let a = i * increment; 
      let mappedFFT = map(fftValues[i], -100, 0, -50, 50);
      
      // scaling up the radius = increased movement
      let r = (currentRadius + mappedFFT + sin(a * 5 + phase + waveformIndex * 0.5) * beatCount) * 1.8;

      let x = r * cos(a);
      let y = r * sin(a);

      let dotSize = 5;
      noStroke();
      fill(255);
      ellipse(x, y, dotSize, dotSize); 
    }
  }

  phase += 0.02 * beatCount / 50;
}

function detectBeat(level) {
  beatAmplitudes.push(level);

  if (beatAmplitudes.length > 10) {
    beatAmplitudes.shift();
  }

  let average = beatAmplitudes.reduce((sum, val) => sum + val, 0) / beatAmplitudes.length;

  if (level > average + beatMin && !beatDetected) {
    beatCount++;
    beatDetected = true;
  }
  if (level < average) {
    beatDetected = false;
  }
}
