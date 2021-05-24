import { wheel, setAnimating, animate } from './roulette.js'

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// positive = counter-clockwise
// negative = clockwise
let ROTATION = (1/900)*Math.PI;

window.addEventListener('mousedown', (event) => {

    let mouseMoveHandler;
    if (wheel.contains(event.x, event.y)) {

        wheel.dragging = false;
        setAnimating(true);
        animate();
        let prevAngle = getAngle(event.x, event.y);
        mouseMoveHandler = function(moveEvent) {
            let currAngle = getAngle(moveEvent.x, moveEvent.y);
            // if spinning clockwise
            if (currAngle < prevAngle) {
                ROTATION = -Math.abs(ROTATION);
            // else spinning counter-clockwise
            } else { 
                ROTATION = Math.abs(ROTATION);
            }
            prevAngle = currAngle;
            wheel.rotating = true;
            wheel.rotationalVelocity += ROTATION/60;
        };

        window.addEventListener('mousemove', mouseMoveHandler);

        window.addEventListener('mouseup', () => {
            wheel.dragging = true;
            window.removeEventListener('mousemove', mouseMoveHandler);
        });
    }

});

function getAngle(x,y) {
    let angle;
    let adjacent = x - wheel.absoluteX;
    let hypotenuse = Math.sqrt(Math.pow(adjacent,2) + Math.pow(y - wheel.absoluteY,2));
    let cosine = adjacent/hypotenuse;

    angle = Math.acos(cosine);

    if (y > wheel.absoluteY)
        angle = 2*Math.PI - angle;

    return angle;
}

export { ROTATION, getAngle };