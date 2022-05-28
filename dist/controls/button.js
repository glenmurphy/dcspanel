import Control from './control.js';

export default class Button extends Control {
  constructor() {
    super(...arguments);
    if (this.config.image) {
      this.image = new Image();
      this.image.src = this.config.image;
      
      this.image.addEventListener('load', () => {
        this.updateHandler();
      });
    }
  }

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
    
    const radius = this.config.r ? this.config.r : 4;

    ctx.fillStyle = pressed ? '#1c1c1c' : '#222';
    const x = this.x + (pressed ? 1 : 0);
    const y = this.y + (pressed ? 1 : 0);
    const w = this.w - (pressed ? 2 : 0);
    const h = this.h - (pressed ? 2 : 0);

    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  
    if (this.label) {
      ctx.fillStyle = '#eeeeee';
      let scale = pressed ? 0.32 : 0.36;
      if (this.config.style == 'rounded_letter') {
        scale *= 0.8;
      }
      ctx.font = `${this.h * scale}px MS33558, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.label.toLowerCase(),
          this.x + this.w / 2 + 1, // compensate for MS33558
          this.y + this.h / 2 + 1);
    }

    if (this.image) {
      ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
    }
    
    ctx.strokeStyle = '#444';
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();

    if (this.config.style == 'rounded_letter') {
      ctx.strokeStyle = '#999';
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.35, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}