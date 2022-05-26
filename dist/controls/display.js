import Control from './control.js';

export default class Display extends Control {
  render(ctx) {
    ctx.fillStyle = '#00ff00';
    ctx.font = `${this.h}px Menlo, Consolas`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    let str = this.outputs[0].getData();
    let w = this.w / str.length;
    for (let i = 0; i < str.length; i++) {
      ctx.fillText(str.charAt(i), this.x + (i * w), this.y);
    }
  }
}