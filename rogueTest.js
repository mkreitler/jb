///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    spriteImages: {},
    tiles: {},
    dungeonCard: null,
    cameraManager: null,
    player: null,
    monster: null,

    start: function() {
        this.spriteImages["dungeonTiles"] = resources.loadImage("oryx_16bit_fantasy_world_trans.png", "./res/fantasy art/");
        this.spriteImages["creatureTiles"] = resources.loadImage("oryx_16bit_fantasy_creatures_trans.png", "./res/fantasy art/");
    },

    do_waitForResources: function() {
        jb.until(resources.loadComplete());
    },

    initSprites: function() {
        var sheets = [],
            knightIdle = null,
            beholderIdle = null;

        jb.setViewScale(2);
        jb.setViewOrigin(0, jb.canvas.height / 2);

        this.createPlayerObject();
        this.createMonsterObject();
        this.createCameraManager();

        this.tiles["dungeon01"] = jb.sprites.addSheet("dungeon01", this.spriteImages["dungeonTiles"], 24, 24, 1, 27, 24, 24);
        this.tiles["creature01"] = jb.sprites.addSheet("creature01", this.spriteImages["creatureTiles"], 24, 24, 18, 22, 24, 24);

        knightIdle = jb.sprites.createState([{row: 0, col: 0}, {row: 1, col: 0}], 0.33, false, 0, null);
        beholderIdle = jb.sprites.createState([{row: 12, col: 4}, {row: 13, col: 4}], 0.33, false, 0, null);

        this.player = blueprints.build("playerObject", "creature01", {"idle" : knightIdle}, "idle", 0, jb.canvas.height / 2 + 24);
        this.monster = blueprints.build("monsterObject", "creature01", {"idle" : beholderIdle}, "idle", 6 * 24, jb.canvas.height / 2 + 24);

        sheets.push(this.tiles["dungeon01"]);
        this.dungeonCard = new rmk.DungeonCard(sheets);

        this.cameraManager.startFadeOut();

        jb.listenForTap();
    },

    do_waitForPlayerTapped: function() {
        jb.clear();
        this.dungeonCard.drawAt(jb.ctxt, 0, jb.canvas.height / 2);

        this.player.spriteUpdate(jb.time.deltaTime);
        this.monster.spriteUpdate(jb.time.deltaTime);

        this.player.spriteDraw(jb.ctxt, -1, 1);
        this.monster.spriteDraw(jb.ctxt);

        this.cameraManager.draw(jb.ctxt);

        jb.until(jb.tap.touched === this.player);
    },

    startZoom: function() {
        this.cameraManager.startZoomAndScale(this.player.bounds.l - jb.canvas.width * 0.25 / 3,
                                             this.player.bounds.t - jb.canvas.height * 0.25 / 3,
                                             3);
    },

    do_ZoomInOnPlayer: function() {
        jb.clear();
        this.dungeonCard.drawAt(jb.ctxt, 0, jb.canvas.height / 2);

        this.player.spriteUpdate(jb.time.deltaTime);
        this.monster.spriteUpdate(jb.time.deltaTime);

        this.player.spriteDraw(jb.ctxt, -1, 1);
        this.monster.spriteDraw(jb.ctxt);

        jb.while(jb.transitions.isTransitioning());
    },

    listenForTap: function() {
        jb.listenForTap();
    },

    do_waitForEnd: function() {
        jb.clear();
        this.dungeonCard.drawAt(jb.ctxt, 0, jb.canvas.height / 2);

        this.player.spriteUpdate(jb.time.deltaTime);
        this.monster.spriteUpdate(jb.time.deltaTime);

        this.player.spriteDraw(jb.ctxt, -1, 1);
        this.monster.spriteDraw(jb.ctxt);

        this.cameraManager.draw(jb.ctxt);

        jb.until(jb.tap.touched);
    },

    done: function() {
        jb.end();
    },

    // Helper Functions ///////////////////////////////////////////////////////
    createPlayerObject: function() {
        blueprints.draft(
            "playerObject",

            // Data
            {
            },

            // Methods
            {
                onCreate: function(sheet, states, startState, x, y) {
                    this.spriteSetSheet(sheet);
                    this.spriteAddStates(states);

                    if (startState) {
                        this.spriteSetState(startState);
                    }

                    x = x ? x : 0;
                    y = y ? y : 0;

                    this.spriteMoveTo(x, y);
                }
            }
        );

        blueprints.make("playerObject", "touchable");
        blueprints.make("playerObject", "sprite");
        blueprints.make("playerObject", "transitioner");
    },

    createMonsterObject: function() {
        blueprints.draft(
            "monsterObject",

            // Data
            {
            },

            // Methods
            {
                onCreate: function(sheet, states, startState, x, y) {
                    this.spriteSetSheet(sheet);
                    this.spriteAddStates(states);

                    if (startState) {
                        this.spriteSetState(startState);
                    }

                    x = x ? x : 0;
                    y = y ? y : 0;

                    this.spriteMoveTo(x, y);
                }
            }
        );

        blueprints.make("monsterObject", "touchable");
        blueprints.make("monsterObject", "sprite");
        blueprints.make("monsterObject", "transitioner");
    },

    createCameraManager: function() {
      blueprints.draft(
        "cameraManager",
        {
          // Data
          alpha: 0,
          fadeColor: "black",
          startOrigin: {x: 0, y: 0},
          endOrigin: {x: 0, y: 0 },
          startScale: 1.0,
          endScale: 1.0,
          ONE_SEC_DIST: 200,
        },

        {
          // Methods
          updateFadeIn: function(param) {
            this.alpha = this.transitionerParamToEaseInOut(param);
          },

          updateFadeOut: function(param) {
            this.alpha = this.transitionerParamToEaseInOut(1 - param);
          },

          updateZoomAndScale: function(param) {
            var easedParam = this.transitionerParamToEaseInOut(param);

            jb.setViewScale(this.endScale * easedParam + this.startScale * (1.0 - easedParam));
            jb.setViewOrigin(this.endOrigin.x * easedParam + this.startOrigin.x * (1.0 - easedParam),
                             this.endOrigin.y * easedParam + this.startOrigin.y * (1.0 - easedParam));
          },

          finalizeFadeIn: function() {
            this.alpha = 1;
          },

          finalizeFadeOut: function() {
            this.alpha = 0;
          },

          finalizeZoomAndScale: function() {
            jb.setViewScale(this.endScale);
            jb.setViewOrigin(this.endOrigin.x, this.endOrigin.y);
          },

          startFadeIn: function() {
            this.transitionerAdd("fadeIn", 0.5, this.updateFadeIn.bind(this), this.finalizeFadeIn.bind(this), true);
          },

          startFadeOut: function() {
            this.transitionerAdd("fadeOut", 0.5, this.updateFadeOut.bind(this), this.finalizeFadeOut.bind(this), true);
          },

          startZoomAndScale: function(destX, destY, destScale) {
            // Compute the new view origin given that we want (destX, destY) to
            // map to (screenX, screenY) at the specified scale.
            var curOrigin = jb.getViewOrigin(),
                dx = 0,
                dy = 0;

                this.startOrigin.x = curOrigin.x;
                this.startOrigin.y = curOrigin.y;

                this.endOrigin.x = destX;
                this.endOrigin.y = destY;

                this.startScale = jb.getViewScale();
                this.endScale = Math.max(jb.EPSILON, destScale);

                dx = this.endOrigin.x - this.startOrigin.x;
                dy = this.endOrigin.y - this.startOrigin.y;

                this.transitionerAdd("zoomAndScale",
                                     Math.sqrt(dx * dx + dy * dy) / this.ONE_SEC_DIST,
                                     this.updateZoomAndScale.bind(this),
                                     this.finalizeZoomAndScale.bind(this),
                                     true);
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

      blueprints.make("cameraManager", "transitioner");

      this.cameraManager = blueprints.build("cameraManager");
    }
};




