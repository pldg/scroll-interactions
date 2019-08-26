# scrollzzz

![size-badge](https://img.shields.io/github/size/pldg/scrollzzz/index.min.js.svg)
![downloads-badge](https://img.shields.io/npm/dt/scrollzzz.svg)

Lightweight zero-dependency package which use [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to check when an element intersect a boundary line inside the viewport.

## Install

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/pldg/scrollzzz/index.min.js"></script>
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
  .onIntersect(({ direction, entry }) => {
    console.log(direction, entry);
  });
```

## Documentation

Read jsdoc comments inside [*index.js*](index.js) and see [*index.html*](docs/index.html) for more info.

## Demo

Online [demo](https://pldg.github.io/scrollzzz/) example.

## Notes

Inspired by [scrollama](https://github.com/russellgoldenberg/scrollama/).

Tested in Chrome, Firefox, Edge; it works even if the browser is zoomed.
