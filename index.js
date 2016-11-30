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

function tween(obj, opts, game, done) {
  if (opts && opts.keyframes) {
    return keyframes(obj, opts, game, done);
  }
  if (opts && Array.isArray(opts)) {
    return keyframes(obj, { keyframes: opts }, game, done);
  }

  check(obj).is('object');
  check(opts).is({
    values: 'object',
    duration: 'number',
    easing: 'easing?',
    delay: 'number?',
    repeat: 'number?',
    yoyo: 'boolean?',
    timeScale: 'number?',
  });
  check(game).is('game');
  check(done).is('function?');

  var t = game.add.tween(obj).to(
    opts.values,
    // hack because of Phaser defaulting to duration of a second,
    // even for duration explicitly sent as 0
    opts.duration || 1,
    getEasing(opts.easing),
    false, // autoStart
    opts.delay,
    opts.repeat,
    opts.yoyo
  );
  if (typeof opts.timeScale === 'number') {
    t.timeScale = opts.timeScale;
  }
  if (done) {
    t.start().onComplete.add(function() {
      done();
    });
  }
  return t;
}

function keyframes(obj, opts, game, done) {
  check(obj).is('object');
  check(opts).is({
    keyframes: 'array',
    property: 'string?',
    easing: 'easing?',
    timeScale: 'number?',
  });
  check(game).is('game');
  check(done).is('function?');

  var t = game.add.tween(obj);
  opts.keyframes.forEach(function(kf) {
    if (Array.isArray(kf)) {
      check(opts.property).is('string');
      check(kf).is(function(val) {
        return val.length === 3 && val.every(function(prop) {
          return typeof prop === 'number';
        });
      });
      var values = {};
      values[opts.property] = kf[2];
      t.to(values, kf[1] || 1, getEasing(opts.easing), false, kf[0]);
      return;
    }
    check(kf).is({
      values: 'object',
      duration: 'number',
      easing: 'easing?',
      delay: 'number?',
    });
    t.to(kf.values, kf.duration || 1, getEasing(kf.easing),
      false, kf.delay);
  });

  if (typeof opts.timeScale === 'number') {
    t.timeScale = opts.timeScale;
  }
  if (done) {
    t.start().onComplete.add(function() {
      done();
    });
  }
  return t;
}

function getEasing(easing) {
  easing = easing || 'Default';
  check(easing).is('easing');

  if ('function' === typeof easing) {
    return easing;
  }
  return get(window.Phaser.Easing, easing);
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
module.exports = tween;

