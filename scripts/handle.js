let canvas = document.querySelector('canvas');
let c = canvas.getContext('2d');

class Handle {
    constructor(sector, adjacentSector, radius) {
        this.sector = sector;
        this.adjacentSector = adjacentSector;
        
        // offset to have roulette vertical 
        let endAngle = sector.endAngle + (1/2)*Math.PI;
        endAngle %= 2*Math.PI;
        const rouletteRadius = sector.wheel.roulette.radius;
        this.x = rouletteRadius * Math.cos(endAngle);
        this.y = rouletteRadius * Math.sin(endAngle);

        // maximum and minimum extension of sector
        this.upperBound = sector.endAngle;
        this.lowerBound = sector.startAngle;
        
        this.radius = radius;
        this.color = sector.color;
    }

    draw() {
        const angle = this.sector.endAngle;
        const radius = this.sector.wheel.roulette.radius;

        c.save();
        c.rotate(angle);

        c.beginPath();
        c.fillStyle = this.color;
    
        // if sector is fully collapsed
        if (this.sector.arcAngle == 0) {
            const adjustedAngle = angle + (1/2)*Math.PI;
            c.arc(0, radius + 2*this.radius, this.radius, 0, 2*Math.PI, false);
            this.x = (radius + 2*this.radius) * Math.cos(adjustedAngle)
            this.y = (radius + 2*this.radius) * Math.sin(adjustedAngle)
        }
        else c.arc(0, radius, this.radius, 0, 2*Math.PI, false);

        c.fill();
        c.closePath();

        c.restore();
    }

    contains(x,y) {
        const roulette = this.sector.wheel.roulette;
        const distance = this.distanceFromCenter(x,y);
        
        if (!roulette.contains(x,y)) {
            return distance <= this.radius;
        } else return false;
    }

    // distance from center of handle
    distanceFromCenter(x,y) {
        const roulette = this.sector.wheel.roulette;
        const offsetX = this.x - roulette.x;
        const offsetY = this.y - roulette.y
        const center = {
            x: roulette.absoluteX + offsetX,
            // subtract to account for canvas reflection
            y: roulette.absoluteY - offsetY,
        }
        const distance = Math.sqrt(Math.pow(x - center.x,2) + Math.pow(y - center.y,2));
        return distance;
    }

    update() {
        const endAngle = this.sector.endAngle + (1/2)*Math.PI;
        const rouletteRadius = this.sector.wheel.roulette.radius;
        this.x = rouletteRadius * Math.cos(endAngle);
        this.y = rouletteRadius * Math.sin(endAngle);

        this.draw();
    }
}

export { Handle };