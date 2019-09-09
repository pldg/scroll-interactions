/**
 * @license MIT
 * @author Luca Poldelmengo
 * @see {@link https://github.com/pldg/scrollzzz}
 */

/**
 * Use
 * [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
 * to check when an element intersect a boundary line inside the viewport.
 *
 * @param {Object} options
 * @param {String} options.entries DOM selector for IntersectionObserver entries
 * @param {Number} [options.trigger=1] Position of the trigger relative to
 * viewport top, range 0..1 where 0 is top and 1 is bottom
 * @param {Boolean} [options.once=false] Set to `true` to unobserve target after
 * its first intersection
 * @param {Boolean} [options.root=null] Set IntersectionObserver root, the
 * element that is used as the viewport for checking visibility of the target
 * @param {Boolean} [options.debug=false] Show trigger
 *
 * @returns {Object} Returns this chainable methods:
 *
 * - `init()` start to observe elements
 * - `onIntersect({ direction, entry })` handle element intersection
 * - `onScroll({ direction, entry, progress })` where `progress` is the percent
 *   of completion relative to the trigger top position
 * - `disconnect()` remove observer
 * - `update(options)` re-init scrollzzz, you can pass the same initial options
 */
function scrollzzz({
  entries,
  trigger = 1,
  once = false,
  root = null,
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

  // onScroll variables
  let v = {};
  let isFirstLoad = true;

  function showDebugTrigger() {
    const el = document.createElement('div');
    const text = document.createElement('p');
    el.style.height = '0px';
    el.style.borderTop = '2px dashed grey';
    el.style.zIndex = '9999';
    if (root === null) {
      el.style.position = 'fixed';
      el.style.width = '100%';
      el.style.top = `${trigger * 100}vh`;
    } else {
      const {
        height: rootHeight,
        width: rootWidth
      } = root.getBoundingClientRect();
      el.style.position = 'absolute';
      el.style.top = `${(trigger * rootHeight) + getCoords(root).top}px`;
      el.style.width = `${rootWidth}px`;
    }
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

  function handleIntersect(entries, observer) {
    v.triggerPosition = entries[0].rootBounds.top;
    entries.forEach(entry => {
      const isIntersecting = entry.isIntersecting;
      if (cb.hasOwnProperty('onIntersect')) {
        cb.onIntersect({
          direction: getScrollDirection(),
          entry
        });
        if (once && isIntersecting) observer.unobserve(entry.target);
      }
      if (!once && cb.hasOwnProperty('onScroll')) {
        const { passive } = v;
        if (isIntersecting) {
          v.entry = entry;
          v.targetHeight = entry.target.getBoundingClientRect().height;
          window.addEventListener('scroll', handleScrolling, passive);
        } else if (!isIntersecting && !isFirstLoad) {
          // Use `!isFirstLoad` to prevent the listener to be immediately
          // removed if the page is loaded where target is already intersecting
          window.removeEventListener('scroll', handleScrolling, passive);
        }
      }
    });
    if (isFirstLoad) isFirstLoad = false;
  }

  function scrollDirection() {
    let previousY = 0;
    let previousD = 'down';
    return function getScrollDirection() {
      const y = root ? root.scrollTop : window.pageYOffset;
      let d = previousD;
      if (y > previousY || (y === previousY && previousD === 'down')) {
        d = 'down';
      } else if (y < previousY || (y === previousY && previousD === 'up')) {
        d = 'up';
      }
      previousY = y;
      previousD = d;
      return d;
    };
  }

  function handleScrolling(evt) {
    cb.onScroll({
      direction: getScrollDirection(),
      entry: v.entry,
      progress: getProgress(),
    });
  }

  function getProgress() {
    const {
      entry,
      targetHeight,
      triggerPosition
    } = v;
    const { top: targetTop } = entry.target.getBoundingClientRect();
    const progress = 1 / (targetHeight / (triggerPosition - targetTop));
    if (progress < 0) return 0;
    else if (progress > 1) return 1;
    else return parseFloat(progress.toFixed(4));
  }

  function errorNotInitialized() {
    throw new Error('scrollzzz has not been initialized');
  }

  api.init = () => {
    if (isInitialized) throw new Error('scrollzzz has beed already initialized');
    io = new IntersectionObserver(handleIntersect, {
      rootMargin: setRootMargin(),
      root
    });
    elements.forEach(el => io.observe(el));
    if (debug === true) showDebugTrigger();
    isInitialized = true;
    return api;
  }

  api.disconnect = () => {
    if (!isInitialized) errorNotInitialized();
    io.disconnect();
    if (debug === true) removeDebugTrigger();
    isInitialized = false;
    return api;
  }

  api.update = (options = {}) => {
    api.disconnect();
    entries = options.entries || entries;
    trigger = options.trigger || trigger;
    root = options.root || root;
    debug = options.debug || debug;
    api.init();
    return api;
  }

  api.onIntersect = (f) => {
    if (!isInitialized) errorNotInitialized();
    if (typeof f === 'function') cb.onIntersect = f;
    else throw new Error('onIntersect requires a function');
    return api;
  }

  api.onScroll = (f) => {
    if (!isInitialized) errorNotInitialized();
    if (typeof f === 'function') cb.onScroll = f;
    else throw new Error('onScroll requires a function');
    v.passive = addPassiveIfSupported();
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

/**
 * Find element position relative to document
 * @param {Object} element DOM element
 * @returns {Object} `{ top, left, height, width, bottom, right }`
 */
function getCoords(element) {
  const scrollTop = window.pageYOffset;
  const scrollLeft = window.pageXOffset;
  const clientTop = document.body.clientTop || 0;
  const clientLeft = document.body.clientLeft || 0;
  let {
    top,
    left,
    height,
    width
  } = element.getBoundingClientRect();

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

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
function addPassiveIfSupported() {
  let passive = false;

  try {
    const options = {
      get passive() {
        passive = {
          passive: true
        };
      }
    };

    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
  } catch (err) {
    passive = false;
  }

  return passive;
}

function isNodejs() {
  return typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;
}

if (isNodejs()) module.exports = scrollzzz;