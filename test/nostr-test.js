/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */
/* eslint max-len: "off" */
'use strict';

const assert = require('bsert');
const {Keys, Event, Relay} = require('../lib/nostr');

const note = {
  'pubkey': '32b061ccac2eb352570c95175ec6351b10f65611ec0a4c0009ba11cd56151880',
  'content': 'hello boogers.',
  'id': '609877181713756fd0bcf6043c91e29c2f2194e0b566dec4ff38af0aaa08692c',
  'created_at': 1689035835,
  'sig': '775bd6021a00fd644d5951df06b7fdf1cb5c6c8a1484c89b0fd97e868859e4adf6b3b55f16fe6dca749bc3efe922e0340c50ee19125f17c60627d5d919551329',
  'kind': 1,
  'tags':
  [
    ['client', 'coracle']
  ]
};

const nsec = 'nsec147wn6s63qgpt35e6xqr2vmms0932g0v4csh6st62furdpkz04c9skhfc4t';
const npub = 'npub1x2cxrn9v96e4y4cvj5t4a334rvg0v4s3as9ycqqfhggu64s4rzqq5tklr7';
const pub = '32b061ccac2eb352570c95175ec6351b10f65611ec0a4c0009ba11cd56151880';
const priv = 'af9d3d43510202b8d33a3006a66f707962a43d95c42fa82f4a4f06d0d84fae0b';

describe('Nostr', function () {
  this.timeout(10000);

  it('should generate keys', () => {
    Keys.generate();
  });

  it('should derive keys', () => {
    const h = Keys.importHex(priv);
    assert.bufferEqual(h.priv, Buffer.from(priv, 'hex'));
    assert.bufferEqual(h.pub, Buffer.from(pub, 'hex'));
    assert.strictEqual(h.nsec, nsec);
    assert.strictEqual(h.npub, npub);

    const s = Keys.importNsec(nsec);
    assert.bufferEqual(s.priv, Buffer.from(priv, 'hex'));
    assert.bufferEqual(s.pub, Buffer.from(pub, 'hex'));
    assert.strictEqual(s.nsec, nsec);
    assert.strictEqual(s.npub, npub);
  });

  it('should serialize event', () => {
    const e = new Event(note);
    const id = e.getID();
    assert.strictEqual(id, note.id);
  });

  it('should verify event', () => {
    const e = new Event(note);
    assert(e.verify());
  });

  it('should re-sign event', () => {
    const e = new Event(note);
    e.id = null;
    e.pubkey = null;
    e.sig = null;

    const k = Keys.importHex(priv);
    e.sign(k);
    assert(e.verify());
    assert.strictEqual(e.id, note.id);
    assert.strictEqual(e.pubkey, note.pubkey);
  });

  it('should create keys and an event, sign it, and relay it', async () => {
    const keys = Keys.generate();

    const event = new Event();
    event.content = `Hello world, check out this random float: ${Math.random()}`;
    event.sign(keys);

    await Relay.sendEventToRelays(
      event,
      [
        'wss://nos.lol',            // might require POW
        'wss://google.com',         // unexpected response
        'wss://relay.damus.io',
        'wss://offchain.pub',
        'wss://relay.snort.social'  // no active subscription
      ]);
  });
});
