///////////////////////////////////////////////////////////////////////////////
// Number Line Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
  GRID_START_SIZE: 10,
  MIN_CELL_SIZE: 10,    // Min number of pixels a row or column can occupy
  GRID_SENSITIVITY: 0.25,
  LINE_WIDTH: 3,
  TICK_COLOR: "#444444",

  gridSize: 10,
  gridScale: 1,
  background: null,
  curArea: null,
  curBubble: null,
  drawables: [],
  origin: {x:0, y:0},
  cellsPerSide: 10,

  start: function() {
    this.createScreen();
    this.drawStaticLayer();
    jb.listenForTap();
    jb.listenForSwipe();
  },

  do_mainLoop: function() {
    this.drawScreen();

    this.handleGestures();

    jb.while(true);
  },

  end: function() {
      jb.end();
  },

  // Functions ////////////////////////////////////////////////////////////////
  yToRow: function(y) {
    return Math.floor((y - this.origin.y) / this.gridSize);
  },

  xToCol: function(x) {
    return Math.floor((x - this.origin.x) / this.gridSize);
  },

  handleGestures: function() {
    var row = 0;
        col = 0,
         i = 0,
         bOverlap = false;

    if (jb.swipe.done) {
      if (this.curArea && this.curArea.width > 0 && this.curArea.height > 0) {
        for (i=0; i<this.drawables.length; ++i) {
          if (this.drawables[i].bounds.overlap(this.curArea.bounds)) {
            bOverlap = true;
            break;
          }
        }

        if (!bOverlap) {
          this.addDrawables(this.curArea);
          this.drawStaticLayer();
        }
      }

      this.curArea = null;

      jb.listenForSwipe();
    }

    if (jb.swipe.started) {
      if (jb.tap.isDoubleTap) {
        if (this.curBubble) {

        }
        else {

        }
      }
      else {
        if (this.curArea) {
          if (jb.swipe.isLeft()) {
            col = this.xToCol(jb.swipe.startX) - Math.round(jb.swipe.width() / this.gridSize);
          }
          else {
            col = this.xToCol(jb.swipe.left());
          }

          if (jb.swipe.isUp()) {
            row = this.yToRow(jb.swipe.startY) - Math.round(jb.swipe.height() / this.gridSize);
          }
          else {
            row = this.yToRow(jb.swipe.top());
          }

          this.curArea.update(row, col, Math.round(jb.swipe.width() / this.gridSize) + 1, Math.round(jb.swipe.height() / this.gridSize) + 1);
        }
        else if (jb.swipe.isTallerThan(this.gridSize * this.GRID_SENSITIVITY) || jb.swipe.isWiderThan(this.gridSize * this.GRID_SENSITIVITY)) {
          this.curArea = new jb.program.support.area(this.yToRow(jb.swipe.top()),
                                                     this.xToCol(jb.swipe.left()),
                                                     Math.round(jb.swipe.width() / this.gridSize) + 1,
                                                     Math.round(jb.swipe.height() / this.gridSize) + 1,
                                                     "submarineLeft");
        }
      }
    }
  },

  drawStaticLayer: function() {
    var i = 0;

    this.drawBackground();

    for (i=0; i<this.drawables.length; ++i) {
      this.drawables[i].draw(this.background.context, this.origin, this.gridSize);
    }
  },

  drawScreen: function() {
    var ctxt = jb.canvas.getContext('2d'),
        i = 0;

    jb.drawImage(ctxt,
                 this.background.canvas,
                 Math.round((jb.canvas.width - this.background.canvas.width) * 0.5),
                 Math.round((jb.canvas.height - this.background.canvas.height) * 0.5),
                 0, 0);

    if (this.curArea) {
      this.curArea.draw(jb.ctxt, this.origin, this.gridSize);

      jb.home();
      jb.print("Row: " + this.curArea.row + "`");
      jb.print("Col: " + this.curArea.col + "`");
      jb.print("Width: " + this.curArea.width + "`");
      jb.print("Height: " + this.curArea.height + "`");
      jb.print("Double Tap: " + (jb.tap.isDoubleTap ? "true" : "false"));
    }
  },

  addDrawables: function() {
    // Decompose this.curArea into individual drawables.
    var iRow = 0,
        iCol = 0;

    for (iRow=0; iRow<this.curArea.height; ++iRow) {
      for (iCol=0; iCol<this.curArea.width; ++iCol) {
        this.drawables.push(new jb.program.support.area(this.curArea.row + iRow,
                                                        this.curArea.col + iCol,
                                                        1,
                                                        1,
                                                        this.curArea.shape || "circle",
                                                        this.curArea.borderColor || "cyan",
                                                        this.curArea.fillColor || "green"));
      }
    }
  },

  // Subroutines //////////////////////////////////////////////////////////////
  drawBackground: function() {
    var iRow = 0,
        iCol = 0,
        cellSize = Math.round(Math.min(jb.canvas.height, jb.canvas.width) / this.cellsPerSide),
        halfSize = 1,
        x0 = 0,
        y0 = 0,
        tickSize = 0,
        sizeFactor = 1,
        visibleCellsPerSize = this.cellsPerSide;

    this.background.context.fillStyle = "black";
    this.background.context.fillRect(0, 0, this.background.canvas.width, this.background.canvas.height);

    if (cellSize < this.MIN_CELL_SIZE) {
      sizeFactor = Math.floor(Math.log10(this.MIN_CELL_SIZE / cellSize) + 0.9999999);
      sizeFactor = Math.pow(10, sizeFactor);
    }

    this.gridScale = sizeFactor;
    visibleCellsPerSide = Math.round(this.cellsPerSide / this.gridScale);

    cellSize = Math.round(cellSize * this.gridScale);
    halfSize = Math.round(cellSize * 0.5);
    tickSize = Math.round(halfSize * 0.5);

    this.origin.x = Math.round((jb.canvas.width - cellSize * visibleCellsPerSide / this.gridScale) * 0.5);
    this.origin.y = Math.round((jb.canvas.height - cellSize * visibleCellsPerSide / this.gridScale) * 0.5);

    this.background.context.strokeStyle = this.TICK_COLOR;
    this.background.context.lineWidth = this.LINE_WIDTH;
    y0 = this.origin.y + halfSize;
    for (iRow=0; iRow<visibleCellsPerSide; ++iRow) {
      x0 = this.origin.x + halfSize;
      for (iCol=0; iCol<visibleCellsPerSide; ++iCol) {
        this.background.context.beginPath();
        this.background.context.moveTo(x0 - tickSize, y0);
        this.background.context.lineTo(x0 + tickSize, y0);
        this.background.context.moveTo(x0, y0 - tickSize);
        this.background.context.lineTo(x0, y0 + tickSize);
        this.background.context.stroke();

        x0 += cellSize;
      }

      y0 += cellSize;
    }

    this.gridSize = cellSize;
  },

  createScreen: function() {
    this.background = jb.createCanvas(0, 0, 'black');
  },
};

// Support Classes ////////////////////////////////////////////////////////////
jb.program.support = {};
jb.program.support.bubble = function(row, col, width, height, icon, color) {
  this.row = Math.max(0, row ? row : 0);
  this.col = Math.max(0, col ? col : 0);
  this.width = width || 1;
  this.height = height || 1;
  this.icon = icon ? icon : null;
  this.color = color || "blue";
};

jb.program.support.bubble.prototype.CELLSIZE_TO_RADIUS_FACTOR = 0.2;
jb.program.support.bubble.prototype.CELLSIZE_TO_LINE_WIDTH_FACTOR = 0.2;
    
jb.program.support.bubble.prototype.draw = function(ctxt, origin, cellSize) {
  ctxt.strokeStyle = color;

  jb.drawRoundedRect(ctxt,
                     origin.x + this.col * cellSize,
                     origin.y + this.row * cellSize,
                     this.width,
                     this.height,
                     cellSize * this.CELLSIZE_TO_RADIUS_FACTOR,
                     this.color,
                     null,
                     Math.round(this.CELLSIZE_TO_LINE_WIDTH_FACTOR * cellSize));
}

jb.program.support.area = function(row, col, width, height, shape, borderColor, fillColor) {
  this.row = Math.max(0, row ? row : 0);
  this.col = Math.max(0, col ? col : 0);
  this.width = width || 1;
  this.height = height || 1;
  this.borderColor = borderColor || "cyan";
  this.fillColor = fillColor || "green";
  this.shape = shape || "circle";
  this.bounds = new jb.bounds(this.col, this.row, this.width, this.height);
};

jb.program.support.area.prototype.LINE_WIDTH = 2; 
jb.program.support.area.prototype.SHAPE_SIZE_FACTOR = 1.2;
jb.program.support.area.prototype.update = function(row, col, width, height) {
  this.row = Math.max(0, row ? row : 0);
  this.col = Math.max(0,col ? col : 0);
  this.width = width || 1;
  this.height = height || 1;

  this.bounds.set(this.col, this.row, this.width, this.height);
};
jb.program.support.area.prototype.draw = function(ctxt, origin, cellSize) {
  var iRow = 0,
      iCol = 0,
      x = 0,
      y = 0,
      halfCell = Math.round(cellSize * 0.5),
      size = Math.max(1, halfCell * this.SHAPE_SIZE_FACTOR - this.LINE_WIDTH),
      halfSize = Math.round(size * 0.5),
      glyphShape = null,
      glyphScale = 1,
      bCircle = this.shape.toLowerCase() === "circle";

  if (bCircle) {
    size = Math.round(size * 0.5);
  }
  else {
    glyphInfo = jb.glyphs.find(this.shape);
    glyphScale = cellSize / parseInt(glyphInfo.size);
    if (glyphScale > 1) {
      glyphScale = Math.floor(glyphScale);
    }
  }

  ctxt.lineWidth = this.LINE_WIDTH;
  ctxt.strokeStyle = this.borderColor;
  ctxt.fillStyle = this.fillColor;

  for (iRow=0; iRow<this.height; ++iRow) {
    y = (this.row + iRow) * cellSize;
    for (iCol=0; iCol<this.width; ++iCol) {
      x = (this.col + iCol) * cellSize;

      if (glyphInfo) {
        jb.glyphs.drawToContext(ctxt, glyphInfo.size, glyphInfo.name, x + origin.x + halfCell, y + origin.y + halfCell, glyphScale, glyphScale, 0.5, 0.5);
      }
      else if (bCircle) {
        ctxt.beginPath();
        ctxt.arc(x + origin.x + halfCell, y + origin.y + halfCell, size, 0, 2 * Math.PI, true);
        ctxt.fill();

        ctxt.arc(x + origin.x + halfCell, y + origin.y + halfCell, size, 0, 2 * Math.PI, true);
        ctxt.stroke();
      }
      else {
        ctxt.beginPath();
        ctxt.fillRect(x + origin.x + halfCell - halfSize, y + origin.y + halfCell - halfSize, size, size);
        ctxt.strokeRect(x + origin.x + halfCell - halfSize, y + origin.y + halfCell - halfSize, size, size);
      }
    }
  }
};

  ///////////////////////////////////////////////////////////////////////////////
  // Touch Test
  ///////////////////////////////////////////////////////////////////////////////
  jb.programBlueprint = {
  touchKnight: null,

  setup: function() {
      blueprints.draft(
          // Template name
          'testKnight',

          // Template data
          {
              x: -1,
              y: -1,
              size: null,
              glyph: null
          },

          // Template actions and shared data
          {
              onCreate: function(x, y, size, glyph) {
                  this.x = x;
                  this.y = y;
                  this.size = size;
                  this.glyph = glyph;
                  
                  jb.glyphs.getBounds(this.size, this.glyph, 2, 2, this.bounds);
              },

              moveTo: function(x, y) {
                  var dx = x - this.x,
                      dy = y - this.y;

                  this.x = x;
                  this.y = y;
                  this.bounds.moveBy(dx, dy);
              },

              moveBy: function(dx, dy) {
                  this.x += dx;
                  this.y += dy;
                  this.bounds.moveBy(dx, dy);
              }
          }
      );

      blueprints.make('testKnight', 'touchable');

      this.touchKnight = blueprints.build('testKnight', 0, 0, '16x16', 'knight');
      this.touchKnight.moveTo(100, 50);

      jb.listenForSwipe();
      jb.listenForTap();
  },

  do_touchKnight: function() {
      jb.clear('black');
      jb.glyphs.draw(this.touchKnight.size, this.touchKnight.glyph, this.touchKnight.x, this.touchKnight.y, 2, 2);

      if (jb.swipe.touched) {
          jb.swipe.touched.bounds.draw('red');
          jb.swipe.touched.moveTo(jb.swipe.endX, jb.swipe.endY);
      }

      jb.until(jb.swipe.done);
  },
  };



