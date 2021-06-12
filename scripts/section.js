const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

class Section {
    constructor(value, startAngle, endAngle, innerRadius, outerRadius, color, sector) {
        this.value = value;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.color = color;
        this.sector = sector;
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
            const wheel = this.sector.wheel;
            // if sector spans 0 radians
            if (endAngle < startAngle) {
                c.arc(wheel.x, wheel.y, this.innerRadius, startAngle, 0, false);
                c.arc(wheel.x, wheel.y, this.innerRadius, 0, endAngle, false);
                c.lineTo(this.outerRadius * Math.cos(endAngle), this.outerRadius * Math.sin(endAngle));
                c.arc(wheel.x, wheel.y, this.outerRadius, endAngle, 0, true);
                c.arc(wheel.x, wheel.y, this.outerRadius, 0, startAngle, true);
                c.lineTo(this.innerRadius * Math.cos(startAngle), this.innerRadius * Math.sin(startAngle));
            } else {
                c.arc(wheel.x, wheel.y, this.innerRadius, startAngle, endAngle, false);
                c.lineTo(this.outerRadius * Math.cos(endAngle), this.outerRadius * Math.sin(endAngle));    
                c.arc(wheel.x, wheel.y, this.outerRadius, endAngle, startAngle, true);  
                c.lineTo(this.innerRadius * Math.cos(startAngle), this.innerRadius * Math.sin(startAngle));  
            }
            
            c.stroke();
            c.fill();
            c.closePath();
        }

        this.label();
    }

    label() {
        // to align wheel with vertical
        let startAngle = this.startAngle + (1/2)*Math.PI;
        let endAngle = this.endAngle + (1/2)*Math.PI;

        // ensure 0 <= angle <= 2*Math.PI
        if (startAngle < 0) startAngle += 2*Math.PI;
        if (startAngle > 2*Math.PI) startAngle %= 2*Math.PI;
        if (endAngle < 0) endAngle += 2*Math.PI;
        if (endAngle > 2*Math.PI) endAngle %= (2*Math.PI);
        
        let midAngle;
        this.calculateArcAngle();
        midAngle = this.startAngle + (this.arcAngle / 2);
        let midRadius = (this.innerRadius + this.outerRadius) / 2;
        
        c.font = 'bold 32px sans-serif';
        let offset = c.measureText(this.value).width / 2;
        
        c.save();
        c.rotate(midAngle);
        c.translate(-offset, midRadius);
        c.transform(1, 0, 0, -1, 0, 0);

        c.beginPath();
        c.fillStyle = 'black';
        c.fillText(this.value, 0, 0, 20); // TODO: fix magic numbers
        c.closePath();
        
        c.restore();
    }

    contains(x,y) {
        let startAngle = this.startAngle + (1/2)*Math.PI;
        let endAngle = this.endAngle + (1/2)*Math.PI;

        // ensure 0 <= angle <= 2*Math.PI
        if (startAngle < 0) startAngle += 2*Math.PI;
        if (startAngle > 2*Math.PI) startAngle %= 2*Math.PI;
        if (endAngle < 0) endAngle += 2*Math.PI;
        if (endAngle > 2*Math.PI) endAngle %= (2*Math.PI);
        
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
    }

    deselect() {
        clear();
        this.color = this.defaultColor;
        this.wheel.draw()
    }

    adjustAngles() {
        // ensure 0 <= angle <= 2*Math.PI
        if (this.startAngle < 0) this.startAngle += 2*Math.PI;
        if (this.startAngle > 2*Math.PI) this.startAngle %= 2*Math.PI;
        if (this.endAngle < 0) this.endAngle += 2*Math.PI;
        if (this.endAngle > 2*Math.PI) this.endAngle %= (2*Math.PI);
    }  
    
    calculateArcAngle() {
        let arcAngle;

        // if sector spans 0 degrees
        if (this.endAngle < this.startAngle) {
            arcAngle = this.endAngle + (2*Math.PI) - this.startAngle;
        } else {
            arcAngle = Math.abs(this.endAngle - this.startAngle);
        }

        this.arcAngle = arcAngle;
    }

    calculateProbability() {
        this.calculateArcAngle();
        this.probability = this.arcAngle / (2*Math.PI);
    }

    update() {
        this.adjustAngles();
        this.calculateProbability();
        this.draw();
        this.label();
    }
}

export { Section };