import Control from './control.js';
import Font from '../fonts/font.js';

export default class Display extends Control {
  constructor() {
    super(...arguments);

    if (this.config.font) {
      this.font = new Font(this.config.font, () => {
        this.updateHandler();
      });
    }
  }

  render(ctx) {
    const size = parseInt(this.h);
    let str = this.outputs[0].getData();
    let w = this.w / str.length;

    if (this.font) {
      for (let i = 0; i < str.length; i++) {
        let char = str.charAt(i);
        // Lowercase is for the Major Mono Display font
        this.font.render(ctx, char, this.x + i * w, this.y, size);
      } 
    } else {
      ctx.fillStyle = '#00ff00';
      ctx.font = `${size}px monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "hanging";

      for (let i = 0; i < str.length; i++) {
        let char = str.charAt(i);
        if (char == '#') char = "\u{2588}";
        ctx.fillText(char, this.x + (i * w), this.y);
      }
    }
  }
}