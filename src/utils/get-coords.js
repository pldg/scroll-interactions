/**
 * Find element position relative to document
 * @param {Object} element DOM element
 * @returns {Object} `{ top, left, height, width, bottom, right }`
 */
export default function getCoords(element) {
  const scrollTop = window.pageYOffset;
  const scrollLeft = window.pageXOffset;
  const clientTop = document.body.clientTop || 0;
  const clientLeft = document.body.clientLeft || 0;

  let { top, left, height, width } = element.getBoundingClientRect();

  top = top + scrollTop - clientTop;
  left = left + scrollLeft - clientLeft;

  return {
    top,
    left,
    height,
    width,
    bottom: top + height,
    right: left + width,
  };
}
