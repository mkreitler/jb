// MathExplorer -- Types
//
// Extended data types.
//
me.types = {};

///////////////////////////////////////////////////////////////////////////////
// ooooo      ooo                 .o8            
// `888b.     `8'                "888            
//  8 `88b.    8   .ooooo.   .oooo888   .ooooo.  
//  8   `88b.  8  d88' `88b d88' `888  d88' `88b 
//  8     `88b.8  888   888 888   888  888ooo888 
//  8       `888  888   888 888   888  888    .o 
// o8o        `8  `Y8bod8P' `Y8bod88P" `Y8bod8P' 
// Node ///////////////////////////////////////////////////////////////////////
me.types.NODE_TYPE = {
  UNKNOWN: 0,
  NUMBER: 1,
};

// Associates node branch with child array elements.
me.types.NODE_ORDER = {
  LEFT: 0,
  RIGHT: 1
};

me.types.node = function(type, value, parent, leftChild, rightChild) {
  this.init(type, value, parent, leftChild, rightChild);
};

me.types.node.prototype.init = function(type, value, parent, leftChild, rightChild) {
  this.type = type ? type : me.types.NODE_TYPE.NUMBER;
  this.value = value ? value : 0;
  this.parent = parent ? parent : null;
  this.children = [];

  if (leftChild) {
    this.children.push(leftChild);
  }
  else {
    this.children.push(null);
  }

  if (rightChild) {
    this.children.push(rightChild);
  }
  else {
    this.children.push(null);
  }
};

me.types.node.prototype.setChild = function(childNode, bLeft) {
  if (bLeft) {
    this.children[me.types.NODE_ORDER.LEFT] = childNode;
  }
  else {
    this.children[me.types.NODE_ORDER.RIGHT] = childNode;
  }
};

me.types.node.prototype.setParent = function(parent) {
  this.parent = parent;
};

me.types.node.prototype.setValue = function(value) {
  this.value = value;
};

me.types.node.prototype.value = function() {
  return this.value;
};

me.types.node.prototype.parent = function() {
  return this.parent;
};

me.types.node.prototype.child = function(bLeft) {
  return bLeft ? this.children[me.types.NODE_ORDER.LEFT] : this.children[me.types.NODE_ORDER.RIGHT];
};



///////////////////////////////////////////////////////////////////////////////
// oooooooooo.                                          .o8           
// `888'   `Y8b                                        "888           
//  888     888  .ooooo.  oooo  oooo  ooo. .oo.    .oooo888   .oooo.o 
//  888oooo888' d88' `88b `888  `888  `888P"Y88b  d88' `888  d88(  "8 
//  888    `88b 888   888  888   888   888   888  888   888  `"Y88b.  
//  888    .88P 888   888  888   888   888   888  888   888  o.  )88b 
// o888bood8P'  `Y8bod8P'  `V88V"V8P' o888o o888o `Y8bod88P" 8""888P' 
// Bounds /////////////////////////////////////////////////////////////////////
me.types.bounds = function(top, left, width, height) {
    this.set(top, left, width, height);
    this.isBound = true;
};

me.types.bounds.prototype.draw = function(color, buffer) {
    var ctxt = buffer || me.types.ctxt;

    ctxt.strokeStyle = color || "white";
    ctxt.beginPath();
    ctxt.moveTo(this.l, this.t);
    ctxt.lineTo(this.l + this.w, this.t);
    ctxt.lineTo(this.l + this.w, this.t + this.h);
    ctxt.lineTo(this.l, this.t + this.h);
    ctxt.closePath();
    ctxt.stroke();
};

me.types.bounds.prototype.set = function(left, top, width, height) {
    this.t = top || 0;
    this.l = left || 0;
    this.w = width || 0;
    this.h = height || 0;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

me.types.bounds.prototype.contain = function(x, y) {
    return this.l <= x && this.l + this.w >= x &&
           this.t <= y && this.t + this.h >= y;
};

me.types.bounds.prototype.intersectLine = function(sx, sy, ex, ey) {
  return me.types.MathEx.linesIntersect(sx, sy, ex, ey, this.l, this.t, this.l + this.w, this.t) ||
         me.types.MathEx.linesIntersect(sx, sy, ex, ey, this.l + this.w, this.t, this.l + this.w, this.t + this.h) ||
         me.types.MathEx.linesIntersect(sx, sy, ex, ey, this.l + this.w, this.t + this.h, this.l, this.t + this.h) ||
         me.types.MathEx.linesIntersect(sx, sy, ex, ey, this.l, this.t + this.h, this.l, this.t) ||
         // These last two tests shouldn't be necessary, but inaccuracies in the above four
         // tests might make them necessary.
         this.contain(sx, sy) ||
         this.contain(ex, ey);
};

me.types.bounds.prototype.copy = function(dest) {
    dest.t = this.t;
    dest.l = this.l;
    dest.w = this.w;
    dest.h = this.h;
    dest.halfWidth = this.halfWidth;
    dest.halfHeight = this.halfHeight;
};

me.types.bounds.prototype.scale = function(sx, sy) {
    var xScale = sx || 1,
        yScale = sy || xScale;

    this.t *= yScale;
    this.l *= xScale;
    this.w *= xScale;
    this.h *= yScale;
    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

me.types.bounds.prototype.moveTo = function(left, top) {
    this.t = top;
    this.l = left;
};

me.types.bounds.prototype.moveBy = function(dl, dt) {
    this.t += dt;
    this.l += dl;
};

me.types.bounds.prototype.resizeTo = function(width, height) {
    this.w = width;
    this.h = height;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

me.types.bounds.prototype.resizeBy = function(dw, dh) {
    this.w += dw;
    this.h += dh;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

me.types.bounds.prototype.intersect = function(other) {
    var bInLeftRight = false,
        bInTopBottom = false;

    me.types.assert(other, "me.types.bounds.intersect: invalid 'other'!");

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

me.types.bounds.prototype.intersection = function(other, result) {
    me.types.assert(other && other.isBound, "me.types.bounds.intersection: invalid 'other'!");
    me.types.assert(result && result.isBound, "me.types.bounds.intersection: invalid 'result'!");

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



