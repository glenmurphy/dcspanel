import data from "./data/a10c.js";// assert { type: "json" };
import log from './log.js';

function getControlConfig(control_id) {
  for (var key in data) {
    for (var id in data[key]) {
      if (control_id == id) {
        return data[key][id];
      }
    }
  }
}

function byteToChar(b) {
  switch (b) {
    case 0:  return " ";

    case 161: return "\u{2337}"; //⌷ : CDU input [] - need to find a better char for this
    case 169: return "\u{2022}"; //• : a dot •
    case 174: return "\u{2195}"; //↕ : updown arrow
    case 182: return "\u{2588}"; //▊: blinking cursor
    default: return String.fromCharCode(b);
  }
}

function getInteger(b) {
  let byteA = b[1];
  let byteB = b[0];

  var sign = byteA & (1 << 7);
  var result = (((byteA & 0xFF) << 8) | (byteB & 0xFF));
  if (sign) {
     result = 0xFFFF0000 | result;  // fill in most significant bits with 1's
  }
  return result;
}

function render_rocker(control, ctx) {
  let a, b;
  if (control.w > control.h) {
    a = {x: control.x, y: control.y, w: control.w / 2, h: control.h};                 // left
    b = {x: control.x + control.w / 2, y: control.y, w: control.w / 2, h: control.h}; // right     
  } else {
    a = {x: control.x, y: control.y + control.h / 2, w: control.w, h: control.h / 2}; // down
    b = {x: control.x, y: control.y, w: control.w, h: control.h / 2};                 // up
  }

  ctx.fillStyle = '#aaaaaa';
  if (control.pressed) {
    if (control.outputs[0].getData() == 0) {
      ctx.fillRect(a.x, a.y, a.w, a.h);
    }
    if (control.outputs[0].getData() == 2) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }

  if (control.label.length == 2) {
    ctx.fillStyle = '#eeeeee';
    let scale = 0.45;
    ctx.font = `${Math.min(control.w, control.h) * scale}px Menlo, Consolas`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(control.label[0], a.x + a.w / 2, a.y + a.h / 2 + 2);
    ctx.fillText(control.label[1], b.x + b.w / 2, b.y + b.h / 2 + 2);
  }

  ctx.strokeRect(control.x, control.y, control.w, control.h);
}

function render_button(control, ctx) {
  if (control.pressed || control.outputs[0].getData() == 1) {
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(control.x, control.y, control.w, control.h);
  }

  if (control.label) {
    ctx.fillStyle = '#eeeeee';
    let scale = 0.45;
    ctx.font = `${control.h * scale}px Menlo, Consolas`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(control.label, control.x + control.w / 2, control.y + control.h / 2 + 2);
  }

  ctx.strokeRect(control.x, control.y, control.w, control.h);
}

class Output {
  constructor(id, bios, config, update_handler) {
    this.id = id;
    this.config = config

    this.start = config.address;
    this.end = this.start + (config.max_length ?? 2);
    this.data = '';
    bios.addListener(this.start, this.end, this.handleData.bind(this));
    this.updateHandler = update_handler;
  }

  handleData(addr, data) {
    if (this.config.type == 'string') {
      this.data = "";
      for (const b of data) {
        this.data += byteToChar(b);
      }
    } else if (this.config.type == 'integer') {
      // TODO: masksnshifts
      this.data = (getInteger(data) & this.config.mask) >> this.config.shift_by;
    } else {
      throw new Error("Unknown data type");
    }

    this.updateHandler(this.id, this.data);
  }

  getData() {
    return this.data;
  }
  
  setData(d) {
    this.data = d;
  }
}

export default class Control {
  constructor(bios, config, update_handler) {
    this.bios = bios;

    this.control_data = getControlConfig(config.id);
    if (!this.control_data) {
      throw new Error("Control not found");
    }

    this.id = config.id;
    this.x = config.x;
    this.y = config.y;
    this.w = config.w;
    this.h = config.h;
    this.label = config.label ?? (this.control_data.description.length == 1 ? this.control_data.description : "");
    this.updateHandler = update_handler;

    this.outputs = [];
    
    for (let i = 0; i < this.control_data.outputs.length; i++) {
      this.outputs.push(new Output(i, bios, this.control_data.outputs[i], this.handleOutput.bind(this)));
    }

    if (this.control_data.physical_variant == 'rocker_switch') {
      this.outputs[0].setData(1);
    } else {
      this.outputs[0].setData(0);
    }
  }

  handleOutput(id, data) {
    //log(`${this.id}: ${id}, ${data}`);
    if (this.updateHandler)
      this.updateHandler();
  }

  press(x, y) {
    this.pressed = true;

    if (this.control_data.physical_variant == 'rocker_switch') {
      if (this.w > this.h) {
        if (x < this.w / 2) {
          this.bios.send(`${this.id} 0\n`); // left
        } else {
          this.bios.send(`${this.id} 2\n`); // right
        }
      } else {
        if (y < this.h / 2) {
          this.bios.send(`${this.id} 2\n`); // up
        } else {
          this.bios.send(`${this.id} 0\n`); // down
        }
      }
    } else {
      // Assume button
      this.bios.send(`${this.id} 1\n`);
    }
  }

  release() {
    this.pressed = false;

    if (this.control_data.physical_variant == 'rocker_switch') {
      this.bios.send(`${this.id} 1\n`);
    } else {
      // Assume button
      this.bios.send(`${this.id} 0\n`);
    }
  }

  render(ctx) {
    if (this.control_data.control_type == 'display') {
      ctx.fillStyle = '#00ff00';
      ctx.font = `${this.h}px Menlo, Consolas`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      let str = this.outputs[0].getData();
      let w = this.w / str.length;
      for (let i = 0; i < str.length; i++) {
        ctx.fillText(str.charAt(i), this.x + (i * w), this.y);
      }
    } else {
      // Assume 'selector'
      switch (this.control_data.physical_variant) {
        case 'rocker_switch':
          render_rocker(this, ctx);
          break;
        case 'push_button':
        default:
          render_button(this, ctx);
          break;
      }
    }
  }
}