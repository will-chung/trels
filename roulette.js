var canvas = document.querySelector('canvas');
maximizeCanvas();

var c = canvas.getContext('2d');

var wheel;

var mouseDown;

window.addEventListener('mousedown', () => {
    mouseDown = true;
    wheel.spin();
}); 

window.addEventListener('mouseup', () => {
    mouseDown = false;
});

class Wheel {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.radians = Math.PI / 2;   
        this.angularVelocity = 0;
        this.maxAngVelocity = 0.5;
        this.spinning = false;
        this.spinningUp = false;
        this.spinDuration = 0;
    }

    draw() {
        c.beginPath();
        c.strokeStyle = "black";
        c.arc(this.x, this.y, this.radius, this.radians, this.radians + 2*Math.PI, false);
        c.stroke();
        c.closePath();

        c.beginPath();
        c.moveTo(this.x, this.y);
        c.lineTo(this.x + Math.cos(this.radians) * this.radius, this.y - Math.sin(this.radians) * this.radius);
        c.stroke();
        c.closePath();
    }
    
    spin() {
        this.spinDuration = randomValueInRange(1, 4);
        this.spinning = true;
        this.spinningUp = true;
    }

    spinUp() {
        this.angularVelocity += 0.01; 
    }

    spinDown() {
        this.angularVelocity -= 0.001;
        if (this.angularVelocity <= 0) {
            this.angularVelocity = 0;
            this.spinning = false;
        } 
    }

    update() {
        this.radians += this.angularVelocity;

        if (this.spinning) {
            if (this.angularVelocity <= this.maxAngVelocity && this.spinningUp) {
                this.spinUp();
            } else {
                this.spinningUp = false;
                setTimeout(this.spinDown(), 1000 * this.spinDuration); 
            }
        }

        this.draw();
    }
}

function initializeWheel() {
    wheel = new Wheel(canvas.width/2, canvas.height/2, 200);
}

function maximizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initializeCanvas(x, y, width, height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'absolute';
    canvas.style.top = x + 'px';
    canvas.style.left = y + 'px';
}

function randomValueInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function animate() {
    requestAnimationFrame(animate);

    c.clearRect(0, 0, canvas.width, canvas.height);
   
    wheel.update();    
}

initializeWheel();
animate();
