export function isNumber(val) {
  return typeof val === 'number' && !isNaN(parseFloat(val));
}

export function isNonEmptyString(val) {
  return typeof val === 'string' && val.length > 0;
}