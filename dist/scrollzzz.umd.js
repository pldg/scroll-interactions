/**
 * @license MIT
 * @author Luca Poldelmengo
 * @see {@link https://github.com/pldg/scrollzzz}
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.scrollzzz = factory());
}(this, (function () { 'use strict';

  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
  function addPassiveIfSupported() {
    var passive = false;
    try {
      var options = {
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

  function addThrottle(fn, wait) {
    var time = Date.now();
    return function () {
      if ((time + wait - Date.now()) < 0) {
        fn();
        time = Date.now();
      }
    }
  }

  /**
   * Find element position relative to document
   * @param {Object} element DOM element
   * @returns {Object} `{ top, left, height, width, bottom, right }`
   */
  function getCoords(element) {
    var scrollTop = window.pageYOffset;
    var scrollLeft = window.pageXOffset;
    var clientTop = document.body.clientTop || 0;
    var clientLeft = document.body.clientLeft || 0;
    var ref = element.getBoundingClientRect();
    var top = ref.top;
    var left = ref.left;
    var height = ref.height;
    var width = ref.width;
    top = top + scrollTop - clientTop;
    left = left + scrollLeft - clientLeft;
    return {
      top: top,
      left: left,
      height: height,
      width: width,
      bottom: top + height,
      right: left + width,
    };
  }

  function isNumber(val) {
    return typeof val === 'number' && !isNaN(parseFloat(val));
  }

  function isNonEmptyString(val) {
    return typeof val === 'string' && val.length > 0;
  }

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
  function scrollzzz(ref) {
    var trigger = ref.trigger; if ( trigger === void 0 ) trigger = 1;
    var progress = ref.progress; if ( progress === void 0 ) progress = false;
    var debug = ref.debug; if ( debug === void 0 ) debug = false;
    var root = ref.root; if ( root === void 0 ) root = null;
    var targets = ref.targets;
    var unobserve = ref.unobserve;
    var throttle = ref.throttle;

    var getScrollDirection = scrollDirection();
    var api = {};
    var unobservedTargets = [];
    var isInitialized = false;
    var rootElem;
    var io;
    var observe;

    // Variables used for `progress`:

    var passive = progress ? addPassiveIfSupported() : false;
    var scrollEvents = [];
    var enableProgress = progress && unobserve !== 'intersect';
    var isFirstLoad = true;
    var triggerPosition;

    function scrollDirection() {
      var previousY = 0;
      var previousD = 'down';
      return function getScrollDirection() {
        var y = root ? root.scrollTop : window.pageYOffset;
        var d = previousD;
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
      var el = document.createElement('div');
      var text = document.createElement('p');
      el.style.height = '0px';
      el.style.borderTop = '2px dashed grey';
      el.style.zIndex = '9999';
      // If user set a custom root, print trigger inside it
      if (rootElem) {
        var ref = rootElem.getBoundingClientRect();
        var rootHeight = ref.height;
        var rootWidth = ref.width;
        el.style.position = 'absolute';
        el.style.top = ((trigger * rootHeight) + getCoords(rootElem).top) + "px";
        el.style.width = rootWidth + "px";
      }
      // Else, root is the browser window
      else {
        el.style.position = 'fixed';
        el.style.width = '100%';
        el.style.top = (trigger * 100) + "vh";
      }
      text.style.fontFamily = 'monospace';
      text.style.color = 'grey';
      text.style.margin = '0';
      text.style.padding = '6px';
      text.innerText = "targets: \"" + targets + "\", trigger: " + trigger;
      el.setAttribute('class', debugTriggerClassName());
      el.appendChild(text);
      document.body.appendChild(el);
    }

    function debugTriggerClassName() {
      var e = (targets[0] === '.' || targets[0] === '#') ?
        targets.substring(1) : targets;
      return ("scrollzzz-trigger--" + e);
    }

    function removeDebugTrigger() {
      var el = document.querySelector(("." + (debugTriggerClassName())));
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
      var margin = trigger * 100;
      return ("-" + margin + "% 0% -" + (100 - margin) + "% 0%");
    }

    function handleIntersect(entries, observer) {
      if (enableProgress) { triggerPosition = entries[0].rootBounds.top; }
      if (observe) {
        entries.forEach(function (entry) {
          var position = getPosition(entry);
          var target = entry.target;
          var targetIndex = parseInt(target.dataset.scrollzzz);
          observe({
            direction: getScrollDirection(),
            progress: enableProgress ? getProgress(entry) : null,
            position: position,
            entry: entry
          });
          if (isFirstLoad && enableProgress) { setScrollEvent(entry); }
          if (enableProgress) { handleScrollEvent(entry, targetIndex); }
          if (unobserve) {
            unobserveTarget(position, target, observer);
            // Cache unobserved targets, if scrollzzz is re-initialized it'll
            // not observe targets that have already been unobserved
            unobservedTargets.push(targetIndex);
          }
        });
      }
      if (isFirstLoad) { isFirstLoad = false; }
    }

    function getPosition(entry) {
      var isIntersecting = entry.isIntersecting;
      var triggerPosition = entry.rootBounds.top;
      var isBelow = entry.boundingClientRect.top > triggerPosition;
      if (isIntersecting) { return 'intersect'; }
      else if (!isIntersecting && isBelow) { return 'below'; }
      else { return 'above'; }
    }

    function handleScrollEvent(entry, targetIndex) {
      var isIntersecting = entry.isIntersecting;
      var ref = scrollEvents[targetIndex];
      var addScroll = ref.addScroll;
      var removeScroll = ref.removeScroll;
      if (isIntersecting) { addScroll(); }
      // Use `!isFirstLoad` to prevent the listener to be immediately removed if
      // the page is loaded where target already intersect
      else if (!isIntersecting && !isFirstLoad) { removeScroll(); }
    }

    // Use this function to build a list of non-initialized scroll event listeners
    // (one for each entry), those listeners will be dynamically initialized only
    // if entry intersect and removed when entry leave the trigger
    function setScrollEvent(entry) {
      var cb = setScrollCallback(entry);
      scrollEvents.push({
        addScroll: function () { return window.addEventListener('scroll', cb, passive); },
        removeScroll: function () { return window.removeEventListener('scroll', cb, passive); }
      });
    }

    function setScrollCallback(entry) {
      if (throttle) { return addThrottle(scrollCallback, throttle); }
      else { return scrollCallback; }
      function scrollCallback(event) {
        observe({
          direction: getScrollDirection(),
          progress: getProgress(entry),
          position: 'intersect',
          entry: entry
        });
      }
    }

    function getProgress(entry) {
      var ref = entry.target.getBoundingClientRect();
      var targetTop = ref.top;
      var targetHeight = ref.height;
      var progress = 1 / (targetHeight / (triggerPosition - targetTop));
      if (progress < 0) { return 0; }
      else if (progress > 1) { return 1; }
      else { return parseFloat(progress.toFixed(4)); }
    }

    function unobserveTarget(position, target, observer) {
      var onLoad = unobserve === 'onLoad';
      var below = unobserve === 'below' && position === 'below';
      var intersect = unobserve === 'intersect' && position === 'intersect';
      var above = unobserve === 'above' && position === 'above';
      if (onLoad || below || intersect || above) { observer.unobserve(target); }
    }

    function checkOptionsErrors() {
      if (!isNonEmptyString(targets)) { errorDomSelector('targets'); }

      if (!isNumber(trigger) || (trigger > 1 || trigger < 0)) {
        throw new Error('trigger must be a number in 0..1 range');
      }

      if (unobserve) {
        var c = ['onLoad', 'below', 'intersect', 'above'].indexOf(unobserve) > -1;
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

      if (root && !isNonEmptyString(root)) { errorDomSelector('root'); }

      function errorDomSelector(optionName) {
        throw new Error((optionName + " must be a valid DOM selector"));
      }
    }

    function errorNotInitialized() {
      throw new Error('scrollzzz has not been initialized');
    }

    api.init = function () {
      if (isInitialized) {
        throw new Error('scrollzzz has beed already initialized');
      } else {
        checkOptionsErrors();
      }
      if (isNonEmptyString(root)) { rootElem = document.querySelector(root); }
      if (debug === true) { showDebugTrigger(rootElem); }
      io = new IntersectionObserver(handleIntersect, {
        rootMargin: setRootMargin(),
        root: rootElem || null
      });
      [].slice.call(document.querySelectorAll(targets)).forEach(function (el, i) {
        if (!el.hasAttribute('data-scrollzzz')) {
          // Use set attribute to:
          // - track targets for scroll events
          // - cache unobserved targets
          el.setAttribute('data-scrollzzz', i);
        }
        if (unobservedTargets.indexOf(i) === -1) { io.observe(el); }
      });
      isInitialized = true;
      return api;
    };

    api.observe = function (fn) {
      if (!isInitialized) { errorNotInitialized(); }
      if (typeof fn === 'function') { observe = fn; }
      else { throw new Error('observe requires a function'); }
      return api;
    };

    api.disconnect = function (emptyCache) {
      if ( emptyCache === void 0 ) emptyCache = false;

      if (!isInitialized) { errorNotInitialized(); }
      if (progress) {
        scrollEvents.forEach(function (ref) {
          var removeScroll = ref.removeScroll;

          return removeScroll();
        });
      }
      if (debug === true) { removeDebugTrigger(); }
      if (emptyCache) { unobservedTargets.splice(0); }
      io.disconnect();
      isInitialized = false;
      return api;
    };

    api.update = function (options, emptyCache) {
      if ( options === void 0 ) options = {};
      if ( emptyCache === void 0 ) emptyCache = false;

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
    };

    return Object.freeze(api);
  }

  return scrollzzz;

})));
