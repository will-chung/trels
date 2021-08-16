import { roulette, data, clear } from './roulette.js';
import { getAngle } from './tracker.js';

addEventListener('mousedown', event => {
  const handles = roulette.handles;
  let mouseMoveHandler;

  handles.forEach((handle, index) => {
    if (handle.contains(event.x, event.y)) {

      // TODO: form sector group
      const sector = handle.sector;
      const adjacentSector = handle.adjacentSector;
      let difference;
      let prevAngle = getAngle(event.x, event.y);

      mouseMoveHandler = moveEvent => {
        let currAngle = getAngle(moveEvent.x, moveEvent.y);
        console.log(handle.lowerBound, sector.endAngle, handle.upperBound, 
                    handle.lowerBound <= sector.endAngle && sector.endAngle <= handle.upperBound)
        
        // use sector.endAngle rather than currAngle
        // because of vertical offset
        if (handle.lowerBound <= sector.endAngle && 
            sector.endAngle <= handle.upperBound) {
          // sector.wheel.roulette.handles.forEach(handle => {
          //   console.log(sector, adjacentSector, `value: ${handle.sector.value}`) 
          //   console.log(handle.lowerBound, handle.upperBound)
          // });
          difference = (currAngle - prevAngle);

          // to account for crossing 0 deg
          if (Math.abs(difference) > 1) {
            // if crossing counter-clockwise
            if (currAngle > prevAngle) difference -= 2*Math.PI;
            // else crossing clockwise
            else difference += 2*Math.PI;
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
              adjacentSector.arcAngle = 2*Math.PI;
              adjacentSector.probability = 1;
            } else {
              sector.arcAngle = 2*Math.PI;
              sector.probability = 1;
              adjacentSector.arcAngle = 0;
              adjacentSector.probablity = 0;
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

      addEventListener('mouseup', () => {
        removeEventListener('mousemove', mouseMoveHandler);
      });
    }
  });
});

function update() {
  clear();
  roulette.draw();
  data.update();
}