import { animate, setAnimating, roulette, data } from './roulette.js';
import { getAngle } from './tracker.js';

window.addEventListener('mousedown', (event) => {
    let handles = roulette.handles;
    let mouseMoveHandler;
    handles.forEach(handle => {
        if (handle.contains(event.x, event.y)) {
            setAnimating(true);
            animate();

            // TODO: form sector group
            let sector = handle.sector;
            let adjacentSector = handle.adjacentSector;
            let difference;
            let prevAngle = getAngle(event.x, event.y);
            mouseMoveHandler = function(moveEvent) {
                let currAngle = getAngle(moveEvent.x, moveEvent.y);
               
                if (handle.lowerBound <= sector.endAngle && sector.endAngle <= handle.upperBound) {
                    difference = (currAngle - prevAngle);
                    // to account for crossing 0 deg
                    if (Math.abs(difference) > 1) {
                        // if crossing clockwise
                        if (currAngle > prevAngle) difference -= 2*Math.PI;

                        // else crossing counter-clockwise
                        else difference += 2*Math.PI;
                    }

                    if (sector.endAngle + difference < handle.lowerBound) {
                        sector.endAngle = handle.lowerBound;
                    } else if (sector.endAngle + difference > handle.upperBound) {
                        sector.endAngle = handle.upperBound;
                    } else {    
                        sector.endAngle += difference;
                    }
                    sector.calculateProbability();
                    
                    adjacentSector.startAngle = sector.endAngle;
                    adjacentSector.calculateProbability(); 
                    
                    // edge case where adjacentSector is full circle
                    if (adjacentSector.startAngle == adjacentSector.endAngle) {
                        adjacentSector.arcAngle = 2*Math.PI;
                        adjacentSector.probability = 1;
                    }
                } 

                prevAngle = currAngle;
            };  

            window.addEventListener('mousemove', mouseMoveHandler);

            window.addEventListener('mouseup', () => {
                setAnimating(false);
                data.update();
                window.removeEventListener('mousemove', mouseMoveHandler);
            });
        }
    });
});