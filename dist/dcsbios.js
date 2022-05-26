import Socket from './socket.js';
import log from './log.js';

export default class DcsBios {
  constructor() {
    this.data = new Array(0xFFFF);
    this.listeners = [];
    this.socket = new Socket(this.handleMessage.bind(this));
  }

  send(data) {
    this.socket.send(data);
  }

  addListener(start, end, handler) {
    this.listeners.push({
      start : start,
      end : end,
      handler :handler,
    });
  }

  async handleData(addr, data) {
    for (let i = 0; i < data.length; i++) {
      this.data[addr + i] = data[i];
    }

    for (const listener of this.listeners) {
      if (addr >= listener.start && addr < listener.end) {
        listener.handler(listener.start, this.data.slice(listener.start, listener.end));
      }
    }
  }

  async handleBlob(blob) {
    let arr = await new Response(blob).arrayBuffer();
    let buf = new Uint8Array(arr);

    let addr = buf[0] + (buf[1] << 8);
    let data = buf.slice(2);
    this.handleData(addr, data);
  }

  async handleMessage(msg) {
    if (msg instanceof Blob) {
      this.handleBlob(msg);
      return;
    }

    log(msg);
  }
}