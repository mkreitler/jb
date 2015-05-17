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

jb.program = {
    touchKnight: null,

    setup: function() {
        blueprints.draft(
            // Template name
            "testKnight",

            // Template constructor
            function(x, y) {
                // Template data
                this.x = x;
                this.y = y;
                this.size = "16x16";
                this.glyph = "knight";
            },

            // Template actions and shared data
            {
                onSpawned: function() {
                    jb.glyphs.getBounds(this.size, this.glyph, 2, 2, this.bounds);
                    this.bounds.moveBy(this.x, this.y);
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
            },

            // Included components
            "touchable"
        );

        this.touchKnight = blueprints.build("testKnight", 100, 50);

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



