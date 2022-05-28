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

function renderLine(ctx, decoration) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(decoration.path[0], decoration.path[1])
  for (var i = 2; i < decoration.path.length; i += 2) {
    ctx.lineTo(decoration.path[i], decoration.path[i + 1]);
  }  
  ctx.strokeStyle = decoration.stroke ?? '#fff';
  ctx.lineWidth = decoration.width ?? 2;
  ctx.stroke();
  ctx.restore();
}

export default function renderDecoration(ctx, decoration) {
  switch (decoration.type) {
    case 'rect_round': return renderRectRound(ctx, decoration);
    case 'rect':       return renderRect(ctx, decoration);
    case 'line':       return renderLine(ctx, decoration);
  }
}