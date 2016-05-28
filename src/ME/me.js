// MathExplorer
//
// Mathematics visualization / game programming language for kids
//
// Structural Notes:
// Expression --interpreted_by--> Visualizer --rendered_into--> View --rendered_to_screen--> Camera
//
// Visualizers:
//   -- Number line
//   -- Grid
//   -- Blobs

me = {};

me.assert = function(test, message) {
  if (!test) {
    alert("Assertion failed: " + message);
    debugger;
  }
};

// Root renderable object:
//   -- number
//   -- operator
//   -- function
//   -- etc
me.primitive = function() {
  this.bounds = new me.bounds(0, 0, 0, 0);
  this.anchor = {x:0, y:0};
};

me.primitive.prototype.draw = function(ctxt) {
  this.bounds.draw(ctxt);
};

me.primitive.prototype.moveTo = function(x, y, anchorX, anchorY) {
  var ax = anchorX || this.anchorX,
      ay = anchorY || this.anchorY;

      x -= this.bounds.w * ax;
      y -= this.bounds.h * ay;

  this.bounds.l = x;
  this.bounds.t = y;
};

me.primitive.prototype.moveBy = function(dx, dy) {
  this.bounds.l += dx;
  this.bounds.t += dy;
};

me.primitive.prototype.copyBounds = function(copyOut) {
  me.assert(copyOut, "copyOut undefined");

  copyOut.set(this.bounds.l, this.bounds.t, this.bounds.w, this.bounds.h);
};

me.primitive.prototype.getBoundsRef = function() {
  return this.bounds;
};

///////////////////////////////////////////////////////////////////////////////
// ooooooooooooo oooooo   oooo ooooooooo.   oooooooooooo  .oooooo.o 
// 8'   888   `8  `888.   .8'  `888   `Y88. `888'     `8 d8P'    `Y8 
//      888        `888. .8'    888   .d88'  888         Y88bo.      
//      888         `888.8'     888ooo88P'   888oooo8     `"Y8888o.  
//      888          `888'      888          888    "         `"Y88b 
//      888           888       888          888       o oo     .d8P 
//     o888o         o888o     o888o        o888ooooood8 8""88888P'  
// Types //////////////////////////////////////////////////////////////////////
me.bounds = function(top, left, width, height) {
    this.set(top, left, width, height);
    this.isBound = true;
};

me.bounds.prototype.draw = function(color, buffer) {
    var ctxt = buffer || me.ctxt;

    ctxt.strokeStyle = color || "white";
    ctxt.beginPath();
    ctxt.moveTo(this.l, this.t);
    ctxt.lineTo(this.l + this.w, this.t);
    ctxt.lineTo(this.l + this.w, this.t + this.h);
    ctxt.lineTo(this.l, this.t + this.h);
    ctxt.closePath();
    ctxt.stroke();
};

me.bounds.prototype.set = function(left, top, width, height) {
    this.t = top || 0;
    this.l = left || 0;
    this.w = width || 0;
    this.h = height || 0;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

me.bounds.prototype.contain = function(x, y) {
    return this.l <= x && this.l + this.w >= x &&
           this.t <= y && this.t + this.h >= y;
};

me.bounds.prototype.intersectLine = function(sx, sy, ex, ey) {
  return me.MathEx.linesIntersect(sx, sy, ex, ey, this.l, this.t, this.l + this.w, this.t) ||
         me.MathEx.linesIntersect(sx, sy, ex, ey, this.l + this.w, this.t, this.l + this.w, this.t + this.h) ||
         me.MathEx.linesIntersect(sx, sy, ex, ey, this.l + this.w, this.t + this.h, this.l, this.t + this.h) ||
         me.MathEx.linesIntersect(sx, sy, ex, ey, this.l, this.t + this.h, this.l, this.t) ||
         // These last two tests shouldn't be necessary, but inaccuracies in the above four
         // tests might make them necessary.
         this.contain(sx, sy) ||
         this.contain(ex, ey);
};

me.bounds.prototype.copy = function(dest) {
    dest.t = this.t;
    dest.l = this.l;
    dest.w = this.w;
    dest.h = this.h;
    dest.halfWidth = this.halfWidth;
    dest.halfHeight = this.halfHeight;
};

me.bounds.prototype.scale = function(sx, sy) {
    var xScale = sx || 1,
        yScale = sy || xScale;

    this.t *= yScale;
    this.l *= xScale;
    this.w *= xScale;
    this.h *= yScale;
    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

me.bounds.prototype.moveTo = function(left, top) {
    this.t = top;
    this.l = left;
};

me.bounds.prototype.moveBy = function(dl, dt) {
    this.t += dt;
    this.l += dl;
};

me.bounds.prototype.resizeTo = function(width, height) {
    this.w = width;
    this.h = height;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

me.bounds.prototype.resizeBy = function(dw, dh) {
    this.w += dw;
    this.h += dh;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

me.bounds.prototype.intersect = function(other) {
    var bInLeftRight = false,
        bInTopBottom = false;

    me.assert(other, "me.bounds.intersect: invalid 'other'!");

    if (this.l < other.l) {
        bInLeftRight = other.l <= this.l + this.w;
    }
    else {
        bInLeftRight = this.l <= other.l + other.w;
    }

    if (this.t < other.t) {
        bInTopBottom = other.t <= this.t + this.h;
    }
    else {
        bInTopBottom = this.t <= other.t + other.h;
    }

    return bInLeftRight && bInTopBottom;
};

me.bounds.prototype.intersection = function(other, result) {
    me.assert(other && other.isBound, "me.bounds.intersection: invalid 'other'!");
    me.assert(result && result.isBound, "me.bounds.intersection: invalid 'result'!");

    if (this.l < other.l) {
        result.l = other.l;
        result.w = Math.min(this.l + this.w, other.l + other.w) - result.l;
    }
    else {
        result.l = this.l;
        result.w = Math.min(this.l + this.w, other.l + other.w) - result.l;
    }

    if (this.t < other.t) {
        result.t = other.t;
        result.h = Math.min(this.t + this.h, other.t + other.h) - result.l;
    }
    else {
        result.t = this.t;
        result.h = Math.min(this.t + this.h, other.t + other.h) - result.l;
    }
};



