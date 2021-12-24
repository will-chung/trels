import { Sector } from './sector.js';
import { Handle } from './handle.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const PRECISION = 0.0000001;

class Wheel {
  constructor(sectors) {
    this.roulette;
    this.level;

    if (sectors) this.sectors = sectors;
    else this.sectors = [];

    this.innerRadius;
    this.outerRadius;
  }

  /*
   * Combine sectors of a wheel, maintaining probabilities
   */
  combine() {
    let region = [];

    if (this.level !== 0) {
      const prevWheel = this.roulette.wheels[this.level - 1];
      prevWheel.sectors.forEach(sector => {
        region = [];
        const startAngle = sector.startAngle;
        const endAngle = sector.endAngle;

        // extract region corresponding to sector of prevWheel
        let i = 0;
        // skip until start of region
        while (
          i < this.sectors.length &&
          this.sectors[i].startAngle < startAngle
        )
          i++;
        // extraction
        while (i < this.sectors.length && this.sectors[i].endAngle < endAngle) {
          region.push(this.sectors[i]);
          i++;
        }

        // extract last sector
        if (endAngle - this.sectors[i].endAngle < PRECISION) {
          region.push(this.sectors[i]);
          i++;
        }

        // combine extracted region
        let startIndex = i - region.length;
        this.combineRegion(region, startIndex, region.length);
      });
    } else {
      region = this.sectors;
      this.combineRegion(region, 0, this.sectors.length);
    }
  }

  /*
   * Combine sectors of a region, maintaining probabilities
   */
  combineRegion(region, startIndex, deleteCount) {
    // combine same probability events
    for (let i = 0; i < region.length; i++) {
      const sector = region[i];
      // adjust starting angle after combining previous region
      if (i > 0) sector.startAngle = region[i - 1].endAngle;
      let arcAngle = sector.arcAngle;

      // delete all elements with same value as sector
      for (let j = i + 1; j < region.length; j++) {
        const currSector = region[j];
        if (currSector.value == sector.value) {
          arcAngle += currSector.arcAngle;
          region.splice(j, 1);
          // account for array shift caused by deletion
          j--;
        }
      }

      // replace sector with new sector representing combined events
      region.splice(
        i,
        1,
        new Sector(
          sector.value,
          sector.startAngle,
          sector.startAngle + arcAngle,
          sector.color,
          sector.wheel
        )
      );
    }

    // finally, replace original region with newly combined region
    this.sectors.splice(startIndex, deleteCount, ...region);
  }

  /*
   * Create a copy of the wheel
   */
  copy() {
    const copyWheel = new Wheel();

    copyWheel.roulette = this.roulette;
    this.sectors.forEach(sector => {
      copyWheel.addSector(
        new Sector(
          sector.value,
          sector.startAngle,
          sector.endAngle,
          sector.defaultColor,
          copyWheel
        )
      );
    });

    return copyWheel;
  }

  setSectors(sectors) {
    this.sectors = sectors;
  }

  addSector(sector) {
    this.sectors.push(sector);
  }

  updateSectors() {
    this.sectors.forEach(sector => {
      sector.update();
    });
  }

  update() {
    this.updateSectors();
  }
}

export { Wheel };
