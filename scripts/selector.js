import { roulette } from './roulette.js';

addEventListener('mousedown', event => {
  let selected = false;
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
          roulette.select(sector);
          selected = true;
        } else roulette.deselect(sector);
      });
    });

    removeEventListener('mouseup', mouseUpHandler);
  };

  addEventListener('mouseup', mouseUpHandler);

  if (!selected) roulette.reset();
});
