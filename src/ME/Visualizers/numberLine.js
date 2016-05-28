me.viz.numberLine = function(name, x, y, w, h) {
  this.bounds = new me.types.bounds(y, x, w, h);
};

me.viz.numberLine.prototype.draw = function(ctxt) {
  var width = this.bounds.width,
      height = this.bounds.height,
      i = 0,
      x = 0,
      y = 0,
      w = width * this.WIDTH;
      h = height * this.THICKNESS;

  ctxt.strokeStyle = 'green';
  ctxt.fillStyle = 'green';

  x = Math.round(width / 2 - w / 2);
  y = Math.round(height / 2 - h / 2);

  ctxt.fillRect(x, y, w, h);

  h = h * 3;
  y = Math.round(height / 2 - h / 2);
  w = Math.round(w * this.WIDTH * this.TICK.WIDTH);
  for (i = 0; i<Math.floor(w * this.WIDTH * 0.5 / (w * this.WIDTH * this.TICK.SPACING)); ++i) {
    x = w / 2 + (i * (w * this.WIDTH * this.TICK.SPACING)) - w * 0.5;
    x = Math.round(x);

    if (i === 0) {
      ctxt.fillRect(x, Math.round(y - h / 2), w, h * 2);
    }
    else {
      ctxt.fillRect(x, y, w, h);
    }
  }
  for (i = 0; i<Math.floor(w * this.WIDTH * 0.5 / (w * this.WIDTH * this.TICK.SPACING)); ++i) {
    x = w / 2 - (i * (w * this.WIDTH * this.TICK.SPACING)) - w * 0.5;
    x = Math.round(x);

    if (i === 0) {
      ctxt.fillRect(x, Math.round(y - h / 2), w, h * 2);
    }
    else {
      ctxt.fillRect(x, y, w, h);
    }
  }
};
  
