///////////////////////////////////////////////////////////////////////////////
// Resources Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    spriteSheet: null,
    sound: null,

    start: function() {
        this.spriteSheet = resources.loadImage("oryx_16bit_scifi_vehicles_trans.png", "./res/sf/");
        this.sound = resources.loadSound("sound.mp3");
    },

    do_waitForResources: function() {
        jb.until(resources.loadComplete());
    },

    checkResources: function() {
        if (!resources.loadSuccessful()) {
            goto("stop");
        }
        else {
            jb.sound.play(this.sound, 1.0);
            jb.listenForTap();
        }
    },

    do_displayBitmap: function() {
        jb.drawImageNormalized(this.spriteSheet, 0.5, 0.5);

        jb.until(jb.tap.done);
    },

    stop: function() {
        jb.print("Resource load failed.`");
        jb.end();
    },
};

///////////////////////////////////////////////////////////////////////////////
// Gosub Test
///////////////////////////////////////////////////////////////////////////////
jb.programTest = {
    start: function() {
        jb.print("Waiting for tap...");
        jb.gosub("startWaitForTap");
    },

    mid: function() {
        jb.print("done!`");
        jb.print("Waiting for another tap...");
        jb.gosub("startWaitForTap");
    },

    end: function() {
        jb.print("done!`");
        jb.end();
    },

    ///////////////////////////////////////////////////////////////////////////
    startWaitForTap: function() {
        jb.listenForTap();
    },

    do_waitForTap: function() {
        jb.until(jb.tap.done);
    },

    endWaitForTap: function() {
        jb.end();
    },
};

///////////////////////////////////////////////////////////////////////////////
// Touch Test
///////////////////////////////////////////////////////////////////////////////
jb.programTouchTest = {
    touchKnight: null,

    setup: function() {
        blueprints.draft(
            // Template name
            "testKnight",

            // Template data
            {
                x: 0,
                y: 0,
                size: "16x16",
                glyph: "knight"
            },

            // Template actions and shared data
            {
                onCreate: function() {
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

        blueprints.make("testKnight", "touchable");

        this.touchKnight = blueprints.build("testKnight");
        this.touchKnight.moveTo(100, 50);

        jb.listenForSwipe();
    },

    do_touchKnight: function() {
        jb.clear("black");
        jb.glyphs.draw(this.touchKnight.size, this.touchKnight.glyph, this.touchKnight.x, this.touchKnight.y, 2, 2);

        if (jb.swipe.touched) {
            jb.swipe.touched.bounds.draw("red");
            jb.swipe.touched.moveTo(jb.swipe.endX, jb.swipe.endY);
        }

        jb.until(jb.swipe.done);
    },
};



