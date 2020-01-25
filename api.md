# API

## Options

*Required* <br>
*Type:* `Object`

Setup initial options.

```js
const observe_elements = scrollzzz(options);
```

### `options.targets`

*Required* <br>
*Type:* `String`

DOM element/s selector.

### `options.trigger`

*Required* <br>
*Type:* `String` <br>
*Default:* `1`

Position of the trigger relative to [root](#optionsroot) top, range `0..1`, where `0` is top and `1` is bottom.

### `options.unobserve`

*Required* <br>
*Type:* `String`

[Unobserve targets](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/unobserve) on page load using `"onLoad"` or based on their position relative to the trigger using `"below"`, `"intersect"` (only works if `progress===false`), `"above"`.

### `options.progress`

*Required* <br>
*Type:* `Boolean` <br>
*Default:* `false`

Add `progress` to [`observe()`](#observeres) method.

### `options.throttle`

*Required* <br>
*Type:* `Number`

Add throttle in millisecond to scroll event listener (only works if `progress===true`).

### `options.root`

*Required* <br>
*Type:* `String`

Set [`IntersectionObserver.root`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/root), the element used as viewport for checking visibility of the target (defaults to browser viewport).

### `options.debug`

*Required* <br>
*Type:* `Boolean` <br>
*Default:* `false`

Show trigger line.

## Methods

Scrollzzz returns the following chainable methods.

```js
observe_elements
  .init()
  .observe()
  // ...
```

### `init()`

Start to [observe](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/observe) elements.

### `observe(res)`

Callback to handle element observation.

You have access to 1 argument, an object with those properties:

- `direction` scroll direction
- `position` element position relative to the trigger
- `progress` percent of completion relative to the target top border (only if `options.progress===true`)
- `entry` original IntersectionObserver entry

### `disconnect(emptyCache)`

[Disconnect IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/disconnect), stops watching all of its target elements.

`emptyCache` defaults to `false`. If `emptyCache===true` scrollzzz will not remember which targets has been previously unobserved (see [`unobserve`](#optionsunobserve) option) therefor, if scrollzzz is re-initialized all targets will be observed again.

### `update(options, emptyCache)`

Re-init scrollzzz. The first argument is an object, you can pass the same initial [options](#options). The second argument is the same as [`disconnect()`](#disconnectemptycache) method.

If you use [`progress`](#optionsprogress) or if you use a custom [`root`](#optionsroot), you must `update()` scrollzzz on window resize and orientation change events (to ensure targetHeight and triggerPosition are re-calculated correctly).
