import { roulette, data } from './roulette.js';
import { getAngle } from './tracker.js';

const CLOCKWISE = 0;
const COUNTERCLOCKWISE = 1;

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

        let direction = difference > 0 ? COUNTERCLOCKWISE : CLOCKWISE;
        // console.log(handle.withinBounds(currAngle, difference, direction));

        // use sector.endAngle rather than currAngle
        // because of vertical offset
        if (handle.withinBounds(currAngle, difference, direction)) {
          sector.endAngle += difference;
          console.log(sector.spans, adjacentSector.spans);

          if (sector.endAngle > 2 * Math.PI) {
            sector.spans = true;
            adjacentSector.spans = false;
          } else if (sector.endAngle < 0) {
            sector.spans = false;
            adjacentSector.spans = true;
          } else if (sector.startAngle > sector.endAngle) sector.spans = true;
          else if (adjacentSector.startAngle > adjacentSector.endAngle)
            adjacentSector.spans = true;

          sector.endAngle %= 2 * Math.PI;
          if (sector.endAngle < 0) sector.endAngle += 2 * Math.PI;

          adjacentSector.startAngle = sector.endAngle;

          sector.calculateProbability();
          adjacentSector.calculateProbability();
        } else handle.setBounds(difference);

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

export { CLOCKWISE, COUNTERCLOCKWISE };
