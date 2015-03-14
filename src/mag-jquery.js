(function (root, factory) {
  var name = 'mag$';
  if (typeof define === 'function' && define.amd) {
    define(['mag',' jquery'], function (mag, $) {
        return (root[name] = factory(mag, $));
    });
  } else if (typeof exports === 'object') {
    module.exports = factory(require('./mag'), require('jquery'));
  } else {
    root[name] = factory(mag, $);
  }
}(this, function (mag, $) {

  var normalizeOffsets = function (e) {
    var offset = $(e.target).offset();
    return {
      x: e.pageX - offset.left,
      y: e.pageY - offset.top
    };
    return e;
  };

  var ratioOffsets = function (e) {
    var normOff = normalizeOffsets(e);
    var $target = $(e.target);
    return {
      x: normOff.x / $target.width(),
      y: normOff.y / $target.height()
    }
  };

  var ratioOffsetsFor = function ($target, x, y) {
    return {
      x: x / $target.width(),
      y: y / $target.height()
    }
  };

  var cssPerc = function (frac) {
    return (frac * 100) + '%';
  };

  var toCSS = function (pt) {
    var css = {};
    if (pt.x !== undefined) css.left = cssPerc(pt.x);
    if (pt.y !== undefined) css.top = cssPerc(pt.y);
    if (pt.w !== undefined) css.width = cssPerc(pt.w);
    if (pt.h !== undefined) css.height = cssPerc(pt.h);
    return css;
  };

  var mag$ = function (options) {

    return this.each(function() {

      var $el = $(this);

      options = $.extend({
        //move: 'follow'
        move: 'drag'
      }, options);

      var model = {
        mode: 'overflow',
        focus: {
          x: 0.5,
          y: 0.5
        },
        zoom: 1,
        lens: {
          w: 0,
          h: 0
        }
      };



      var render = function () {
        var lens, full;
        lens = model.lazyLens;
        full = model.lazyFull;
        var css = toCSS(lens);
        $lens.css(css);
        var fullCSS = toCSS(full);
        $full.css(fullCSS);
      };


      $el.addClass('mag-host');

      var $lens = $('<div class="mag-lens"></div>');
      $lens.appendTo($el);

      var $noflow = $('<div class="mag-noflow"></div>');
      $noflow.appendTo($el);

      var $zone = $('<div class="mag-zone"></div>');
      $zone.appendTo($noflow);

      var $full = $('<div class="mag-full"></div>');
      $full.html(options.content);
      $full.appendTo($noflow);


      mag.compute(model);

      model.lazyFocus = {
        x: model.focus.x,
        y: model.focus.y
      };
      model.lazyLens = {
        x: model.lens.x,
        y: model.lens.y,
        w: model.lens.w,
        h: model.lens.h
      };
      model.lazyFull = {
        x: model.full.x,
        y: model.full.y,
        w: model.full.w,
        h: model.full.h
      };
      model.lazyZoom = model.zoom;

      render();


      var lazyRate = 1;
      var frameSpeed = 100;
      var baseDragRate = 0.2;
      var zoomRate = 0.5;


      var renderLoop = function () {
        model.lazyFocus.x += (model.focus.x - model.lazyFocus.x) * lazyRate;
        model.lazyFocus.y += (model.focus.y - model.lazyFocus.y) * lazyRate;
        model.lazyFull.x += (model.full.x - model.lazyFull.x) * lazyRate;
        model.lazyFull.y += (model.full.y - model.lazyFull.y) * lazyRate;
        model.lazyFull.w += (model.full.w - model.lazyFull.w) * lazyRate;
        model.lazyFull.h += (model.full.h - model.lazyFull.h) * lazyRate;
        // model.lazyLens.x += (model.lens.x - model.lazyLens.x) / lazyRate;
        // model.lazyLens.y += (model.lens.y - model.lazyLens.y) / lazyRate;
        // model.lazyLens.w += (model.lens.w - model.lazyLens.w) / lazyRate;
        // model.lazyLens.h += (model.lens.h - model.lazyLens.h) / lazyRate;
        model.lazyZoom += (model.zoom - model.lazyZoom) * lazyRate;

        render();
      };

      var ratios = {
        x: model.focus.x,
        y: model.focus.y
      };

      if (options.move === 'drag') {
        lazyRate = 0.5;
        frameSpeed = 20;
        var dragging = false;

        var dragInterval = setInterval(function () {
          // console.log('focus', model.focus);
          if (! dragging) return;

          var focus = model.focus;

          var dragRate =  baseDragRate * (1 / model.zoom);
          focus.x += (ratios.x - 0.5) * dragRate;
          focus.y += (ratios.y - 0.5) * dragRate;

          console.log('focus', focus);

          focus = {
            x: mag.minMax(focus.x, 0, 1),
            y: mag.minMax(focus.y, 0, 1)
          };

          model.focus = focus;

          mag.compute(model);
        }, 50);

        $zone.drag('start', function () {
          dragging = true;
        });

        $zone.drag('end', function () {
          dragging = false;
        });

        $zone.drag(function( e, dd ){
          console.log('drag', dd);
          console.log('e', e);

          var offset = $zone.offset();
          ratios = ratioOffsetsFor($zone, e.pageX - offset.left, e.pageY - offset.top);
        });
      }
      //else if (options.move === 'follow') {
      //  rate = 5;
      //
      //  $zone.on('mousemove', function(e){
      //    console.log('e', e);
      //
      //    ratios = ratioOffsets(e);
      //    ratios = {
      //      x: mag.minMax(ratios.x, 0, 1),
      //      y: mag.minMax(ratios.y, 0, 1)
      //    };
      //    console.log('ratios', ratios);
      //    model.focus.x = ratios.x;
      //    model.focus.y = ratios.y;
      //
      //    mag.compute(model);
      //  });
      //}
      //else {
      //  throw new Error("No 'move' option specified.");
      //}


      $zone.on('mousewheel', function (e) {
        e.preventDefault();

        var delta = e.deltaY * zoomRate;

        var zoom = model.zoom;
        zoom += delta;
        zoom = mag.minMax(zoom, 1, 10);

        model.zoom = zoom;

        mag.compute(model);

        console.log('full', model.full);
        console.log('focus', model.focus);
        console.log('zoom', model.zoom);
      })

      var interval = setInterval(renderLoop, frameSpeed);

    });
  };

  $.fn.mag = mag$;

  return mag$;
}));
