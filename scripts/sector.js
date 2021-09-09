import { getRadians } from './math.js';
import { clear } from './roulette.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// color of sector when selected
const selectColor = 'white';

const HEIGHT = 12.5; // px

class Sector {
  constructor(value, startAngle, endAngle, color, wheel) {
    this.value = value;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.color = color;
    this.defaultColor = color;
    this.wheel = wheel;
    this.arcAngle = Math.abs(endAngle - startAngle);
    this.probability = this.arcAngle / (2 * Math.PI);
    this.ratio;
    this.sectorGroup = null;
  }

  calculateRatio() {
    const sectors = this.sectorGroup.getSectorWheel(this);
    const startAngle = sectors[0].startAngle;
    const endAngle = sectors[sectors.length - 1].endAngle;
    const arcAngle = endAngle - startAngle;

    this.ratio = this.arcAngle / (arcAngle / sectors.length);
  }

  copy() {
    const copySector = new Sector(
      this.value,
      this.startAngle,
      this.endAngle,
      this.defaultColor,
      this.wheel
    );
    copySector.ratio = this.ratio;
    copySector.sectorGroup = this.sectorGroup;

    return copySector;
  }

  fit(sectors) {
    const arcAngle = this.arcAngle / sectors.length;

    for (let i = 0; i < sectors.length; i++) {
      const sector = sectors[i];
      const startAngle = arcAngle * i + this.startAngle;
      const endAngle = arcAngle * (i + 1) + this.startAngle;

      sector.startAngle = startAngle;
      sector.endAngle = endAngle;
      sector.calculateProbability();
    }
  }

  draw() {
    const roulette = this.wheel.roulette;

    const innerRadius = this.wheel.innerRadius;
    const outerRadius = this.wheel.outerRadius;

    let label = true;

    // vertical offset
    let startAngle = this.startAngle + (1 / 2) * Math.PI;
    let endAngle = this.endAngle + (1 / 2) * Math.PI;

    // ensure 0 <= angle <= 2*Math.PI
    if (startAngle < 0) startAngle += 2 * Math.PI;
    if (startAngle > 2 * Math.PI) startAngle %= 2 * Math.PI;
    if (endAngle < 0) endAngle += 2 * Math.PI;
    if (endAngle > 2 * Math.PI) endAngle %= 2 * Math.PI;

    c.beginPath();
    c.strokeStyle = 'black';
    c.fillStyle = this.color;
    c.lineWidth = 2;

    // if sector is fully collapsed
    if (this.arcAngle == 0) {
      label = false;
    } else if (this.arcAngle == 2 * Math.PI) {
      let innerCoords = {
        x: innerRadius * Math.cos(endAngle),
        y: innerRadius * Math.sin(endAngle),
      };
      let outerCoords = {
        x: outerRadius * Math.cos(endAngle),
        y: outerRadius * Math.sin(endAngle),
      };
      c.lineWidth = 2;
      c.moveTo(innerCoords.x, innerCoords.y);
      c.lineTo(outerCoords.x, outerCoords.y);

      c.arc(
        roulette.x,
        roulette.y,
        roulette.radius,
        endAngle,
        endAngle + 2 * Math.PI,
        false
      );
    } else {
      // if sector spans 0 radians
      if (endAngle < startAngle) {
        // edge case
        if (startAngle == 2 * Math.PI) startAngle = 0;

        c.arc(roulette.x, roulette.y, innerRadius, startAngle, 0, false);
        c.arc(roulette.x, roulette.y, innerRadius, 0, endAngle, false);
        c.lineTo(
          outerRadius * Math.cos(endAngle),
          outerRadius * Math.sin(endAngle)
        );
        c.arc(roulette.x, roulette.y, outerRadius, endAngle, 0, true);
        c.arc(roulette.x, roulette.y, outerRadius, 0, startAngle, true);
        c.lineTo(
          innerRadius * Math.cos(startAngle),
          innerRadius * Math.sin(startAngle)
        );
      } else {
        c.arc(roulette.x, roulette.y, innerRadius, startAngle, endAngle, false);
        c.lineTo(
          outerRadius * Math.cos(endAngle),
          outerRadius * Math.sin(endAngle)
        );
        c.arc(roulette.x, roulette.y, outerRadius, endAngle, startAngle, true);
        c.lineTo(
          innerRadius * Math.cos(startAngle),
          innerRadius * Math.sin(startAngle)
        );
      }
    }

    c.fill();
    c.stroke();
    c.closePath();

    if (label) this.label();
  }

  label() {
    // vertical offset
    let startAngle = this.startAngle + (1 / 2) * Math.PI;
    let endAngle = this.endAngle + (1 / 2) * Math.PI;

    // ensure 0 <= angle <= 2*Math.PI
    if (startAngle < 0) startAngle += 2 * Math.PI;
    if (startAngle > 2 * Math.PI) startAngle %= 2 * Math.PI;
    if (endAngle < 0) endAngle += 2 * Math.PI;
    if (endAngle > 2 * Math.PI) endAngle %= 2 * Math.PI;

    const wheel = this.wheel;
    let midAngle = this.startAngle + this.arcAngle / 2;
    let midRadius = (wheel.innerRadius + wheel.outerRadius) / 2;

    c.font = 'bold 32px sans-serif';
    let offset = c.measureText(this.value).width / 2;

    c.save();
    c.rotate(midAngle);
    c.translate(-offset, midRadius - HEIGHT);
    c.transform(1, 0, 0, -1, 0, 0);

    c.beginPath();
    c.fillStyle = 'black';
    c.fillText(this.value, 0, 0); // TODO: fix magic numbers
    c.closePath();

    c.restore();
  }

  contains(x, y) {
    const roulette = this.wheel.roulette;
    const wheel = this.wheel;

    let startAngle = this.startAngle + (1 / 2) * Math.PI;
    let endAngle = this.endAngle + (1 / 2) * Math.PI;

    // ensure 0 <= angle <= 2*Math.PI
    if (startAngle < 0) startAngle += 2 * Math.PI;
    if (startAngle > 2 * Math.PI) startAngle %= 2 * Math.PI;
    if (endAngle < 0) endAngle += 2 * Math.PI;
    if (endAngle > 2 * Math.PI) endAngle %= 2 * Math.PI;

    // absolute coordinates of wheel center
    let rouletteCenter = {
      x: roulette.absX,
      y: roulette.absY,
    };

    let distance = Math.sqrt(
      Math.pow(x - rouletteCenter.x, 2) + Math.pow(y - rouletteCenter.y, 2)
    );
    if (wheel.innerRadius <= distance && distance <= wheel.outerRadius) {
      let adjacent = x - rouletteCenter.x;
      let theta = Math.acos(adjacent / distance);

      if (y > rouletteCenter.y) {
        theta = 2 * Math.PI - theta;
      }
      // align with current wheel angle
      theta -= getRadians(c.getTransform());
      if (theta < 0) {
        theta += 2 * Math.PI;
      }

      if (endAngle < startAngle) {
        if (theta >= startAngle) {
          return theta >= endAngle;
        } else {
          return theta <= endAngle;
        }
      } else {
        return startAngle <= theta && theta <= endAngle;
      }
    }
    return false;
  }

  select() {
    clear();
    this.color = selectColor;
    this.wheel.roulette.update();
  }

  deselect() {
    clear();
    this.color = this.defaultColor;
    this.wheel.roulette.update();
  }

  adjustAngles() {
    // ensure 0 <= angle <= 2*Math.PI
    if (this.startAngle < 0) this.startAngle += 2 * Math.PI;
    if (this.startAngle > 2 * Math.PI) this.startAngle %= 2 * Math.PI;
    if (this.endAngle < 0) this.endAngle += 2 * Math.PI;
    if (this.endAngle > 2 * Math.PI) this.endAngle %= 2 * Math.PI;
  }

  calculateArcAngle() {
    let arcAngle;

    // if sector spans 0 degrees
    if (this.endAngle < this.startAngle)
      arcAngle = this.endAngle + 2 * Math.PI - this.startAngle;
    else arcAngle = Math.abs(this.endAngle - this.startAngle);

    this.arcAngle = arcAngle;
  }

  calculateProbability() {
    this.calculateArcAngle();
    this.probability = this.arcAngle / (2 * Math.PI);
  }

  update() {
    this.draw();
  }
}

export { Sector };
