'use strict';

// import { assert } from 'chai';
//
// describe('npm addict', function() {
//   it('...', function() {
//
//   });
// });

let Twit = require('twit');

let twit = new Twit({
  consumer_key: 'stQM0CNOLnbAuOg2G0t0HhvQF', // eslint-disable-line
  consumer_secret: 'URbIolavIxXutcmJyHCzREoKJbV92vcFFY7uartWhbFAZLaf3z', // eslint-disable-line
  access_token: '4841972786-M9ThYtA11VmrADpJAzidOwnwfG0mJs3uM5JBexR', // eslint-disable-line
  access_token_secret: 'k98dE8eV1u5qyzapiZpvi0s1AyN8rTSPZkXjpsR99oiOg', // eslint-disable-line
  timeout_ms: 60*1000 // eslint-disable-line
});

twit.post('statuses/update', { status: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ultricies cursus venenatis. Vestibulum non libero. xxxxxxxxxxxxx iuiuiuoiu kj lkjlkjl jlkjdsglkjsdg https://en.wikipedia.org/wiki/Lorem_ipsum' }, function(err, data) {
  console.log(err);
  console.log(data);
});
