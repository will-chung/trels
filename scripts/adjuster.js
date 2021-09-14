import { roulette, data } from './roulette.js';
import { getAngle } from './tracker.js';

const COLLAPSED = 0;
const FULL = 1;

addEventListener('mousedown', event => {
  const handles = roulette.handles;
  let mouseMoveHandler;

  handles.forEach(handle => {
    if (handle.contains(event.x, event.y)) {
      // TODO: form sector group
      const sector = handle.sector;
      const adjacentSector = handle.adjacentSector;
      let prevAngle = getAngle(event.x, event.y);

      mouseMoveHandler = moveEvent => {
        let currAngle = getAngle(moveEvent.x, moveEvent.y);
        let difference = currAngle - prevAngle;

        // to account for crossing 0 deg
        if (Math.abs(difference) > 1) {
          // if crossing clockwise
          if (currAngle > prevAngle) difference -= 2 * Math.PI;
          // else crossing counter-clockwise
          else difference += 2 * Math.PI;
        }

        let trueAngle = sector.endAngle + difference;

        let boundProps = handle.withinBounds(currAngle, trueAngle);

        if (boundProps.withinBounds) {
          sector.endAngle = boundProps.angle;

          adjacentSector.startAngle = sector.endAngle;

          sector.calculateProbability();
          adjacentSector.calculateProbability();
        } else handle.setBounds(boundProps.boundType);

        prevAngle = currAngle;
        update();
      };

      addEventListener('mousemove', mouseMoveHandler);

      const mouseUpHandler = () => {
        removeEventListener('mousemove', mouseMoveHandler);
        removeEventListener('mouseup', mouseUpHandler);
      };

      addEventListener('mouseup', mouseUpHandler);
    }
  });
});

function update() {
  roulette.update();
  data.update();
}

export { COLLAPSED, FULL };
