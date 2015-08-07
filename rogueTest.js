///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    spriteImages: {},
    tiles: {},
    dungeonCard: null,
    cameraManager: null,
    dustParticle: null,
    player: null,
    monster: null,
    cameraZoomTime: 1.0,  // NOT constant!
    GROW_PHASE_TIME: 0.1,
    FADE_PHASE_TIME: 0.33,
    CAMERA_FADE_TIME: 0.5,

    start: function() {
        this.spriteImages["dungeonTiles"] = resources.loadImage("oryx_16bit_fantasy_world_trans.png", "./res/fantasy art/");
        this.spriteImages["creatureTiles"] = resources.loadImage("oryx_16bit_fantasy_creatures_trans.png", "./res/fantasy art/");
        this.spriteImages["FXtiles"] = resources.loadImage("oryx_16bit_fantasy_fx_trans.png", "./res/fantasy art/");
    },

    do_waitForResources: function() {
        jb.until(resources.loadComplete());
    },

    initSprites: function() {
        var sheets = [],
            knightIdle = null,
            beholderIdle = null,
            dustGrow = null,
            dustFade = null;

        jb.setViewScale(2);
        jb.setViewOrigin(0, jb.canvas.height / 2);

        this.createDustParticle();
        this.createPlayerObject();
        this.createMonsterObject();
        this.createCameraManager();

        this.tiles["dungeon01"] = jb.sprites.addSheet("dungeon01", this.spriteImages["dungeonTiles"], 24, 24, 1, 27, 24, 24);
        this.tiles["creature01"] = jb.sprites.addSheet("creature01", this.spriteImages["creatureTiles"], 24, 24, 18, 22, 24, 24);
        this.tiles["fx_24x24"] = jb.sprites.addSheet("fx_24x24", this.spriteImages["FXtiles"], 24, 24, 20, 10, 24, 24);
        this.tiles["fx_32x32"] = jb.sprites.addSheet("fx_32x32", this.spriteImages["FXtiles"], 288, 32, 11, 8, 32, 32);

        knightIdle = jb.sprites.createState([{row: 0, col: 0}, {row: 1, col: 0}], 0.33, false, null);
        beholderIdle = jb.sprites.createState([{row: 12, col: 4}, {row: 13, col: 4}], 0.33, false, null);
        dustGrow = jb.sprites.createState([{row: 10 , col: 4}], this.GROW_PHASE_TIME, false, null);
        dustFade = jb.sprites.createState([{row: 10 , col: 5}], this.FADE_PHASE_TIME, false, null);

        this.player = blueprints.build("playerObject", "creature01", {"idle" : knightIdle}, "idle", 1 * 24, jb.canvas.height / 2 + 24);
        this.monster = blueprints.build("monsterObject", "creature01", {"idle" : beholderIdle}, "idle", 6 * 24, jb.canvas.height / 2 + 24);
        this.dustParticle = blueprints.build("dustParticle", "fx_32x32", {"grow" : dustGrow, "fade" : dustFade}, "grow", 12, jb.canvas.height / 2 + 2 * 24 + 12);

        this.player.spriteSetScale(-1, 1);

        sheets.push(this.tiles["dungeon01"]);
        this.dungeonCard = new rmk.DungeonCard(sheets);

        this.cameraManager.startFadeOut();

        jb.listenForTap();
    },

    do_waitForPlayerTapped: function() {
      this.updateScene();
      this.drawScene();

      jb.until(jb.tap.touched === this.player);
    },

    startZoomIn: function() {
      this.cameraManager.startZoomAndScale(this.player.bounds.l - jb.canvas.width * 0.25 / 3,
                                           this.player.bounds.t - jb.canvas.height * 0.25 / 3,
                                           3);
      jb.gosub("do_waitForTransitions");
    },

    playerAttack: function() {
      this.player.startDash();
      this.dustParticle.emitAt(this.player.bounds.l + this.player.bounds.halfWidth,
                               this.player.bounds.t + this.player.bounds.halfHeight);

      jb.gosub("do_waitForTransitions");
    },

    startZoomOut: function() {
      this.cameraManager.startZoomAndScale(0, jb.canvas.height * 0.5, 2);
      this.player.startReset();

      jb.gosub("do_waitForTransitions");
    },

    done: function() {
      jb.end();
    },

    // API R&D Area ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    // Subroutines ////////////////////////////////////////////////////////////
    do_WaitForTransitions: function() {
        this.updateScene();
        this.drawScene();

        jb.while(jb.transitions.isTransitioning());
    },

    listenForTap: function() {
        jb.listenForTap();
    },

    do_waitForPlayerTap: function() {
        this.updateScene();
        this.drawScene();

        jb.until(jb.tap.done);
    },

    endWaitForTransitions: function() {
      jb.end();
    },

    // Helper Functions ///////////////////////////////////////////////////////
    updateScene: function() {
      this.dustParticle.spriteUpdate(jb.time.deltaTime);      
      this.player.spriteUpdate(jb.time.deltaTime);
      this.monster.spriteUpdate(jb.time.deltaTime);
    },

    drawScene: function() {
      jb.clear();
      this.dungeonCard.drawAt(jb.ctxt, 0, jb.canvas.height / 2);
      this.dustParticle.spriteDraw(jb.ctxt);
      this.player.spriteDraw(jb.ctxt);
      this.monster.spriteDraw(jb.ctxt);
      this.cameraManager.draw(jb.ctxt);
    },

    createPlayerObject: function() {
        blueprints.draft(
            "playerObject",

            // Data
            {
              startX: 0,
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
                },

                startDash: function() {
                  this.transitionerAdd("dash", 0.33, this.updateDash, this.finalizeDash, true);
                  this.startX = this.bounds.l;
                },

                updateDash: function(param) {
                  var newX = this.startX * (1.0 - param) + 7 * 24 * (param);

                  this.spriteMoveTo(newX, this.bounds.t);
                },

                finalizeDash: function() {
                  this.spriteMoveTo(7 * 24, this.bounds.t);
                },

                startReset: function() {
                  this.transitionerAdd("resetFadeOut", jb.program.cameraZoomTime * 0.5, this.updateResetFadeOut, this.finalizeResetFadeOut, true);
                  this.spriteSetAlpha(1.0);
                },

                updateResetFadeOut: function(param) {
                  this.spriteSetAlpha(1.0 - param);
                },

                finalizeResetFadeOut: function() {
                  this.spriteSetAlpha(0.0);
                  this.startResetFadeIn();
                },

                startResetFadeIn: function() {
                  this.transitionerAdd("resetFadeIn", jb.program.cameraZoomTime * 0.5, this.updateResetFadeIn, this.finalizeResetFadeIn, true);
                  this.spriteMoveTo(this.startX, this.bounds.t);
                },

                updateResetFadeIn: function(param) {
                  this.spriteSetAlpha(param);
                },

                finalizeResetFadeIn: function() {
                  this.spriteSetAlpha(1.0);
                },

            }
        );

        blueprints.make("playerObject", "touchable");
        blueprints.make("playerObject", "sprite");
        blueprints.make("playerObject", "transitioner");
    },

    createDustParticle: function() {
      blueprints.draft(
        "dustParticle",

        // Data
        {
          STARTING_SCALE: 0.25,
          alpha: 0.0,
          lifetime: 0.0,
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

            this.spriteSetAnchor(0.5, 0.5);
          },

          emitAt: function(x, y) {
            this.spriteMoveTo(x, y);
            this.stateMachineStart(this.growState);
          },

          growState: {
            enter: function() {
              this.spriteSetScale(this.STARTING_SCALE, this.STARTING_SCALE);
              this.spriteSetAlpha(1.0);
              this.lifetime = 0.0;
              this.spriteSetState("grow");
            },

            update: function(dt) {
              var scale = 1,
                  param = 0;

              this.lifetime += dt;
              if (this.lifetime > jb.program.GROW_PHASE_TIME) {
                this.lifetime -= jb.program.GROW_PHASE_TIME;

                this.stateMachineSetNextState(this.fadeState);
              }
              else {
                param = this.lifetime / jb.program.GROW_PHASE_TIME;
                scale = param * (1.0 - this.STARTING_SCALE) + this.STARTING_SCALE;
                this.spriteSetScale(scale, scale);
              }
            },

            exit: function() {
              this.spriteSetScale(1.0, 1.0);
            },
          },

          fadeState: {
            enter: function() {
              this.alpha = 1.0;
              this.spriteSetScale(1.0);
              this.spriteSetState("fade");
            },

            update: function(dt) {
              var spriteAlpha = 1.0;

              this.lifetime += dt;
              if (this.lifetime < jb.program.FADE_PHASE_TIME) {
                spriteAlpha = 1.0 - this.lifetime / jb.program.FADE_PHASE_TIME;
                spriteAlpha = Math.max(0.0, spriteAlpha);

                this.spriteSetAlpha(spriteAlpha);
              }
              else {
                this.stateMachineStop();
              }
            },

            exit: function() {
              this.lifetime = 0.0;
              this.spriteSetAlpha(0.0);
            }
          }
        }
      );

      blueprints.make("dustParticle", "sprite");
      blueprints.make("dustParticle", "stateMachine");
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
            this.transitionerAdd("fadeIn", jb.program.CAMERA_FADE_TIME, this.updateFadeIn, this.finalizeFadeIn, true);
          },

          startFadeOut: function() {
            this.transitionerAdd("fadeOut", jb.program.CAMERA_FADE_TIME, this.updateFadeOut, this.finalizeFadeOut, true);
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

                jb.program.cameraZoomTime = Math.sqrt(dx * dx + dy * dy) / this.ONE_SEC_DIST;

                this.transitionerAdd("zoomAndScale",
                                     jb.program.cameraZoomTime,
                                     this.updateZoomAndScale,
                                     this.finalizeZoomAndScale,
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




