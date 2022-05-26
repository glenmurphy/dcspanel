import Socket from './socket.js';
import log from './log.js';
import DcsBios from './dcsbios.js';
import Control from './control.js';

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
    this.bios = new DcsBios();

    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);

    this.pressed = null; // widget being engaged with
    this.controls = [];
    
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleUp.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), true);
    this.canvas.addEventListener('touchend', this.handleUp.bind(this), true);
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  loadConfig(config) {
    this.controls = [];
    this.config = config;

    for (let control_config of this.config.controls) {
      let control = new Control(this.bios, control_config, this.render.bind(this));
      this.controls.push(control);
    }

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
  getControl(pos) {
    for (let control of this.controls) {
      if (pos.x >= control.x && pos.x <= control.x + control.w &&
          pos.y >= control.y && pos.y <= control.y + control.h)
        return control;
    }
  }

  engageControl(control, x, y) {
    if (this.pressed) {
      this.disengageControl();
    }

    this.pressed = control;

    // Do control action
    control.press(x, y);
    // this.socket.send(`+${this.pressed.id}`);

    this.render(); // we should queue renders
  }

  disengageControl() {
    if (!this.pressed) return;

    // Do control action
    // this.socket.send(`-${this.pressed.id}`);
    this.pressed.release();

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
    
    //this.ctx.strokeRect(0, 0, this.config.w, this.config.h);
    //this.ctx.strokeStyle = '#fff';
    //this.ctx.fillStyle = '#fbb';
    for (let control of this.controls) {
      control.render(this.ctx);
    }
    this.ctx.restore();
  }

  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
    this.render();
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
    let control = this.getControl(pos);
    if (control)
      this.engageControl(control, pos.x - control.x, pos.y - control.y);
  }

  handleUp(e) {
    e.preventDefault();
    this.disengageControl();
  }
}


