# scrollzzz

Lightweight zero-dependency package which use [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to check when an element intersect a boundary line inside the viewport.

## Quick start

```js
const scroller = scrollzzz({
  entries: '.entry',
  trigger: 0.5,
  debug: ''
});

scroller
  .init()
  .onIntersect(({ direction, entry }) => {
    console.log(direction, entry);
  });
```

## Documentation

Read jsdoc comments inside [*index.js*](index.js) and see [*index.html*](docs/index.html) example for more info.

## Notes

Inspired by [scrollama](https://github.com/russellgoldenberg/scrollama/).

Tested in Chrome, Firefox, Edge; it works even if the browser is zoomed.
