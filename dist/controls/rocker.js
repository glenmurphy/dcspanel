import Control from './control.js';

export default class Rocker extends Control {
  setDefault() {
    this.pressed = 1;
    this.outputs[0].setData(1);
  }

  press(x, y) {
    if (this.w > this.h) {
      if (x < this.w / 2) {
        this.pressed = 0;
        this.sendState(0); // left
      } else {
        this.pressed = 2;
        this.sendState(2);  // right
      }
    } else {
      if (y < this.h / 2) {
        this.pressed = 2;
        this.sendState(2); // up
      } else {
        this.pressed = 0;
        this.sendState(0);  // down
      }
    }
  }

  release() {
    this.setDefault();
  }

  render(ctx) {
    let a, b;

    const radius = 4;

    if (this.w > this.h) {
      a = {x: this.x, y: this.y, w: this.w / 2, h: this.h};                 // left
      b = {x: this.x + this.w / 2, y: this.y, w: this.w / 2, h: this.h};    // right 
    } else {
      a = {x: this.x, y: this.y + this.h / 2, w: this.w, h: this.h / 2};    // down
      b = {x: this.x, y: this.y, w: this.w, h: this.h / 2};                 // up
    }
  
    ctx.fillStyle = '#222222';
    ctx.roundRect(this.x, this.y, this.w, this.h, radius);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    if (this.pressed == 0 || this.outputs[0].getData() == 0) {
      ctx.roundRect(a.x, a.y, a.w, a.h, radius);
      ctx.fill();
    }
    if (this.pressed == 2 || this.outputs[0].getData() == 2) {
      ctx.roundRect(b.x, b.y, b.w, b.h, radius);
      ctx.fill();
    }
    
    if (this.label.length == 2) {
      ctx.fillStyle = '#eeeeee';
      let scale = 0.45;
      ctx.font = `${Math.min(this.w, this.h) * scale}px Menlo, Consolas`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.label[0], a.x + a.w / 2, a.y + a.h / 2 + 1);
      ctx.fillText(this.label[1], b.x + b.w / 2, b.y + b.h / 2 + 1);
    }
  
    ctx.strokeStyle = '#444';
    ctx.roundRect(this.x, this.y, this.w, this.h, radius);
    ctx.stroke();
  }
}