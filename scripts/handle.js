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

  setSpans() {
    const sector = this.sector;
    const adjacentSector = this.adjacentSector;

    if (
      adjacentSector.endAngle - sector.endAngle < 0 ||
      sector.endAngle - sector.startAngle < 0
    )
      sector.spans = true;
    else if (
      adjacentSector.endAngle - sector.endAngle > 0 &&
      sector.endAngle - sector.startAngle > 0
    )
      sector.spans = false;
  }

  update() {
    const endAngle = this.sector.endAngle + (1 / 2) * Math.PI;
    const rouletteRadius = this.sector.wheel.roulette.radius;

    this.setSpans();

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

    // TODO: further testing
    if (sector.spans) {
      if (sector.spanning) {
        if (trueAngle - adjacentSector.endAngle > 0) {
          boundProps.withinBounds = false;
          boundProps.boundType = FULL;
        } else boundProps.withinBounds = true;
      } else {
        if (trueAngle - sector.startAngle < 0) {
          boundProps.withinBounds = false;
          boundProps.boundType = COLLAPSED;
        } else boundProps.withinBounds = true;
      }
    } else {
      // only works if sector does not span
      if (trueAngle - sector.startAngle < 0) {
        boundProps.withinBounds = false;
        boundProps.boundType = COLLAPSED;
      } else if (trueAngle - adjacentSector.endAngle > 0) {
        boundProps.withinBounds = false;
        boundProps.boundType = FULL;
      } else boundProps.withinBounds = true;
    }

    return boundProps;
  }
}

export { Handle };
