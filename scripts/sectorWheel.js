import { roulette } from './roulette.js';

class SectorWheel {
  constructor(root, sectors) {
    this.root = root;
    this.lowerIndex;
    this.upperIndex;

    if (sectors) this.sectors = sectors;
    else this.sectors = [];
  }

  contains(sector) {
    return this.sectors.includes(sector);
  }

  fit() {
    const angleRange = this.root.arcAngle;

    let totalRatio = 0;
    for (const sector of this.sectors) {
      totalRatio += sector.ratio;
    }

    const base = angleRange / totalRatio;

    let currAngle = this.sectors[0];
    for (const sector of this.sectors) {
      let arcAngle = base * sector.ratio;

      sector.startAngle = currAngle;
      sector.endAngle = sector.startAngle + arcAngle;
      // update sector info
      sector.updateStatistics();

      currAngle = sector.endAngle;
    }
  }

  // locates the position of the sectorWheel in the roulette
  // described by lowerIndex and upperIndex
  locate() {
    const level = this.sectors[0].wheel.level;
    const beginSector = this.sectors[0];
    const endSector = this.sectors[this.sectors.length - 1];

    const sectors = roulette.wheels[level].sectors;
    for (let j = 0; j < sectors.length; j++) {
      const sector = sectors[j];
      if (sector === beginSector) this.lowerIndex = j;
      if (sector === endSector) {
        this.upperIndex = j;
        break;
      }
    }
  }

  push(...sectors) {
    this.sectors.push(...sectors);
    this.fit();
  }

  remove(location, isSector) {
    if (isSector) this.sectors.filter(sec => sec === location);
    else this.sectors.splice(location, 1);
    this.fit();
  }
}

export { SectorWheel };
