let canvas = document.querySelector('canvas');
let c = canvas.getContext('2d');

class Handle {
    constructor(sector, adjacentSector, radius) {
        this.sector = sector;
        this.adjacentSector = adjacentSector;
        
        // offset to have wheel vertical 
        let endAngle = sector.endAngle + (1/2)*Math.PI;
        endAngle %= 2*Math.PI;
        this.x = sector.wheel.radius * Math.cos(endAngle);
        this.y = sector.wheel.radius * Math.sin(endAngle);
        
        this.radius = radius;
        this.color = sector.color;
    }

    draw() {

        let angle = this.sector.endAngle;
        c.save();
        c.rotate(angle);

        c.beginPath();
        c.fillStyle = this.color;
        c.arc(0, this.sector.wheel.radius, this.radius, 0, 2*Math.PI, false);
        c.fill();
        c.closePath();

        c.restore();
    }

    contains(x,y) {
        const wheel = this.sector.wheel;
        const distance = this.distanceFromCenter(x,y);

        if (!wheel.contains(x,y)) {
            return distance <= this.radius;
        } else return false;
    }

    distanceFromCenter(x,y) {
        const wheel = this.sector.wheel;
        const offsetX = this.x - wheel.x;
        const offsetY = this.y - wheel.y
        const center = {
            x: wheel.absoluteX + offsetX,
            y: wheel.absoluteY - offsetY, // subtract to account for canvas reflection
        }
        const distance = Math.sqrt(Math.pow(x - center.x,2) + Math.pow(y - center.y,2));
        return distance;
    }

    update() {
        const endAngle = this.sector.endAngle + (1/2)*Math.PI;
        let radius = this.sector.wheel.radius;
        this.x = radius * Math.cos(endAngle);
        this.y = radius * Math.sin(endAngle);

        this.draw();
    }
}

function clear() {
    c.clearRect(0, 0, canvas.width, canvas.height);
}

export { Handle };