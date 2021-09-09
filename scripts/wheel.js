import { Sector } from './sector.js';
import { Handle } from './handle.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const PRECISION = 0.0000001;

class Wheel {
  constructor(sectors) {
    // TODO: singleton design
    this.roulette;
    this.level;

    if (sectors) this.sectors = sectors;
    else this.sectors = [];

    this.innerRadius;
    this.outerRadius;
  }

  combine() {
    const combine = [];
    let region = [];

    if (this.level != 0) {
      const prevWheel = this.roulette.wheels[this.level - 1];
      prevWheel.sectors.forEach(sector => {
        region = [];
        const startAngle = sector.startAngle;
        const endAngle = sector.endAngle;

        // extract region corresponding to sector of prevWheel
        let i = 0;
        while (
          i < this.sectors.length &&
          this.sectors[i].startAngle < startAngle
        )
          i++;
        while (i < this.sectors.length && this.sectors[i].endAngle < endAngle) {
          region.push(this.sectors[i]);
          i++;
        }

        if (endAngle - this.sectors[i].endAngle < PRECISION) {
          region.push(this.sectors[i]);
          i++;
        }

        let startIndex = i - region.length;
        this.combineRegion(region, startIndex, region.length);
      });
    } else {
      region = this.sectors;
      this.combineRegion(region, 0, this.sectors.length);
    }
  }

  combineRegion(region, startIndex, deleteCount) {
    // combine same events
    for (let j = 0; j < region.length; j++) {
      const sector = region[j];
      // adjust starting angle after combining previous event
      if (j > 0) sector.startAngle = region[j - 1].endAngle;
      let arcAngle = sector.arcAngle;
      for (let k = j + 1; k < region.length; k++) {
        const currSector = region[k];
        if (currSector.value == sector.value) {
          arcAngle += currSector.arcAngle;
          region.splice(k, 1);
          // account for array shift
          k--;
        }
      }
      region.splice(
        j,
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

    if (region.length == 3) console.log(region);
    this.sectors.splice(startIndex, deleteCount, ...region);
  }

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

  draw() {
    this.updateSectors();
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
    this.draw();
  }
}

export { Wheel };
