import log from '../log.js';

let font_cache = {};

function loadImage(url) {
  return new Promise(resolve => {
    var img = new Image()
    img.addEventListener('load', () => { resolve(img); });
    img.src = url;
  });
}

export default class Font {
  constructor(name, load_handler) {
    if (name in font_cache) {
      font_cache[name].addLoadHandler(load_handler);
      return font_cache[name];
    }

    this.name = name;
    this.config = null;
    this.loadHandlers = [load_handler];
    font_cache[name] = this;
    this.load();
  }

  async load() {
    let res = await fetch(`/assets/fonts/${this.name}/index.json`);
    this.config = await res.json();
    this.image = await loadImage(`${this.config.image}`);
    
    // Fill out any missing upper/lowercase characters
    for (const key in this.config.chars) {
      if (!this.config.chars[key.toUpperCase()]) {
        this.config.chars[key.toUpperCase()] = this.config.chars[key];
      }
      if (!this.config.chars[key.toLowerCase()]) {
        this.config.chars[key.toLowerCase()] = this.config.chars[key];
      }
    }

    this.loaded = true;
    for (let handler of this.loadHandlers) {
      handler();
    }
    this.loadHandlers = [];
  }

  async addLoadHandler(handler) {
    if (this.loaded) {
      handler();
      return;
    }
    this.loadHandlers.push(handler);
  }

  render(ctx, text, x, y, size) {
    if (!this.loaded) return;

    for (let i = 0; i < text.length; i++) {
      let char = text.charAt(i);
      let char_def = this.config.chars[char];

      if (!char_def) {
        log(`Missing char: ${char} (${char.charCodeAt(0)})`);
        continue;
      }
      const size_y = size * (char_def.h / char_def.w);
      ctx.drawImage(this.image, char_def.x + 1, char_def.y + 1, char_def.w - 2, char_def.h - 2, x, y, size, size_y);
    }
  }
}