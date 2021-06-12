import { randomValueInRange, randomValueInArray, getRadians } from './math.js'
import { Handle } from './handle.js'
import { Sector } from './sector.js'
import { Data } from './data.js'
import { ROTATION } from './tracker.js'
import './adjuster.js'
import { Wheel } from './wheel.js'

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

let width = getCanvasDimensions(), height = getCanvasDimensions(); 
initializeCanvas(window.innerWidth/2 - width/2, window.innerHeight/2 - height/2, width, height);

let animating = false;

let roulette;
let data;

const FPS = 60;
const DEFAULT_ACCELERATION = (1/3) * Math.PI;         // 1 degree/frame
const DEFAULT_DECCELERATION = DEFAULT_ACCELERATION/8; // 0.125 degrees/frame
const DEFAULT_DURATION = 0.75;

let acceleration = DEFAULT_ACCELERATION;
let decceleration = DEFAULT_DECCELERATION;
let spinUpDuration = DEFAULT_DURATION;

const CANVAS_PADDING = 25; // px

const PRECISION = 0.0000001;

const colors = [];
colors.push('#00629B');
colors.push('#FFCD00');
colors.push('#182B49');

window.addEventListener('click', (event) => {
    let selected = false;

    roulette.wheels.forEach(wheel => {
        wheel.sectors.forEach(sector => {
            if (sector.contains(event.x, event.y)) {
                roulette.select(sector);
                selected = true;
                // console.log(sector)
            }
            else 
                roulette.deselect(sector); 
        });
    });

    if (!selected) {
        roulette.reset();
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

document.getElementById('btnInsert').addEventListener('click', () => {
    roulette.insert();
});

document.getElementById('btnRemove').addEventListener('click', () => {
    roulette.remove();
});

document.getElementById('btnRepeat').addEventListener('click', () => {
    roulette.repeat();
});

document.getElementById('btnTotal').addEventListener('click', () => {
    roulette.total();
});

document.getElementById('btnInvert').addEventListener('click', () => {
    roulette.invert();
});

document.getElementById('btnSimplify').addEventListener('click', () => {
    roulette.simplify();
});

document.getElementById('btnRandom').addEventListener('click', () => {
    roulette.random();
});

document.addEventListener('submit', (event) => {
    event.preventDefault();
    const sampleSize = document.getElementById('sample-size').value;
    const numTrials = document.getElementById('num-trials').value;
    roulette.collectData(sampleSize, numTrials);
});

document.getElementById('btnClear').addEventListener('click', () => {
    data.clear();
    data.update();
});

class Roulette {
    constructor(x, y, radius) {
        this.x = x;
        this.absoluteX = canvas.x + CANVAS_PADDING + radius;
        this.y = y;
        this.absoluteY = canvas.y + CANVAS_PADDING + radius;
        
        this.radius = radius;
        
        this.wheels = [];
        this.handles = [];

        this.result;
        this.selectedWheel;
        this.selectedSector;
        
        this.radians = Math.PI;  
        this.finalRadians = this.radians;
        
        this.angularVelocity = 0;
        this.maxAngularVelocity = 0;
        this.rotationalVelocity = 0;
        
        this.spinning = false;
        this.spinningUp = false;
        this.rotating = false;
        this.dragging = false;
    }

    random() {
        const angle = Math.random() * (2*Math.PI);
        c.rotate(angle);
        this.record();
    }

    collectData(sampleSize, numTrials) {
        const runs = sampleSize * numTrials;
        const possibleValues = [];
        
        const outermostWheel = this.wheels[this.wheels.length - 1];
        outermostWheel.sectors.forEach(sector => {
            possibleValues.push(sector.value);
        });

        for (let i = 0; i < runs; i++) {
            const result = randomValueInArray(possibleValues);
            data.add(result);
        }

        data.update();
    }

    // TODO: set correct level
    insert() {
        const index = this.selectedWheel.level;
        const insertWheel = this.selectedWheel.copy();
        insertWheel.level = this.wheels.length;
        this.wheels.splice(index+1, 0, insertWheel);
    }

    // TODO: set correct level
    remove() {
        if (this.selectedWheel.level == 0)
            return;
        const index = this.selectedWheel.level;
        this.wheels.splice(index, 1);
    }

    total() {
        const outermostWheel = this.wheels[this.wheels.length - 1];
        const totalWheel = outermostWheel.copy();

        totalWheel.sectors.forEach(sector => {
            const startAngle = sector.startAngle;
            const endAngle = sector.endAngle;

            for (let i = this.wheels.length - 2; i >= 0; i--) {
                const wheel = this.wheels[i];
                for (let j = 0; j < wheel.sectors.length; j++) {
                    const innerSector = wheel.sectors[j];
                    if (innerSector.startAngle <= startAngle && endAngle <= innerSector.endAngle) {
                        sector.value += innerSector.value;
                        console.log(sector.value)
                    }
                    else {
                        j == wheel.sectors.length;
                    }
                }
            }
        })

        this.wheels.push(totalWheel);
        data.update();
    }

    // TODO: set correct level
    invert() {
        this.wheels.reverse();
        data.upate();
    }

    simplify() {
        this.wheels.forEach(wheel => {
            wheel.combine();
        });
    }

    repeat() {
        const repeatWheel = new Wheel();

        // set roulette for new wheel
        repeatWheel.roulette = this;

        const outermostWheel = this.wheels[this.wheels.length - 1];
        const outermostSectors = outermostWheel.sectors;
        const selectedWheel = this.selectedWheel;
        const selectedSectors = selectedWheel.sectors;
        
        // set level of new wheel
        repeatWheel.level = outermostWheel.level+1;
        
        for (let i = 0; i < outermostSectors.length; i++) {
            let repeat = [];
            const currSector = outermostSectors[i];
            for (let j = 0; j < selectedSectors.length; j++) {
                const sector = selectedSectors[j];
                const newSector = sector.copy();
                newSector.wheel = repeatWheel;
                repeat.push(newSector);                
            }

            currSector.fit(repeat);
            repeat.forEach(sector => {
                repeatWheel.addSector(sector);
            });
            
            // if next sector has same arcAngle
            while (i+1 < outermostSectors.length && Math.abs(outermostSectors[i+1].arcAngle - currSector.arcAngle) < PRECISION) {
                const startAngle = outermostSectors[i+1].startAngle;
                repeat.forEach(sector => {
                    const newSector = sector.copy();
                    newSector.startAngle += startAngle;
                    newSector.endAngle += startAngle;

                    repeatWheel.addSector(newSector);
                });
                i++;
            }
        }

        this.wheels.push(repeatWheel);
        data.update();
    }

    reset() {
        const wheels = this.wheels;
        wheels.forEach(wheel => {
            wheel.sectors.forEach(sector => {
                sector.deselect();
            });
        });
        this.selectedWheel = this.selectedSector = null;
        data.setProbability(0);
    }

    draw() {
        this.updateRadii();
        this.updateWheels();
        this.updateHandles();

        // offset from vertical
        let angleOffset = getRadians(c.getTransform());
        c.save();
        c.rotate(-angleOffset);
        
        c.beginPath();
        c.strokeStyle = 'black';
        c.lineWidth = 2;
        c.moveTo(0, this.radius);
        c.lineTo(0, this.radius - 20);
        c.stroke();
        c.closePath();
        
        c.restore();
    }

    setWheels(wheels) {
        // set roulette reference and level of each wheel
        wheels.forEach((wheel, index) => {
            wheel.roulette = this;
            wheel.level = index;
        })
        this.wheels = wheels;
    }

    addWheel(wheel) {
        // set roulette reference of the wheel
        wheel.roulette = this;
        // set level of the wheel
        wheel.level = this.wheels.length;
        // add wheel to roulette
        this.wheels.push(wheel);
    }

    updateRadii() {
        const numWheels = this.wheels.length;
        const radius = this.radius / numWheels;
        for (let i = 0; i < numWheels; i++) {
            const wheel = this.wheels[i];
            wheel.innerRadius = radius * i;
            wheel.outerRadius = radius * (i+1);
        }
    }

    updateWheels() {
        this.wheels.forEach(wheel => {
            wheel.update();
        });
    }

    updateHandles() {
        this.handles.forEach(handle => {
            handle.update();
        });
    }
    
    select(sector) {
        this.selectedSector = sector;
        this.selectedWheel = sector.wheel;
        sector.select();
        data.setProbability(sector.probability); 
    }

    deselect(sector) {
        sector.deselect();
    }

    rotate() {
        if (this.dragging) {
            // spinning clockwise
            if (this.rotationalVelocity < 0)
                this.rotationalVelocity += Math.abs(ROTATION)/60; 
            // spinning counter-clockwise
            else 
                this.rotationalVelocity -= Math.abs(ROTATION)/60;
            
            if (Math.abs(this.rotationalVelocity) <= Math.abs(ROTATION/60)) {
                this.rotating = false;
                this.dragging = false;
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
            x: roulette.absoluteX,
            y: roulette.absoluteY - roulette.radius + 10, // TODO: fix magic numbers
        };

        this.wheels.forEach(wheel => {
            wheel.sectors.forEach(sector => {
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
                if (sector.contains(pointerCoordinates.x, pointerCoordinates.y)) {
                    this.result = sector.value;
                    data.add(this.result);
                    console.log(data);
                    data.update();
                }
            });
        });
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
            if (Math.abs(this.angularVelocity) < Math.abs(this.maxAngularVelocity) && this.spinningUp) {
                this.spinUp();
            } else {
                this.spinningUp = false;
                this.spinDown();
            }
        }

        if (this.rotating)
            this.rotate();

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
    canvas.style.position = 'absolute';
    canvas.style.top = y + 'px';
    canvas.style.left = x + 'px'
    canvas.x = x;
    canvas.y = y;
    
    c.translate(canvas.width/2, canvas.height/2);
    c.transform(1, 0, 0, -1, 0, 0);
 }

function initializeRoulette() {
    let radius = canvas.width/2 - CANVAS_PADDING;

    let wheel = new Wheel();
    wheel.addSector(new Sector(0, 0, Math.PI, colors[0], wheel));
    wheel.addSector(new Sector(1, Math.PI, 2*Math.PI, colors[1], wheel));

    roulette = new Roulette(0, 0, radius);
    roulette.addWheel(wheel);

    initializeHandles();

    roulette.update();
    
    data = new Data(roulette);
    data.update();
}

function initializeHandles() {
    const handles = [];

    const outermostWheel = roulette.wheels[roulette.wheels.length - 1];
    const sectors = outermostWheel.sectors;
    for (let i = 0; i < sectors.length; i++) {
        const currSector = sectors[i];
        let adjacentSector;
        if (i == sectors.length - 1) {
            // adjacent to first sector
            adjacentSector = sectors[0];
        } else {
            adjacentSector = sectors[i + 1];
        }

        handles.push(new Handle(currSector, adjacentSector, 10));
    }

    roulette.handles = handles;
}

function spin() {
    animating = true;
    animate();
    roulette.spin(randomValueInRange(0, 2*Math.PI));
}

function animate() {
    if (animating) {
        requestAnimationFrame(animate);
        clear();
        roulette.update();   
    } else {
        return;
    }
}

function clear() {
    c.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
}

initializeRoulette();

export { Roulette , initializeRoulette, roulette, clear, acceleration, decceleration, spinUpDuration, setAnimating, animate, data };