///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    spriteImages: {},
    tiles: {},
    dungeonCard: null,
    cameraManager: null,
    dustParticle: null,
    spurtParticle: null,
    readoutParticle: null,
    player: null,
    monster: null,
    cameraZoomTime: 1.0,  // NOT constant!
    GROW_PHASE_TIME: 0.1,
    FADE_PHASE_TIME: 0.33,
    CAMERA_FADE_TIME: 0.5,
    CAMERA_WHITEOUT_TIME: 0.3,

    start: function() {
        this.spriteImages["dungeonTiles"] = resources.loadImage("oryx_16bit_fantasy_world_trans.png", "./res/fantasy art/");
        this.spriteImages["creatureTiles"] = resources.loadImage("oryx_16bit_fantasy_creatures_trans.png", "./res/fantasy art/");
        this.spriteImages["FXtiles"] = resources.loadImage("oryx_16bit_fantasy_fx_trans.png", "./res/fantasy art/");
        this.spriteImages["slashParticle"] = resources.loadImage("singleSlash.png", "./res/particles/");
    },

    do_waitForResources: function() {
        jb.until(resources.loadComplete());
    },

    initSprites: function() {
        var sheets = [],
            knightIdle = null,
            beholderIdle = null,
            dustGrow = null,
            dustFade = null,
            slashFade = null;

        jb.setViewScale(2);
        jb.setViewOrigin(0, jb.canvas.height / 2);

        this.createPlayerObject();
        this.createMonsterObject();
        this.createCameraManager();

        this.createDustParticle();
        this.createSlashParticle();
        this.createSpurtParticle();
        this.createReadoutParticle();

        this.tiles["dungeon01"] = jb.sprites.addSheet("dungeon01", this.spriteImages["dungeonTiles"], 24, 24, 1, 27, 24, 24);
        this.tiles["creature01"] = jb.sprites.addSheet("creature01", this.spriteImages["creatureTiles"], 24, 24, 18, 22, 24, 24);
        this.tiles["fx_24x24"] = jb.sprites.addSheet("fx_24x24", this.spriteImages["FXtiles"], 24, 24, 20, 10, 24, 24);
        this.tiles["fx_32x32"] = jb.sprites.addSheet("fx_32x32", this.spriteImages["FXtiles"], 288, 32, 11, 8, 32, 32);
        this.tiles["slashParticle"] = jb.sprites.addSheet("slashParticle", this.spriteImages["slashParticle"], 0, 0, 1, 1, 192, 3);
        this.tiles["slashCreatures"] = jb.sprites.addSheet("slashParticle", this.spriteImages["slashParticle"], 0, 0, 1, 1, 24, 12);

        knightIdle = jb.sprites.createState([{row: 0, col: 0}, {row: 1, col: 0}], 0.33, false, null);
        beholderIdle = jb.sprites.createState([{row: 12, col: 4}, {row: 13, col: 4}], 0.33, false, null);
        dustGrow = jb.sprites.createState([{row: 10 , col: 4}], this.GROW_PHASE_TIME, false, null);
        dustFade = jb.sprites.createState([{row: 10 , col: 5}], this.FADE_PHASE_TIME, false, null);

        this.player = blueprints.build("playerObject", "creature01", {"idle" : knightIdle}, "idle", 1 * 24, jb.canvas.height / 2 + 24);
        this.monster = blueprints.build("monsterObject", "creature01", {"idle" : beholderIdle}, "idle", 6 * 24, jb.canvas.height / 2 + 24);
        this.dustParticle = blueprints.build("dustParticle", "fx_32x32", {"grow" : dustGrow, "fade" : dustFade}, "grow", 12, jb.canvas.height / 2 + 2 * 24 + 12);
        this.slashParticle = blueprints.build("slashParticle", "slashParticle");
        this.spurtParticle = blueprints.build("spurtParticle", "fx_32x32");
        this.readoutParticle = blueprints.build("readoutParticle");

        this.player.spriteSetScale(-1, 1);
        this.player.setTarget(this.monster);

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

    restart: function() {
      jb.goto("do_waitForPlayerTapped");
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
      this.slashParticle.spriteUpdate(jb.time.deltaTime);
      this.spurtParticle.spriteUpdate(jb.time.deltaTime);
      this.player.spriteUpdate(jb.time.deltaTime);
      this.monster.spriteUpdate(jb.time.deltaTime);
    },

    drawScene: function() {
      jb.clear();
      this.dungeonCard.drawAt(jb.ctxt, 0, jb.canvas.height / 2);
      this.dustParticle.spriteDraw(jb.ctxt);
      this.player.spriteDraw(jb.ctxt);
      this.monster.spriteDraw(jb.ctxt);
      this.spurtParticle.spriteDraw(jb.ctxt);
      this.readoutParticle.draw(jb.ctxt);
      this.slashParticle.spriteDraw(jb.ctxt);
      this.cameraManager.draw(jb.ctxt);
    },

    ///////////////////////////////////////////////////////////////////////////
    // Game Objects
    ///////////////////////////////////////////////////////////////////////////
    createReadoutParticle: function() {
      blueprints.draft(
        "readoutParticle",

        // Data
        {
          value: 0,
          x: 0,
          y: 0,
          color: "white",
          alpha: 0,
          lifetime: 0,
          DRIFT_SPEED: 50,
          LIFETIME: 0.67,
        },

        // Methods
        {
          onCreate: function() {
            // Nothing special to do, here.
          },

          emitAt: function(value, x, y, color) {
            this.value = value;
            this.x = x;
            this.y = y;
            this.color = color || "white";
            this.lifetime = 0;

            this.stateMachineStart(this.fadeOut);
          },

          draw: function(ctxt) {
            var oldAlpha = ctxt.globalAlpha;

            if (this.alpha > 0.0) {
              ctxt.globalAlpha = this.alpha;
              jb.fonts.drawAt("fantasy", this.x, this.y, "" + this.value, this.color, 0.5, 0.0, 1);
              ctxt.globalAlpha = oldAlpha;
            }
          },

          // States
          fadeOut: {
            enter: function() {
              this.alpha = 0.0;
            },

            update: function(dt) {
              this.lifetime += dt;

              this.y -= dt * this.DRIFT_SPEED;

              if (this.lifetime >= this.LIFETIME) {
                this.stateMachineStop();
              }
              else {
                this.alpha = Math.sin(Math.PI * this.lifetime / this.LIFETIME);
                this.alpha = Math.min(1.0, this.alpha);
                this.alpha = Math.max(0.0, this.alpha);
              }
            },

            exit: function() {
              this.alpha = 0;
            }
          }
        }
      );

      blueprints.make("readoutParticle", "stateMachine");
    },

    createSpurtParticle: function() {
      blueprints.draft(
        "spurtParticle",

        // Data
        {
          sheet: null,
          tile: null,
          lifetime: 0,
          driftVel: {x: 0, y:0},
          GRAVITY: 50,
          DRIFT_SPEED: 70, // Pixels per second
          FADE_TIME: 0.33,
          ANCHOR_X: 0.5,
          ANCHOR_Y: 0.5,
        },

        // Methods
        {
          onCreate: function(sheet) {
            var spurtState01 = null,
                spurtState02 = null,
                spurtState03 = null;

            this.sheet = sheet;

            spurtState01 = jb.sprites.createState([{row:3, col:0}], 0.33, true, null);
            spurtState02 = jb.sprites.createState([{row:3, col:1}], 0.33, true, null);
            spurtState03 = jb.sprites.createState([{row:3, col:2}], 0.33, true, null);

            this.spriteSetSheet(sheet);

            this.spriteAddStates({"spurt01": spurtState01, "spurt02": spurtState02, "spurt03": spurtState03});
            this.spriteSetAnchor(this.ANCHOR_X, this.ANCHOR_Y);
            this.spriteHide();
          },

          emitAt: function(x, y) {
            var stateName = "spurt0" + (Math.floor(Math.random() * 3) + 1);

            this.spriteMoveTo(x, y);

            this.spriteSetState(stateName);
            this.driftVel.x = Math.cos(45.0 * Math.PI / 180.0) * this.DRIFT_SPEED;
            this.driftVel.y = -Math.sin(45.0 * Math.PI / 180.0) * this.DRIFT_SPEED;

            this.stateMachineStart(this.fadeState);
          },

          fadeState: {
            enter: function() {
              this.spriteSetAlpha(1.0);
              this.spriteShow();
              this.lifetime = 0;
            },

            update: function(dt) {
              var vStart = this.driftVel.y;

              this.lifetime += dt;

              this.driftVel.y += this.GRAVITY * dt;
              this.spriteMoveBy(Math.round(this.driftVel.x * dt), Math.round((this.driftVel.y + vStart) * 0.5 * dt));

              this.spriteSetAlpha(Math.max(0, 1.0 - this.lifetime / this.FADE_TIME));

              if (this.lifetime >= this.FADE_TIME) {
                this.stateMachineStop();
              }
            },

            exit: function() {
              this.spriteHide();
            }
          }
        }
      );

      blueprints.make("spurtParticle", "sprite");
      blueprints.make("spurtParticle", "stateMachine");
    },

    createPlayerObject: function() {
        blueprints.draft(
            "playerObject",

            // Data
            {
              startX: 0,
              target: null,
              bMetTarget: false,
              bLeftTarget: false,
            },

            // Methods
            {
                setTarget: function(newTarget) {
                  this.target = newTarget;
                },

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
                  this.bMetTarget = false;
                  this.bLeftTarget = false;
                },

                updateDash: function(param) {
                  var newX = this.startX * (1.0 - param) + (this.target.bounds.l + 2 * this.bounds.w) * param;

                  this.spriteMoveTo(newX, this.bounds.t);

                  if (this.target && !this.bMetTarget && this.bounds.l + this.bounds.w > this.target.bounds.l) {
                    this.bMetTarget = true;
                    jb.program.slashParticle.emitAt(this.target.bounds.l + this.target.bounds.halfWidth, this.target.bounds.t + this.target.bounds.halfHeight);
                    jb.program.cameraManager.startWhiteIn();
                  }

                  if (this.target && !this.bLeftTarget && this.bounds.l + this.bounds.w > this.target.bounds.l + this.target.bounds.w) {
                    this.bLeftTarget = true;
                    jb.program.spurtParticle.emitAt(this.target.bounds.l + this.target.bounds.halfWidth, this.target.bounds.t + this.target.bounds.halfHeight);
                    jb.program.readoutParticle.emitAt(10 + Math.round(Math.random() * 10), this.target.bounds.l + this.target.bounds.halfWidth, this.target.bounds.t, "red");
                  }
                },

                finalizeDash: function() {
                  this.spriteMoveTo(this.target.bounds.l + 2 * this.bounds.w, this.bounds.t);
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

    createSlashParticle: function() {
      blueprints.draft(
        "slashParticle",

        // Data
        {
          sheet: null,
          tile: null,
          lifetime: 0,
          DRIFT_SPEED: 50, // Pixels per second
          FADE_TIME: 0.2,
          ANCHOR_X: 0.8,
        },

        // Methods
        {
          onCreate: function(sheet) {
            var fadeState = null;

            this.sheet = sheet;

            fadeState = jb.sprites.createState([{row:0, col:0}], 0.33, true, null);
            this.spriteSetSheet(sheet);
            this.spriteAddStates({"fadeState": fadeState});
            this.spriteSetAnchor(this.ANCHOR_X, 0.5);
            this.spriteHide();
          },

          emitAt: function(x, y) {
            this.spriteMoveTo(x, y);
            this.spriteSetState("fadeState");
            this.stateMachineStart(this.fadeState);
          },

          fadeState: {
            enter: function() {
              this.spriteSetAlpha(1.0);
              this.spriteShow();
              this.lifetime = 0;
            },

            update: function(dt) {
              this.lifetime += dt;
              this.spriteMoveBy(Math.round(this.DRIFT_SPEED * dt), 0);
              this.spriteSetAlpha(Math.max(0, 1.0 - this.lifetime / this.FADE_TIME));

              if (this.lifetime >= this.FADE_TIME) {
                this.stateMachineStop();
              }
            },

            exit: function() {
              this.spriteHide();
            }
          }
        }
      );

      blueprints.make("slashParticle", "sprite");
      blueprints.make("slashParticle", "stateMachine");
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
              this.spriteSetState("fadeState");
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
            this.fadeColor = "black";
            this.transitionerAdd("fadeIn", jb.program.CAMERA_FADE_TIME, this.updateFadeIn, this.finalizeFadeIn, true);
          },

          startFadeOut: function() {
            this.fadeColor = "black";
            this.transitionerAdd("fadeOut", jb.program.CAMERA_WHITEOUT_TIME, this.updateFadeOut, this.finalizeFadeOut, true);
          },

          startWhiteIn: function() {
            this.fadeColor = "white";
            this.transitionerAdd("fadeOut", jb.program.CAMERA_WHITEOUT_TIME, this.updateFadeOut, this.finalizeFadeOut, true);
          },

          startWhiteOut: function() {
            this.fadeColor = "white";
            this.transitionerAdd("fadeIn", jb.program.CAMERA_WHITEOUT_TIME, this.updateFadeIn, this.finalizeFadeIn, true);
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




