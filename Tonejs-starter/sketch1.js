let synth; 
let isPlaying = false;
let startButton = document.getElementById('startButton');

window.setup = function() {
  startButton.addEventListener('click', mySound);

  //createCanvas(innerWidth, innerHeight);
};

function mySound() {
  // Check if sound is playing
  if (!isPlaying) {
    isPlaying = true;
    startButton.innerHTML = 'Stop';

    synth = new Tone.Synth().toDestination();

    // Play a note repeatedly
    const loop = new Tone.Loop((time) => {
      synth.triggerAttackRelease("C4", "8n", time); 
    }, "1m").start(0); 

    Tone.start().then(() => {
      Tone.Transport.start();
    });
  } else {
    // Stop sound
    isPlaying = false;
    startButton.innerHTML = 'Start';  
    Tone.Transport.stop(); 
    Tone.Transport.clear(); 
  }
}


function setup() {
  createCanvas(innerWidth, innerHeight);
}

