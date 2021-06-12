// import {Wheel, initializeWheel} from './roulette.js'
import { data } from './roulette.js';

// const canvas = document.querySelector('canvas');
// const c = canvas.getContext('2d');

// const roulette = new Roulette();
// initializeWheel();

const ctx = document.getElementById('histogram').getContext('2d');

const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [0, 1, 2, 3, 4],
    datasets: [{
      label: 'Number of Arrivals',
      data: [19, 28, 20, 16],
      backgroundColor: 'green',
    }]
  },
  options: {
    scales: {
      xAxes: [{
        display: false,
        barPercentage: 1.3,
        ticks: {
          max: 3,
        }
      }, {
        display: true,
        ticks: {
          autoSkip: false,
          max: 4,
        }
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }
});
