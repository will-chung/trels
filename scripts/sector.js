import { getRadians } from './math.js'
import { clear } from './roulette.js'

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const selectColor = 'white';

window.addEventListener('mousedown', () => {

});

class Sector {
    constructor(value, startAngle, endAngle, innerRadius, outerRadius, color, wheel) {
        this.value = value;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.color = color;
        this.defaultColor = color;
        this.wheel = wheel;  
        this.arcAngle = Math.abs(endAngle - startAngle);
        this.offset = startAngle - wheel.radians; // offset from wheel angle
        this.probability = this.arcAngle / (2*Math.PI);
    }

    draw() {
        let startAngle = this.startAngle + (1/2)*Math.PI;
        let endAngle = startAngle + this.arcAngle;

        if (endAngle > 2*Math.PI)
            endAngle -= 2*Math.PI;

        c.beginPath();
        c.strokeStyle = 'black';
        c.fillStyle = this.color;

        // if sector spans 0 radians
        if (endAngle < startAngle) {
            c.arc(this.wheel.x, this.wheel.y, this.innerRadius, startAngle, 0, false);
            c.arc(this.wheel.x, this.wheel.y, this.innerRadius, 0, endAngle, false);
            c.lineTo(this.outerRadius * Math.cos(endAngle), this.outerRadius * Math.sin(endAngle));
            c.arc(this.wheel.x, this.wheel.y, this.outerRadius, endAngle, 0, true);
            c.arc(this.wheel.x, this.wheel.y, this.outerRadius, 0, startAngle, true);
            c.lineTo(this.innerRadius * Math.cos(startAngle), this.innerRadius * Math.sin(startAngle));
        } else {
            c.arc(this.wheel.x, this.wheel.y, this.innerRadius, startAngle, endAngle, false);
            c.lineTo(this.outerRadius * Math.cos(endAngle), this.outerRadius * Math.sin(endAngle));    
            c.arc(this.wheel.x, this.wheel.y, this.outerRadius, endAngle, startAngle, true);  
            c.lineTo(this.innerRadius * Math.cos(startAngle), this.innerRadius * Math.sin(startAngle));  
        }
        
        c.stroke();
        c.fill();
        c.closePath();

        this.label();
    }

    label() {
        let startAngle = this.startAngle + (1/2)*Math.PI;
        let endAngle = startAngle + this.arcAngle;

        if (endAngle > 2*Math.PI)
            endAngle -= 2*Math.PI;

        let midAngle;
        if (this.endAngle < startAngle) {
            let startOffset = 2*Math.PI - startAngle;
            let endOffset = endAngle;
            if (startOffset >= endOffset) {
                let endAngleOffset = endAngle + 2*Math.PI;
                midAngle = Math.abs(startAngle - ((startAngle + endAngleOffset) / 2));
            } else {
                let startAngleOffset = startAngle - 2*Math.PI;
                midAngle = Math.abs(endAngle - ((startAngleOffset + endAngle) / 2));
            }
        } else {
            midAngle = Math.abs(endAngle - ((startAngle + endAngle) / 2));
        }
        let midRadius = (this.innerRadius + this.outerRadius) / 2;
        
        let offset = c.measureText(this.value).width;

        c.save();
        c.rotate(startAngle - (1/2)*Math.PI);
        c.rotate(midAngle);
        c.translate(-offset, midRadius);
        c.transform(1, 0, 0, -1, 0, 0);

        c.beginPath();
        c.fillStyle = 'black';
        c.font = 'bold 32px sans-serif';
        c.fillText(this.value, 0, 0, 20); // TODO: fix magic number
        c.closePath();
        
        c.restore();
    }

    contains(x,y) {
        let startAngle = this.startAngle + (1/2)*Math.PI;
        let endAngle = startAngle + this.arcAngle;

        if (endAngle > 2*Math.PI)
            endAngle -= 2*Math.PI;

        // absolute coordinates of wheel center
        let wheelCenter = {
            x: this.wheel.absoluteX,
            y: this.wheel.absoluteY,
        }

        let distance = Math.sqrt(Math.pow((x - wheelCenter.x), 2) + Math.pow(y - wheelCenter.y, 2));
        if (this.innerRadius <= distance && distance <= this.outerRadius) {
            let adjacent = x - wheelCenter.x;
            let theta = Math.acos(adjacent / distance);
            
            if (y > wheelCenter.y) {
                theta = 2*Math.PI - theta;
            }
            // align with current wheel angle
            theta -= (getRadians(c.getTransform()));
            if (theta < 0) {
                theta += 2*Math.PI;
            }
            
            if (endAngle < startAngle) {
                if (theta >= startAngle) {
                    return (theta >= endAngle);
                } else {
                    return (theta <= endAngle);
                }
            } else {
                return (startAngle <= theta && theta <= endAngle);
            }
        }
        return false;
    }

    select() {
        clear();
        this.color = selectColor;
        this.wheel.draw();        
        // TODO: draw handles?
    }

    deselect() {
        clear();
        this.color = this.defaultColor;
        this.wheel.draw()
        // TODO: draw handles?
    }

    update() {
        this.startAngle = this.wheel.radians + this.offset;
        this.endAngle = this.startAngle + this.arcAngle;
        this.endAngle %= 2*Math.PI;

        this.draw();
        this.label();
    }
}

export { Sector };