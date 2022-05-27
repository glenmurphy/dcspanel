function renderRect(ctx, decoration) {
  if (decoration.fill) {
    ctx.fillStyle = decoration.fill;
    ctx.fillRect(decoration.x, decoration.y, decoration.w, decoration.h);
  }
  if (decoration.stroke) {
    ctx.strokeStyle = decoration.stroke;
    ctx.strokeRect(decoration.x, decoration.y, decoration.w, decoration.h);
  }
}

function renderRectRound(ctx, decoration) {
  ctx.roundRect(decoration.x, decoration.y, decoration.w, decoration.h, decoration.r);
  if (decoration.fill) {
    ctx.fillStyle = decoration.fill;
    ctx.fill();
  }
  if (decoration.stroke) {
    ctx.strokeStyle = decoration.stroke;
    ctx.stroke();
  }
}

export default function renderDecoration(ctx, decoration) {
  switch (decoration.type) {
    case 'rect_round': return renderRectRound(ctx, decoration);
    case 'rect':       return renderRect(ctx, decoration);
  }
}