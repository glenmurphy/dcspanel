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
    const pressed = (this.pressed || this.outputs[0].getData() == 1);
    
    const radius = this.config.style == 'round' ? this.h / 2 : 4;

    ctx.fillStyle = pressed ? '#1c1c1c' : '#222';
    const x = this.x + (pressed ? 1 : 0);
    const y = this.y + (pressed ? 1 : 0);
    const w = this.w - (pressed ? 2 : 0);
    const h = this.h - (pressed ? 2 : 0);

    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  
    if (this.label) {
      ctx.fillStyle = '#eeeeee';
      let scale = pressed ? 0.44 : 0.45;
      ctx.font = `${this.h * scale}px Menlo, Consolas`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.label,
          this.x + this.w / 2,
          this.y + this.h / 2 + 1);
    }
  
    ctx.strokeStyle = '#444';
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();
  }
}