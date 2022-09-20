import addPassiveIfSupported from './utils/add-passive';
import addThrottle from './utils/add-throttle';
import getCoords from './utils/get-coords';
import {
  isNumber,
  isNonEmptyString
} from './utils/is';

/**
 * Easy scroll-driven interactions using
 * [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API):
 * observe elements position relative to a (trigger) boundary line
 *
 * @param {Object} options Setup initial options
 * @param {String} options.targets DOM elements selector
 * @param {Number} [options.trigger=1] Position of the trigger relative to root
 * top, range 0..1, where 0 is top and 1 is bottom
 * @param {String} [options.unobserve] Unobserve targets on page load using
 * `"onLoad"` or based on their position relative to the trigger using
 * `"below"`, `"intersect"` (only works if progress===false), `"above"`
 * @param {Boolean} [options.progress=false] Add `progress` to `observe()`
 * method
 * @param {Number} [options.throttle] Add throttle in millisecond to scroll
 * event listener (only works if progress===true)
 * @param {Boolean} [options.root=null] Set IntersectionObserver root, the
 * element used as viewport for checking visibility of the target (defaults to
 * browser viewport)
 * @param {Boolean} [options.debug=false] Show trigger line
 *
 * @returns {Object} Returns this chainable methods:
 *
 * - `init()` start to observe elements
 * - `observe({ direction, position, progress, entry })` callback to handle
 *   element observation:
 *   - `direction` scroll direction
 *   - `position` element position relative to the trigger
 *   - `progress` percent of completion relative to the target top border (only
 *     if options.progress===true)
 *   - `entry` original IntersectionObserver entry
 * - `disconnect(emptyCache=false)` disconnect IntersectionObserver, stops
 *   watching all of its target elements; if emptyCache===true scrollzzz will
 *   not remember which targets has been previously unobserved (see `unobserve`
 *   option) therefor if scrollzzz is re-initialized all targets will be
 *   observed again
 * - `update(options={}, emptyCache=false)` re-init scrollzzz; you can pass the
 *   same initial options, emptyCache is the same as disconnect() method
 */
export default function scrollzzz({
  trigger = 1,
  progress = false,
  debug = false,
  root = null,
  targets,
  unobserve,
  throttle
}) {
  const getScrollDirection = scrollDirection();
  const api = {};
  const unobservedTargets = [];
  let isInitialized = false;
  let rootElem;
  let io;
  let observe;

  // Variables used for `progress`:

  const passive = progress ? addPassiveIfSupported() : false;
  const scrollEvents = [];
  let enableProgress = progress && unobserve !== 'intersect';
  let isFirstLoad = true;
  let triggerPosition;

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

  function showDebugTrigger(rootElem) {
    const el = document.createElement('div');
    const text = document.createElement('p');
    el.style.height = '0px';
    el.style.borderTop = '2px dashed grey';
    el.style.zIndex = '9999';
    // If user set a custom root, print trigger inside it
    if (rootElem) {
      const {
        height: rootHeight,
        width: rootWidth
      } = rootElem.getBoundingClientRect();
      el.style.position = 'absolute';
      el.style.top = `${(trigger * rootHeight) + getCoords(rootElem).top}px`;
      el.style.width = `${rootWidth}px`;
    }
    // Else, root is the browser window
    else {
      el.style.position = 'fixed';
      el.style.width = '100%';
      el.style.top = `${trigger * 100}vh`;
    }
    text.style.fontFamily = 'monospace';
    text.style.color = 'grey';
    text.style.margin = '0';
    text.style.padding = '6px';
    text.innerText = `targets: "${targets}", trigger: ${trigger}`;
    el.setAttribute('class', debugTriggerClassName());
    el.appendChild(text);
    document.body.appendChild(el);
  }

  function debugTriggerClassName() {
    const e = (targets[0] === '.' || targets[0] === '#') ?
      targets.substring(1) : targets;
    return `scrollzzz-trigger--${e}`;
  }

  function removeDebugTrigger() {
    const el = document.querySelector(`.${debugTriggerClassName()}`);
    el.parentNode.removeChild(el);
  }

  /**
   * Because the sum of `rootMargin` top and bottom is -100% the root collapse
   * into a single boundary line (trigger). The intersection ratio is always 0.
   *
   * Examples:
   *
   * - '-100% 0% 0% 0%' -> bottom
   * - '0% 0% -100% 0%' -> top
   * - '-50% 0% -50% 0%' -> middle
   * - '-80% 0% -20% 0%' -> 20% from bottom
   * - '-20% 0% -80% 0%' -> 20% from top
   */
  function setRootMargin() {
    const margin = trigger * 100;
    return `-${margin}% 0% -${100 - margin}% 0%`;
  }

  function handleIntersect(entries, observer) {
    if (enableProgress) triggerPosition = entries[0].rootBounds.top;
    if (observe) {
      entries.forEach(entry => {
        const position = getPosition(entry);
        const target = entry.target;
        const targetIndex = parseInt(target.dataset.scrollzzz);
        observe({
          direction: getScrollDirection(),
          progress: enableProgress ? getProgress(entry) : null,
          position,
          entry
        });
        if (isFirstLoad && enableProgress) setScrollEvent(entry);
        if (enableProgress) handleScrollEvent(entry, targetIndex);
        if (unobserve) {
          unobserveTarget(position, target, observer);
          // Cache unobserved targets, if scrollzzz is re-initialized it'll
          // not observe targets that have already been unobserved
          unobservedTargets.push(targetIndex);
        }
      });
    }
    if (isFirstLoad) isFirstLoad = false;
  }

  function getPosition(entry) {
    const isIntersecting = entry.isIntersecting;
    const triggerPosition = entry.rootBounds.top;
    const isBelow = entry.boundingClientRect.top > triggerPosition;
    if (isIntersecting) return 'intersect';
    else if (!isIntersecting && isBelow) return 'below';
    else return 'above';
  }

  function handleScrollEvent(entry, targetIndex) {
    const isIntersecting = entry.isIntersecting;
    const {
      addScroll,
      removeScroll
    } = scrollEvents[targetIndex];
    if (isIntersecting) addScroll();
    // Use `!isFirstLoad` to prevent the listener to be immediately removed if
    // the page is loaded where target already intersect
    else if (!isIntersecting && !isFirstLoad) removeScroll();
  }

  // Use this function to build a list of non-initialized scroll event listeners
  // (one for each entry), those listeners will be dynamically initialized only
  // if entry intersect and removed when entry leave the trigger
  function setScrollEvent(entry) {
    const cb = setScrollCallback(entry);
    scrollEvents.push({
      addScroll: () => window.addEventListener('scroll', cb, passive),
      removeScroll: () => window.removeEventListener('scroll', cb, passive)
    });
  }

  function setScrollCallback(entry) {
    if (throttle) return addThrottle(scrollCallback, throttle);
    else return scrollCallback;
    function scrollCallback(event) {
      observe({
        direction: getScrollDirection(),
        progress: getProgress(entry),
        position: 'intersect',
        entry
      });
    }
  }

  function getProgress(entry) {
    const {
      top: targetTop,
      height: targetHeight
    } = entry.target.getBoundingClientRect();
    const progress = 1 / (targetHeight / (triggerPosition - targetTop));
    if (progress < 0) return 0;
    else if (progress > 1) return 1;
    else return parseFloat(progress.toFixed(4));
  }

  function unobserveTarget(position, target, observer) {
    const onLoad = unobserve === 'onLoad';
    const below = unobserve === 'below' && position === 'below';
    const intersect = unobserve === 'intersect' && position === 'intersect';
    const above = unobserve === 'above' && position === 'above';
    if (onLoad || below || intersect || above) observer.unobserve(target);
  }

  function checkOptionsErrors() {
    if (!isNonEmptyString(targets)) errorDomSelector('targets');

    if (!isNumber(trigger) || (trigger > 1 || trigger < 0)) {
      throw new Error('trigger must be a number in 0..1 range');
    }

    if (unobserve) {
      const c = ['onLoad', 'below', 'intersect', 'above'].indexOf(unobserve) > -1;
      if (!c) {
        throw new Error(
          'unobserve must be "onLoad" or "below" or "intersect" or "above"'
        );
      } else if (progress && unobserve === 'intersect') {
        throw new Error('if using progress, unobserve can not be "intersect"');
      }
    }

    if (!isNumber(throttle) && throttle > 0) {
      throw new Error('throttle must be a number > 0');
    }

    if (root && !isNonEmptyString(root)) errorDomSelector('root');

    function errorDomSelector(optionName) {
      throw new Error(`${optionName} must be a valid DOM selector`);
    }
  }

  function errorNotInitialized() {
    throw new Error('scrollzzz has not been initialized');
  }

  api.init = () => {
    if (isInitialized) {
      throw new Error('scrollzzz has beed already initialized');
    } else {
      checkOptionsErrors();
    }
    if (isNonEmptyString(root)) rootElem = document.querySelector(root);
    if (debug === true) showDebugTrigger(rootElem);
    io = new IntersectionObserver(handleIntersect, {
      rootMargin: setRootMargin(),
      root: rootElem || null
    });
    [].slice.call(document.querySelectorAll(targets)).forEach((el, i) => {
      if (!el.hasAttribute('data-scrollzzz')) {
        // Use set attribute to:
        // - track targets for scroll events
        // - cache unobserved targets
        el.setAttribute('data-scrollzzz', i);
      }
      if (unobservedTargets.indexOf(i) === -1) io.observe(el);
    });
    isInitialized = true;
    return api;
  }

  api.observe = (fn) => {
    if (!isInitialized) errorNotInitialized();
    if (typeof fn === 'function') observe = fn;
    else throw new Error('observe requires a function');
    return api;
  }

  api.disconnect = (emptyCache = false) => {
    if (!isInitialized) errorNotInitialized();
    if (progress) {
      scrollEvents.forEach(({ removeScroll }) => removeScroll());
    }
    if (debug === true) removeDebugTrigger();
    if (emptyCache) unobservedTargets.splice(0);
    io.disconnect();
    isInitialized = false;
    return api;
  }

  api.update = (options = {}, emptyCache = false) => {
    api.disconnect(emptyCache);
    targets = options.targets || targets;
    trigger = options.trigger || trigger;
    unobserve = options.unobserve || unobserve;
    progress = options.progress || progress;
    throttle = options.throttle || throttle;
    root = options.root || root;
    debug = options.debug || debug;
    api.init();
    return api;
  }

  return Object.freeze(api);
}