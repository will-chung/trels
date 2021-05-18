import { wheel, clear, acceleration, decceleration, spinUpDuration, setAnimating, animate } from './roulette.js'

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const ROTATION = (1/2060)*Math.PI;

window.addEventListener('mousedown', (event) => {

    let mouseMoveHandler;
    if (wheel.contains(event.x, event.y)) {

        setAnimating(true);
        animate();
        wheel.rotationalVelocity = -(1/2160)*Math.PI;
        let startAngle = getAngle(event.x, event.y);
        mouseMoveHandler = function (event) {
            // let currAngle = getAngle(event.x, event.y);
            // let rotationAngle = currAngle - startAngle;
            // startAngle = currAngle;

            wheel.rotating = true;
            wheel.rotationalVelocity -= ROTATION/60;
        }

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

export { ROTATION };