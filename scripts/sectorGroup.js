import { data, roulette } from './roulette.js';
import { SectorWheel } from './sectorWheel.js';

class SectorGroup {
  constructor(rootSector) {
    this.root = rootSector;
    this.sectorWheels = [];
  }

  contains(sector) {
    for (const sectorWheel of this.sectors) {
      if (sectorWheel.contains(sector)) return true;
    }

    return false;
  }

  extract() {
    const level = this.root.wheel.level + 1;
    const startAngle = this.root.startAngle;
    const endAngle = this.root.endAngle;

    // extract sectors belonging to sectorGroup
    for (let i = level; i < roulette.wheels.length; i++) {
      const sectors = roulette.wheels[i].sectors;
      for (const sector of sectors) {
        if (startAngle <= sector.startAngle && sector.endAngle <= endAngle)
          this.push(sector);
      }
    }
  }

  // fill (expand) sectorGroup relative to root sector
  fill() {
    let level = this.root.wheel.level + 1;
    let currSectors = this.getSectorWheel(level);

    while (level < roulette.wheels.length) {
      this.fit(currSectors);
      // increment currLevel and get next sectorWheel
      currSectors = this.getSectorWheel(++level);
    }
  }

  // fit sectorWheel to sectorGroup
  fit(sectorWheel) {
    const angleRange = this.root.arcAngle;
    const sectors = sectorWheel.sectors;

    let totalRatio = 0;
    for (const sector of sectors) {
      totalRatio += sector.ratio;
    }

    const base = angleRange / totalRatio;

    // fit sectors into angleRange
    let currAngle = sectors[0].startAngle;
    for (const sector of sectors) {
      const arcAngle = base * sector.ratio;

      sector.startAngle = currAngle;
      sector.endAngle = currAngle + arcAngle;
      sector.updateStatistics();

      currAngle = sector.endAngle;
    }

    // re-render and update data
    roulette.update();
    data.update();
  }

  getSectors() {
    let sectors = [];

    for (const sectorWheel of this.sectorWheels) {
      sectors.push(...sectorWheel.sectors);
    }

    return sectors;
  }

  getSectorWheel(location, isSector) {
    let sectorWheel;

    if (isSector) {
      for (const sectorWheel of this.sectorWheels) {
        const sectors = sectorWheel.sectors;
        if (sectors.includes(location)) return sectorWheel;
      }
    } else return this.sectorWheels[location];

    return sectorWheel;
  }

  push(sector) {
    // only add if DNE
    if (!this.contains(sector)) {
      const groupLevel = sector.wheel.level - this.root.wheel.level;
      if (!(groupLevel in this.sectorWheels))
        this.sectorWheels[groupLevel] = new SectorWheel(this.root);

      const sectorWheel = this.sectorWheels[groupLevel];
      sectorWheel.push(sector);
    } else {
      // TODO: error handling
    }
  }

  remove(sector) {
    // only remove if exists
    if (this.contains(sector)) {
      const sectorWheel = this.getSectorWheel(sector, true);
      sectorWheel.remove(sector, true);
    } else {
      // TODO: error handling
    }
  }

  // replace(sector, newArcAngle) {
  //   const sectorGroup = sector.sectorGroup;

  //   let sectors, angleRange;
  //   if (this.root.wheel.level === 0) {
  //     sectors = sector.wheel.sectors;
  //     angleRange = 2 * Math.PI;
  //   } else {
  //     sectors = this.getSectorWheel(sector, true).sectors;
  //     angleRange = this.root.arcAngle;
  //   }

  //   const remainingAngle = angleRange - newArcAngle;

  //   let totalRatio = 0;
  //   for (const sec of sectors) {
  //     if (sec !== sector) totalRatio += sec.ratio;
  //   }

  //   const base = remainingAngle / totalRatio;

  //   let index = 0;
  //   let prevSector;
  //   let currSector = sectors[index];

  //   while (currSector) {
  //     let arcAngle;
  //     if (currSector === sector) arcAngle = newArcAngle;
  //     else arcAngle = base * currSector.ratio;

  //     const currSectorGroup = sectorGroup.getSectorGroup(currSector);

  //     if (prevSector) currSector.startAngle = prevSector.endAngle;
  //     currSector.endAngle = currSector.startAngle + arcAngle;

  //     currSector.updateStatistics();
  //     currSectorGroup.setRoot(currSector);

  //     prevSector = currSector;
  //     // increment index & get next sector
  //     currSector = sectors[++index];
  //   }
  // }
}

function createSectorGroup(sector) {
  let sectorGroup = new SectorGroup(sector);
  sectorGroup.extract();
  return sectorGroup;
}

// get sectorGroup whose root is the sector one level below input sector
function getPrecedingGroup(sector) {
  let precedingSector = getPrecedingSector(sector);

  // at innermost wheel => precedingGroup DNE
  if (precedingSector === null) return null;

  return precedingSector.sectorGroup;
}

// get sector one level below input sector, containing input sector
function getPrecedingSector(sector) {
  const level = sector.wheel.level;

  // if at innermost level
  if (level === 0) return null;

  const prevWheel = roulette.wheels[level - 1];
  const prevSectors = prevWheel.sectors;

  for (const sec of prevSectors) {
    if (sec.startAngle <= sector.startAngle && sector.endAngle <= sec.endAngle)
      return sec;
  }
}

export {
  SectorGroup,
  createSectorGroup,
  getPrecedingGroup,
  getPrecedingSector,
};
