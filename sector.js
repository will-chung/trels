import { Handle, clear } from './handle.js'
import { getRadians } from './math.js'

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const selectColor = 'green';

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
        c.beginPath();
        c.strokeStyle = 'black';
        c.fillStyle = this.color;

        // if sector spans 0 radians
        if (this.endAngle < this.startAngle) {
            c.arc(this.wheel.x, this.wheel.y, this.innerRadius, this.startAngle, 0, false);
            c.arc(this.wheel.x, this.wheel.y, this.innerRadius, 0, this.endAngle, false);
            c.lineTo(this.outerRadius * Math.cos(this.endAngle), this.outerRadius * Math.sin(this.endAngle));
            c.arc(this.wheel.x, this.wheel.y, this.outerRadius, this.endAngle, 0, true);
            c.arc(this.wheel.x, this.wheel.y, this.outerRadius, 0, this.startAngle, true);
            c.lineTo(this.innerRadius * Math.cos(this.startAngle), this.innerRadius * Math.sin(this.startAngle));
        } else {
            c.arc(this.wheel.x, this.wheel.y, this.innerRadius, this.startAngle, this.endAngle, false);
            c.lineTo(this.outerRadius * Math.cos(this.endAngle), this.outerRadius * Math.sin(this.endAngle));    
            c.arc(this.wheel.x, this.wheel.y, this.outerRadius, this.endAngle, this.startAngle, true);  
            c.lineTo(this.innerRadius * Math.cos(this.startAngle), this.innerRadius * Math.sin(this.startAngle));  
        }
        
        c.stroke();
        c.fill();
        c.closePath();

        this.label();
    }

    label() {
        let midAngle;
        if (this.endAngle < this.startAngle) {
            let startOffset = 2*Math.PI - this.startAngle;
            let endOffset = this.endAngle;
            if (startOffset >= endOffset) {
                let endAngle = this.endAngle + 2*Math.PI;
                midAngle = Math.abs(this.startAngle - ((this.startAngle + endAngle) / 2));
            } else {
                let startAngle = this.startAngle - 2*Math.PI;
                midAngle = Math.abs(this.endAngle - ((startAngle + this.endAngle) / 2));
            }
        } else {
            midAngle = Math.abs(this.endAngle - ((this.startAngle + this.endAngle) / 2));
        }
        let midRadius = (this.innerRadius + this.outerRadius) / 2;
        
        let offset = c.measureText(this.value).width;

        c.save();
        c.rotate(this.startAngle - (1/2)*Math.PI);
        c.rotate(midAngle);
        c.translate(-offset, midRadius);
        c.transform(1, 0, 0, -1, 0, 0);

        c.beginPath();
        c.fillStyle = 'blue';
        c.font = 'bold 32px sans-serif';
        c.fillText(this.value, 0, 0, 20); // TODO: fix magic number
        c.closePath();
        
        c.restore();
    }

    contains(x,y) {
        let xOffset = (canvas.width/2) + this.wheel.x;
        let yOffset = (canvas.height/2) - this.wheel.y; 
        // absolute coordinates of wheel center
        let wheelCenter = {
            x: canvas.x + xOffset,
            y: canvas.y + yOffset,
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
            
            if (this.endAngle < this.startAngle) {
                if (theta >= this.startAngle) {
                    return (theta >= this.endAngle);
                } else {
                    return (theta <= this.endAngle);
                }
            } else {
                return (this.startAngle <= theta && theta <= this.endAngle);
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

export { Sector, Handle, clear };