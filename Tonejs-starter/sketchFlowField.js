let song;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let audioInput = document.getElementById("audioFile");
let meter, analyser;
let beatMin = 10, beatDetected = false, beatCount = 0;
let beatAmplitudes = [], particles = [];
let flowField = [];
let cols, rows;
let scale; // grid cell size
let zOffset = 0;
let seed, day, currentSecond;
let fftValues = []; 

//open time
let pageOpenTime = Date.now();
//current day
let date = new Date();

window.addEventListener("load", () => {
  
    audioInput.addEventListener("change", handleFile);
    startButton.addEventListener("click", startAudio);
});

function handleFile() {
    let file = this.files[0];
    if (file) {
        let url = URL.createObjectURL(file);
        song = new Tone.Player(url).toDestination();
        meter = new Tone.Meter();
        analyser = new Tone.Analyser("fft", 1024);
        song.connect(meter);
        song.connect(analyser);
        Tone.start();
    }
}

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

seed = (pageOpenTime % 1000) / 8;

function setup() {
    background(0);
    createCanvas(innerWidth, innerHeight);

    scale = floor(10 + (seed / 3));

    cols = floor(width / scale);
    rows = floor(height / scale);

    console.log("cellSize:", scale);

    flowField = new Array(cols * rows);
}

function draw() {

    let yOffset = 0;
    for (let y = 0; y < rows; y++) {
        let xOffset = 0;
        for (let x = 0; x < cols; x++) {
            let index = x + y * cols;
            let angle = noise(xOffset, yOffset, zOffset) * TWO_PI * 2;
            let v = p5.Vector.fromAngle(angle);
            v.setMag(1);
            flowField[index] = v;
            xOffset += 0.2;

            // // Draw grid lines
            // stroke(50, 100); 
            // strokeWeight(1);
            // push();
            // translate(x * scale, y * scale);
            // rotate(v.heading());
            // line(0, 0, scale / 2, 0); 
            // pop();
        }
        yOffset += 0.2;
    }
    zOffset += 0.005; 

   
    for (let i = 0; i < particles.length; i++) {
        particles[i].follow(flowField);
        particles[i].update(fftValues);
        particles[i].edges();
        particles[i].display();
    }

    if (isPlaying) {
        fftValues = analyser.getValue();
        detectBeat(meter.getValue());
        console.log("beatCount:", beatCount);
    }
}

class Particle {
    constructor(x, y, size) {
        this.position = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        this.maxSpeed = 2;
        this.size = size; // Size depends on beat volume
        this.color = this.getColorByCurrentSecond(); // Color based on real-time second
    }

    getColorByCurrentSecond() {
        let currentSecond = new Date().getSeconds();
        let hue = map(currentSecond, 0, 59, 0, 255); 
        //later - maybe make the second values depend on the day
        return color(hue, random(120, 200), random(200, 255));
    }


    follow(vectors) {
        let x = floor(this.position.x / scale);
        let y = floor(this.position.y / scale);
        let index = x + y * cols;
        let force = vectors[index];
        this.applyForce(force);
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    update(fftValues) {
       
        let spectrumIndex = floor(map(this.position.x, 0, width, 0, fftValues.length));
        let frequency = fftValues[spectrumIndex];

        let frequencyEffect = map(frequency, -100, 0, 0, 5);
        this.velocity.add(p5.Vector.random2D().mult(frequencyEffect)); 

        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed + frequencyEffect);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
    }

    edges() {
        if (this.position.x > width) this.position.x = 0;
        if (this.position.x < 0) this.position.x = width;
        if (this.position.y > height) this.position.y = 0;
        if (this.position.y < 0) this.position.y = height;
    }

    display() {
        noStroke();
        fill(this.color);
        ellipse(this.position.x, this.position.y, this.size);
    }
} 


// Detect beats and generate new particles
function detectBeat(level) {
    beatAmplitudes.push(level);
    if (beatAmplitudes.length > 10) beatAmplitudes.shift();

    let average = beatAmplitudes.reduce((sum, val) => sum + val, 0) / beatAmplitudes.length;

    if (level > average + beatMin && !beatDetected) {
        beatCount++;
        generateParticles(level); 
        beatDetected = true;
    }
    if (level < average) {
        beatDetected = false;
    }
}

function generateParticles(level) {
    let particleSize;
    if (level < -40) {
        particleSize = random(2, 4); // Small size for low volume
    } else if (level < -20) {
        particleSize = random(4, 7); // Medium size for mid volume
    } else {
        particleSize = random(7, 12); // Large size for high volume
    }

    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(random(width), random(height), particleSize));
    }
}
