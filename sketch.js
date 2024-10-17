//logo
let logoImg;
let logoLoaded = false;
let logoInput = document.getElementById("logoInput");
let logoButton = document.getElementById("logoButton");

//song
let song;
let isPlaying = false;
let startButton = document.getElementById("startButton");
let songInput = document.getElementById("audioFile");
let songButton = document.getElementById("songButton"); 
let meter, analyser;
let beatMin = 10, beatDetected = false, beatCount = 0;
let beatAmplitudes = [], particles = [];
let fftValues = [];

//flow-field
let flowField = [];
let cols, rows;
let scale; // Size of each grid cell in the flow field
let zOffset = 0; // Perlin noise "time" dimension?

//particles
let currentColor;

//hide the buttons
let hideButton = document.getElementById("hideButton");


//open time
let seed, day, currentSecond;
//https://editor.p5js.org/yichun/sketches/OAdEpKtNc 
let pageOpenTime = Date.now();
//current day
let date = new Date(); // Sunday - Satyrday (0-6)

//canvas shake
let isShaking = false;
let shakeDuration = 10;
let shakeMagnitude = 7;
//fade effect
let fadeInterval = (1 + date.getDay()) * 10000;
let lastFadeTime = 0; // last time fading started
let fadeActive = false;
let fadeAlpha = 0; // opacity of the fade


window.addEventListener("load", () => {
    songInput.addEventListener("change", chooseSong);
    startButton.addEventListener("click", startAudio);
    logoInput.addEventListener("change", chooseLogo);

    hideButton.addEventListener("click", () => {  
        logoButton.style.display = "none";
        songButton.style.display = "none";
        hideButton.style.display = "none"
    });

    
    logoButton.addEventListener("click", () => {
        logoInput.click();
    });

    songButton.addEventListener("click", () => {
        songInput.click();
    });

     // Load default logo image on page load
     let defaultLogo = document.getElementById("logoImage").src;
     loadImage(defaultLogo, img => {
         logoImg = img;
         logoLoaded = true;
     });
});


function chooseLogo(event) {
    let file = event.target.files[0];
    if (file) {
        let url = URL.createObjectURL(file);
        loadImage(url, img => {
            logoImg = img;
            logoLoaded = true;
            background(0);
            redraw();
        });
        
    }
}

function chooseSong() {
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
        startButton.innerHTML = "▐▐";
    } else {
        song.stop();
        startButton.innerHTML = "▶";
    }
    isPlaying = !isPlaying;
}


//the real-time seconds the page was loaded / 8
seed = (pageOpenTime % 1000) / 8;

function setup() {
    background(0, 30);
    createCanvas(innerWidth, innerHeight);
    console.log("day:", date.getDay());
    console.log("fade:", fadeInterval);

    // the cells' size
    scale = floor(10 + (seed / 3)); // 30 = 10 + pageOpenTime *1000 / 8/ 240 = 10 + x * 1000/ 230 = x * 1000/ 0,23 = x

    //grid
    cols = floor(width / scale);
    rows = floor(height / scale);

    console.log("cellSize:", scale);

    // flow field array
    flowField = new Array(cols * rows);

    //set particle color
    currentColor = particleRandomColor();
}

function draw() {
     // Draw the logo in the center of the canvas
     if (logoLoaded) {
        let logoWidth = width / 5;  // Adjust size of the logo
        let logoHeight = logoWidth * (logoImg.height / logoImg.width);  // Maintain aspect ratio
        image(logoImg, width / 2 - logoWidth / 2, height / 2 - logoHeight / 2, logoWidth, logoHeight);
    }

    // canvas shaking
    if (isShaking) {
        applyShakeEffect();
        shakeDuration--;
        if (shakeDuration <= 0) {
            isShaking = false;
        }
    }

    // Fade effect
    // https://editor.p5js.org/enickles/sketches/MBgdwrdPB 
    if (millis() - lastFadeTime > fadeInterval) {
        fadeActive = true;
        lastFadeTime = millis(); // Reset the timer
    }

    if (fadeActive) {
        applyFadeEffect();
    }


    // Change color on every 10th beat
    if (beatCount % 10 === 0) {
        currentColor = particleRandomColor();

    }

    // Generate the flow field based on Perlin noise
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

            // //Draw grid lines to visualize the flow field
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
    zOffset += 0.005; // Change over time (for dynamic flow)


    // Move and display particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].follow(flowField);
        particles[i].update(fftValues); // FFT values update the movement
        particles[i].edges();
        particles[i].display();
    }

    // Handle beat detection and generate agents on beats
    if (isPlaying) {
        fftValues = analyser.getValue();
        detectBeat(meter.getValue());
        //console.log("beatCount:", beatCount);
    } else {
        background(0);
    }

    function applyShakeEffect() {
        // Apply translation to create shaking effect
        let shakeX = random(-shakeMagnitude, shakeMagnitude);
        let shakeY = random(-shakeMagnitude, shakeMagnitude);
        translate(shakeX, shakeY);
      }

    function applyFadeEffect() {
        fadeAlpha += 0.01; // fade speed
        if (fadeAlpha > 255) {
            fadeAlpha = 0; // Reset after fully faded
            fadeActive = false;
        }
    
    noStroke();
    fill(0, fadeAlpha); 
    rect(0, 0, width, height);
}

}

class Particle {
    constructor(x, y, size) {
        this.position = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        this.maxSpeed = 2;
        this.size = size; // depends on beat volume
        this.color = currentColor; 
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

        // influence velocityocity or accelerationeleration
        let frequencyEffect = map(frequency, -100, 0, 0, 5); 
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

function particleRandomColor() {
    let currentSecond = new Date().getSeconds();
    let hue = map(currentSecond, 0, 59, 0, 255);
    let opacity = random(200, 255);

    let red = color(hue, 0, 0, opacity);
    let yellow = color(hue, hue, 0, opacity);
    let green = color(0, hue, 0, opacity);
    let turquoise = color(0, hue, hue, opacity);
    let purple = color(hue, 0, hue, opacity);
    let blue = color(0, 0, hue, opacity);

    let colors = [red, yellow, green, turquoise, purple, blue];
    return colors[floor(random(0, colors.length))]; // Pick a random color
    
}

function changeGrid() {
    let newScaleIncrease = random(10, 30);  
    scale += floor(newScaleIncrease);  // sclate the current cells'size

    scale = constrain(scale, 20, 100);  // min and max limits for scale (to not get too big)

    // recalculate the grid
    cols = floor(width / scale);
    rows = floor(height / scale);

    flowField = new Array(cols * rows);

    console.log("new cellSize:", scale);

    background(random(0, 100));
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

        //change grid
    if (beatCount % 30 === 0) {
        changeGrid();
    }

        // shaking effect
        isShaking = true;
        shakeDuration = 10; // Reset duration on each beat
    
    }
    if (level < average) {
        beatDetected = false;
    }
}

// Generate new particles on beat
function generateParticles(level) {
    let today = date.getDay();
    let particleSize;
    if (level < -40) {
        particleSize = random(2, 4); // Small size for low volume
    } else if (level < -20) {
        particleSize = random(4, 7); // Medium size for mid volume
    } else {
        particleSize = random(7, 12); // Large size for high volume
        
    }

    // Create new particles on beat
    for (let i = 0; i < (1 + today); i++) {
        particles.push(new Particle(random(width), random(height), particleSize));
    }
}

// add device spund input