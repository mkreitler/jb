///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    sfFont: null,

    start: function() {
      this.sfFont = resources.loadFont("Erval", "./res/fonts", "otf");
    },

    do_waitForResources: function() {
      jb.until(resources.loadComplete());
    },

    startTitleScreen: function() {
      jb.setOpenTypeFont(this.sfFont, 50, 1.33);
      jb.listenForTap();
    },

    do_titleScreen: function() {
      jb.backColor = "gray";
      jb.clear();
      jb.drawOpenTypeFontAt(jb.ctxt, "Star Zoo", jb.canvas.width / 2, jb.canvas.height / 2, "yellow", "black", 0.5, 1.0);
//      this.sfFont.openTypeFont.drawMetrics(jb.ctxt, "Station Invasion", jb.canvas.width / 2, jb.canvas.height / 2, jb.openTypeFontSize);

      jb.until(jb.tap.done);
    },

    end: function() {
      jb.end();
    },

    // API R&D Area ///////////////////////////////////////////////////////////
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




