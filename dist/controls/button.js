import Control from './control.js';

export default class Button extends Control {
  press(x, y) {
    this.pressed = true;
    this.sendState(1);
  }

  release() {
    this.pressed = false;
    this.sendState(0);
  }

  render(ctx) {
    if (this.pressed || this.outputs[0].getData() == 1) {
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  
    if (this.label) {
      ctx.fillStyle = '#eeeeee';
      let scale = 0.45;
      ctx.font = `${this.h * scale}px Menlo, Consolas`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.label,
          this.x + this.w / 2,
          this.y + this.h / 2 + 2);
    }
  
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}