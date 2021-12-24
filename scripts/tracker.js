import { roulette } from './roulette.js';

// TODO: singleton design
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const VERTICAL_OFFSET = Math.PI / 2;

addEventListener('mousedown', event => {
  // if within roulette
  if (roulette.contains(event.x, event.y)) {
    let mouseMoveHandler;
    let prevAngle = getAngle(event.x, event.y);

    mouseMoveHandler = moveEvent => {
      let currAngle = getAngle(moveEvent.x, moveEvent.y);

      let difference = currAngle - prevAngle;
      c.rotate(difference);

      prevAngle = currAngle;

      // re-render
      roulette.update();
    };

    addEventListener('mousemove', mouseMoveHandler);

    const mouseUpHandler = () => {
      removeEventListener('mousemove', mouseMoveHandler);
      removeEventListener('mouseup', mouseUpHandler);
    };

    // when mouse is released stop listening for movement
    addEventListener('mouseup', mouseUpHandler);
  }
});

/**
 * Calculates the trigonometric angle of a point within the roulette, treating it as a unit circle.
 *
 * @param {Number} x The x-coordinate of the input point
 * @param {Number} y The y-coordinate of the input point
 * @returns The trigonometric angle, in radians, of the input point, treating the roulette as a unit circle
 */
function getAngle(x, y) {
  let angle;
  let adjacent = x - roulette.absX;
  let opposite = y - roulette.absY;
  let hypotenuse = Math.sqrt(Math.pow(adjacent, 2) + Math.pow(opposite, 2));
  let cosine = adjacent / hypotenuse;

  angle = Math.acos(cosine);

  if (y > roulette.absY) angle = 2 * Math.PI - angle;

  // account for vertical offset of roulette
  angle -= VERTICAL_OFFSET;
  if (angle < 0) angle += 2 * Math.PI;

  return angle;
}

export { getAngle, VERTICAL_OFFSET };
