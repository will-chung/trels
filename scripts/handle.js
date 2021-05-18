let canvas = document.querySelector('canvas');
let c = canvas.getContext('2d');

class Handle {
    constructor(sector, adjacentSector, radius) {
        this.sector = sector;
        this.adjacentSector = adjacentSector;
        this.x = sector.wheel.radius * Math.cos(sector.endAngle);
        this.y = sector.wheel.radius * Math.sin(sector.endAngle);
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

    // TODO: fix
    contains(x,y) {
        let handleCoordinates = {
            x: canvas.x + this.x,
            y: canvas.y + this.y,
        };
        let distance = Math.sqrt(Math.pow(x - handleCoordinates.x,2) + Math.pow(y - handleCoordinates.y,2));
        
        return distance <= this.radius;
    }

    update() {
        let radius = this.sector.wheel.radius;
        this.x = this.sector.wheel.x + radius * Math.cos(this.sector.endAngle);
        this.y = this.sector.wheel.y + radius * Math.sin(this.sector.endAngle);

        this.draw();
    }
}

function clear() {
    c.clearRect(0, 0, canvas.width, canvas.height);
}

export { Handle };