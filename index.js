var get = require('getsetprop').get;

var check = require('easier-types');

check.addTypes({
  'game-object': function(value) {
    return 'function' === typeof get(value, 'game.add.tween');
  },
  'easing': function(value) {
    return 'function' === typeof value ||
      ('function' === typeof get(window, 'Phaser.Easing.' + value));
  }
});

function tween(obj, opts, game) {
  if (game) {
    try {
      check(game).is(window.Phaser.Game);
    } catch(e) {
      throw 'Phaser not loaded as window.Phaser';
    }
  } else {
    check(obj).is('game-object');
    game = obj.game;
  }
  check(opts).is({
    values: 'object',
    duration: 'number',
    easing: 'easing',
    delay: 'number?',
    repeat: 'boolean?',
    yoyo: 'boolean?'
  });

  var easing = opts.easing;
  if ('function' !== typeof easing) {
    easing = get(window.Phaser.Easing, opts.easing);
  }

  var t = game.add.tween(obj);
  t.to(opts.values, opts.duration, easing, false, opts.delay,
    opts.repeat, opts.yoyo);
  return t;
}

function tweenMaker(obj, optsParent) {
  check(obj).is('object');
  check(optsParent).is('object');
  return function(optsName) {
    check(optsName).is('string');
    return tween(obj, optsParent[optsName]);
  };
}

tween.maker = tweenMaker;
module.exports = tween;

