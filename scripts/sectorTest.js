const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

class SectorTest {
    constructor(startAngle, endAngle, innerRadius, outerRadius, wheel) {
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.arcAngle = Math.abs(endAngle - startAngle);
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.sections;
        this.wheel = wheel;
    }

    draw() {
        // to align wheel with vertical
        let startAngle = this.startAngle + (1/2)*Math.PI;
        let endAngle = this.endAngle + (1/2)*Math.PI;

        // ensure 0 <= angle <= 2*Math.PI
        if (startAngle < 0) startAngle += 2*Math.PI;
        if (startAngle > 2*Math.PI) startAngle %= 2*Math.PI;
        if (endAngle < 0) endAngle += 2*Math.PI;
        if (endAngle > 2*Math.PI) endAngle %= (2*Math.PI);
        
        c.beginPath();
        c.strokeStyle = 'black';
        c.fillStyle = this.color;

        // if sector is fully collapsed
        if (this.arcAngle == 0) {
            let innerCoords = {
                x: this.innerRadius * Math.cos(this.endAngle),
                y: this.innerRadius * Math.sin(this.endAngle),
            };
            let outerCoords = {
                x: this.outerRadius * Math.cos(this.endAngle),
                y: this.outerRadius * Math.sin(this.endAngle),
            };
            c.moveTo(innerCoords.x, innerCoords.y);
            c.lineTo(outerCoords.x, outerCoords.y);
        } else {
            this.sections.forEach(section => {
                section.update();
            });
        }
    }

    update() {
        this.draw();
    }
}

export { SectorTest };