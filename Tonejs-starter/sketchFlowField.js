let song;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let audioInput = document.getElementById("audioFile");
let meter, analyser;
let beatMin = 10, beatDetected = false, beatCount = 0;
let beatAmplitudes = [], particles = [];
let flowField = [];
let cols, rows;
let scale; // Size of each grid cell in the flow field
let zOffset = 0; // Controls the Perlin noise "time" dimension?
let seed, day, currentSecond;
let fftValues = []; // Store FFT values

//open time
let pageOpenTime = Date.now();
//current day
let date = new Date();

window.addEventListener("load", () => {
    // Initialize audio input and button listeners
    audioInput.addEventListener("change", handleFile);
    startButton.addEventListener("click", startAudio);

    // Generate a unique seed based on current time (day, hour, minute, second)
    
    // seed = now.getTime(); // Use the timestamp as a random seed
    // noiseSeed(seed); // Seed for Perlin noise to make flow field different
    // randomSeed(seed); // Random seed for other randomness
    // currentSecond = now.getSeconds();
});

function handleFile() {
    let file = this.files[0];
    if (file) {
        let url = URL.createObjectURL(file);
        song = new Tone.Player(url).toDestination();
        meter = new Tone.Meter();
        analyser = new Tone.Analyser("fft", 1024); // FFT analysis
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
// let noiseSeed(seed);

function setup() {
    background(0);
    createCanvas(innerWidth, innerHeight);

    scale = floor(10 + (seed / 3));

    cols = floor(width / scale);
    rows = floor(height / scale);

    console.log("cellSize:", scale);

    // Initialize flow field array
    flowField = new Array(cols * rows);
}

function draw() {
    //background(0, 10); // Semi-transparent black background for trails effect

    // Generate the flow field based on Perlin noise, seeded uniquely for every load
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

            // // Draw grid lines to visualize the flow field
            // stroke(50, 100); // Gray lines with slight transparency
            // strokeWeight(1);
            // push();
            // translate(x * scale, y * scale);
            // rotate(v.heading());
            // line(0, 0, scale / 2, 0); // Draw the direction of the vector
            // pop();
        }
        yOffset += 0.2;
    }
    zOffset += 0.005; // Change over time for dynamic flow

    // Move and display particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].follow(flowField);
        particles[i].update(fftValues); // Pass FFT values to update movement
        particles[i].edges();
        particles[i].display();
    }

    // Handle beat detection and generate agents on beats
    if (isPlaying) {
        fftValues = analyser.getValue();
        detectBeat(meter.getValue());
        console.log("beatCount:", beatCount);
    }


    // fill(255);
    // noStroke();
    // textSize(16);
    // textAlign(CENTER, CENTER);
    // text("Beat count: " + beatCount, width / 2, 50);
}
// let realTimeSecond = date.getSeconds(); // Get current real-time second
// let hue;
// Particle class for flow field movement
class Particle {
    constructor(x, y, size) {
        this.position = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        this.maxSpeed = 2;
        this.size = size; // Size depends on beat volume
        this.color = this.getColorByCurrentSecond(); // Color based on real-time second
    }

    // getColorByCurrentSecond() {
    //     hue = map(realTimeSecond, 0, 59, 0, 255); // Map the real-time second to a hue value
    //     return color(hue, 200, 255);
    // }
// check later
    getColorByCurrentSecond() {
        // Get the current real-time second dynamically every time this method is called
        let currentSecond = new Date().getSeconds();
        let hue = map(currentSecond, 0, 59, 0, 255); // Map the real-time second to a hue value
        //make the second values depend on the day
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
        // Get a frequency band from FFT values
        let spectrumIndex = floor(map(this.position.x, 0, width, 0, fftValues.length));
        let frequency = fftValues[spectrumIndex];

        // Use FFT data to influence velocityocity or accelerationeleration
        let frequencyEffect = map(frequency, -100, 0, 0, 5); // FFT mapped to a range
        this.velocity.add(p5.Vector.random2D().mult(frequencyEffect)); // Randomized direction influenced by frequency

        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed + frequencyEffect); // Speed depends on frequency
        this.position.add(this.velocity);
        this.acceleration.mult(0); // Reset accelerationeleration for the next frame
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
// console.log("currentSecond:", realTimeSecond);
// console.log("secondNow:", date.getSeconds()); // current seconds
// console.log("hue:", hue);

// Detect beats and generate new particles
function detectBeat(level) {
    beatAmplitudes.push(level);
    if (beatAmplitudes.length > 10) beatAmplitudes.shift();

    let average = beatAmplitudes.reduce((sum, val) => sum + val, 0) / beatAmplitudes.length;

    if (level > average + beatMin && !beatDetected) {
        beatCount++;
        generateParticles(level); // Generate 5 new agents based on the beat
        beatDetected = true;
    }
    if (level < average) {
        beatDetected = false;
    }
}

// Generate new particles on beat
function generateParticles(level) {
    let particleSize;
    if (level < -40) {
        particleSize = random(2, 4); // Small size for low volume
    } else if (level < -20) {
        particleSize = random(4, 7); // Medium size for mid volume
    } else {
        particleSize = random(7, 12); // Large size for high volume
    }

    // Create 5 new particles on beat
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(random(width), random(height), particleSize));
    }
}
