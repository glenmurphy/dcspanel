import Control from './control.js';

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
      
    ctx.fillStyle = pressed ? '#1c1c1c' : '#222';
    const x = this.x + (pressed ? 2 : 0);
    const y = this.y + (pressed ? 2 : 0);
    const w = this.w - (pressed ? 4 : 0);
    const h = this.h - (pressed ? 4 : 0);

    ctx.roundRect(x, y, w, h, 5);
    ctx.fill();
  
    if (this.label) {
      ctx.fillStyle = '#eeeeee';
      let scale = pressed ? 0.42 : 0.45;
      ctx.font = `${this.h * scale}px Menlo, Consolas`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.label,
          this.x + this.w / 2,
          this.y + this.h / 2 + 2);
    }
  
    ctx.strokeStyle = '#444';
    ctx.roundRect(x, y, w, h, 5);
    ctx.stroke();
  }
}