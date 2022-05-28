import log from '../log.js';

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}

function byteToChar(b) {
  switch (b) {
    case 0:  return " ";
    /*
    case 161: return "\u{2337}"; //⌷ : CDU input [] - need to find a better char for this
    case 169: return "\u{2022}"; //• : a dot •
    case 174: return "\u{2195}"; //↕ : updown arrow
    case 182: return "\u{2588}"; //▊: blinking cursor
    */
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

var getInitString = (function (len) {
  let index = 0;
  const base_str = "INIT DCS PANEL-";
  const str = base_str + base_str + base_str + base_str;

  return function(len) {
    let res = str.slice(index, index + len);
    index = (index + len) % base_str.length;
    return res;
  };
})();

class Output {
  constructor(id, bios, config, update_handler) {
    this.id = id;
    this.config = config

    this.start = this.config.address;
    this.end = this.start + (this.config.max_length ?? 2);

    this.data = '';
    if (this.config.type == 'string') {
      this.data = getInitString(this.config.max_length);
    }

    bios.addListener(this.start, this.end, this.handleData.bind(this));
    this.updateHandler = update_handler;
  }

  handleData(data) {
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
  constructor(bios, config, scheme, update_handler) {
    this.bios = bios;
    this.scheme = scheme;

    if (!this.scheme) {
      throw new Error("Control not found");
    }

    this.id = config.id;
    this.x = config.x;
    this.y = config.y;
    this.w = config.w;
    this.h = config.h;
    this.label = config.label ?? (this.scheme.description.length == 1 ? this.scheme.description : "");
    
    this.config = config; // for any additional props
    this.config.id = null; // prevent people accidentally depending on the wrong props
    this.config.x = null;
    this.config.y = null;
    this.config.w = null;
    this.config.h = null;
    this.config.label = null;
    
    this.updateHandler = update_handler;

    this.outputs = [];
    
    for (let i = 0; i < this.scheme.outputs.length; i++) {
      this.outputs.push(new Output(i, bios, this.scheme.outputs[i], update_handler));
    }

    this.setDefault();
  }

  sendState(state) {
    this.bios.send(`${this.id} ${state}\n`);
  }

  // Stuff you should override
  setDefault() { }

  press(x, y) { }

  move(x, y) { }

  release() { }

  render(ctx) {}
}