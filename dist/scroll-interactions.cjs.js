
/**
 * @author Luca Poldelmengo
 * @license MIT
 * @see {@link https://github.com/pldg/scroll-interactions}
 */

'use strict';

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
function addPassiveIfSupported() {
  var passive = false;

  try {
    var options = {
      get passive() {
        passive = {
          passive: true,
        };
      },
    };

    window.addEventListener("test", null, options);
    window.removeEventListener("test", null, options);
  } catch (err) {
    passive = false;
  }

  return passive;
}

function addThrottle(fn, wait) {
  var time = Date.now();

  return function () {
    if (time + wait - Date.now() < 0) {
      fn();
      time = Date.now();
    }
  };
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
 * @typedef {Object} options Set scroll-interactions options.
 *
 * @property {String} targets DOM elements selector.
 * @property {Number} [trigger=1] Position of the trigger relative to root top.
 * Range 0..1, where 0 is top and 1 is bottom.
 * @property {String} [unobserve] Unobserve target elements:
 * - `"onLoad"` after first page load.
 * - `"below"` when they are below the trigger.
 * - `"intersect"` as soon as they intersect the trigger.
 * - `"above"` when they are above the trigger.
 * @property {Boolean} [progress=false] Add `progress` to `observe()` method.
 * @property {Number} [throttle] Add throttle in millisecond to scroll event
 * listener for when `progress` is active.
 * @property {Boolean} [root=null] Set IntersectionObserve's root, the element
 * used as viewport for checking visibility of the target. Defaults to browser
 * viewport.
 * @property {Boolean} [debug=false] Show the trigger line for debugging.
 */

/**
 * @typedef {Object} api Chainable methods returned by scroll-interactions.
 *
 * @method init Start to observe elements.
 * @method [observe] Callback to handle element observation.
 * @method [disconnect] Disconnect IntersectionObserver.
 * @method [update] Re-initialize scroll-interactions. As first argument you
 * can pass the same initial options. As second argument you can pass
 * `emptyCache` which is the same as `disconnect()` method.
 */

/**
 * @callback disconnect Disable IntersectionObserve, stops watching all target
 * elements.
 *
 * @param {emptyCache} [emptyCache=false]
 */

/**
 * @callback update Re-initialize scroll-interactions.
 *
 * @param {options}
 * @param {emptyCache} [emptyCache=false]
 */

/**
 * @typedef {Boolean} emptyCache If `true` scroll-interactions will not
 * remember which targets has been previously unobserved therefor if
 * scroll-interactions is re-initialized all targets will be observed again.
 */

/**
 * @callback observe Handle element observation.
 * @param {String} [direction] Scroll direction: `"up"`, `"down"`.
 * @param {String} [position] Element position relative to the trigger:
 * `"below"`, `"intersect"`, `"above"`.
 * @param {Number} [progress] Percent of completion relative to the target top
 * border.
 * @param {Object} [entry] Original IntersectionObserver entry.
 */

/**
 * Easy scroll-driven interactions in the browser built on top of
 * IntersectionObserver. Set a hidden trigger line in the browser viewport and
 * see how one or more elements relate to it. This package tells you when an
 * element is above, below or intersect the trigger line. If the element
 * intersect the trigger it can also calculate the percent of completion
 * relative to the element's top border.
 *
 * @param {options}
 * @returns {api}
 */
function scroll_interactions(ref) {
  var trigger = ref.trigger; if ( trigger === void 0 ) trigger = 1;
  var progress = ref.progress; if ( progress === void 0 ) progress = false;
  var debug = ref.debug; if ( debug === void 0 ) debug = false;
  var root = ref.root; if ( root === void 0 ) root = null;
  var targets = ref.targets;
  var unobserve = ref.unobserve;
  var throttle = ref.throttle;

  var getScrollDirection = scrollDirection();
  var passive = progress ? addPassiveIfSupported() : false;
  var enableProgress = progress && unobserve !== "intersect";
  var api = {};
  var unobservedTargets = [];
  var scrollEvents = [];
  var isInitialized = false;
  var isFirstLoad = true;
  var rootElem;
  var io;
  var observe;
  var triggerPosition;

  function scrollDirection() {
    var previousY = 0;
    var previousD = "down";

    return function getScrollDirection() {
      var y = root ? root.scrollTop : window.pageYOffset;
      var d = previousD;

      if (y > previousY || (y === previousY && previousD === "down")) {
        d = "down";
      } else if (y < previousY || (y === previousY && previousD === "up")) {
        d = "up";
      }

      previousY = y;
      previousD = d;

      return d;
    };
  }

  function showDebugTrigger(rootElem) {
    var el = document.createElement("div");
    var text = document.createElement("p");

    el.style.height = "0px";
    el.style.borderTop = "2px dashed grey";
    el.style.zIndex = "9999";

    // Print trigger inside custom root
    if (rootElem) {
      var ref =
        rootElem.getBoundingClientRect();
      var rootHeight = ref.height;
      var rootWidth = ref.width;
      el.style.position = "absolute";
      el.style.top = (trigger * rootHeight + getCoords(rootElem).top) + "px";
      el.style.width = rootWidth + "px";
    }
    // Print trigger inside browser window
    else {
      el.style.position = "fixed";
      el.style.width = "100%";
      el.style.top = (trigger * 100) + "vh";
    }

    el.setAttribute("class", debugTriggerClassName());

    text.style.fontFamily = "monospace";
    text.style.color = "grey";
    text.style.margin = "0";
    text.style.padding = "6px";
    text.innerText = "targets: \"" + targets + "\", trigger: " + trigger;

    el.appendChild(text);
    document.body.appendChild(el);
  }

  function debugTriggerClassName() {
    var e =
      targets[0] === "." || targets[0] === "#" ? targets.substring(1) : targets;
    return ("scroll-interactions--trigger-" + e);
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
  function setRootMargin(trigger) {
    var margin = trigger * 100;
    return ("-" + margin + "% 0% -" + (100 - margin) + "% 0%");
  }

  function handleIntersect(entries, observer) {
    if (enableProgress) { triggerPosition = entries[0].rootBounds.top; }

    if (observe) {
      entries.forEach(function (entry) {
        var position = getPosition(entry);
        var target = entry.target;
        // When accessing `data-` attribute, dash-style are converted to
        // camelCase:
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset#name_conversion
        var targetIndex = parseInt(target.dataset.scrollInteractions);

        observe({
          direction: getScrollDirection(),
          progress: enableProgress ? getProgress(entry) : null,
          position: position,
          entry: entry,
        });

        if (isFirstLoad && enableProgress) { setScrollEvent(entry); }

        if (enableProgress) { handleScrollEvent(entry, targetIndex); }

        if (unobserve) {
          unobserveTarget(position, target, observer);
          // Cache unobserved targets, if scroll_interactions is re-initialized
          // it'll not observe targets that have been unobserved
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

    if (isIntersecting) { return "intersect"; }
    else if (!isIntersecting && isBelow) { return "below"; }
    else { return "above"; }
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
      addScroll: function () { return window.addEventListener("scroll", cb, passive); },
      removeScroll: function () { return window.removeEventListener("scroll", cb, passive); },
    });
  }

  function setScrollCallback(entry) {
    if (throttle) { return addThrottle(scrollCallback, throttle); }
    else { return scrollCallback; }

    function scrollCallback(event) {
      observe({
        direction: getScrollDirection(),
        progress: getProgress(entry),
        position: "intersect",
        entry: entry,
      });
    }
  }

  function getProgress(entry) {
    var ref =
      entry.target.getBoundingClientRect();
    var targetTop = ref.top;
    var targetHeight = ref.height;
    var progress = 1 / (targetHeight / (triggerPosition - targetTop));

    if (progress < 0) { return 0; }
    else if (progress > 1) { return 1; }
    else { return parseFloat(progress.toFixed(4)); }
  }

  function unobserveTarget(position, target, observer) {
    var onLoad = unobserve === "onLoad";
    var below = unobserve === "below" && position === "below";
    var intersect = unobserve === "intersect" && position === "intersect";
    var above = unobserve === "above" && position === "above";

    if (onLoad || below || intersect || above) { observer.unobserve(target); }
  }

  function checkOptionsErrors() {
    if (!isNonEmptyString(targets)) { errorDomSelector("targets"); }

    if (!isNumber(trigger) || trigger > 1 || trigger < 0)
      { throw new Error("`trigger` must be a number in 0..1 range"); }

    if (unobserve) {
      var c =
        ["onLoad", "below", "intersect", "above"].indexOf(unobserve) > -1;
      if (!c) {
        throw new Error(
          '`unobserve` must be equal to: "onLoad" or "below" or "intersect" or "above"'
        );
      } else if (progress && unobserve === "intersect") {
        throw new Error(
          'If `progress === true`, `unobserve` can\'t be equal to "intersect"'
        );
      }
    }

    if (!isNumber(throttle) && throttle > 0) {
      throw new Error("`throttle` must be a number > 0");
    }

    if (root && !isNonEmptyString(root)) { errorDomSelector("root"); }

    function errorDomSelector(optionName) {
      throw new Error(("`" + optionName + "` must be a valid DOM selector"));
    }
  }

  function errorNotInitialized() {
    throw new Error("`scroll-interactions` has not been initialized");
  }

  api.init = function () {
    if (isInitialized)
      { throw new Error("`scroll-interactions` has been already initialized"); }
    else { checkOptionsErrors(); }

    if (isNonEmptyString(root)) { rootElem = document.querySelector(root); }

    if (debug === true) { showDebugTrigger(rootElem); }

    io = new IntersectionObserver(handleIntersect, {
      rootMargin: setRootMargin(trigger),
      root: rootElem || null,
    });

    [].slice.call(document.querySelectorAll(targets)).forEach(function (el, i) {
      if (!el.hasAttribute("data-scroll-interactions")) {
        // Use setAttribute to track targets for scroll events and cache
        // unobserved targets
        el.setAttribute("data-scroll-interactions", i);
      }

      if (unobservedTargets.indexOf(i) === -1) { io.observe(el); }
    });

    isInitialized = true;

    return api;
  };

  api.observe = function (fn) {
    if (!isInitialized) { errorNotInitialized(); }
    if (typeof fn === "function") { observe = fn; }
    else { throw new Error("`observe` requires a function"); }

    return api;
  };

  api.disconnect = function (emptyCache) {
    if ( emptyCache === void 0 ) emptyCache = false;

    if (!isInitialized) { errorNotInitialized(); }
    if (progress) { scrollEvents.forEach(function (ref) {
      var removeScroll = ref.removeScroll;

      return removeScroll();
      }); }
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

module.exports = scroll_interactions;
