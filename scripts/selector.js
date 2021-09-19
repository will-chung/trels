import { setSize, setValue } from './region.js';
import { roulette } from './roulette.js';

addEventListener('mousedown', event => {
  const start = [event.x, event.y];

  const mouseUpHandler = upEvent => {
    const end = [upEvent.x, upEvent.y];
    roulette.wheels.forEach(wheel => {
      wheel.sectors.forEach(sector => {
        // only select if mouse click is stationary
        if (
          sector.contains(upEvent.x, upEvent.y) &&
          start[0] === end[0] &&
          start[1] === end[1]
        ) {
          roulette.reset();
          roulette.select(sector);
          setValue(sector.value);
          setSize(sector);
        }
      });
    });

    removeEventListener('mouseup', mouseUpHandler);
  };

  addEventListener('mouseup', mouseUpHandler);
});

/*
 * Double click to deselect sectors
 **/
// addEventListener('dblclick', event => {
//   let contains = false;

//   for (const wheel of roulette.wheels) {
//     for (const sector of wheel.sectors) {
//       if (sector.contains(event.x, event.y)) contains = true;
//     }
//   }

//   if (!contains) roulette.reset();
// });
