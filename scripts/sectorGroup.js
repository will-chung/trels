import { data, roulette } from './roulette.js';
import { Sector } from './sector.js';
import { Handle } from './handle.js';

class SectorGroup {
  constructor(rootSector) {
    this.root = rootSector;
    this.sectors = [rootSector];
  }

  contains(sector) {
    return this.sectors.includes(sector);
  }

  extract() {
    const level = this.root.wheel.level + 1;
    const startAngle = this.root.startAngle;
    const endAngle = this.root.endAngle;

    // extract sectors belonging to sectorGroup
    for (let i = level; i < roulette.wheels.length; i++) {
      const sectors = roulette.wheels[i].sectors;
      for (const sector of sectors) {
        if (startAngle <= sector.startAngle && sector.endAngle <= endAngle) {
          this.push(sector);
        }
      }
    }
  }

  fill() {
    let currLevel = this.root.wheel.level + 1;
    let currSectors = this.getSectorWheel(currLevel);

    while (currLevel < roulette.wheels.length) {
      this.fit(currSectors);
      // increment currLevel & get next sectorWheel
      currSectors = this.getSectorWheel(++currLevel);
    }
  }

  fit(sectorWheel, sector) {
    // if sector is not passed in original sectorWheel is fit to root sector
    let angleRange;
    if (sector.wheel.level === 0) angleRange = 2 * Math.PI;
    else angleRange = this.root.arcAngle;

    const sectors = sectorWheel.sectors;

    if (sector) {
      // insert new sector next to selected sector (clockwise)
      const index = sectors.indexOf(sector);
      const newSector = sector.copy();
      sectors.splice(index, 0, newSector);

      const handles = roulette.handles;
      handles.splice(index, 0, new Handle(newSector, sector, 10));
    }

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

    if (sector) {
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
    }

    // re-render and update data
    roulette.update();
    data.update();
  }

  // necessary?
  getLevel(level) {
    const sectors = [];

    for (const sector of this.sectors) {
      if (sector.wheel.level === level) sectors.push(sector);
    }

    return sectors;
  }

  // get sectorGroup whose root is the sector one level below input sector
  getPrecedingGroup(sector) {
    const level = sector.wheel.level;
    // if at innermost level
    if (level === 0) return null;

    let sectorGroup;

    for (const sec of this.sectors) {
      if (
        sec.wheel.level === level - 1 &&
        sec.startAngle <= sector.startAngle &&
        sector.endAngle <= sec.endAngle
      ) {
        sectorGroup = new SectorGroup(sec);
        sectorGroup.extract();
      }
    }

    return sectorGroup;
  }

  getPrecedingSector(sector) {
    const level = sector.wheel.level;
    // if at innermost level
    if (level === 0) return null;

    for (const sec of this.sectors) {
      if (
        sec.wheel.level === level - 1 &&
        sec.startAngle <= sector.startAngle &&
        sector.endAngle <= sec.endAngle
      )
        return sec;
    }
  }

  getSectorGroup(sector) {
    const sectorGroup = new SectorGroup(sector);
    sectorGroup.extract();
    return sectorGroup;
  }

  // TODO: make new class for SectorWheel?
  getSectorWheel(location) {
    const sectorWheel = {};
    sectorWheel.sectors = [];
    let sectors;

    if (location instanceof Sector) sectors = location.wheel.sectors;
    else {
      // TODO: error handling
      if (location < roulette.wheels.length)
        sectors = roulette.wheels[location].sectors;
      else return;
    }

    const startAngle = this.root.startAngle;
    const endAngle = this.root.endAngle;

    // case when sector is part of innermost wheel
    if (location instanceof Sector && location.wheel.level === 0) {
      sectorWheel.sectors = location.wheel.sectors;
      sectorWheel.lowerIndex = 0;
      sectorWheel.upperIndex = location.wheel.sectors.length - 1;
      return sectorWheel;
    } else if (location === 0) {
      sectorWheel.sectors = roulette.wheels[location].sectors;
      sectorWheel.lowerIndex = 0;
      sectorWheel.upperIndex = location.wheel.sectors.length - 1;
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

  replace(sector, newArcAngle) {
    const sectorGroup = sector.sectorGroup;

    let sectors, angleRange;
    if (this.root.wheel.level === 0) {
      sectors = sector.wheel.sectors;
      angleRange = 2 * Math.PI;
    } else {
      sectors = this.getSectorWheel(sector).sectors;
      angleRange = this.root.arcAngle;
    }

    const remainingAngle = angleRange - newArcAngle;

    let totalRatio = 0;
    for (const sec of sectors) {
      if (sec !== sector) totalRatio += sec.ratio;
    }
    const base = remainingAngle / totalRatio;

    let index = 0;
    let prevSector;
    let currSector = sectors[index];

    while (currSector) {
      let arcAngle;
      if (currSector === sector) arcAngle = newArcAngle;
      else arcAngle = base * currSector.ratio;

      const currSectorGroup = sectorGroup.getSectorGroup(currSector);

      if (prevSector) currSector.startAngle = prevSector.endAngle;

      currSector.endAngle = currSector.startAngle + arcAngle;
      currSector.calculateProbability();
      currSectorGroup.setRoot(currSector);

      prevSector = currSector;
      // increment index & get next sector
      currSector = sectors[++index];
    }
  }

  setRoot(root) {
    this.root = root;
    // necessary?
    // this.extract();
    this.fill();
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
