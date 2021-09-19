import { data, roulette } from './roulette.js';

const insertSector = document.getElementById('btnInsertSector');
const removeSector = document.getElementById('btnRemoveSector');

const value = document.getElementById('value');
const size = document.getElementById('size');
const sizeSelect = document.getElementById('sizeSelect');

const color = document.getElementById('color');

let sizeType = sizeSelect.value;

insertSector.onclick = () => {
  roulette.insertSector();
};

removeSector.onclick = () => {
  roulette.removeSector();
};

value.oninput = () => {
  const sector = roulette.selectedSector;

  if (sector) {
    sector.setValue(value.value);
  }
};

size.oninput = () => {
  const type = sizeSelect.value;

  roulette.setSectorSize(type, Number(size.value));
};

sizeSelect.onchange = () => {
  sizeType = sizeSelect.value;

  const selectedSector = roulette.selectedSector;

  if (selectedSector) {
    setSize(selectedSector);
  } else {
    // TODO: error handling
  }
};

color.onchange = () => {};

function setValue(val) {
  value.value = val;
}

function setSize(sector) {
  switch (sizeType) {
    case 'probability':
      size.value = sector.probability;
      break;
    case 'conditional':
      size.value = sector.conditionalProb;
      break;
    case 'ratio':
      size.value = sector.ratio;
      break;
  }
}

export { sizeType, setValue, setSize };
