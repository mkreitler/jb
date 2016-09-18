///////////////////////////////////////////////////////////////////////////////
// Number Line Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
  WIDTH: 900,
  HEIGHT: 768,
  BANNER_HEIGHT: 128,
  CELL_SIZE: 48,
  SPRITE_CELL_SIZE: 24,
  START_DX: 3,
  START_DY: 3,
  BACK_COLOR: "#222222",
  multMatrix: [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              ],

  sfFont: null,
  spriteSheets: {},
  roomDx: 1,
  roomDy: 1,

  start: function() {
    jb.resize(this.WIDTH, this.HEIGHT);
    this.initMultMatrix();
    this.spriteSheets["walls"] = resources.loadImage("walls.png", "./res/DungeonDig/spritesheets");
    this.spriteSheets["floor"] = resources.loadImage("floor.png", "./res/DungeonDig/spritesheets");
    this.spriteSheets["door"] = resources.loadImage("door.png", "./res/DungeonDig/spritesheets");

    this.roomDx = this.START_DX;
    this.roomDy = this.START_DY;

//    jb.listenForTap();
//    jb.listenForSwipe();
//    this.sfFont = resources.loadFont("AurivanWideBold", "./res/dungeonDig", "otf");
  },

  do_waitForResources: function() {
    jb.until(resources.loadComplete());
  },

  startTitleScreen: function() {
//    jb.setOpenTypeFont(this.sfFont, 50, 1.33);

    jb.sprites.addSheet("walls", this.spriteSheets["walls"], 0, 0, 3, 3, this.SPRITE_CELL_SIZE, this.SPRITE_CELL_SIZE);

    jb.listenForTap();
  },

  do_titleScreen: function() {
    jb.backColor = this.BACK_COLOR;
    jb.clear();

    jb.fonts.printAt("fantasy", 1, 40, "Dungeon Dig", "yellow", 0.5, 0.0, 4);
    jb.fonts.printAt("fantasy", 9, 40, "Find your father!`", "white", 0.5, 0.0, 2);
    jb.fonts.printAt("fantasy", 11, 40, "When you were young, your father traveled the land,`", "gray", 0.5, 0.0, 1);
    jb.fonts.printAt("fantasy", 12, 40, "delving into ancient dungeons in search of treasure.`", "gray", 0.5, 0.0, 1);
    jb.fonts.printAt("fantasy", 13, 40, "Now, just before your 15th birthday, he has`", "gray", 0.5, 0.0, 1);
    jb.fonts.printAt("fantasy", 14, 40, "vanished, leaving behind nothing but a chest full`", "gray", 0.5, 0.0, 1);
    jb.fonts.printAt("fantasy", 15, 40, "of his old treasure maps.`", "gray", 0.5, 0.0, 1);
    jb.fonts.printAt("fantasy", 16, 40, "Can you use these to find and rescue him?`", "gray", 0.5, 0.0, 1);
    jb.fonts.printAt("fantasy", 18, 40, "<TAP> to start!", "white", 0.5, 0.0, 2);

    jb.until(jb.tap.done);
  },

  do_mainLoop: function() {
    this.drawMultMatrix();

    this.handleGestures();

    jb.while(true);
  },

  end: function() {
      jb.end();
  },

  // Functions ////////////////////////////////////////////////////////////////
  handleGestures: function() {
    var row = 0;
        col = 0,
         i = 0,
         bOverlap = false;

    if (jb.swipe.done) {
      // Handle end of swipe here...

      jb.listenForSwipe();
    }

    if (jb.swipe.started) {
      if (jb.tap.isDoubleTap) {
        // Handle double tap here...
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
        }
      }
    }
  },

  initMultMatrix: function() {
    var iRow, iCol;

    for (iRow=0; iRow<this.multMatrix.length; ++iRow) {
      for (iCol=iRow; iCol<this.multMatrix[0].length; ++iCol) {
        this.multMatrix[iRow][iCol] = (iRow + 1) * (iCol + 1);
        this.multMatrix[iCol][iRow] = (iCol + 1) * (iRow + 1);
      }
    }
  },

  drawMultMatrix: function() {
    var iRow, iCol, cellWidth, cellHeight, color;

    jb.ctxt.fillStyle = this.BACK_COLOR;
    jb.ctxt.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    jb.ctxt.fillStyle = "#000060";
    jb.ctxt.fillRect(0, 0, this.WIDTH, this.BANNER_HEIGHT);

    for (iCol=0; iCol<=this.multMatrix[0].length + 1; ++iCol) {

    }

    cellWidth = this.CELL_SIZE;
    cellHeight = this.CELL_SIZE;

    jb.ctxt.strokeStyle = "#444444";
    jb.ctxt.lineWidth = 2;
    jb.ctxt.beginPath();
    for (iRow=0; iRow<=this.multMatrix.length; ++iRow) {
      jb.ctxt.moveTo(0, this.BANNER_HEIGHT + iRow * cellHeight);
      jb.ctxt.lineTo(10 * cellWidth, this.BANNER_HEIGHT + iRow * cellHeight);
      jb.ctxt.closePath();
      jb.ctxt.stroke();

      for (iCol=0; iCol<=this.multMatrix[0].length; ++iCol) {
        jb.ctxt.beginPath();
        jb.ctxt.moveTo(iCol * cellWidth, this.BANNER_HEIGHT);
        jb.ctxt.lineTo(iCol * cellWidth, this.BANNER_HEIGHT + this.multMatrix.length * cellHeight);
        jb.ctxt.closePath();
        jb.ctxt.stroke();

        color = iRow == 0 || iCol == 0 ? "white" : "yellow";

        if (iRow < this.multMatrix.length && iCol < this.multMatrix[0].length) {
          jb.fonts.drawAt("fantasy",
                          iCol * cellWidth + cellWidth / 2,
                          this.BANNER_HEIGHT + cellHeight * iRow,
                          "" + ((iRow + 1) * (iCol + 1)),
                          color,
                          0.5,
                          0.5,
                          1.0);
        }
      }
    }
  },

  // Subroutines //////////////////////////////////////////////////////////////
  drawBackground: function() {
  },
};

// Support Classes ////////////////////////////////////////////////////////////
jb.helpers = {};



