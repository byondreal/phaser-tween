var get = require('getsetprop').get;
var check = require('easier-types');

check.addTypes({
  'game': function(value) {
    return 'function' === typeof get(value, 'add.tween');
  },
  'easing': function(value) {
    return 'function' === typeof value ||
      ('function' === typeof get(window, 'Phaser.Easing.' + value));
  }
});

function tween(obj, opts, game, done, timeScale) {
  if (Array.isArray(opts)) {
    return chain(obj, opts, game, done, timeScale);
  }
  if (opts && opts.keyframes) {
    return keyframes(obj, opts, game, done, timeScale);
  }

  check(obj).is('object');
  check(opts).is({
    values: 'object',
    duration: 'number',
    easing: 'easing?',
    delay: 'number?',
    repeat: 'number?',
    yoyo: 'boolean?',
  });
  check(game).is('game');
  check(done).is('function?');
  check(timeScale).is('number?');

  timeScale = timeScale || 1;
  var duration = opts.duration * timeScale;
  var delay = opts.delay ? opts.delay * timeScale : 0;

  var t = game.add.tween(obj).to(
    opts.values,
    duration || 10,
    getEasing(opts.easing),
    false,
    delay,
    opts.repeat,
    opts.yoyo
  );
  if (done) {
    t.start().onComplete.add(function() {
      done();
    });
  }
  return t;
}

function chain(obj, opts, game, done, timeScale) {
  var duration = opts.reduce(function(total, tweenOpts) {
    if (tweenOpts.keyframes) {
      return total + getKeyframesDuration(tweenOpts);
    }
    return total + tweenOpts.duration;
  }, 0);
  duration *= timeScale || 1;

  var firstTween;
  opts.reduce(function(lastTween, tweenOpts) {
    var t = tween(obj, tweenOpts, game, undefined, timeScale);
    if (!lastTween) {
      firstTween = t;
    } else {
      lastTween.chain(t);
    }
    return t;
  }, null);

  var t = getGenericTween(duration, game, done);
  t.start = wrap(t.start, function() {
    firstTween.start();
  });
  if (done) {
    t.start();
  }
  return t;
}

function keyframes(obj, opts, game, done, timeScale) {
  check(obj).is('object');
  check(opts).is({
    property: 'string',
    keyframes: 'array',
    easing: 'easing?',
  });
  check(game).is('game');
  check(done).is('function?');
  check(timeScale).is('number?');

  var firstTween;
  timeScale = timeScale || 1;
  var duration = timeScale * getKeyframesDuration(opts);

  opts.keyframes.reduce(function(lastTween, frame) {
    var kfOpts;
    if (Array.isArray(frame)) {
      var values = {};
      values[opts.property] = frame[2];
      kfOpts = {
        values: values,
        duration: frame[1],
        delay: frame[0],
        easing: opts.easing,
      };
    } else if (typeof frame === 'object') {
      kfOpts = frame;
    } else {
      throw new Error('unknown keyframe object: ' + JSON.stringify(frame));
    }

    var t = tween(obj, kfOpts, game, undefined, timeScale);
    if (!lastTween) {
      firstTween = t;
    } else {
      lastTween.chain(t);
    }
    return t;
  }, null);

  var t = getGenericTween(duration, game, done);
  t.start = wrap(t.start, function() {
    firstTween.start();
  });
  if (done) {
    t.start();
  }
  return t;
}

function wrap(fn, deco) {
  return function() {
    deco();
    return fn.apply(this, arguments);
  };
}

function getKeyframesDuration(opts) {
  return opts.keyframes.reduce(function(duration, frame) {
    check(frame).is(['number', 'number', 'number']);
    return duration + frame[0] + frame[1];
  }, 0);
}

function getEasing(easing) {
  if ('function' === typeof easing) {
    return easing;
  }
  return get(window.Phaser.Easing, easing || 'Default');
}

function getGenericTween(duration, game, done) {
  done = done || noop;
  var t = game.add.tween({ duration: 0 });
  t.to({ duration: duration }, duration || 10, getEasing('Linear.None'));
  t.onComplete.add(function() { done(); });
  return t;
}

function maker(obj, optsParent, game) {
  check(obj).is('object');
  check(optsParent).is('object');
  return function(optsName) {
    check(optsName).is('string');
    return tween(obj, optsParent[optsName], game);
  };
}

function noop() {}

tween.maker = maker;
tween.keyframes = keyframes;
module.exports = tween;

