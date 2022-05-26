import log from './log.js';

export default class Socket {
  constructor(handler) {
    this.handler = handler;
    this.connect(handler);
  }

  connect(handler) {
    log("[Socket] Connecting");
    var h = location.hostname;

    if (this.socket) {
      this.socket.close();
    }

    this.reconnecting = false;
    this.socket = new WebSocket(`ws://${h}:8217/ws`);
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
  }

  reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;
    setTimeout(() => {
      if (this.reconnecting)
        this.connect();
    }, 500);
  }

  send(msg) {
    // TODO: Queue? Maybe queue to depth of 1
    if (this.socket.readyState === WebSocket.OPEN)
      this.socket.send(msg);
    else
      log(`[Socket] Connection not open, dropped message: '${msg}'`);
  }

  handleMessage(message) {
    log(`recv: ${message.data}`);
    this.handler(message.data);
  }

  handleOpen() {
    log("[Socket] Connection established");
  }

  handleClose() {
    log("[Socket] Connection closed");
    this.reconnect();
  }

  handleError(error) {
    log(`[Socket] Connection error: ${error.message}`);
    this.reconnect();
  }
}