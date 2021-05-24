import { randomValueInRange, getRadians } from './math.js'
import { Handle } from './handle.js'
import { Sector } from './sector.js'
import { Data, updateData } from './data.js'
import { ROTATION } from './tracker.js'
import './adjuster.js'

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

let width = getCanvasDimensions(), height = getCanvasDimensions(); 
initializeCanvas(window.innerWidth/2 - width/2, window.innerHeight/2 - height/2, width, height);

let animating = false;

let wheel;
let data;

const FPS = 60;
const DEFAULT_ACCELERATION = (1/3) * Math.PI;         // 1 degree/frame
const DEFAULT_DECCELERATION = DEFAULT_ACCELERATION/8; // 0.125 degrees/frame
const DEFAULT_DURATION = 0.75;

let acceleration = DEFAULT_ACCELERATION;
let decceleration = DEFAULT_DECCELERATION;
let spinUpDuration = DEFAULT_DURATION;

const canvasPadding = 12; // px

const colors = [];
colors.push('red');
colors.push('green');
colors.push('blue');

window.addEventListener('click', (event) => {
    let selected = false;
    for(let level = 0; level < wheel.sectors.length; level++) {
        for(let sector = 0; sector < wheel.sectors[level].length; sector++) {
            let curr = wheel.sectors[level][sector];
            if (curr.contains(event.x, event.y)) {
                selected = true;
                wheel.select(curr);
            } else {
                wheel.deselect(curr);
            }
        }
    }

    if (!selected) {
        document.getElementById('probability').innerHTML = "Probability: 0";
    }
});

document.getElementById('btnClockwise').addEventListener('click', () => {
    acceleration = -DEFAULT_ACCELERATION;
    decceleration = -DEFAULT_DECCELERATION;
    spin();
});

document.getElementById('btnCounter').addEventListener('click', () => {
    acceleration = DEFAULT_ACCELERATION;
    decceleration = DEFAULT_DECCELERATION;
    spin();
})

class Wheel {
    constructor(x, y, radius) {
        this.x = x;
        this.absoluteX = canvas.x + canvas.width/2;
        this.y = y;
        this.absoluteY = canvas.y + canvas.height/2;
        
        this.radius = radius;
        
        this.sectors;
        this.handles;
        
        this.selected;
        this.result = 0;
        
        this.radians = Math.PI;  
        this.finalRadians = this.radians;
        
        this.angularVelocity = 0;
        this.rotationalVelocity = 0;
        this.maxAngularVelocity = 0;
        
        this.spinning = false;
        this.spinningUp = false;
        this.rotating = false;
        this.dragging = false;
    }

    draw() {
        this.updateSectors();
        this.updateHandles();

        let angleOffset = getRadians(c.getTransform());
        c.save();
        c.rotate(-angleOffset);
        
        c.beginPath();
        c.strokeStyle = 'blue';
        c.lineWidth = 2;
        c.moveTo(0, this.radius);
        c.lineTo(0, this.radius - 20);
        c.stroke();
        c.closePath();
        
        c.restore();

    }

    updateSectors() {
        this.sectors.forEach(level => {
            level.forEach(sector => {
                sector.update();
            });
        })
    }

    updateHandles() {
        this.handles.forEach(handle => {
            handle.update();
        })
    }

    rotate() {
        if (this.dragging) {
            // spinning clockwise
            if (this.rotationalVelocity < 0)
                this.rotationalVelocity += Math.abs(ROTATION)/90; 
            // spinning counter-clockwise
            else 
                this.rotationalVelocity -= Math.abs(ROTATION)/90;

            if (Math.abs(this.rotationalVelocity - 0) < ROTATION/60) {
                wheel.rotating = false;
                animating = false;
                this.record();
            }
        }

        c.rotate(this.rotationalVelocity);
    }
    
    spin(radians) {
        this.spinning = true;
        this.spinningUp = true;
        this.finalRadians = radians;
        this.maxAngularVelocity = acceleration * spinUpDuration;
    }

    spinUp() {
        let trueAcceleration = acceleration / FPS;
        this.angularVelocity += trueAcceleration;
        c.rotate(this.angularVelocity);
    }

    spinDown() {
        let trueDecceleration = decceleration / FPS;
        if (Math.abs(this.angularVelocity) <= Math.PI/180 * 3) {
            let radians = getRadians(c.getTransform()); 

            if (Math.abs(this.angularVelocity) >= Math.PI/180) {
                this.angularVelocity -= trueDecceleration/9;
            } else if (Math.abs(this.angularVelocity) >= Math.PI/180 * (1/3)) {
                this.angularVelocity -= trueDecceleration/81;
            }

            if (Math.abs(this.finalRadians - radians) <= 0.01 && Math.abs(this.angularVelocity) <= Math.PI/180) {
                this.stop();
            }
            
            // if (Math.abs(this.finalRadians - this.radians) <= 0.01 && Math.abs(this.angularVelocity) <= Math.PI/180) {
            //     this.radians = this.finalRadians;
            //     this.stop();
            // }
        } else {
            this.angularVelocity -= trueDecceleration;
        }
        c.rotate(this.angularVelocity);
    }

    stop() {
        animating = false;
        this.spinning = false;
        this.angularVelocity = 0;
        this.record();
    }

    record() {
        let pointerCoordinates = {
            x: wheel.absoluteX,
            y: wheel.absoluteY + wheel.radius - 10, // TODO: fix magic numbers
        }; 

        let level = this.sectors.length-1;
        let numSectors = this.sectors[level].length;
        for(let sector = 0; sector < numSectors; sector++) {
            // only check outermost sectors
            let currSector = this.sectors[level][sector];
            // case when pointer lands directly on an edge
            if (this.radians == sector.startAngle) {
                let coinFlip = Math.round(Math.random()*2);
                switch (coinFlip) {
                    case 0:
                        pointerCoordinates.x += 2;
                        break;
                    case 1:
                        pointerCoordinates.x -= 2;
                        break;
                }
            }
            // record result of wheel spin
            if (currSector.contains(pointerCoordinates.x, pointerCoordinates.y)) {
                this.result = currSector.value;
                data.add(this.result);
                console.log(data);
                updateData(data);
            }
        }
    }

    select(sector) {
        this.selected = sector;
        sector.select();
        updateData(data);
    }

    deselect(sector) {
        sector.deselect();
        updateData(data);
    }

    contains(x,y) {
        let distance = this.distanceFromCenter(x,y);
        return distance <= this.radius;
    }

    distanceFromCenter(x,y) {
        let center = {
            x: this.absoluteX,
            y: this.absoluteY,
        }
        let distance = Math.sqrt(Math.pow(x - center.x,2) + Math.pow(y - center.y,2));
        return distance;
    }

    update() {
        if (this.spinning) {
            // this.radians += this.angularVelocity;
            // if (this.radians < 0)
            //     this.radians += 2*Math.PI;
            // this.radians %= (2*Math.PI);

            if (Math.abs(this.angularVelocity) < Math.abs(this.maxAngularVelocity) && this.spinningUp) {
                this.spinUp();
            } else {
                this.spinningUp = false;
                this.spinDown();
            }
        }
        
        if (this.rotating) {
            this.rotate();
        }

        this.updateSectors();
        this.updateHandles();
        this.draw();
    }
}

function setAnimating(boolean) {
    animating = boolean;
}

function getCanvasDimensions() {
    let fillPercentage = 0.8;
    let winWidth = window.innerWidth;
    let winHeight = window.innerHeight;
    let min = winHeight;
    if (winWidth < winHeight) {
        min = winWidth;
    }
    return Math.round(fillPercentage * min);
}

function initializeCanvas(x, y, width, height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'fixed';
    canvas.style.top = y + 'px';
    canvas.style.left = x + 'px'
    canvas.x = x;
    canvas.y = y;
    
    c.translate(canvas.width/2, canvas.height/2);
    c.transform(1, 0, 0, -1, 0, 0);
}

function initializeWheel() {
    let radius = canvas.width/2 - canvasPadding;
    wheel = new Wheel(0, 0, radius);
   
    // initialize sectors
    let levels = [2, 3];
    initializeSectors(levels);
    
    // initialize handles
    initializeHandles();

    data = new Data(wheel);
    updateData(data);

    wheel.draw();
}

function initializeSectors(levels) {
    let sectors = [];

    let numLevels = levels.length;
    for (let level = 0; level < numLevels; level++) {
        let numSectors = levels[level];
        let arcAngle = (2*Math.PI) / numSectors;
        let radius = wheel.radius / numLevels;
        let innerRadius = level*radius;
        let outerRadius = (level+1)*radius;
        sectors[level] = [];
        for (let sector = 0; sector < numSectors; sector++) {
            let startAngle = sector*arcAngle;
            let endAngle = (sector+1)*arcAngle;

            if (endAngle > 2*Math.PI) {
                endAngle -= 2*Math.PI;
            }

            let color = colors[sector%3];
            sectors[level].push(new Sector(sector, startAngle, endAngle, innerRadius, outerRadius, color, wheel));
        }
    }

    wheel.sectors = sectors;
}

function initializeHandles() {
    let handles = [];

    let outermostLevel = wheel.sectors.length-1;
    let numSectors = wheel.sectors[outermostLevel].length;
    let outermostSectors = wheel.sectors[outermostLevel];
    for (let sector = 1; sector <= numSectors; sector++) {
        let currSector = outermostSectors[sector-1];
        let adjacentSector;
        if (sector == numSectors) {
            adjacentSector = outermostSectors[0];      // adj to first sector
        } else {
            adjacentSector = outermostSectors[sector];
        }

        handles.push(new Handle(currSector, adjacentSector, 10));
    }

    wheel.handles = handles;
}

function spin() {
    animating = true;
    animate();
    wheel.spin(randomValueInRange(0, 2*Math.PI));
}

function animate() {
    if (animating) {
        requestAnimationFrame(animate);

        clear();
        wheel.update();   
    }
}

function clear() {
    c.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
}

initializeWheel();

export { Wheel, initializeWheel, wheel, clear, acceleration, decceleration, spinUpDuration, setAnimating, animate };