import { chordLength, getRadians } from './math.js';
import { clear, data } from './roulette.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const ARC_ANGLE_PRECISION = 0.001;
const LABEL_PADDING = 5;

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
    this.conditionalProb;
    this.ratio;
    this.sectorGroup = null;

    this.spans = false;
    this.spanning = false;
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
    if (this.spanning) arcAngle = this.endAngle + 2 * Math.PI - this.startAngle;
    else arcAngle = Math.abs(this.endAngle - this.startAngle);

    // edge case to account for precision
    if (Math.abs(arcAngle - 2 * Math.PI) < ARC_ANGLE_PRECISION)
      arcAngle = 2 * Math.PI;

    this.arcAngle = arcAngle;
  }

  calculateConditionalProb() {
    const sectorGroup = this.sectorGroup;
    const precedingGroup = sectorGroup.getPrecedingGroup(this);

    let arcAngle;
    if (!precedingGroup) arcAngle = 2 * Math.PI;
    else arcAngle = precedingGroup.root.arcAngle;

    this.conditionalProb = this.arcAngle / arcAngle;
  }

  calculateProbability() {
    this.setSpanning();
    this.calculateArcAngle();
    // edge case to account for precision
    if (this.arcAngle === 2 * Math.PI) this.probability = 1;
    else this.probability = this.arcAngle / (2 * Math.PI);
  }

  calculateRatio() {
    const precedingGroup = this.sectorGroup.getPrecedingGroup(this);

    let sectors;
    if (!precedingGroup) sectors = this.wheel.sectors;
    else sectors = precedingGroup.getSectorWheel(this).sectors;

    let arcAngle;
    if (!precedingGroup) arcAngle = 2 * Math.PI;
    else arcAngle = precedingGroup.root.arcAngle;

    const base = arcAngle / sectors.length;

    this.ratio = this.arcAngle / base;
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

  deselect() {
    clear();
    this.color = this.defaultColor;
    this.wheel.roulette.update();
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

  label() {
    // TODO: dynamic resizing when adding wheels
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

    // length of chord that goes parallel through label
    const maxWidth = chordLength(wheel.outerRadius, midRadius - HEIGHT);

    let fontSize = 32;
    while (c.measureText(this.value).width >= maxWidth - LABEL_PADDING) {
      fontSize--;
      c.font = `bold ${fontSize}px sans-serif`;
      offset = c.measureText(this.value).width / 2;
    }

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

  select() {
    clear();
    this.color = selectColor;
    this.wheel.roulette.update();
  }

  setConditionalProbability(probability) {
    this.conditionalProb = probability;

    const sectorGroup = this.sectorGroup;
    const precedingGroup = sectorGroup.getPrecedingGroup(this);

    let angleRange;
    if (!precedingGroup) angleRange = 2 * Math.PI;
    else angleRange = precedingGroup.root.arcAngle;

    const newArcAngle = angleRange * probability;

    if (!precedingGroup) sectorGroup.replace(this, newArcAngle);
    else precedingGroup.replace(this, newArcAngle);
  }

  setProbability(probability) {
    this.probability = probability;

    const sectorGroup = this.sectorGroup;
    const precedingGroup = sectorGroup.getPrecedingGroup(this);

    let maxProbability;
    if (!precedingGroup) maxProbability = 1;
    else maxProbability = precedingGroup.root.probability;

    if (probability > maxProbability) {
      // TODO: error handling
    } else {
      const newArcAngle = 2 * Math.PI * probability;

      if (!precedingGroup) sectorGroup.replace(this, newArcAngle);
      else precedingGroup.replace(this, newArcAngle);
    }
  }

  setRatio(ratio) {
    this.ratio = ratio;

    const sectorGroup = this.sectorGroup;
    const precedingGroup = sectorGroup.getPrecedingGroup(this);

    let sectors, arcAngle;
    if (!precedingGroup) {
      sectors = this.wheel.sectors;
      arcAngle = 2 * Math.PI;
    } else {
      sectors = precedingGroup.getSectorWheel(this).sectors;
      arcAngle = precedingGroup.root.arcAngle;
    }

    let totalRatio = 0;
    for (const sector of sectors) {
      if (sector !== this) totalRatio += sector.ratio;
    }
    totalRatio += ratio;

    const base = arcAngle / totalRatio;
    const newArcAngle = base * ratio;

    if (!precedingGroup) sectorGroup.replace(this, newArcAngle);
    else precedingGroup.replace(this, newArcAngle);
  }

  setSize(size, startAngle) {
    if (startAngle !== undefined) this.startAngle = startAngle;
    this.endAngle = this.startAngle + size;
    this.calculateProbability();
  }

  setSpanning() {
    if (this.spans) {
      if (this.endAngle - this.startAngle < 0) this.spanning = true;
      else this.spanning = false;
    } else this.spanning = false;
  }

  setValue(value) {
    this.value = value;
    this.update();
    data.update();
  }

  split(angle) {}

  update() {
    this.updateStatistics();
    this.draw();
  }

  updateStatistics() {
    this.calculateProbability();
    this.calculateConditionalProb();
    this.calculateRatio();
  }
}

export { Sector };
