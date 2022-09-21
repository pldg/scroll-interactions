export default function addThrottle(fn, wait) {
  let time = Date.now();

  return function () {
    if (time + wait - Date.now() < 0) {
      fn();
      time = Date.now();
    }
  };
}
