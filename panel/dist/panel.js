import Socket from './socket.js';
import log from './log.js';

/*
let config = {
  name : '',
  background : '',
  size : { w : 0, h : 0 },
  widgets : []
}
*/
export default class Panel {
  constructor() {
    this.socket = new Socket(this.handleMessage.bind(this));
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);

    this.pressed = null; // widget being engaged with
    
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleUp.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), true);
    this.canvas.addEventListener('touchend', this.handleUp.bind(this), true);
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  loadConfig(config) {
    this.config = config;
    this.render();
  }

  // Convert screenX/Y to panelX/Y
  getPanelPos(x, y) {
    const x_scale = this.canvas.width / this.config.w;
    const y_scale = this.canvas.height / this.config.h;
    const scale = Math.min(x_scale, y_scale);
    return {
      x : x / scale - (this.canvas.width / 2) / scale + (this.config.w / 2),
      y : y / scale - (this.canvas.height / 2) / scale + (this.config.h / 2),
    }
  }

  // Get the widget at panelX/Y
  getWidget(pos) {
    for (let widget of this.config.widgets) {
      if (pos.x >= widget.x && pos.x <= widget.x + widget.w &&
          pos.y >= widget.y && pos.y <= widget.y + widget.h)
        return widget;
    }
  }

  engageWidget(widget) {
    if (this.pressed) {
      this.disengageWidget();
    }
    this.pressed = widget;

    // Do widget action
    this.socket.send(`+${this.pressed.id}`);

    this.render(); // we should queue renders
  }

  disengageWidget() {
    if (!this.pressed) return;

    // Do widget action
    this.socket.send(`-${this.pressed.id}`);
    this.pressed = null;

    this.render(); // we should queue renders
  }


  render() {
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeWidth = 1;

    this.ctx.fillStyle = this.config.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    // Scale to fit
    const x_scale = this.canvas.width / this.config.w;
    const y_scale = this.canvas.height / this.config.h;
    const scale = Math.min(x_scale, y_scale);
    this.ctx.scale(scale, scale);

    // Center
    if (y_scale < x_scale)
      this.ctx.translate((this.canvas.width / 2) / scale - (this.config.w / 2), 0);
    else
      this.ctx.translate(0, (this.canvas.height / 2) / scale - (this.config.h / 2));

    
    this.ctx.strokeRect(0, 0, this.config.w, this.config.h);

    this.ctx.strokeStyle = '#fff';
    this.ctx.fillStyle = '#fbb';
    for (let widget of this.config.widgets) {
      if (widget == this.pressed)
        this.ctx.fillRect(widget.x, widget.y, widget.w, widget.h);
      this.ctx.strokeRect(widget.x, widget.y, widget.w, widget.h);
    }
    this.ctx.restore();
  }

  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
    this.render();
  }

  handleMessage(msg) {
    log(msg);
    if (msg === "down")
      document.body.style.backgroundColor = 'black';
    if (msg === "up")
      document.body.style.backgroundColor = '';
  }

  handleMouseDown(e) {
    e.preventDefault();
    let pos = this.getPanelPos(e.clientX, e.clientY);
    
    this.handlePress(pos);
  }

  handleTouchStart(e) {
    e.preventDefault();
    let touch = e.touches[0];
    let pos = this.getPanelPos(touch.clientX, touch.clientY);

    this.handlePress(pos);
  }

  handlePress(pos) {
    let widget = this.getWidget(pos);
    if (widget)
      this.engageWidget(widget);
  }

  handleUp(e) {
    e.preventDefault();
    this.disengageWidget();
  }
}


