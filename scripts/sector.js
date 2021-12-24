import { chordLength, getRadians } from './math.js';
import { clear, data } from './roulette.js';
import { getPrecedingGroup } from './sectorGroup.js';
import { getAngle, VERTICAL_OFFSET } from './tracker.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const ARC_ANGLE_PRECISION = 0.001;
const LABEL_PADDING = 5;

// color of sector when selected
const selectColor = 'white';

const TEXT_HEIGHT = 12.5; // px

class Sector {
  constructor(value, startAngle, endAngle, color, wheel) {
    this.value = value;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    // current color
    this.currColor = color;
    this.defaultColor = color;
    this.wheel = wheel;

    this.arcAngle = Math.abs(endAngle - startAngle);
    this.probability = this.arcAngle / (2 * Math.PI);
    this.conditionalProb;
    this.ratio;
    this.sectorGroup = null;

    this.spans = false;
    this.spanning = false;
    this.full = false;
  }

  /*
   * Ensure 0 <= angle <= 2*Math.PI
   */
  adjustAngles() {
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
    let conditionalProb;

    const sectorGroup = this.sectorGroup;
    const precedingGroup = getPrecedingGroup(this);

    let arcAngle;
    if (!precedingGroup) arcAngle = 2 * Math.PI;
    else arcAngle = precedingGroup.root.arcAngle;
    conditionalProb = this.arcAngle / arcAngle;

    this.conditionalProb = conditionalProb;
  }

  calculateProbability() {
    // update spanning status
    this.setSpanning();
    this.calculateArcAngle();

    // edge case to account for precision
    if (this.arcAngle === 2 * Math.PI) this.probability = 1;
    else this.probability = this.arcAngle / (2 * Math.PI);
  }

  calculateRatio() {
    const precedingGroup = getPrecedingGroup(this);

    let sectors;
    if (!precedingGroup) sectors = this.wheel.sectors;
    else sectors = precedingGroup.getSectorWheel(this).sectors;

    let arcAngle;
    if (!precedingGroup) arcAngle = 2 * Math.PI;
    else arcAngle = precedingGroup.root.arcAngle;

    // "base angle" representing denominator of ratio
    const base = arcAngle / sectors.length;

    this.ratio = this.arcAngle / base;
  }

  clear() {
    c.globalCompositeOperation = 'destination-out';

    const roulette = this.wheel.roulette;
    const innerRadius = this.wheel.innerRadius;
    const outerRadius = this.wheel.outerRadius;

    // account for vertical offset
    const startAngle = this.startAngle + VERTICAL_OFFSET;
    const endAngle = this.endAngle + VERTICAL_OFFSET;

    c.lineWidth = 2;
    c.beginPath();

    c.arc(roulette.x, roulette.y, innerRadius, startAngle, endAngle);
    c.arc(roulette.x, roulette.y, outerRadius, endAngle, startAngle, true);

    c.closePath();
    c.stroke();
    c.fill();

    c.globalCompositeOperation = 'source-over';
  }

  contains(x, y) {
    const roulette = this.wheel.roulette;
    const wheel = this.wheel;

    this.adjustAngles();

    // absolute coordinates of wheel center
    let rouletteCenter = {
      x: roulette.absX,
      y: roulette.absY,
    };

    let distance = Math.sqrt(
      Math.pow(x - rouletteCenter.x, 2) + Math.pow(y - rouletteCenter.y, 2)
    );

    // point is in between innerRadius and outerRadius
    if (wheel.innerRadius <= distance && distance <= wheel.outerRadius) {
      let angle = getAngle(x, y);
      let angleOffset = getRadians(c.getTransform());

      // account for canvas rotation
      if (angle < angleOffset) angle = Math.abs(angle - 2 * Math.PI);
      else if (angle >= angleOffset) angle -= angleOffset;

      return this.startAngle <= angle && angle <= this.endAngle;
    }

    return false;
  }

  /*
   * Creates a copy of the sector
   */
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
    this.currColor = this.defaultColor;
    this.wheel.roulette.draw();
  }

  // draw() {
  //   const roulette = this.wheel.roulette;

  //   const innerRadius = this.wheel.innerRadius;
  //   const outerRadius = this.wheel.outerRadius;

  //   let label = true;

  //   // vertical offset
  //   let startAngle = this.startAngle + (1 / 2) * Math.PI;
  //   let endAngle = this.endAngle + (1 / 2) * Math.PI;

  //   this.adjustAngles();

  //   c.strokeStyle = 'black';
  //   c.fillStyle = this.color;
  //   c.lineWidth = 2;
  //   c.beginPath();

  //   // if sector is fully collapsed
  //   if (this.arcAngle == 0) {
  //     label = false;
  //   } else if (this.arcAngle == 2 * Math.PI) {
  //     let innerCoords = {
  //       x: innerRadius * Math.cos(endAngle),
  //       y: innerRadius * Math.sin(endAngle),
  //     };
  //     let outerCoords = {
  //       x: outerRadius * Math.cos(endAngle),
  //       y: outerRadius * Math.sin(endAngle),
  //     };
  //     c.moveTo(innerCoords.x, innerCoords.y);
  //     c.lineTo(outerCoords.x, outerCoords.y);

  //     c.arc(
  //       roulette.x,
  //       roulette.y,
  //       roulette.radius,
  //       endAngle,
  //       endAngle + 2 * Math.PI,
  //       false
  //     );
  //   } else {
  //     // if sector spans 0 radians
  //     if (endAngle < startAngle) {
  //       // edge case
  //       if (startAngle == 2 * Math.PI) startAngle = 0;

  //       c.arc(roulette.x, roulette.y, innerRadius, startAngle, 0, false);
  //       c.arc(roulette.x, roulette.y, innerRadius, 0, endAngle, false);
  //       c.lineTo(
  //         outerRadius * Math.cos(endAngle),
  //         outerRadius * Math.sin(endAngle)
  //       );
  //       c.arc(roulette.x, roulette.y, outerRadius, endAngle, 0, true);
  //       c.arc(roulette.x, roulette.y, outerRadius, 0, startAngle, true);
  //       c.lineTo(
  //         innerRadius * Math.cos(startAngle),
  //         innerRadius * Math.sin(startAngle)
  //       );
  //     } else {
  //       c.arc(roulette.x, roulette.y, innerRadius, startAngle, endAngle, false);
  //       c.lineTo(
  //         outerRadius * Math.cos(endAngle),
  //         outerRadius * Math.sin(endAngle)
  //       );
  //       c.arc(roulette.x, roulette.y, outerRadius, endAngle, startAngle, true);
  //       c.lineTo(
  //         innerRadius * Math.cos(startAngle),
  //         innerRadius * Math.sin(startAngle)
  //       );
  //     }
  //   }

  //   c.closePath();
  //   c.fill();
  //   c.stroke();

  //   if (label) this.label();
  // }

  draw() {
    const roulette = this.wheel.roulette;
    const innerRadius = this.wheel.innerRadius;
    const outerRadius = this.wheel.outerRadius;

    // account for vertical offset
    const startAngle = this.startAngle + VERTICAL_OFFSET;
    const endAngle = this.endAngle + VERTICAL_OFFSET;

    // TODO: test if necessary
    this.adjustAngles();

    let label = this.arcAngle !== 0;

    c.fillStyle = this.currColor;
    c.lineWidth = 2;
    c.beginPath();

    if (this.arcAngle === 2 * Math.PI) {
      c.moveTo(0, 0);
      c.lineTo(
        outerRadius * Math.cos(startAngle),
        outerRadius * Math.sin(startAngle)
      );
      c.arc(
        roulette.x,
        roulette.y,
        outerRadius,
        startAngle,
        startAngle + 2 * Math.PI
      );
    } else {
      c.arc(roulette.x, roulette.y, innerRadius, startAngle, endAngle);
      c.arc(roulette.x, roulette.y, outerRadius, endAngle, startAngle, true);
    }

    c.closePath();
    c.fill();
    c.stroke();

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

    this.adjustAngles();

    const wheel = this.wheel;
    const midAngle = this.startAngle + this.arcAngle / 2;
    const midRadius = (wheel.innerRadius + wheel.outerRadius) / 2;

    c.font = 'bold 32px sans-serif';
    // offset to center label "horizontally"
    let offset = c.measureText(this.value).width / 2;

    // length of chord that goes perpendicular through label
    const maxWidth = chordLength(wheel.outerRadius, midRadius - TEXT_HEIGHT);

    // fit label inside sector
    let fontSize = 32;
    while (c.measureText(this.value).width >= maxWidth - LABEL_PADDING) {
      fontSize--;
      c.font = `bold ${fontSize}px sans-serif`;
      offset = c.measureText(this.value).width / 2;
    }

    // orient canvas along roulette radial
    c.save();

    c.rotate(midAngle);
    c.translate(-offset, midRadius - TEXT_HEIGHT);
    c.transform(1, 0, 0, -1, 0, 0);

    c.fillStyle = 'black';
    c.fillText(this.value, 0, 0);

    c.restore();
  }

  select() {
    clear();
    this.currColor = selectColor;
    this.wheel.roulette.draw();
  }

  setConditionalProbability(probability) {
    this.conditionalProb = probability;

    const sectorGroup = this.sectorGroup;
    const precedingGroup = getPrecedingGroup(this);

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
    const precedingGroup = getPrecedingGroup(this);

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
    const precedingGroup = getPrecedingGroup(this);

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

    // arc angle of "base" sector
    // i.e. if all sectors in sector wheel were congruent
    const base = arcAngle / totalRatio;
    const newArcAngle = base * ratio;

    if (!precedingGroup) sectorGroup.replace(this, newArcAngle);
    else precedingGroup.replace(this, newArcAngle);
  }

  setSize(radians, startAngle) {
    if (startAngle !== undefined) this.startAngle = startAngle;
    this.endAngle = this.startAngle + radians;
    this.calculateProbability();
  }

  setSpanning() {
    if (this.spans) {
      if (this.endAngle - this.startAngle < 0) this.spanning = true;
      else if (this.endAngle === this.startAngle && this.full)
        this.spanning = true;
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
