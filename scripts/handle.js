import { PRECISION } from './roulette.js';
import { COLLAPSED, FULL } from './adjuster.js';
import { getRadians } from './math.js';

let canvas = document.querySelector('canvas');
let c = canvas.getContext('2d');

class Handle {
  constructor(sector, adjacentSector, radius) {
    this.sector = sector;
    this.adjacentSector = adjacentSector;

    // vertical offset
    let endAngle = sector.endAngle + (1 / 2) * Math.PI;
    endAngle %= 2 * Math.PI;

    const rouletteRadius = sector.wheel.roulette.radius;
    this.x = rouletteRadius * Math.cos(endAngle);
    this.y = rouletteRadius * Math.sin(endAngle);

    this.radius = radius;
    this.color = sector.color;
  }

  contains(x, y) {
    const roulette = this.sector.wheel.roulette;
    const distance = this.distanceFromCenter(x, y);

    if (!roulette.contains(x, y)) {
      return distance <= this.radius;
    } else return false;
  }

  /**
   * Calculates distance to center of handle.
   *
   * @param {Number} x X-coordinate of the input point.
   * @param {Number} y Y-coordinate of the input point.
   * @returns Distance from input point to center of handle.
   */
  distanceFromCenter(x, y) {
    const roulette = this.sector.wheel.roulette;
    // offset of handle from roulette center
    const offsetX = this.x - roulette.x;
    const offsetY = this.y - roulette.y;
    // absolute handle center calculated from absolute roulette center
    const center = {
      x: roulette.absX + offsetX,
      // subtract offset to account for reflection of the canvas
      y: roulette.absY - offsetY,
    };

    const distance = Math.sqrt(
      Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
    );

    return distance;
  }

  draw() {
    const angle = this.sector.endAngle;
    const radius = this.sector.wheel.roulette.radius;

    c.save();
    c.rotate(angle);

    c.beginPath();
    c.fillStyle = this.color;

    // if sector is fully collapsed
    if (this.sector.arcAngle !== 0)
      c.arc(0, radius, this.radius, 0, 2 * Math.PI, false);

    c.fill();
    c.closePath();

    c.restore();
  }

  setBounds(boundType) {
    const sector = this.sector;
    const adjacentSector = this.adjacentSector;

    if (boundType === COLLAPSED) {
      sector.endAngle = sector.startAngle;
      adjacentSector.startAngle = sector.startAngle;
    }

    if (boundType === FULL) {
      sector.endAngle = adjacentSector.endAngle;
      adjacentSector.startAngle = adjacentSector.endAngle;
    }

    sector.calculateProbability();
    adjacentSector.calculateProbability();
  }

  update() {
    const endAngle = this.sector.endAngle + (1 / 2) * Math.PI;
    const rouletteRadius = this.sector.wheel.roulette.radius;

    // true angle taking into account roulette rotation
    const angleOffset = getRadians(c.getTransform());
    const angle = endAngle + angleOffset;

    this.x = rouletteRadius * Math.cos(angle);
    this.y = rouletteRadius * Math.sin(angle);

    this.draw();
  }

  withinBounds(currAngle, trueAngle) {
    const boundProps = {};
    const sector = this.sector;
    const adjacentSector = this.adjacentSector;

    let newAngle = trueAngle;
    if (newAngle !== 2 * Math.PI) newAngle %= 2 * Math.PI;
    if (newAngle < 0) newAngle += 2 * Math.PI;
    boundProps.angle = newAngle;

    const difference = Math.abs(trueAngle - sector.endAngle);
    const prevArcAngle = sector.arcAngle;
    let newArcAngle;
    if (sector.spans) newArcAngle = newAngle + 2 * Math.PI - sector.startAngle;
    else newArcAngle = Math.abs(newAngle - sector.startAngle);

    if (newAngle - sector.startAngle < 0) {
      boundProps.withinBounds = false;
      boundProps.boundType = COLLAPSED;
    } else boundProps.withinBounds = true;

    // if (Math.abs(currAngle - newAngle) > PRECISION) return false;

    // if (sector.spans) {
    //   if (difference < -1) sector.spanning = true;
    //   else if (difference > 1) sector.spanning = false;
    //   adjacentSector.spanning = !sector.spanning;

    //   boundProps.withinBounds = sector.spanning
    //     ? newAngle - adjacentSector.endAngle <= 0
    //     : newAngle - sector.startAngle >= 0;

    //   if (!boundProps.withinBounds) {
    //     if (newAngle - adjacentSector.endAngle > 0) boundProps.boundType = FULL;
    //     else if (newAngle - sector.startAngle < 0)
    //       boundProps.boundType = COLLAPSED;
    //   }
    // } else if (sector.reverseSpans) {
    //   boundProps.withinBounds = sector.spanning
    //     ? trueAngle - sector.startAngle <= 0
    //     : trueAngle - adjacentSector.endAngle <= 0 &&
    //       trueAngle - sector.startAngle >= 0;

    //   if (!boundProps.withinBounds) {
    //     if (
    //       trueAngle - sector.startAngle > 0 ||
    //       trueAngle - adjacentSector.endAngle > 0
    //     )
    //       boundProps.boundType = FULL;
    //     else if (trueAngle - sector.startAngle < 0)
    //       boundProps.boundType = COLLAPSED;
    //   }
    // } else {
    //   boundProps.withinBounds =
    //     newAngle - adjacentSector.endAngle <= 0 &&
    //     newAngle - sector.startAngle >= 0;

    //   if (!boundProps.withinBounds) {
    //     if (newAngle - adjacentSector.endAngle > 0) boundProps.boundType = FULL;
    //     else if (newAngle - sector.startAngle < 0)
    //       boundProps.boundType = COLLAPSED;
    //   }
    // }

    return boundProps;
  }
}

export { Handle };
