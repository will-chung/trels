import { roulette, data } from './roulette.js';
import { getAngle } from './tracker.js';

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

        // use sector.endAngle rather than currAngle
        // because of vertical offset
        if (
          handle.lowerBound <= sector.endAngle &&
          sector.endAngle <= handle.upperBound
        ) {
          let difference = currAngle - prevAngle;

          // to account for crossing 0 deg
          if (Math.abs(difference) > 1) {
            // if crossing counter-clockwise
            if (currAngle > prevAngle) difference -= 2 * Math.PI;
            // else crossing clockwise
            else difference += 2 * Math.PI;
          }

          if (sector.endAngle + difference < handle.lowerBound) {
            sector.endAngle = handle.lowerBound;
          } else if (sector.endAngle + difference > handle.upperBound) {
            sector.endAngle = handle.upperBound;
          } else {
            sector.endAngle += difference;
          }

          adjacentSector.startAngle = sector.endAngle;

          // edge case when sector becomes full circle / fully collapsed
          if (sector.startAngle == sector.endAngle) {
            if (Math.round(sector.arcAngle) == 0) {
              sector.arcAngle = 0;
              sector.probability = 0;
            }
          } else {
            sector.calculateProbability();
            adjacentSector.calculateProbability();
          }
        }

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
