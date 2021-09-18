import { roulette } from './roulette.js';

const insertSector = document.getElementById('btnInsertSector');
const removeSector = document.getElementById('btnRemoveSector');

const value = document.getElementById('value');
const size = document.getElementById('size');
const sizeSelect = document.getElementById('sizeSelect');

const color = document.getElementById('color');

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

  roulette.setSectorSize(type, size.value);
};

color.onchange = () => {};
