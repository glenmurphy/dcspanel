import Control from './control.js';

export default class Display extends Control {
  render(ctx) {
    ctx.fillStyle = '#00ff00';
    const size = parseInt(this.h);
    ctx.font = `${size}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "hanging";

    let str = this.outputs[0].getData();
    let w = this.w / str.length;
    for (let i = 0; i < str.length; i++) {
      let char = str.charAt(i);
      if (char == '#') char = "\u{2588}";
      // Lowercase is for the Major Mono Display font
      ctx.fillText(char, this.x + (i * w), this.y);
    }
  }
}