let player;
let analyser;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let values = []; // Array to hold frequency values

window.addEventListener("load", () => {
  player = new Tone.Player("houdini.mp3");

  analyser = new Tone.Analyser("fft", 128);
  
  player.connect(analyser);
  player.toDestination();

  startButton.addEventListener("click", startAudio);
});

// Start/ stop audio
function startAudio() {
  if (!isPlaying) {
    player.start();
    startButton.innerHTML = "Stop";
  } else {
    player.stop();
    startButton.innerHTML = "Start";
    values = [];
  }
  isPlaying = !isPlaying;
}

function setup() {
  createCanvas(innerWidth, innerHeight);
}

function draw() {
  background(30, 0, 30); 
  translate(innerWidth / 2, innerHeight / 2);

  if (isPlaying) {
    values = analyser.getValue();
  }

  //draw vectors
  strokeWeight(3);
  for (let i = 0; i < values.length; i++) {
    let angle = map(i, 0, values.length, 0, TWO_PI); 
    let v = map(values[i] * 2, -100, 0, 0, 300);

    let vector = p5.Vector.fromAngle(angle);
    vector.mult(v);

    stroke(255, random(10, 180)); 
    line(0, 0, vector.x, vector.y);  
  }

  //clear the screen
  if (!isPlaying) {
    background(0);
  }
}
