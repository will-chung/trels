import { roulette } from './roulette.js'

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// positive = counter-clockwise
// negative = clockwise
let ROTATION = (1/900)*Math.PI;

window.addEventListener('dblclick', (event) => {

    let mouseMoveHandler;
    if (roulette.contains(event.x, event.y)) {
        setAnimating(true);
        animate();
        let prevAngle = getAngle(event.x, event.y);
        mouseMoveHandler = function(moveEvent) {
            if (roulette.rotating == false)
                roulette.rotating = true;
            
            let currAngle = getAngle(moveEvent.x, moveEvent.y);
            // if spinning clockwise
            if (currAngle < prevAngle) {
                ROTATION = -Math.abs(ROTATION);
            // else spinning counter-clockwise
            } else { 
                ROTATION = Math.abs(ROTATION);
            }
            prevAngle = currAngle;
            roulette.rotationalVelocity += ROTATION/60;
        };

        window.addEventListener('mousemove', mouseMoveHandler);

        window.addEventListener('mousedown', () => {
            roulette.dragging = true;
            window.removeEventListener('mousemove', mouseMoveHandler);
        });
    }

});

function getAngle(x, y) {
    let angle;
    let adjacent = x - roulette.absX;
    let hypotenuse = Math.sqrt(Math.pow(adjacent,2) + Math.pow(y - roulette.absY,2));
    let cosine = adjacent/hypotenuse;

    angle = Math.acos(cosine);

    if (y > roulette.absY)
        angle = 2*Math.PI - angle;

    return angle;
}

export { ROTATION, getAngle };