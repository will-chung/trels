import { randomValueInRange, getRadians } from './math.js'
import { Sector, Handle, clear } from './sector.js'
import { Data, updateData } from './data.js'

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
colors.push('black');
colors.push('white');

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

// window.addEventListener('mousedown', (event) => {

//     let handle;

//     let prevRadians = wheel.radians;
//     let timer = 0;
//     let distance = 0;
    
//     let wheelCoordinates = {
//         x: canvas.x + canvasPadding + wheel.x,
//         y: canvas.y + canvasPadding + wheel.y,
//     };
//     let adjacent = event.x - wheelCoordinates.x;
//     let hypotenuse = Math.sqrt(Math.pow(event.x - wheelCoordinates.x,2) + Math.pow(event.y - wheelCoordinates.y,2)); 
//     let radians = Math.acos(adjacent/hypotenuse);

//     if (event.y < wheelCoordinates.y) {
//         radians = 2*Math.PI - radians;
//     }

//     // offset between angle of mouse click and wheel
//     let offset = radians - wheel.radians;

//     function moveWheel(radians) {
//         wheel.radians = radians;
        
//         c.clearRect(0, 0, canvas.width, canvas.height);

//         wheel.sectors.forEach(level => {
//             level.forEach(sector => {
//                 sector.update();
//             });
//         });
//         wheel.update();
//     }
    
//     function moveSector(radians) {
//         handle.sector.endAngle = radians;
//         handle.adjacentSector.startAngle = radians;
//         handle.sector.arcAngle = handle.sector.endAngle - handle.sector.startAngle;
//         handle.adjacentSector.arcAngle = handle.adjacentSector.endAngle - handle.adjacentSector.startAngle;

//         c.clearRect(0, 0, canvas.width, canvas.height);

//         wheel.sectors.forEach(level => {
//             level.forEach(sector => {
//                 sector.draw();
//             });
//         });
//         wheel.update();
//     }

//     function onMouseMove(event) {
//         adjacent = event.x - wheelCoordinates.x;
//         hypotenuse = Math.sqrt(Math.pow(event.x - wheelCoordinates.x,2) + Math.pow(event.y - wheelCoordinates.y,2)); 
//         radians = Math.acos(adjacent/hypotenuse);

//         if (event.y < wheelCoordinates.y) {
//             radians = 2*Math.PI - radians;
//         }
        
//         if (radians < prevRadians && isClockwise) {
//             isClockwise = false;
//             timer = 0;
//             distance = 0;
//         } else if (radians > prevRadians && !isClockwise) {
//             isClockwise = true;
//             timer = 0;
//             distance = 0;
//         }

//         timer++;
//         distance += Math.abs(radians - prevRadians);
//         prevRadians = radians;

//         let newRadians = radians - offset;
//         // console.log(newRadians);
//         moveWheel(newRadians);
//     }

//     function onHandleMove(event) {
//         adjacent = event.x - wheelCoordinates.x;
//         hypotenuse = Math.sqrt(Math.pow(event.x - wheelCoordinates.x,2) + Math.pow(event.y - wheelCoordinates.y,2)); 
//         radians = Math.acos(adjacent/hypotenuse);

//         if (event.y < wheelCoordinates.y) {
//             radians = 2*Math.PI - radians;
//         }

//         let newRadians = radians;
//         moveSector(newRadians);
//     }

//     function onMouseUp() {

//         if (distance != 0) {
//             let time = timer / 10;
//             acceleration = distance / time;
//             console.log(distance, time);
            
//             if (Math.abs(acceleration) > DEFAULT_ACCELERATION) { 
//                 acceleration = isClockwise ? DEFAULT_ACCELERATION : -DEFAULT_ACCELERATION;
//             }

//             if (!isClockwise)
//                 acceleration = -acceleration;

//             decceleration = acceleration/8;
//             spinUpDuration = Math.abs((acceleration / Math.PI) * 2);
//             wheel.angularVelocity = acceleration / time;
//             spin();
//         }

//         timer = 0;
//         distance = 0;
//         window.removeEventListener('mousemove', onMouseMove);
//         window.removeEventListener('mouseup', onMouseUp);
//     }

//     function onHandleReleased() {
//         wheel.sectors.forEach(level => {
//             level.forEach(sector => {
//                 console.log(sector);
//             });
//         });
//         window.removeEventListener('mousemove', onHandleMove);
//         window.removeEventListener('mouseup', onHandleReleased);
//     }

//     wheel.sectors.forEach(level => {
//         level.forEach(sector => {
//             if (sector.handle.contains(event.x, event.y)) {
//                 handle = sector.handle;
//                 window.addEventListener('mousemove', onHandleMove);
//                 window.addEventListener('mouseup', onHandleReleased);
//             }
//         });
//     }); 

//     if (wheel.contains(event.x, event.y)) {
//         window.addEventListener('mousemove', onMouseMove);
//         window.addEventListener('mouseup', onMouseUp);
//     }
// });

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
        this.y = y;
        this.radius = radius;
        this.sectors;
        this.selected;
        this.result = 0;
        this.radians = Math.PI;  
        this.finalRadians = this.radians;
        this.angularVelocity = 0;
        this.maxAngularVelocity = 0;
        this.spinning = false;
        this.spinningUp = false;
    }

    draw() {
        this.drawSectors();

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

        // this.drawHandles();
    }

    drawSectors() {
        this.sectors.forEach(level => {
            level.forEach(sector => {
                sector.update();
                sector.draw();
            });
        })
    }

    drawHandles() {
        this.sectors.forEach(level => {
            level.forEach(sector => {
                sector.handle.draw();
            });
        })
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
       
        let xOffset = canvas.width/2 + wheel.x;
        let yOffset = canvas.height/2 - wheel.y;
        let pointerCoordinates = {
            x: canvas.x + xOffset,
            y: canvas.y + yOffset - this.radius + 10, // TODO: fix magic numbers
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
        let center = {
            x: canvas.x + this.x,
            y: canvas.y + this.y,
        };
        let distance = Math.sqrt(Math.pow(x - center.x,2) + Math.pow(y - center.y,2));
        
        return distance <= this.radius;
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

        this.draw();
    }
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
    
    c.translate(0, canvas.height);
    c.transform(1, 0, 0, -1, 0, 0);
    c.translate(canvas.width/2, canvas.height/2);

    // c.beginPath();
    // c.moveTo(0, canvas.height/2);
    // c.lineTo(0, -canvas.height/2);
    // c.moveTo(canvas.width/2, 0);
    // c.lineTo(-canvas.width/2, 0);
    // c.stroke();
    // c.closePath();
}

function initializeWheel() {
    let radius = canvas.width/2 - canvasPadding;
    wheel = new Wheel(0, 0, radius);
    
    let sectors = [];
    let level = [];
    level.push(new Sector(0, (1/2)*Math.PI, (3/2)*Math.PI, 0, wheel.radius, 'red', wheel));
    level.push(new Sector(1, (3/2)*Math.PI, (1/2)*Math.PI, 0, wheel.radius, 'black', wheel));
    wheel.sectors = sectors;
    sectors.push(level);

    data = new Data(wheel);
    updateData(data);

    wheel.draw();
}

function spin() {
    animating = true;
    animate();
    wheel.spin(randomValueInRange(0, 2*Math.PI));
}

function animate() {
    if (animating) {
        requestAnimationFrame(animate);

        c.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);

        wheel.update();   
    }
}

initializeWheel();

export {Wheel, initializeWheel, wheel};