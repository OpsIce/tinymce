define(
  'ephox.alloy.positioning.layout.Anchor',

  [
    'ephox.alloy.positioning.layout.Origins',
    'ephox.katamari.api.Struct',
    'global!window'
  ],

  function (Origins, Struct, window) {
    /*
     * Smooths over the difference between passing an element anchor (which requires an origin to determine the box) and passing a box.
     *
     * It is only useful for fixed origins; relative needs to do everything the old way.
     */
    var anchor = Struct.immutable('anchorBox', 'origin');

    var fixedOrigin = function () {
      return Origins.fixed(0, 0, window.innerWidth, window.innerHeight);
    };

    var element = function (anchorElement) {
      var origin = fixedOrigin();
      var anchorBox = Origins.toBox(origin, anchorElement);

      return anchor(anchorBox, origin);
    };

    var box = function (anchorBox) {
      var origin = fixedOrigin();

      return anchor(anchorBox, origin);
    };

    return {
      box: box,
      element: element
    };
  }
);