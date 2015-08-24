rmk = {};

rmk.DungeonCard = function(spriteSheets) {
  this.spriteSheets = spriteSheets;
  this.currentCard = null;
  this.bounds = new jb.bounds(0, 0, 0, 0);
  this.buffer = null;

  jb.messages.listen("setCombatOrigin", this);
};

rmk.DungeonCard.prototype.setCombatOrigin = function(x, y) {
  this.bounds.l = x;
  this.bounds.t = y;

  if (this.currentCard) {
    this.setCard(this.currentCard);
  }
};

rmk.DungeonCard.prototype.getWidth = function() {
  return this.bounds.w;
},

rmk.DungeonCard.prototype.getHeight = function() {
  return this.bounds.h;
},

rmk.DungeonCard.prototype.setCard = function(cardName) {
  var tileMap = cardName ? this.cards[cardName] : null,
      iRow = 0,
      iCol = 0,
      curAdventureSlot = -1,
      curMonsterSlot = -1;

  this.currentCard = cardName;
  this.buffer = null;

  this.bounds.h = tileMap.length / 2 * jb.program.CELL.HEIGHT;
  this.bounds.w = tileMap.length > 0 ? tileMap[0].length / 2 * jb.program.CELL.WIDTH : 0;

  if (tileMap) {
    for (iRow=1; iRow<tileMap.length; iRow+=2) {
      for (iCol=0; iCol<tileMap[iRow].length; iCol+=2) {
        if (tileMap[iRow][iCol] === "A") {
          // Mark adventurer's slot.
          ++curAdventureSlot;
          jb.messages.send("setPartyCombatLocation",
                            curAdventureSlot,
                            Math.floor(iCol / 2) * jb.program.CELL.WIDTH + this.bounds.l,
                            Math.floor(iRow / 2) * jb.program.CELL.HEIGHT + this.bounds.t);
        }
        else if (tileMap[iRow][iCol] === "M") {
          // Mark monster slot.
          ++curMonsterSlot;
          jb.messages.send("setMonsterCombatLocation",
                            curMonsterSlot,
                            Math.floor(iCol / 2) * jb.program.CELL.WIDTH + this.bounds.l,
                            Math.floor(iRow / 2) * jb.program.CELL.HEIGHT + this.bounds.t);
        }
      }
    }

    this.buffer = jb.createCanvas(this.bounds.w, this.bounds.h);
    this.drawInto(this.buffer.context)
  }
};

rmk.DungeonCard.prototype.draw = function(ctxt) {
  if (this.buffer && this.buffer.canvas) {
    ctxt.drawImage(this.buffer.canvas, this.bounds.l, this.bounds.t);
  }
};

rmk.DungeonCard.prototype.drawInto = function(ctxt) {
  var iLayer = 0,
      iRow = 0,
      iCol = 0,
      cellDx = 0,
      cellDy = 0,
      cell = null,
      tileVal = 0,
      tileMap = this.currentCard ? this.cards[this.currentCard] : null;

  if (tileMap) {
    for (iRow=0; iRow<tileMap.length; iRow+=2) {
      for (iCol=0; iCol<tileMap[iRow].length; iCol+=2) {
        // Draw background.
        cell = tileMap[iRow].substr(iCol, 2);
        tileVal = parseInt(cell);

        if (!isNaN(tileVal)) {
          this.spriteSheets[0].drawTile(ctxt, 0, 0, iRow / 2, iCol / 2, tileVal);
        }
      }

      for (iCol=0; iCol<tileMap[iRow].length; iCol+=2) {
        // Draw foreground/adventurers/monsters.
        cell = tileMap[iRow + 1].substr(iCol, 2);
        tileVal = parseInt(cell);

        if (!isNaN(tileVal) && tileVal) {
          // Draw foreground object.
          this.spriteSheets[1].drawTile(ctxt, 0, 0, iRow / 2, iCol / 2, tileVal);
        }
      }
    }
  }
};

rmk.DungeonCard.prototype.cards = {
    "hallway01" : ["1011111111111111111111111111111111111112",
                   "0000000000000000000000000000000000000000",
                   "0404040404040404040404040404040404040404",
                   "000000000000A100000000000000M10000000000",
                   "0404040404040404040404040404040404040404",
                   "0000000000000000000000000000000000000000",
                   "0404040404040404040404040404040404040404",
                   "000000000000A200000000000000M20000000000",
                   "0404040404040404040404040404040404040404",
                   "0000000000000000000000000000000000000000",
                   "0404040404040404040404040404040404040404",
                   "000000000000A300000000000000M30000000000",
                   "0404040404040404040404040404040404040404",
                   "0000000000000000000000000000000000000000",
                   "0404040404040404040404040404040404040404",
                   "000000000000A400000000000000M40000000000",
                   "1011111111111111111111111111111111111112",
                   "0000000000000000000000000000000000000000"],
};
