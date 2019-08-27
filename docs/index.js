/**
 * Use
 * [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 * to check when an element intersect a boundary line inside the viewport.
 *
 * @param {Object} options
 * @param {String} options.entries DOM selector for IntersectionObserver entries
 * @param {Number} [options.trigger=1] Position of the trigger (boundary line)
 * relative to viewport top, range 0..1 where 0 is top and 1 is bottom
 * @param {Boolean} [options.debug=false] Show trigger
 *
 * @returns {Object} Returns this chainable methods:
 *
 * - `init()` start to observe elements
 * - `onIntersect({ direction, entry })` handle element intersection
 * - `disconnect()` remove IntersectionObserver
 * - `setTrigger(t)` set a new trigger position
 */
function scrollzzz({
  entries,
  trigger = 1,
  debug = false
}) {
  if (!isNonEmptyString) {
    throw new Error('entries must be a valid DOM selector');
  }

  if (!isNumber(trigger) || (trigger > 1 || trigger < 0)) {
    throw new Error('trigger must be a number in 0..1 range');
  }

  if (!isBoolean(debug)) {
    throw new Error('debug must be boolean');
  }

  const elements = [...document.querySelectorAll(entries)];
  const getScrollDirection = scrollDirection();
  const cb = {};
  const api = {};
  let isInitialized = false;
  let io;

  function showDebugTrigger() {
    const el = document.createElement('div');
    const text = document.createElement('p');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.width = '100%';
    el.style.height = '0px';
    el.style.borderTop = '2px dashed grey';
    el.style.zIndex = '9999';
    el.style.marginTop = `${trigger * 100}vh`;
    text.style.fontFamily = 'monospace';
    text.style.color = 'grey';
    text.style.margin = '0';
    text.style.padding = '6px';
    text.innerText = `entries: "${entries}", trigger: ${trigger}`;
    el.setAttribute('class', debugTriggerClassName());
    el.appendChild(text);
    document.body.appendChild(el);
  }

  function debugTriggerClassName() {
    const e = (entries[0] === '.' || entries[0] === '#') ?
      entries.substring(1) : entries;
    return `scrollzzz-trigger--${e}`;
  }

  function removeDebugTrigger() {
    const el = document.querySelector(`.${debugTriggerClassName()}`);
    el.parentNode.removeChild(el);
  }

  /**
   * Because the sum of `rootMargin` top and bottom is -100% the root collapse
   * into a single (boundary) line:
   *
   * - '-100% 0% 0% 0%' -> bottom
   * - '0% 0% -100% 0%' -> top
   * - '-50% 0% -50% 0%' -> middle
   * - '-80% 0% -20% 0%' -> 20% from bottom
   * - '-20% 0% -80% 0%' -> 20% from top
   *
   * Note: the intersection ratio is always 0.
   */
  function setRootMargin() {
    const margin = trigger * 100;
    return `-${margin}% 0% -${100 - margin}% 0%`;
  }

  function handleIntersect(entries) {
    entries.forEach(entry => {
      if (cb.hasOwnProperty('onIntersect')) {
        cb.onIntersect({
          direction: getScrollDirection(),
          entry
        });
      }
    });
  }

  function scrollDirection() {
    let previousY = 0;
    return function getScrollDirection() {
      const y = window.pageYOffset;
      let d = 'down';
      if (y >= previousY) d = 'down';
      else if (y < previousY) d = 'up';
      previousY = window.pageYOffset;
      return d;
    };
  }

  api.init = () => {
    if (isInitialized) throw new Error('scrollzzz has beed already initialized');
    io = new IntersectionObserver(handleIntersect, {
      rootMargin: setRootMargin()
    });
    elements.forEach(el => io.observe(el));
    if (debug === true) showDebugTrigger();
    isInitialized = true;
    return api;
  }

  api.onIntersect = (f) => {
    if (!isInitialized) throw new Error('scrollzzz has not been initialized');
    if (typeof f === 'function') cb.onIntersect = f;
    else throw new Error('onIntersect requires a function');
    return api;
  }

  api.disconnect = () => {
    if (!isInitialized) throw new Error('scrollzzz has not been initialized');
    io.disconnect();
    isInitialized = false;
    return api;
  }

  api.setTrigger = (t = 1) => {
    api.disconnect();
    trigger = t;
    if (debug === true) removeDebugTrigger();
    api.init();
    return api;
  }

  return Object.freeze(api);
}

function isNumber(val) {
  return typeof val === 'number' && !Number.isNaN(val);
}

function isNonEmptyString(val) {
  return typeof val === 'string' && val.length > 0;
}

function isBoolean(val) {
  return typeof val === 'boolean';
}

function isNodejs() {
  return typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;
}

if (isNodejs()) module.exports = scrollzzz;