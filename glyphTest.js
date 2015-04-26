// Acey-ducey card game

// Create an object that will be the game:
game = {
    // Variables and data //////////////////////////////////////////////////////

    // Functions ///////////////////////////////////////////////////////////////
    test: function() {
        var testSound = jb.sound.makeTestSound();

        jb.setBackColor("rgba(64, 32, 0, 1)");
        jb.clear();
        jb.glyphs.draw("16x16", "tree01", 150, 118, 4, 4);
        jb.glyphs.draw("16x16", "knight", 100, 150, 2, 2);
        jb.glyphs.draw("16x16", "mage", 68, 150, 2, 2);

        jb.glyphs.draw("16x16", "brickBattlementLeft", 200, 118, 2, 2);
        jb.glyphs.draw("16x16", "brickBattlementCenter", 232, 118, 2, 2);
        jb.glyphs.draw("16x16", "brickBattlementCenter", 264, 118, 2, 2);
        jb.glyphs.draw("16x16", "brickBattlementRight", 296, 118, 2, 2);

        jb.glyphs.draw("16x16", "brickLeft", 200, 150, 2, 2);
        jb.glyphs.draw("16x16", "brickCenter", 232, 150, 2, 2);
        jb.glyphs.draw("16x16", "brickCenterDoor", 264, 150, 2, 2);
        jb.glyphs.draw("16x16", "brickRight", 296, 150, 2, 2);

        jb.glyphs.draw("16x16", "brickTopLeft", 264, 200, 2, 2);
        jb.glyphs.draw("16x16", "brickCenter", 296, 200, 2, 2);
        jb.glyphs.draw("16x16", "brickTopRight", 328, 200, 2, 2);

        jb.glyphs.draw("16x16", "brickMidDoor", 264, 232, 2, 2);
        jb.glyphs.draw("16x16", "brickMidDoorway", 328, 232, 2, 2);

        jb.glyphs.draw("16x16", "brickBottomLeft", 264, 264, 2, 2);
        jb.glyphs.draw("16x16", "brickCenterDoorway", 296, 264, 2, 2);
        jb.glyphs.draw("16x16", "brickBottomRight", 328, 264, 2, 2);
  
        jb.glyphs.draw("16x16", "brickWedgeTopLeft", 364, 264, 2, 2);
        jb.glyphs.draw("16x16", "brickWedgeTopRight", 396, 264, 2, 2);
        jb.glyphs.draw("16x16", "brickWedgeBottomLeft", 364, 296, 2, 2);
        jb.glyphs.draw("16x16", "brickWedgeBottomRight", 396, 296   , 2, 2);

        jb.fonts.printAt("fantasy", 1, 40, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.!?'", "red", 0.5, 0, 1);
        jb.fonts.printAt("fantasy", 2, 40, "I CAN'T EAT 200 FISH!", "yellow", 0.5, 0, 1);

        testSound.play();
    }
};


// Start the game!
window.onload = function() {
    jb.run(game);
};
