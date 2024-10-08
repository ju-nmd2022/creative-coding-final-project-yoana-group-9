let player;
//let oscillator;
let analyser;
//let mic;

window.addEventListener("load", () => {
  player = new Tone.Player("houdini.mp3");
  //oscillator = new Tone.Oscillator(440, "sine").toDestination();

  analyser = new Tone.Analyser("fft", 4096);
  
  //mic = new Tone.UserMedia();

  //oscillator.connect(analyser);
  //oscillator.toDestination();
  player.connect(analyser);
  player.toDestination();
  //mic.connect(analyser);
});

window.addEventListener("click", () => {
  player.start();
  //oscillator.start();
  // mic.open();
});

function setup() {
  createCanvas(innerWidth, innerHeight);
}

function draw() {
  background(255, 255, 255);
  let value = analyser.getValue();
  for (let i = 0; i < value.length; i++) {
    let v = map(value[i], -100, 0, height, 0);
    rect(i * 1, 0, 1, v); // waveform: * 100
  }
}
