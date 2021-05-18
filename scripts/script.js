import {Wheel, initializeWheel} from './roulette.js'

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const wheel = new Wheel();
initializeWheel();
