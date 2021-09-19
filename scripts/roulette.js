import { Data } from './data.js';
import { FPS } from './fps.js';
import { Handle } from './handle.js';
import { randomValueInRange, randomValueInArray, getRadians } from './math.js';
import { Sector } from './sector.js';
import { SectorGroup } from './sectorGroup.js';
import { Wheel } from './wheel.js';
import './adjuster.js';
import './region.js';
import './selector.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

let width = getCanvasDimensions(),
  height = getCanvasDimensions();
initializeCanvas(
  innerWidth / 2 - width / 2,
  innerHeight / 2 - height / 2,
  width,
  height
);

let roulette;
let data;

const DEFAULT_ACCELERATION = (1 / 3) * Math.PI; // 1 degree/frame
const DEFAULT_DECCELERATION = DEFAULT_ACCELERATION / 8; // 0.125 degrees/frame
const DEFAULT_DURATION = 0.75;

let acceleration = DEFAULT_ACCELERATION;
let decceleration = DEFAULT_DECCELERATION;
let spinUpDuration = DEFAULT_DURATION;

const CANVAS_PADDING = 25; // px

const PRECISION = 0.01;

// TODO: design color palette
const colors = [];
colors.push('#00629B');
colors.push('#FFCD00');
colors.push('#182B49');

document.getElementById('btnClockwise').addEventListener('click', () => {
  acceleration = -DEFAULT_ACCELERATION;
  decceleration = -DEFAULT_DECCELERATION;
  spin();
});

document.getElementById('btnCounter').addEventListener('click', () => {
  acceleration = DEFAULT_ACCELERATION;
  decceleration = DEFAULT_DECCELERATION;
  spin();
});

document.getElementById('btnInsert').addEventListener('click', () => {
  roulette.insert();
});

document.getElementById('btnRemove').addEventListener('click', () => {
  roulette.remove();
});

document.getElementById('btnRepeat').addEventListener('click', () => {
  roulette.repeat();
});

document.getElementById('btnTotal').addEventListener('click', () => {
  roulette.total();
});

document.getElementById('btnInvert').addEventListener('click', () => {
  roulette.invert();
});

document.getElementById('btnSimplify').addEventListener('click', () => {
  roulette.simplify();
});

document.getElementById('btnRandom').addEventListener('click', () => {
  roulette.random();
});

document.addEventListener('submit', event => {
  event.preventDefault();
  const sampleSize = document.getElementById('sample-size').value;
  const numTrials = document.getElementById('num-trials').value;
  roulette.collectData(sampleSize, numTrials);
});

document.getElementById('btnClear').addEventListener('click', () => {
  data.clear();
});

class Roulette {
  constructor(x, y, radius) {
    // center coords of the roulette wheel
    this.x = x;
    this.y = y;
    // absolute center coords
    this.absX = canvas.x + CANVAS_PADDING + radius;
    this.absY = canvas.y + CANVAS_PADDING + radius;

    this.radius = radius;

    // roulette wheel composed of series of sub-wheels
    // and sector groups
    this.wheels = [];
    this.sectorGroups = [];
    this.handles = [];

    // currently selected wheel and sector
    this.selectedWheel;
    this.selectedSector;

    // angle, in radians, roulette stops at
    this.finalRadians = Math.PI;

    this.angularVelocity = 0;
    this.maxAngularVelocity = 0;

    // flags to keep track of the wheel's state
    this.spinning = false;
    this.spinningUp = false;
  }

  attachHandles() {
    this.handles = [];

    const outermostWheel = this.wheels[this.wheels.length - 1];
    const outermostSectors = outermostWheel.sectors;

    let index = 0;
    let currSector = outermostSectors[index];
    let adjacentSector = outermostSectors[index + 1];

    if (!adjacentSector) return;

    while (adjacentSector) {
      this.handles.push(new Handle(currSector, adjacentSector, 10));

      currSector = outermostSectors[++index];
      adjacentSector = outermostSectors[index + 1];
    }
    this.handles.push(new Handle(currSector, outermostSectors[0], 10));
  }

  insertSector() {
    // currently selected sector
    const sector = this.selectedSector;
    const sectorGroup = sector.sectorGroup;
    const precedingGroup = sectorGroup.getPrecedingGroup(sector);

    if (sector) {
      if (!precedingGroup) sectorGroup.insert(sector);
      else precedingGroup.insert(sector);
    }

    this.updateSectorGroups();
  }

  removeSector() {
    // currently selected sector
    const sector = this.selectedSector;
    const sectorGroup = sector.sectorGroup;
    const precedingGroup = sectorGroup.getPrecedingGroup(sector);

    if (sector) {
      if (!precedingGroup) sectorGroup.remove(sector);
      else precedingGroup.remove(sector);
    }

    this.updateSectorGroups();
  }

  random() {
    const angle = Math.random() * (2 * Math.PI);
    c.rotate(angle);
    this.update();
    this.record();
  }

  collectData(sampleSize, numTrials) {
    const runs = sampleSize * numTrials;
    const possibleValues = [];

    const outermostWheel = this.wheels[this.wheels.length - 1];
    outermostWheel.sectors.forEach(sector => {
      possibleValues.push(sector.value);
    });

    for (let i = 0; i < runs; i++) {
      const result = randomValueInArray(possibleValues);
      data.add(result);
    }

    data.update();
  }

  insert() {
    const insertWheel = this.selectedWheel.copy();
    const index = this.selectedWheel.level;
    insertWheel.level = index + 1;

    this.insertWheel(insertWheel, index + 1);
    this.update();
  }

  insertWheel(wheel, index) {
    this.wheels.splice(index, 0, wheel);
    this.fitWheels();
    this.updateWheelLevels();
  }

  fitWheels() {
    const wheels = this.wheels;
    const radius = this.radius;
    const distance = radius / wheels.length;

    let currRadius = 0;
    let index = 0;
    let currWheel = wheels[index];
    while (currWheel) {
      currWheel.innerRadius = currRadius;
      currWheel.outerRadius = currWheel.innerRadius + distance;

      currRadius += distance;
      // increment index and get next wheel
      currWheel = wheels[++index];
    }
  }

  remove() {
    // TODO: error handling
    if (this.wheels.length === 1) return;
    const index = this.selectedWheel.level;

    this.removeWheel(index);
    this.update();
    data.update();
  }

  removeWheel(index) {
    this.wheels.splice(index, 1);
    this.fitWheels();
    this.updateWheelLevels();
  }

  total() {
    const outermostWheel = this.wheels[this.wheels.length - 1];
    const totalWheel = outermostWheel.copy();

    totalWheel.roulette = this;
    totalWheel.level = outermostWheel.level + 1;

    totalWheel.sectors.forEach(sector => {
      const startAngle = sector.startAngle;
      const endAngle = sector.endAngle;

      for (let i = this.wheels.length - 2; i >= 0; i--) {
        const wheel = this.wheels[i];
        for (let j = 0; j < wheel.sectors.length; j++) {
          const innerSector = wheel.sectors[j];
          if (
            innerSector.startAngle <= startAngle &&
            endAngle <= innerSector.endAngle
          ) {
            sector.value += innerSector.value;
            console.log(sector.value);
          } else {
            j == wheel.sectors.length;
          }
        }
      }
    });

    this.insertWheel(totalWheel, totalWheel.level);

    this.update();
    data.update();
  }

  invert() {
    this.reverseWheels();
    this.update();
    data.update();
  }

  reverseWheels() {
    const wheels = this.wheels;
    wheels.reverse();
    this.fitWheels();
  }

  simplify() {
    this.wheels.forEach(wheel => {
      wheel.combine();
    });
    console.log(this);

    this.update();
  }

  repeat() {
    const repeatWheel = new Wheel();

    // set roulette for new wheel
    repeatWheel.roulette = this;

    const outermostWheel = this.wheels[this.wheels.length - 1];
    const outermostSectors = outermostWheel.sectors;
    const selectedWheel = this.selectedWheel;
    const selectedSectors = selectedWheel.sectors;

    // set level of new wheel
    repeatWheel.level = outermostWheel.level + 1;

    for (let i = 0; i < outermostSectors.length; i++) {
      let repeat = [];
      const currSector = outermostSectors[i];
      for (let j = 0; j < selectedSectors.length; j++) {
        const sector = selectedSectors[j];
        const newSector = sector.copy();
        newSector.wheel = repeatWheel;
        repeat.push(newSector);
      }

      currSector.fit(repeat);
      repeat.forEach(sector => {
        repeatWheel.addSector(sector);
      });

      // optimization while next sector has same arcAngle
      while (
        i + 1 < outermostSectors.length &&
        Math.abs(outermostSectors[i + 1].arcAngle - currSector.arcAngle) <
          PRECISION
      ) {
        const startAngle = outermostSectors[i + 1].startAngle;
        repeat.forEach(sector => {
          const newSector = sector.copy();
          newSector.startAngle += startAngle;
          newSector.endAngle += startAngle;

          repeatWheel.addSector(newSector);
        });
        i++;
      }
    }

    this.insertWheel(repeatWheel, repeatWheel.level);

    this.update();
    data.update();
  }

  reset() {
    const wheels = this.wheels;
    wheels.forEach(wheel => {
      wheel.sectors.forEach(sector => {
        sector.deselect();
      });
    });
    this.selectedWheel = this.selectedSector = null;
    data.setProbability(0);
  }

  draw() {
    this.updateSectorGroups();
    this.updateWheels();
    this.updateHandles();

    // offset from vertical
    let angleOffset = getRadians(c.getTransform());
    // draw pin
    c.save();
    c.rotate(-angleOffset);

    c.strokeStyle = 'black';
    c.lineWidth = 2;

    c.beginPath();
    c.moveTo(0, this.radius);
    c.lineTo(0, this.radius - 20);
    c.stroke();
    c.closePath();

    c.restore();
  }

  setWheels(wheels) {
    // set roulette reference and level of each wheel
    wheels.forEach((wheel, index) => {
      wheel.roulette = this;
      wheel.level = index;
    });
    this.wheels = wheels;

    this.updateRadii();
  }

  addWheel(wheel) {
    // set roulette reference of the wheel
    wheel.roulette = this;
    // set level of the wheel
    wheel.level = this.wheels.length;
    // add wheel to roulette
    this.wheels.push(wheel);

    this.updateRadii();
  }

  updateRadii() {
    const numWheels = this.wheels.length;
    const radius = this.radius / numWheels;

    for (let i = 0; i < numWheels; i++) {
      const wheel = this.wheels[i];
      wheel.innerRadius = radius * i;
      wheel.outerRadius = radius * (i + 1);
    }
  }

  updateWheels() {
    this.wheels.forEach(wheel => {
      wheel.update();
    });
  }

  updateSectorGroups() {
    // innermost sectors
    const roots = this.wheels[0].sectors;
    this.sectorGroups = [];

    for (const sector of roots) {
      if (!sector.sectorGroup || sector.sectorGroup.root !== sector)
        sector.sectorGroup = new SectorGroup(sector);

      sector.sectorGroup.extract(sector);
      this.sectorGroups.push(sector.sectorGroup);
    }

    // update all ratios
    this.updateRatios();
  }

  updateRatios() {
    for (const wheel of this.wheels) {
      for (const sector of wheel.sectors) {
        sector.calculateRatio();
      }
    }
  }

  updateHandles() {
    this.attachHandles();

    this.handles.forEach(handle => {
      handle.update();
    });
  }

  select(sector) {
    this.selectedWheel = sector.wheel;
    this.selectedSector = sector;
    sector.select();
    data.setProbability(sector.probability);
  }

  deselect(sector) {
    sector.deselect();
  }

  /**
   * Spins the roulette wheel to stop at a specified angle.
   *
   * @param {Number} radians The final angle in radians to stop spinning at
   */
  spin(radians) {
    // set spin configuration
    this.spinning = true;
    this.spinningUp = true;
    this.finalRadians = radians;
    this.maxAngularVelocity = acceleration * spinUpDuration;

    requestAnimationFrame(this.update.bind(this));
  }

  spinUp() {
    let trueAcceleration = acceleration / FPS;
    this.angularVelocity += trueAcceleration;
    c.rotate(this.angularVelocity);
  }

  spinDown() {
    let trueDecceleration = decceleration / FPS;

    if (Math.abs(this.angularVelocity) <= (Math.PI / 180) * 3) {
      let radians = getRadians(c.getTransform());

      // make decceleration proportional to velocity
      if (Math.abs(this.angularVelocity) >= Math.PI / 180) {
        this.angularVelocity -= trueDecceleration / 9;
      } else if (Math.abs(this.angularVelocity) >= (Math.PI / 180) * (1 / 3)) {
        this.angularVelocity -= trueDecceleration / 81;
      }

      // TODO: fix magic numbers
      // if (approximately) at stop angle and wheel is slow enough
      // then stop spinning
      if (
        Math.abs(this.finalRadians - radians) <= 0.01 &&
        Math.abs(this.angularVelocity) <= Math.PI / 180
      ) {
        this.stop();
      }
    } else {
      this.angularVelocity -= trueDecceleration;
    }

    c.rotate(this.angularVelocity);
  }

  stop() {
    this.spinning = false;
    this.angularVelocity = 0;
    this.record();
  }

  record() {
    const pointerCoordinates = {
      x: roulette.absX,
      y: roulette.absY - roulette.radius + 10, // TODO: fix magic numbers
    };

    const currRadians = getRadians(c.getTransform());

    this.wheels.forEach(wheel => {
      wheel.sectors.forEach(sector => {
        // case when pointer lands directly on an edge
        if (currRadians == sector.startAngle) {
          let coinFlip = Math.round(Math.random() * 2);
          switch (coinFlip) {
            case 0:
              pointerCoordinates.x += 2;
              break;
            case 1:
              pointerCoordinates.x -= 2;
              break;
          }
        }

        // record result of wheel spin
        if (sector.contains(pointerCoordinates.x, pointerCoordinates.y)) {
          this.result = sector.value;
          data.add(this.result);
        }
      });
    });
  }

  contains(x, y) {
    let distance = this.distanceFromCenter(x, y);
    return distance <= this.radius;
  }

  distanceFromCenter(x, y) {
    let center = {
      x: this.absX,
      y: this.absY,
    };

    let distance = Math.sqrt(
      Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
    );
    return distance;
  }

  setSectorSize(type, value) {
    const sector = this.selectedSector;

    if (sector) {
      switch (type) {
        case 'probability':
          sector.setProbability(value);
          break;
        case 'conditional':
          sector.setConditionalProbability(value);
          break;
        case 'ratio':
          sector.setRatio(value);
          break;
      }

      // update all ratios
      this.updateRatios();

      // re-render and update data
      this.update();
      data.update();
    }
  }

  split() {
    const wheels = this.wheels;
    const sectorGroups = this.sectorGroups;

    // currIndex for each wheel
    const wheelIndices = [];
    for (let i = 1; i < wheels.length; i++) {
      wheelIndices.push(0);
    }

    // iterate through each sectorGroup to split along edges
    for (const group of sectorGroups) {
      const startAngle = group.root.startAngle;
      const endAngle = group.root.endAngle;
      for (let i = 1; i < wheels.length; i++) {
        const sectors = wheels[i];
        let sector = sectors[wheelIndices[i - 1]];
        let overshot = false;

        while (sector && !overshot) {
          if (sector.startAngle < startAngle && startAngle < sector.endAngle)
            sector.split(startAngle);
          if (sector.startAngle < endAngle && endAngle < sector.endAngle)
            sector.split(endAngle);
          if (sector.startAngle >= endAngle) overshot = true;

          // increment wheel index & get next sector
          sector = sectors[++wheelIndices[i - 1]];
        }
      }
    }
  }

  update() {
    /*
     * Two stages of spinning:
     *  1. Spinning up - increase velocity until max
     *  2. Spinning down - decrease velocity until stop
     */

    if (this.spinning) {
      if (
        Math.abs(this.angularVelocity) < Math.abs(this.maxAngularVelocity) &&
        this.spinningUp
      ) {
        this.spinUp();
      } else {
        this.spinningUp = false;
        this.spinDown();
      }
      requestAnimationFrame(this.update.bind(this));
    }

    clear();
    this.draw();
  }

  updateWheelLevels() {
    for (let i = 0; i < this.wheels.length; i++) {
      const wheel = this.wheels[i];
      wheel.level = i;
    }
  }
}

function getCanvasDimensions() {
  let fillPercentage = 0.8;
  let winWidth = innerWidth;
  let winHeight = innerHeight;
  let min = winHeight;
  if (winWidth < winHeight) {
    min = winWidth;
  }
  return Math.round(fillPercentage * min);
}

function initializeCanvas(x, y, width, height) {
  canvas.width = width;
  canvas.height = height;
  canvas.style.position = 'absolute';
  canvas.style.top = y + 'px';
  canvas.style.left = x + 'px';
  canvas.x = x;
  canvas.y = y;

  c.translate(canvas.width / 2, canvas.height / 2);
  c.transform(1, 0, 0, -1, 0, 0);
}

function initializeRoulette() {
  let radius = canvas.width / 2 - CANVAS_PADDING;

  let wheel = new Wheel();
  wheel.addSector(new Sector(0, 0, Math.PI, colors[0], wheel));
  wheel.addSector(new Sector(1, Math.PI, 2 * Math.PI, colors[1], wheel));

  roulette = new Roulette(0, 0, radius);
  roulette.addWheel(wheel);

  initializeHandles();

  roulette.update();

  data = new Data(roulette);
  data.update();
}

function initializeHandles() {
  const handles = [];

  const outermostWheel = roulette.wheels[roulette.wheels.length - 1];
  const sectors = outermostWheel.sectors;
  for (let i = 0; i < sectors.length; i++) {
    const currSector = sectors[i];
    let adjacentSector;
    let prevSector;
    // last sector
    if (i == sectors.length - 1) {
      adjacentSector = sectors[0];
      prevSector = sectors[i - 1];
    } else {
      adjacentSector = sectors[i + 1];
      prevSector = sectors[i - 1];
    }

    handles.push(new Handle(currSector, adjacentSector, 10));
  }

  roulette.handles = handles;
}

function spin() {
  roulette.spin(randomValueInRange(0, 2 * Math.PI));
}

function clear() {
  c.clearRect(
    -canvas.width / 2,
    -canvas.height / 2,
    canvas.width,
    canvas.height
  );
}

initializeRoulette();

export { Roulette, initializeRoulette, clear, roulette, data, PRECISION };
