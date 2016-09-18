///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    sfFont: null,
    worldTiles: null,
    worldSheet: null,
    nTilesX: 0,
    nTilesY: 0,
    scaleX: 2,
    scaleY: 2,

    ASPECT_X: 16,
    ASPECT_Y: 9,
    aspectRatio: 1,
    TILE_DX: 24,
    TILE_DY: 24,
    TITLE_BACK_COLOR: "#222222",

    precompute: function() {
      this.aspectRatio = this.ASPECT_X / this.ASPECT_Y;
    },

    start: function() {
      this.sfFont = resources.loadFont("Erval", "./res/fonts", "otf");
      this.worldTiles = resources.loadImage("oryx_16bit_scifi_world.png", "./res/sf/");

      // Compute play size.
      var nativeAspect = jb.canvas.width / jb.canvas.height;
      var newWidth = 0, newHeight = 0;
      if (nativeAspect > 0.5) {
        // Wider than tall.
        newHeight = jb.canvas.height;
        newWidth = Math.floor(newHeight * this.aspectRatio);
      }
      else {
        // Taller than wide.
        newWidth = jb.canvas.width;
        newHeight = Math.floor(newWidth / this.aspectRatio);
      }

      // Quantize to tile size (24x24).
      this.nTilesX = Math.floor(newWidth / this.TILE_DX / this.ASPECT_X) * this.ASPECT_X;
      this.nTilesY = Math.round(this.nTilesX / this.aspectRatio);

      this.nTilesX = Math.floor(this.nTilesX / this.scaleX);
      this.nTilesY = Math.floor(this.nTilesY / this.scaleY);

      jb.resize(this.nTilesX * this.TILE_DX * this.scaleX, this.nTilesY * this.TILE_DY * this.scaleY);
      jb.setBackColor(this.TITLE_BACK_COLOR);
    },

    do_waitForResources: function() {
      jb.until(resources.loadComplete());
    },

    makeSprites: function() {
      this.worldSheet = jb.sprites.addSheet("worldTiles", this.worldTiles, 0, 0, 35, 41, 24, 24);
    },

    startTitleScreen: function() {
      jb.setOpenTypeFont(this.sfFont, 50, 1.33);
      jb.listenForTap();
    },

    do_titleScreen: function() {
      jb.clear();
      jb.drawOpenTypeFontAt(jb.ctxt, "Bug Hunt", jb.canvas.width / 2, jb.canvas.height / 2, null, "red", 0.0, 1.0);

      jb.until(jb.tap.done);
    },

    startScreenTest: function() {
      jb.print(">>> Starting screen test...");
      jb.listenForTap();
    },

    do_screenTest: function() {
      this.drawBasicRoom();

      jb.until(jb.tap.done);
    },

    end: function() {
      jb.end();
    },

    // API R&D Area ///////////////////////////////////////////////////////////
    drawBasicRoom: function() {
      var i = 0,
          j = 0;

      jb.clear();

      this.worldSheet.drawTile(jb.ctxt, 0, 0, 0, 0, 6, 13, this.scaleX, this.scaleY);
      this.worldSheet.drawTile(jb.ctxt, 0, 0, 0, this.nTilesX - 1, 6, 14, this.scaleX, this.scaleY);
      this.worldSheet.drawTile(jb.ctxt, 0, 0, this.nTilesY - 1, 0, 6, 15, this.scaleX, this.scaleY);
      this.worldSheet.drawTile(jb.ctxt, 0, 0, this.nTilesY - 1, this.nTilesX - 1, 6, 16, this.scaleX, this.scaleY);

      for (i=1; i<this.nTilesY - 1; ++i) {
        for (j=1; j<this.nTilesX - 1; ++j) {
          this.worldSheet.drawTile(jb.ctxt, 0, 0, i, j, 6, 1, this.scaleX, this.scaleY);
        }
      }

      for (i=1; i<this.nTilesX - 1; ++i) {
        this.worldSheet.drawTile(jb.ctxt, 0, 0, 0, i, 6, 8, this.scaleX, this.scaleY);
        this.worldSheet.drawTile(jb.ctxt, 0, 0, this.nTilesY - 1, i, 6, 8, this.scaleX, this.scaleY);
      }

      for (i=1; i<this.nTilesY - 1; ++i) {
        this.worldSheet.drawTile(jb.ctxt, 0, 0, i, 0, 6, 11, this.scaleX, this.scaleY);
        this.worldSheet.drawTile(jb.ctxt, 0, 0, i, this.nTilesX - 1, 6, 11, this.scaleX, this.scaleY);
      }
    },

    ///////////////////////////////////////////////////////////////////////////

    // Subroutines ////////////////////////////////////////////////////////////
    // ------------------------------------------
    do_WaitForTransitions: function() {
      this.updateScene();
      this.drawScene();

      jb.while(jb.transitions.isTransitioning());
    },

    endWaitForTransitions: function() {
      jb.end();
    },

    // ------------------------------------------
    do_WaitForLootTransitions: function() {
      this.updateScene();
      this.drawScene();

      jb.while(jb.transitions.isTransitioning());
    },

    // ------------------------------------------
    listenForGestures: function() {
      jb.listenForSwipe();
      jb.listenForTap();
    },

    do_waitForPlayerGesture: function() {
      this.updateScene();
      this.drawScene();

      jb.until(jb.tap.done || jb.swipe.done);
    },

    endWaitForTransitionsAndGestures: function() {
      jb.end();
    },

    // Helper Functions ///////////////////////////////////////////////////////
};




