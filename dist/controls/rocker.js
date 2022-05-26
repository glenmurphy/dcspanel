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

    ctx.strokeStyle = '#888888';
    ctx.beginPath();
    if (this.w > this.h) {
      a = {x: this.x, y: this.y, w: this.w / 2, h: this.h};                 // left
      b = {x: this.x + this.w / 2, y: this.y, w: this.w / 2, h: this.h};    // right 
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
    } else {
      a = {x: this.x, y: this.y + this.h / 2, w: this.w, h: this.h / 2};    // down
      b = {x: this.x, y: this.y, w: this.w, h: this.h / 2};                 // up
      ctx.moveTo(this.x, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w, this.y + this.h / 2);
    }
    ctx.stroke();
  
    ctx.fillStyle = '#aaaaaa';
    if (this.pressed == 0 || this.outputs[0].getData() == 0) {
      ctx.fillRect(a.x, a.y, a.w, a.h);
    }
    if (this.pressed == 2 || this.outputs[0].getData() == 2) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    
    if (this.label.length == 2) {
      ctx.fillStyle = '#eeeeee';
      let scale = 0.45;
      ctx.font = `${Math.min(this.w, this.h) * scale}px Menlo, Consolas`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.label[0], a.x + a.w / 2, a.y + a.h / 2 + 2);
      ctx.fillText(this.label[1], b.x + b.w / 2, b.y + b.h / 2 + 2);
    }
  
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}