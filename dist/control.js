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
    case 161: return "[]";//"⌷";  // CDU input thingy - need to find a single char for this
    case 169: return ".";//"•";   // a dot •
    case 174: return "^";//"↕";   // updown arrow
    case 182: return "_";//"▊";  // blinking cursor
    default: return String.fromCharCode(b);
  }
}

function getInteger(b) {
  let byteA = b[1];
  let byteB = b[0];

  var sign = byteA & (1 << 7);
  var result = (((byteA & 0xFF) << 8) | (byteB & 0xFF));
  if (sign) {
     result = 0xFFFF0000 | x;  // fill in most significant bits with 1's
  }
  return result;
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
  }

  handleOutput(id, data) {
    log(`${this.id}: ${id}, ${data}`);
    if (this.updateHandler)
      this.updateHandler();
  }

  press() {
    this.pressed = true;

    this.bios.send(`${this.id} 1\n`);
  }

  release() {
    this.pressed = false;

    this.bios.send(`${this.id} 0\n`);
  }

  render(ctx) {
    if (this.control_data.control_type == 'display') {
      ctx.fillStyle = '#00ff00';
      ctx.font = `${this.h}px Menlo, Consolas, Monaco`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      let str = this.outputs[0].getData();
      let w = this.w / str.length;
      for (let i = 0; i < str.length; i++) {
        ctx.fillText(str.charAt(i), this.x + (i * w), this.y);
      }
    } else {
      // Assume 'selector'
      if (this.pressed || this.outputs[0].getData() == 1) {
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(this.x, this.y, this.w, this.h);
      }

      if (this.label) {
        ctx.fillStyle = '#eeeeee';
        let scale = 0.45;
        ctx.font = `${this.h * scale}px Menlo, Consolas, Monaco`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2 + 2);
      }

      ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
  }
}