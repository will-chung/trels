function arithmeticSum(first, last, n) {
  return 0.5 * n * (first + last);
}

function chordLength(radius, distance) {
  return 2 * Math.sqrt(Math.pow(radius, 2) - Math.pow(distance, 2));
}

function countDecimals(value) {
  if (Math.floor(value) !== value)
    return value.toString().split('.')[1].length || 0;
  return 0;
}

function gaussSum(n) {
  if (n >= 0) return (n * (n + 1)) / 2;
  else return -1;
}

function getRadians(transform) {
  let arcCos = Math.acos(transform.a);
  let arcSin = Math.asin(transform.b);

  let theta = arcCos;
  if (transform.b > 0) {
    theta = 2 * Math.PI - arcCos;
  }

  return theta;
}

function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomValueInArray(array) {
  return array[randomIntInRange(0, array.length - 1)];
}

function randomValueInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function round(value, precision) {
  let power = Math.pow(10, precision);
  return Math.round((value + Number.EPSILON) * power) / power;
}

export { chordLength, getRadians, randomValueInArray, randomValueInRange };
