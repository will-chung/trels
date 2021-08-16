let canvas = document.querySelector('canvas');
let c = canvas.getContext('2d');

class Handle {
  constructor(sector, adjacentSector, radius) {
    this.sector = sector;
    this.adjacentSector = adjacentSector;
    
    // vertical offset 
    let endAngle = sector.endAngle + (1/2)*Math.PI;
    endAngle %= 2*Math.PI;

    const rouletteRadius = sector.wheel.roulette.radius;
    this.x = rouletteRadius * Math.cos(endAngle);
    this.y = rouletteRadius * Math.sin(endAngle);

    // maximum and minimum extension of sector
    this.upperBound = this.adjacentSector.endAngle;
    this.lowerBound = this.sector.startAngle;

    // edge case when we only have 2 sectors
    if (this.lowerBound == this.upperBound) {
      this.upperBound += 2*Math.PI;
    }

    this.radius = radius;
    this.color = sector.color;
  }

  draw() {
    const angle = this.sector.endAngle;
    const radius = this.sector.wheel.roulette.radius;

    c.save();
    c.rotate(angle);

    c.beginPath();
    c.fillStyle = this.color;
  
    // if sector is fully collapsed
    if (this.sector.arcAngle == 0) {
      const adjustedAngle = angle + (1/2)*Math.PI;
      c.arc(0, radius + 2*this.radius, this.radius, 0, 2*Math.PI, false);
      this.x = (radius + 2*this.radius) * Math.cos(adjustedAngle)
      this.y = (radius + 2*this.radius) * Math.sin(adjustedAngle)
    }
    else c.arc(0, radius, this.radius, 0, 2*Math.PI, false);

    c.fill();
    c.closePath();

    c.restore();
  }

  contains(x,y) {
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
    }

    const distance = Math.sqrt(Math.pow(x - center.x, 2) +
                               Math.pow(y - center.y, 2));

    return distance;
  }

  update() {
    const endAngle = this.sector.endAngle + (1/2)*Math.PI;
    const rouletteRadius = this.sector.wheel.roulette.radius;
    this.x = rouletteRadius * Math.cos(endAngle);
    this.y = rouletteRadius * Math.sin(endAngle);

    // update bounds
    this.upperBound = this.adjacentSector.endAngle;
    this.lowerBound = this.sector.startAngle;

    // edge case when we only have 2 sectors
    if (this.lowerBound == this.upperBound) {
      // TODO: explain
      // this.sector.startAngle == this.sector.endAngle : full circle / fully collapsed 
      // this.sector.startAngle > this.sector.endAngle : moved across 0 degs
      if (this.sector.startAngle >= this.sector.endAngle)
        this.lowerBound -= 2*Math.PI;
      else 
        this.upperBound += 2*Math.PI;
    }

    this.draw();
  }
}

export { Handle };