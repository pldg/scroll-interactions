// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
export default function addPassiveIfSupported() {
  let passive = false;
  try {
    const options = {
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