'use strict';
const {Keys} = require('../lib/nostr');

let out = {npub: 'npub1nothing'};
const find = '8l0cks';

while (out.npub.split('npub1')[1].substr(0, find.length) !== find) {
  out = Keys.generate();
  console.log(out);
}
