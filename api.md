# API

- [API](#api)
  - [`scroll_interactions`](#scroll_interactions)
  - [`options`](#options)
    - [`options.targets`](#optionstargets)
    - [`options.trigger`](#optionstrigger)
    - [`options.unobserve`](#optionsunobserve)
    - [`options.progress`](#optionsprogress)
    - [`options.throttle`](#optionsthrottle)
    - [`options.root`](#optionsroot)
    - [`options.debug`](#optionsdebug)
  - [Methods](#methods)
    - [`init()`](#init)
    - [`observe(results)`](#observeresults)
    - [`disconnect(emptyCache)`](#disconnectemptycache)
    - [`update(options, emptyCache)`](#updateoptions-emptycache)

## `scroll_interactions`

> **Required**
>
> Type: `Function`
>
> Returns: `Object` with some methods

Create a new `scroll_interactions` instance with some [options](#options):

```js
import scroll_interactions from "scroll-interactions";

const observe_elements = scroll_interactions(options);
```

It returns chainable [methods](#methods).

## `options`

> **Required**
>
> Type: `Object`

Set `scroll_interactions` options.

### `options.targets`

> **Required**
>
> Type: `String`

DOM element/s selector.

### `options.trigger`

> Type: `String`
>
> Defaults: `1`

Position of the trigger relative to [root](#optionsroot) top. Range `0..1`, where `0` is top and `1` is bottom.

### `options.unobserve`

> Type: `String`
>
> Defaults: `Undefined`

[Unobserve](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/unobserve) target elements:

- `"onLoad"` after first page load.
- `"below"` when they are below the trigger.
- `"intersect"` as soon as they intersect the trigger.
- `"above"` when they are above the trigger.

### `options.progress`

> Type: `Boolean`
>
> Defaults: `false`

Add `progress` to [`observe()`](#observeresults) method. Track the percent of completion relative to the target top border.

### `options.throttle`

> Type: `Number`
>
> Defaults: `Undefined`

Add throttle in millisecond to scroll event listener.

Note: Only works if [`options.progress: true`](#optionsprogress).

### `options.root`

> Type: `String`
>
> Defaults: `Document Viewport`

Set [`IntersectionObserver.root`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/root), the element used as viewport for checking visibility of the target.

### `options.debug`

> Type: `Boolean`
>
> Default: `false`

Show the trigger line for debugging.

## Methods

The `scroll_interactions` function returns some chainable methods.

```js
const observe_elements = scroll_interactions(options);

observe_elements
  .init()
  .observe()
  // ...
```

### `init()`

> **Required**
>
> Type: `Function`
>
> Returns: `scroll_interactions` methods

Start to [observe](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/observe) elements.

Be sure to initialize it after all elements has been rendered with their correct size and position, otherwise it'll not work as intended (`window.onLoad` listener may be useful in this type of situations).

### `observe(results)`

> Type: `Function`
>
> Argument: `results={direction, position, progress, entry}`
>
> Returns: `scroll_interactions` methods

Callback to handle element observation.

You've access to one argument, an object with those properties:

- `direction` scroll direction (`"up"`, `"down"`).
- `position` element position relative to the trigger (`"below"`, `"intersect"`, `"above"`).
- `progress` percent of completion relative to the target top border.
- `entry` original IntersectionObserver entry.

Note: `progress` only works if only if [`options.progress: true`](#optionsprogress).

### `disconnect(emptyCache)`

> Type: `Function`
>
> Argument: `emptyCache=false`
>
> Returns: `scroll_interactions` methods

[Disconnect IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/disconnect), stops watching all target elements.

If `emptyCache: true` scroll_interactions will not remember which targets has been previously [unobserved](#optionsunobserve), therefor if scroll_interactions is re-initialized all targets will be observed again.

### `update(options, emptyCache)`

> Type: `Function`
>
> Arguments: `options={}`, `emptyCache=false`
>
> Returns: `scroll_interactions` methods

Re-initialize scroll_interactions.

The first argument is an object, you can pass the same initial [options](#options). The second argument is the same as [`disconnect()`](#disconnectemptycache) method.

If you use [`progress`](#optionsprogress) or if you use a custom [`root`](#optionsroot), you must `update()` scroll_interactions on window resize and orientation change events (to ensure targetHeight and triggerPosition are re-calculated correctly).
