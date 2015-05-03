// Acey-ducey card game

// Create an object that will be the game:
game = {
    // Variables and data //////////////////////////////////////////////////////
    BACK_COLOR: "rgba(64, 32, 0, 1)",

    // Functions ///////////////////////////////////////////////////////////////
    test: function() {
        var testSound = jb.sound.makeSound("pinkNoise", 0.5, 1.0, 50, 100);

        jb.setBackColor(game.BACK_COLOR);
        jb.clear();

        jb.glyphs.draw("16x16", "submarineLeft", 50, 75, 4, 2);
        jb.glyphs.draw("16x16", "destroyerRight", 150, 75, 4, 2);

        jb.glyphs.draw("16x16", "tree01", 150, 118, 4, 4);
        jb.glyphs.draw("16x16", "knight", 100, 150, 2, 2);
        jb.glyphs.draw("16x16", "mage", 68, 150, 2, 2);

        jb.glyphs.draw("16x16", "brickBattlementLeft", 200, 118, 2, 2);
        jb.glyphs.draw("16x16", "brickBattlementCenter", 232, 118, 2, 2);
        jb.glyphs.draw("16x16", "brickBattlementRight", 264, 118, 2, 2);

        // Tower
        jb.glyphs.draw("16x16", "brickLeft", 200, 150, 2, 2);
        jb.glyphs.draw("16x16", "brickCenterWindow", 232, 150, 2, 2);
        jb.glyphs.draw("16x16", "brickRight", 264, 150, 2, 2);

        jb.glyphs.draw("16x16", "brickLeft", 200, 182, 2, 2);
        jb.glyphs.draw("16x16", "brickCenter", 232, 182, 2, 2);
        jb.glyphs.draw("16x16", "brickRight", 264, 182, 2, 2);

        jb.glyphs.draw("16x16", "brickLeft", 200, 214, 2, 2);
        jb.glyphs.draw("16x16", "brickCenterWindow", 232, 214, 2, 2);
        jb.glyphs.draw("16x16", "brickRight", 264, 214, 2, 2);

        jb.glyphs.draw("16x16", "brickLeft", 200, 246, 2, 2);
        jb.glyphs.draw("16x16", "brickCenter", 232, 246, 2, 2);
        jb.glyphs.draw("16x16", "brickRight", 264, 246, 2, 2);

        jb.glyphs.draw("16x16", "brickCenterLeft", 200, 278, 2, 2);
        jb.glyphs.draw("16x16", "brickCenterWindow", 232, 278, 2, 2);
        jb.glyphs.draw("16x16", "brickCenter", 264, 278, 2, 2);

        jb.glyphs.draw("16x16", "brickCenterLeft", 200, 310, 2, 2);
        jb.glyphs.draw("16x16", "brickCenterDoor", 232, 310, 2, 2);
        jb.glyphs.draw("16x16", "brickCenter", 264, 310, 2, 2);

        // Blockhouse cross-section
        jb.glyphs.draw("16x16", "brickTopLeft", 364, 200, 2, 2);
        jb.glyphs.draw("16x16", "brickCenter", 396, 200, 2, 2);
        jb.glyphs.draw("16x16", "brickTopRight", 428, 200, 2, 2);

        jb.glyphs.draw("16x16", "brickMidDoor", 364, 232, 2, 2);
        jb.glyphs.draw("16x16", "brickMidDoorway", 428, 232, 2, 2);

        jb.glyphs.draw("16x16", "brickBottomLeft", 364, 264, 2, 2);
        jb.glyphs.draw("16x16", "brickCenterDoorway", 396, 264, 2, 2);
        jb.glyphs.draw("16x16", "brickBottomRight", 428, 264, 2, 2);

        // Tower cross-section
        jb.glyphs.draw("16x16", "brickWedgeTopLeft", 464, 200, 2, 2);
        jb.glyphs.draw("16x16", "brickCenter", 496, 200, 2, 2);
        jb.glyphs.draw("16x16", "brickWedgeTopRight", 528, 200, 2, 2);

        jb.glyphs.draw("16x16", "brickMidDoor", 464, 232, 2, 2);
        jb.glyphs.draw("16x16", "brickMidDoorway", 528, 232, 2, 2);

        jb.glyphs.draw("16x16", "brickWedgeBottomLeft", 464, 264, 2, 2);
        jb.glyphs.draw("16x16", "brickCenterDoorway", 496, 264, 2, 2);
        jb.glyphs.draw("16x16", "brickWedgeBottomRight", 528, 264, 2, 2);

        jb.fonts.printAt("fantasy", 1, 40, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.!?'", "red", 0.5, 0, 1);
        jb.fonts.printAt("fantasy", 2, 40, "I CAN'T EAT 200 FISH!", "yellow", 0.5, 0, 2);
        jb.fonts.printAt("military", 4, 40, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.'", "white", 0.5, 0, 1);
        jb.fonts.printAt("military", 5, 40, "AND IF I COULD, I WOULDN'T EAT 200 FISH!", "orange", 0.5, 0, 1);

        if (testSound) {
            testSound.play();
        }

        this.missileIndex = 0;
    },

    missile_loop: function() {
        this.missileIndex += 1;
        this.missileIndex = this.missileIndex % 10;

        jb.ctxt.fillStyle = game.BACK_COLOR;
        jb.ctxt.fillRect(350, 75, 8, 16);

        if (this.missileIndex < 5) {
            jb.glyphs.draw("8x8", "missile01up", 350, 75, 1, 2);
        }
        else {
            jb.glyphs.draw("8x8", "missile01up2", 350, 75, 1, 2);
        }
    }
};

// Start the game!
window.onload = function() {
    jb.run(game);
};
