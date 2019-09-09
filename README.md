# scrollzzz

![size-badge](https://img.shields.io/github/size/pldg/scrollzzz/index.min.js.svg)
![downloads-badge](https://img.shields.io/npm/dt/scrollzzz.svg)

Lightweight zero-dependency package which use [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to check when an element intersect a boundary line inside the viewport.

## Why

Make it easy to create scroll-driven interactions in the browser.

## Install

### CDN

```html
<script src="https://unpkg.com/scrollzzz/index.min.js"></script>
```

### NPM

`npm install --save scrollzzz`

## Quick start

```js
const scroller = scrollzzz({
  entries: '.entry',
  trigger: 0.5,
  debug: true
});

scroller
  .init()
  .onIntersect(({ direction, entry }) => { ... })
  .onScroll(({ direction, entry, progress }) => { ... });
```

## Examples

Some [examples](https://pldg.github.io/scrollzzz/) online.

See *index.html* examples files inside [*docs*](docs/) folder.

## How it works

`onIntersect()` fires only when element enter or exit the trigger line.

`onScroll()` fires when element intersect the trigger: it adds a scroll event listener to keep track of `progress` (the
percent of completion relative to the trigger top position), when the element leave the trigger the event listener is removed.

## API

Look at [*index.js*](index.js) file.

## Notes

Tested in latest version of Chrome, Firefox, Edge. If you need support for older browser you can use the official [IntersectionObserver polyfill](https://github.com/w3c/IntersectionObserver/tree/master/polyfill).

It works even if the browser is zoomed.

Inspired by [scrollama](https://github.com/russellgoldenberg/scrollama/).
