/* eslint max-len: "off" */
'use strict';

const {WebSocket} = require('ws');
const {SHA256, schnorr, encoding} = require('bcrypto');
const {bech32} = encoding;

class Keys {
  constructor() {
    this.priv = Buffer.alloc(0, 32);
    this.pub = Buffer.alloc(0, 32);
    this.nsec = '';
    this.npub = '';
  }

  generate() {
    this.priv = schnorr.privateKeyGenerate();
    return this.derive();
  }

  derive() {
    this.pub = schnorr.publicKeyCreate(this.priv);
    this.npub = bech32.serialize('npub', bech32.convertBits(this.pub, 8, 5, true));
    this.nsec = bech32.serialize('nsec', bech32.convertBits(this.priv, 8, 5, true));
    return this;
  }

  static generate() {
    return new this().generate();
  }

  static importHex(hex) {
    const keys = new this();
    keys.priv = Buffer.from(hex, 'hex');
    return keys.derive();
  }

  static importNsec(nsec) {
    const [, data] = bech32.deserialize(nsec);
    const bytes = bech32.convertBits(data, 5, 8, false);
    const keys = new this();
    keys.priv = bytes;
    return keys.derive();
  }
}

class Event {
  constructor(json) {
    this.pubkey = '';
    this.content = '';
    this.id = '';
    this.created_at = parseInt(new Date().valueOf() / 1000);
    this.sig = '';
    this.kind = 1;
    this.tags = [];

    if (json) {
      this.pubkey = json.pubkey;
      this.content = json.content;
      this.id = json.id;
      this.created_at = json.created_at;
      this.sig = json.sig;
      this.kind = json.kind;
      this.tags = json.tags.slice();
    }
  }

  serialize() {
    return JSON.stringify(
      [
        'EVENT',
        {
          id: this.id,
          pubkey: this.pubkey,
          sig: this.sig,
          created_at: this.created_at,
          kind: this.kind,
          tags: this.tags,
          content: this.content
        }
      ]);
  }

  getID() {
    const string = JSON.stringify([
      0,
      this.pubkey,
      this.created_at,
      this.kind,
      this.tags,
      this.content
    ]);
    const hash = SHA256.digest(Buffer.from(string, 'utf8'));
    const hex = hash.toString('hex');
    return hex;
  }

  setID() {
    this.id = this.getID();
    return this.id;
  }

  verify() {
    if (!this.id || !this.sig || !this.pubkey)
      return false;

    const id = this.getID();
    if (this.id !== id)
      return false;

    return schnorr.verify(
      Buffer.from(this.id, 'hex'),
      Buffer.from(this.sig, 'hex'),
      Buffer.from(this.pubkey, 'hex'));
  }

  sign(key) {
    this.pubkey = key.pub.toString('hex');
    this.setID();
    this.sig = schnorr.sign(
      Buffer.from(this.id, 'hex'),
      key.priv)
        .toString('hex');
    return this;
  }
}

class Relay {
  constructor(host) {
    this.host = host;
    this.socket = null;
  }

  async open() {
    this.socket = new WebSocket(this.host);

    const waiter = new Promise((resolve, reject) => {
      this.socket.once('open', () => {
        console.log(`socket open to ${this.host}\n`);
        resolve();
      });

      this.socket.once('error', (err) => {
        reject(err);
      });
    });

    this.socket.on('error', (err) => {
      console.log(`${err.message}\n`);
    });

    await waiter;
  }

  close() {
    this.socket.close();
    this.socket = null;
    console.log(`socket closed to ${this.host}\n`);
  }

  async sendEvent(event) {
    const waiter = new Promise((resolve) => {
      let timeout;

      const handler = (msg) => {
        console.log(`received from ${this.host}:\n  ${msg.toString('utf8')}\n`);
        clearTimeout(timeout);
        resolve();
      };

      timeout = setTimeout(() => {
          console.log('timed out waiting for socket response\n');
          if (this.socket)
            this.socket.removeListener('message', handler);
          resolve();
        },
        2000);

      this.socket.once('message', handler);
    });

    const packet = event.serialize();
    console.log(`sending event ${event.id} to ${this.host}:\n`);
    this.socket.send(packet);
    await waiter;
  }

  static async sendEventToRelays(event, hosts) {
    for (const host of hosts) {
      try {
        const relay = new this(host);
        await relay.open();
        await relay.sendEvent(event);
        await relay.close();
      } catch (e) {
        console.log(`sending failed: ${e}\n`);
      }
    }
  }
}

exports.Keys = Keys;
exports.Event = Event;
exports.Relay = Relay;

