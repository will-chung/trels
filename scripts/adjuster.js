import { animate, setAnimating, wheel } from './roulette.js';
import { getAngle } from './tracker.js';

window.addEventListener('mousedown', (event) => {
    let handles = wheel.handles;
    let mouseMoveHandler;
    handles.forEach(handle => {
        if (handle.contains(event.x, event.y)) {
            setAnimating(true);
            animate();

            let sector = handle.sector;
            let adjacentSector = handle.adjacentSector;
            let difference;
            let prevAngle = getAngle(event.x, event.y);
            mouseMoveHandler = function(moveEvent) {
                let currAngle = getAngle(moveEvent.x, moveEvent.y);
                
                if (0 < sector.arcAngle && sector.arcAngle < 2*Math.PI) {
                    difference = (currAngle - prevAngle);
                    // to account for crossing 0 deg
                    if (Math.abs(difference) > 1) {
                        // if crossing clockwise
                        if (currAngle > prevAngle) difference -= 2*Math.PI;
                        // else crossing counter-clockwise
                        else difference += 2*Math.PI;
                    }

                    sector.endAngle += difference;
                    adjacentSector.startAngle += difference
                    if (sector.arcAngle + difference < 0) sector.arcAngle = 0;
                    else if (sector.arcAngle + difference > 2*Math.PI) sector.arcAngle = 2*Math.PI;
                    else sector.arcAngle += difference;
                    adjacentSector.arcAngle -= difference;
                } 

                prevAngle = currAngle;
            };  
        }

        window.addEventListener('mousemove', mouseMoveHandler);

        window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', mouseMoveHandler)
        });
    });
});