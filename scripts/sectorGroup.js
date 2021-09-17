import { data, roulette } from './roulette.js';
import { Handle } from './handle.js';

class SectorGroup {
  constructor(rootSector) {
    this.root = rootSector;
    this.sectors = [rootSector];
  }

  contains(sector) {
    return this.sectors.includes(sector);
  }

  fit(sectorWheel, sector) {
    let angleRange;
    if (sector.wheel.level === 0) angleRange = 2 * Math.PI;
    else angleRange = this.root.arcAngle;

    const sectors = sectorWheel.sectors;

    // insert new sector next to selected sector (clockwise)
    const index = sectors.indexOf(sector);
    const newSector = sector.copy();
    sectors.splice(index, 0, newSector);

    const handles = roulette.handles;
    handles.splice(index, 0, new Handle(newSector, sector, 10));

    // fit sectors into angleRange
    let currAngle = sectors[0].startAngle;
    for (const sector of sectors) {
      const ratio = sector.ratio;
      const arcAngle = (angleRange / sectors.length) * ratio;

      sector.startAngle = currAngle;
      sector.endAngle = currAngle + arcAngle;
      sector.calculateProbability();

      currAngle = sector.endAngle;
    }

    // update roulette sectors if not innermost wheel
    if (sector.wheel.level !== 0) {
      const rouletteSectors = sector.wheel.sectors;
      rouletteSectors.splice(
        sectorWheel.lowerIndex,
        sectorWheel.count,
        sectors
      );
    }

    // update handles
    for (const handle of roulette.handles) {
      handle.updatePosition();
    }

    // re-render and update data
    roulette.update();
    data.update();
  }

  // get sectorGroup whose root is the sector one level below input sector
  getSectorGroup(sector) {}

  getSectorWheel(sector) {
    const sectorWheel = {};
    sectorWheel.sectors = [];
    const sectors = sector.wheel.sectors;
    const startAngle = this.root.startAngle;
    const endAngle = this.root.endAngle;

    // case when sector is part of innermost wheel
    if (sector.wheel.level === 0) {
      sectorWheel.sectors = sector.wheel.sectors;
      sectorWheel.lowerIndex = 0;
      sectorWheel.upperIndex = sector.wheel.sectors.length - 1;
      return sectorWheel;
    }

    for (let i = 0; i < sectors.length; i++) {
      const sector = sectors[i];
      if (startAngle <= sector.startAngle && sector.endAngle <= endAngle) {
        sectorWheel.sectors.push(sector);
        if (!sectorWheel.sectors.includes(sectors[i - 1]))
          sectorWheel.lowerIndex = i;
        if (i === sectors.length - 1) sectorWheel.upperIndex = i;
      } else if (sectorWheel.sectors.includes(sectors[i - 1])) {
        sectorWheel.upperIndex = i - 1;
        break;
      }
    }
    sectorWheel.count = sectorWheel.upperIndex - sectorWheel.lowerIndex;

    return sectorWheel;
  }

  insert(sector) {
    const sectorWheel = this.getSectorWheel(sector);

    // fit new sector to sectorWheel
    this.fit(sectorWheel, sector);
    console.log(roulette);
  }

  push(sector) {
    // only add if not a duplicate
    if (!this.contains(sector)) {
      this.sectors.push(sector);
      // set sectorGroup reference
      sector.sectorGroup = this;
    }
  }

  remove(sector) {
    const sectorWheel = this.getSectorWheel(sector);

    // unfit sector from sectorWheel
    this.unfit(sectorWheel, sector);
    console.log(roulette);
  }

  unfit(sectorWheel, sector) {
    let angleRange;
    if (sector.wheel.level === 0) angleRange = 2 * Math.PI;
    else angleRange = this.root.arcAngle;

    const sectors = sectorWheel.sectors;

    // remove sector
    const index = sectors.indexOf(sector);
    sectors.splice(index, 1);

    const handles = roulette.handles;
    handles.splice(index, 1);

    // fit sectors into angleRange
    let currAngle = sectors[0].startAngle;
    for (const sector of sectors) {
      const ratio = sector.ratio;
      const arcAngle = (angleRange / sectors.length) * ratio;

      sector.startAngle = currAngle;
      sector.endAngle = currAngle + arcAngle;
      sector.calculateProbability();

      currAngle = sector.endAngle;
    }

    // update roulette sectors if not innermost wheel
    if (sector.wheel.level !== 0) {
      const rouletteSectors = sector.wheel.sectors;
      rouletteSectors.splice(
        sectorWheel.lowerIndex,
        sectorWheel.count,
        sectors
      );
    }

    // update handles
    for (const handle of roulette.handles) {
      handle.updatePosition();
    }

    // re-render and update data
    roulette.update();
    data.update();
  }
}

export { SectorGroup };
