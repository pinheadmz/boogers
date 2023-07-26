/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */
/* eslint max-len: "off" */
'use strict';

const assert = require('bsert');
const {Keys, Event, Relay} = require('../lib/nostr');

describe('Nostr', function () {
  describe('Classes: create and post', function () {
    this.timeout(10000);

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

  describe.only('Tags', function () {
    const json = {
      'content': '',
      'created_at': 1690403443,
      'id': 'dcb118f7428f34847f11652b696f72467ae4474b8b951e8a1556ba6cdcd79c47',
      'kind': 9735,
      'pubkey': '79f00d3f5a19ec806189fcab03c1be4ff81d18ee4f653c88fac41fe03570f432',
      'sig': 'cf4b84fe53f01fc033f441cbffd13d9225b29d1f5e600f5a76e1a91fef1fe0fd52afeb488df8026acdff534d10af94569ccdf50d447abe18e10d2abf7a90bfc7',
      'tags':
      [
        [
          'p',
          'a3eb29554bd27fca7f53f66272e4bb59d066f2f31708cf341540cb4729fbd841'
        ],
        [
          'e',
          'a97669890f6645441887f3a1ccb38e57023403ad5b2368fbd8e8efc804eec4bc'
        ],
        [
          'bolt11',
          'lnbc230n1pjvrqnwpp5wzwk83p3aees5q74g6qe0njwj0g0evhnqncjjacdq6699n2jtgkshp5cv5ek4ly60zuxl3wrs3h7j4nlue4kql032rcs2lh35msjhhuzg6qcqzzsxqyz5vqsp5zecrdpv4hg4xmz8delq7c54auv209u3vp85y3fgh0sdkknv7plts9qyyssqtsg5pd44adt9ck0t8ldzcl0knhjxk04sxm0sj0nekdv2raadm5n5vtqc5n7vtmsnzu5mq3e2le26krkelnzwpx36ea7a70sa5fmkafsqj6nnf5'
        ],
        [
          'preimage',
          'b0d8506b640718086c26667a4e17d09c00ade5cc317ca3cf2d430ce9c44d2f91'
        ],
        [
          'description',
          '{\"pubkey\":\"c89cf36deea286da912d4145f7140c73495d77e2cfedfb652158daa7c771f2f8\",\"content\":\"\",\"id\":\"99b8219fdb894edac9237c19d679dfea224fb5a0f90c29a0345c3ff98bfca06d\",\"created_at\":1690403437,\"sig\":\"cb4338ed7077a27df666368feba7cea2f3b6b3d69d9b9ae3d6efae540e79da896980167779ee311aec438ea1e50e545b2d5d86b40ec30a83974a0d74c1e569cc\",\"kind\":9734,\"tags\":[[\"e\",\"a97669890f6645441887f3a1ccb38e57023403ad5b2368fbd8e8efc804eec4bc\"],[\"p\",\"a3eb29554bd27fca7f53f66272e4bb59d066f2f31708cf341540cb4729fbd841\"],[\"relays\",\"wss://feeds.nostr.band/meme\",\"wss://relay.nostr.wirednet.jp\",\"wss://nostr.wine\",\"wss://purplepag.es\",\"wss://relay.chicagoplebs.com\",\"wss://nos.lol\",\"wss://nostr-world.h3z.jp\",\"wss://nostr-relay.nokotaro.com\",\"wss://relay.damus.io\",\"wss://nostr.shroomslab.net\"]]}'
        ]
      ]
    };

    let desc;

    it('should parse zap receipt', () => {
      const rec = new Event(json);
      assert(rec.verify());
      const p = rec.getTagValue('p');
      assert.strictEqual(p, 'a3eb29554bd27fca7f53f66272e4bb59d066f2f31708cf341540cb4729fbd841');
      const es = rec.getTagValues('e');
      assert.deepStrictEqual(es, ['a97669890f6645441887f3a1ccb38e57023403ad5b2368fbd8e8efc804eec4bc']);
      desc = rec.getTagValue('description');

      assert.deepStrictEqual(json, rec.getJSON());
    });

    it('should parse zap request', () => {
      const req = new Event(JSON.parse(desc));
      assert.deepStrictEqual(JSON.parse(desc), req.getJSON());
      assert(req.verify());
      const relays = req.getTagValues('relays');
      assert(Array.isArray(relays));
      assert.strictEqual(relays.length, 10);

      assert.throws(() => {
        req.getTagValue('relays');
      });

      assert.strictEqual(req.getTagValue('blah'), null);
      assert.deepStrictEqual(req.getTagValues('blah'), []);
    });
  });
});
