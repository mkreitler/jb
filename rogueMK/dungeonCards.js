rmk = {};

rmk.DungeonCard = function(spriteSheets) {
  this.spriteSheets = spriteSheets;

  this.layers = [
    // Bottom layer:
    [
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
      [04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04],
      [04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04],
      [04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04],
      [04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04],
      [04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04],
      [04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04, 04],
      [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    ]
  ];
};

rmk.DungeonCard.prototype.drawAt = function(ctxt, x, y) {
  var iLayer = 0,
      iRow = 0,
      iCol = 0,
      cellDx = 0,
      cellDy = 0;

  for (iLayer=0; iLayer<this.layers.length; ++iLayer) {
    cellDx = this.spriteSheets[iLayer].getCellWidth();
    cellDy = this.spriteSheets[iLayer].getCellHeight();

    for (iRow=0; iRow<this.layers[0].length; ++iRow) {
      for (iCol=0; iCol<this.layers[0][0].length; ++iCol) {
        this.spriteSheets[iLayer].drawAsTile(ctxt, y, x, iRow, iCol, this.layers[iLayer][iRow][iCol]);
      }
    }
  }
};