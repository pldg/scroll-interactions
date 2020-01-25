# scrollzzz

![size-badge](https://img.shields.io/github/size/pldg/scrollzzz/dist/scrollzzz.esm.min.js)
![downloads-badge](https://img.shields.io/npm/dt/scrollzzz.svg)

Lightweight, fast, zero-dependency package which use [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to observe when an element intersect a (trigger) boundary line inside the viewport.

## Why

Make it easy to create scroll-driven interactions in the browser without performance overload.

## Key features

You have access to:

- Scroll direction
- Element position relative to the trigger
- Percent of completion relative to the target top border
- The original IntersectionObserver entry

You can also:

- Unobserve targets
- Change IntersectionObserver.root
- Disconnect IntersectionObserver

And more.

## Install

### NPM

`npm install --save scrollzzz`

### CDN

```html
<script src="https://unpkg.com/scrollzzz/dist/scrollzzz.iife.min.js"></script>
```

## Quick start

```js
const observe_box = scrollzzz({
  targets: '.box',
  trigger: 0.5,
  debug: true
});

observe_box
  .init()
  .observe(({ direction, position, entry }) => { ... });
```

## Examples

See online [examples](https://pldg.github.io/scrollzzz/) and inspect their *index.html* source code for more info.

## API

Go to [API](api.md) page.

## How it works

`observe()` works as callback handler of [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), it fires on page load for all elements, then it fires only when element enter or exit the trigger line.

If `progress===true` and an element intersect the trigger, a scroll event listener is added to keep track of `progress`, when the element leave the trigger the event listener is removed. It make use of [passive](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners) to improve performance.

When you use `unobserve` option, scrollzzz will cache all targets that has been unobserved, if scrollzzz is re-initialize it'll not observe them again (see [*docs/unobserve*](docs/unobserve/index.html) example), you can also empty the cache if needed (read [API](api.md) for reference).

## Browsers support

Tested in IE11 and in the latest version of Chrome, Firefox, Edge, Safari. For older browser make sure to add the official IntersectionObserver [polyfill](https://github.com/w3c/IntersectionObserver/tree/master/polyfill) just before scrollzzz.

## Notes

It works even if the browser is zoomed.

Inspired by [scrollama](https://github.com/russellgoldenberg/scrollama/).
