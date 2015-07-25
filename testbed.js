///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    spriteImages: {},
    tiles: {},
    sprites: {},
    dungeonCard: null,
    fadePlane: null,

    start: function() {
        this.spriteImages["dungeonTiles"] = resources.loadImage("oryx_16bit_fantasy_world_trans.png", "./res/fantasy art/");
        this.spriteImages["creatureTiles"] = resources.loadImage("oryx_16bit_fantasy_creatures_trans.png", "./res/fantasy art/");
    },

    do_waitForResources: function() {
        jb.until(resources.loadComplete());
    },

    initSprites: function() {
        var sheets = [];

        jb.setViewScale(2);
            jb.setViewOrigin(0, 768 / 2);

        this.tiles["dungeon01"] = jb.sprites.addSheet("dungeon01", this.spriteImages["dungeonTiles"], 24, 24, 1, 27, 24, 24);
        this.tiles["creature01"] = jb.sprites.addSheet("creature01", this.spriteImages["creatureTiles"], 24, 24, 18, 22, 24, 24);

        this.sprites["knight"] = jb.sprites.create("creature01", 0, 768 / 2 + 12,
                                                        {"walk": jb.sprites.createState([{row: 0, col: 0}, {row: 1, col: 0}],
                                                                                        0.33,
                                                                                        false,
                                                                                        0,
                                                                                        null)},
                                                    "walk");

        sheets.push(this.tiles["dungeon01"]);
        this.dungeonCard = new rmk.DungeonCard(sheets);

        this.createFadePlane();
        this.fadePlane.startFadeOut();

        jb.listenForTap();
    },

    do_drawSprites: function() {
        this.dungeonCard.drawAt(jb.ctxt, 0, 768 / 2 - 12);

        this.sprites["knight"].update(jb.time.deltaTime);
        this.sprites["knight"].draw(jb.ctxt);

        this.fadePlane.draw(jb.ctxt);

        jb.until(jb.tap.done);
    },

    done: function() {
        jb.end();
    },

    // Helper Functions ///////////////////////////////////////////////////////
    createFadePlane: function() {
      blueprints.draft(
        "fadePlane",
        {
          // Data
          alpha: 0,
          fadeColor: "black",
        },

        {
          // Methods
          updateFadeIn: function(param) {
            this.alpha = param;
          },

          updateFadeOut: function(param) {
            this.alpha = 1 - param;
          },

          finalizeFadeIn: function() {
            this.alpha = 1;
          },

          finalizeFadeOut: function() {
            this.alpha = 0;
          },

          startFadeIn: function() {
            this.transitionerAdd("fadeIn", 0.5, this.updateFadeIn.bind(this), this.finalizeFadeIn.bind(this), true);
          },

          startFadeOut: function() {
            this.transitionerAdd("fadeOut", 0.5, this.updateFadeOut.bind(this), this.finalizeFadeOut.bind(this), true);
          },

          draw: function(ctxt) {
            if (this.alpha > 0) {
              ctxt.save();

              ctxt.globalAlpha = this.alpha;
              ctxt.fillStyle = this.fadeColor;
              ctxt.fillRect(0, 0, jb.canvas.width, jb.canvas.height);

              ctxt.restore();
            }
          },

          isFadeFinished: function() {
            return this.alpha === 0 && this.transitionerCountActiveTransitions() === 0;
          }
        }
      );

      blueprints.make("fadePlane", "transitioner");

      this.fadePlane = blueprints.build("fadePlane");
    }
};

///////////////////////////////////////////////////////////////////////////////
// Resources Test
///////////////////////////////////////////////////////////////////////////////
jb.programResource = {
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
            jb.print("Resource load failed.`");
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
jb.programBlueprint = {
    touchKnight: null,

    setup: function() {
        blueprints.draft(
            // Template name
            "testKnight",

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

        blueprints.make("testKnight", "touchable");

        this.touchKnight = blueprints.build("testKnight", 0, 0, "16x16", "knight");
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



