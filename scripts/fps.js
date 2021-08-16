let FPS;

let start;
let count = 0;

function step(timestamp) {
  if (start === undefined)
    start = timestamp;
  const elapsed = timestamp - start;
  count++;

  if (elapsed < 1000)
    window.requestAnimationFrame(step);
  else {
    FPS = count;
    console.log('Calculated FPS: ' + count);
  }
}

function calculateFPS() {
  window.requestAnimationFrame(step);
}

calculateFPS();

export { FPS };