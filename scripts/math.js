function gaussSum(n) {
  if (n >= 0) return (n * (n + 1)) / 2;
  else return -1;
}

function arithmeticSum(first, last, n) {
  return 0.5 * n * (first + last);
}

function countDecimals(value) {
  if (Math.floor(value) !== value)
    return value.toString().split('.')[1].length || 0;
  return 0;
}

function round(value, precision) {
  let power = Math.pow(10, precision);
  return Math.round((value + Number.EPSILON) * power) / power;
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

function getRadians(transform) {
  let arcCos = Math.acos(transform.a);
  let arcSin = Math.asin(transform.b);

  let theta = arcCos;
  if (transform.b > 0) {
    theta = 2 * Math.PI - arcCos;
  }

  return theta;
}

export { randomValueInRange, randomValueInArray, getRadians };
