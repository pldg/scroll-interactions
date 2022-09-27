# `scroll-interactions`

## Introduction

Easy scroll-driven interactions in the browser built on top of [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). Set a hidden trigger line in the browser viewport and see how one or more elements relate to it. This package tells you when an element is above, below or intersect the trigger line. If the element intersect the trigger it can also calculate the percent of completion relative to the element's top border.

## Features

- Zero dependencies, lightweight (4kb).
- Get browser's scroll direction (downwards or upwards).
- Get element position relative to the trigger line (above, intersect, below).
- Get percent of completion relative to the target element's top border.
- Unobserve target elements.
- Change IntersectionObserver's root (defaults to browser viewport).
- Access the original IntersectionObserver entry elements.
- Disconnect IntersectionObserver.

## Install

### NPM

```sh
npm install --save scroll-interactions
```

### CDN

```html
<script src="https://unpkg.com/scroll-interactions/dist/scroll-interactions.iife.min.js"></script>
```

## Quick start

```html
<div class="box">box1</div>
<div class="box">box2</div>
<div class="box">box3</div>
```

```js
import scroll_interactions from "scroll-interactions";

const observe_box = scroll_interactions({
  targets: ".box",
  trigger: 0.5,
});

observe_box
  .init()
  .observe(({ direction, position }) => {
    // direction: scroll direction
    // position: element position relative to the trigger
  });
```

## Examples

Try those [examples](https://pldg.github.io/scroll-interactions/) and inspect their *index.html* source code for more info.

## API

Go to [API](api.md) page.

## How it works

The `observe()` method works as callback handler of [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), it fires one time on first page load, then it fires only when a target element enter or exit the trigger line.

If `progress: true` and a target element intersect the trigger line, a scroll event listener is added to keep track of `progress`, when the element leave the trigger line the event listener is removed.

When you use `unobserve` option, all targets that has been unobserved will be cached, if scroll-interactions is re-initialize it'll not observe them again (see [*docs/unobserve*](docs/unobserve/index.html) example), you can also empty the cache if needed (read [API](api.md) for reference).

## Browsers support

It works with all [browser that support IntersectionObserver](https://caniuse.com/?search=IntersectionObserver). For older browser make sure to add the official [IntersectionObserver polyfill](https://github.com/w3c/IntersectionObserver/tree/master/polyfill) before creating a `scroll_interactions` instance.

## Notes

It works even if the browser is zoomed.

At the moment support only vertical scrolling.

Inspired by [scrollama](https://github.com/russellgoldenberg/scrollama/).
