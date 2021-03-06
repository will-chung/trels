import { setSize } from './region.js';
import { roulette, data } from './roulette.js';
import { getAngle } from './tracker.js';

const COLLAPSED = 0;
const FULL = 1;

addEventListener('mousedown', event => {
  const handles = roulette.handles;
  let mouseMoveHandler;

  handles.forEach(handle => {
    if (handle.contains(event.x, event.y)) {
      const sector = handle.sector;
      const adjacentSector = handle.adjacentSector;

      const sectorGroup = handle.sectorGroup;
      const adjacentSectorGroup = handle.adjacentSectorGroup;

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

        let boundProps = handle.withinBounds(trueAngle);

        if (boundProps.withinBounds) {
          sector.endAngle = boundProps.angle;
          adjacentSector.startAngle = sector.endAngle;

          // TODO: optimize
          if (sector.full) sector.full = false;
          if (adjacentSector.full) adjacentSector.full = false;
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
  if (roulette.selectedSector) setSize(roulette.selectedSector);
}

export { COLLAPSED, FULL };
