import Socket from './socket.js';
import log from './log.js';
import DcsBios from './dcsbios.js';
import createControl from './controls/create.js';

var loadJSON = (await (async function (url, flush) {
  var cache = {};

  return async function(url, flush) {
    if (flush != true && url in cache) return cache[url]; 

    const res = await fetch(url);
    const json = await res.json();
    cache[url] = json;
    return json;
  };
})());

export default class Panel {
  constructor(config_url) {
    this.bios = new DcsBios();

    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);

    this.engaged = null; // widget being engaged with
    this.controls = [];
    
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleUp.bind(this));

    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), true);
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), true);
    window.addEventListener('touchend', this.handleUp.bind(this), true);

    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('orientationchange', this.handleResize.bind(this));

    if (config_url) {
      this.setConfig(config_url);
    }
  }

  async setConfig(config_url) {
    this.controls = [];

    const config = await loadJSON(config_url);
    const scheme = await loadJSON(config.scheme);

    function getControlScheme(control_id) {
      for (var key in scheme) {
        for (var id in scheme[key]) {
          if (control_id == id) {
            return scheme[key][id];
          }
        }
      }
      
      throw new Error(`Could not find control scheme for: ${control_id} in ${config.scheme}`);
    }

    this.config = config;
    for (let control_config of this.config.controls) {
      this.controls.push(createControl(this.bios, control_config, getControlScheme(control_config.id), this.render.bind(this)));
    }

    document.body.style.backgroundColor = config.background ?? '#222';
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
    if (this.engaged) {
      this.disengageControl();
    }

    this.engaged = control;
    this.engaged.press(x, y);
    this.render(); // we should queue renders
  }

  disengageControl() {
    if (!this.engaged) return;

    // Do control action
    this.engaged.release();
    this.engaged = null;
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

    for (let decoration of this.config.decorations ?? []) {
      if (decoration.type == 'rect_round') {
        this.ctx.roundRect(decoration.x, decoration.y, decoration.w, decoration.h, decoration.r);
        if (decoration.fill) {
          this.ctx.fillStyle = decoration.fill;
          this.ctx.fill();
        }
        if (decoration.stroke) {
          this.ctx.strokeStyle = decoration.stroke;
          this.ctx.stroke();
        }
      } else if (decoration.type == "rect") {
        if (decoration.fill) {
          this.ctx.fillStyle = decoration.fill;
          this.ctx.fillRect(decoration.x, decoration.y, decoration.w, decoration.h);
        }
        if (decoration.stroke) {
          this.ctx.strokeStyle = decoration.stroke;
          this.ctx.strokeRect(decoration.x, decoration.y, decoration.w, decoration.h);
        }
      }
    }

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


  handlePress(pos) {
    let control = this.getControl(pos);
    if (control)
      this.engageControl(control, pos.x - control.x, pos.y - control.y);
  }

  handleMove(pos) {
    if (this.engaged) {
      this.engaged.move(pos.x - this.engaged.x, pos.y - this.engaged.y);
      this.render();
    }
  }

  handleUp(e) {
    e.preventDefault();
    this.disengageControl();
  }

  // hardware-specific handlers 
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

  handleTouchMove(e) {
    e.preventDefault();
    let touch = e.touches[0];
    let pos = this.getPanelPos(touch.clientX, touch.clientY);

    this.handleMove(pos.x, pos.y);
  }

  handleMouseMove(e) {
    e.preventDefault();
    let pos = this.getPanelPos(e.clientX, e.clientY);

    this.handleMove(pos);
  }
}


