import { data, roulette } from './roulette.js';
import { Handle } from './handle.js';

class SectorGroup {
  constructor(rootSector) {
    this.root = rootSector;
    this.sectors = [rootSector];
  }

  contains(sector) {
    return this.sectors.contains(sector);
  }

  fit(sectors, sector) {
    let angleRange;
    if (sector.wheel.level === 0) angleRange = 2 * Math.PI;
    else angleRange = this.root.arcAngle;

    // insert new sector next to selected sector (counterclockwise)
    const index = sectors.indexOf(sector);
    const newSector = sector.copy();
    sectors.splice(index, 0, newSector);

    const handles = roulette.handles;
    handles.splice(index, 0, new Handle(newSector, sector, 10));

    // fit sectors into angleRange
    let currAngle = sector.startAngle;
    for (const sector of sectors) {
      const ratio = sector.ratio;
      const arcAngle = (angleRange / sectors.length) * ratio;

      sector.startAngle = currAngle;
      sector.endAngle = currAngle + arcAngle;
      sector.calculateProbability();

      currAngle = sector.endAngle;
    }

    // re-render and update data
    roulette.update();
    data.update();
  }

  getSectorWheel(sector) {
    const sectorWheel = [];
    const sectors = sector.wheel.sectors;
    const startAngle = this.root.startAngle;
    const endAngle = this.root.endAngle;

    for (const sector of sectors) {
      if (startAngle <= sector.startAngle && sector.endAngle <= endAngle)
        sectorWheel.push(sector);
    }

    return sectorWheel;
  }

  insert(sector) {
    const level = sector.wheel.level;
    let sectors;

    if (level === 0) sectors = sector.wheel.sectors;
    else sectors = this.getSectorWheel(sector);

    // fit new sector to sectorGroup
    this.fit(sectors, sector);
  }

  push(sector) {
    // only add if not a duplicate
    if (!this.contains(sector)) {
      this.sectors.push(sector);
      // set sectorGroup reference
      sector.sectorGroup = this;
    }
  }
}

export { SectorGroup };
