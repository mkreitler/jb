// Tray with draggable dice sprites
rmk.diceBay = {
  create: function() {
    blueprints.draft(
      "combatDie",

      // Data
      {
        value: 0,
        startX: -1,
        startY: -1,
        dropX: -1,
        dropY: -1,
        overlaps: 0,
        timer: 0,
        RETURN_TIME: 0.5,
        FADE_TIME: 0.25,
      },

      // Methods
      {
        onCreate: function(sheet) {
          var states = {};

          this.spriteSetSheet(sheet);

          states["1"] = jb.sprites.createState([{row: 0, col: 0}], 0.0, true, null);
          states["2"] = jb.sprites.createState([{row: 0, col: 1}], 0.0, true, null);
          states["3"] = jb.sprites.createState([{row: 0, col: 2}], 0.0, true, null);
          states["4"] = jb.sprites.createState([{row: 0, col: 3}], 0.0, true, null);
          states["5"] = jb.sprites.createState([{row: 0, col: 4}], 0.0, true, null);
          states["6"] = jb.sprites.createState([{row: 0, col: 5}], 0.0, true, null);
          states["7"] = jb.sprites.createState([{row: 0, col: 6}], 0.0, true, null);
          states["8"] = jb.sprites.createState([{row: 0, col: 7}], 0.0, true, null);
          states["9"] = jb.sprites.createState([{row: 0, col: 8}], 0.0, true, null);
          states["10"] = jb.sprites.createState([{row: 0, col: 9}], 0.0, true, null);
          states["11"] = jb.sprites.createState([{row: 0, col: 10}], 0.0, true, null);
          states["12"] = jb.sprites.createState([{row: 0, col: 11}], 0.0, true, null);

          this.spriteAddStates(states);

          this.spriteSetAnchor(0.5, 0.5);
        },

        onTouched: function(x, y) {
          if (this.stateMachineIsInState(null)) {
            jb.listenForSwipe();
            this.stateMachineStart(this.dragState);
          }
        },

        onUntouched: function(x, y) {
        },

        moveTo: function(x, y) {
          this.spriteMoveTo(x, y);

          this.startX = this.bounds.l;
          this.startY = this.bounds.t;
        },

        roll: function(maxPower) {
          this.value = Math.floor(Math.random() * maxPower) + 1;
          this.spriteSetState("" + this.value);
          this.spriteShow();
          this.touchableEnable();
        },

        update: function(dt) {
          this.spriteUpdate(dt);
        },

        draw: function(ctxt) {
          this.spriteDraw(ctxt);
        },

        doesDieOverlap: function(other) {
          if (other.bounds && other.bounds.intersect(this.bounds)) {
            this.overlaps += 1;
          }
        },

        // States ---------------------------------------------------
        dragState: {
          enter: function() {
          },

          update: function(dt) {
            this.spriteMoveTo(Math.round(jb.swipe.endX / jb.viewScale),
                              Math.round(jb.swipe.endY / jb.viewScale));

            if (jb.swipe.done) {
              // Check: do we overlap a single adventurer?
              this.overlaps = 0;
              jb.messages.query("doesDieOverlap", this, this.bounds);

              if (this.overlaps === 1) {
                // Fade to attack.
                this.stateMachineSetNextState(this.fadeState);
              }
              else {
                // Return to starting position.
                this.dropX = this.bounds.l;
                this.dropY = this.bounds.t;
                this.stateMachineSetNextState(this.returnState);
              }
            }
          },

          exit: function() {
          }
        },

        returnState: {
          enter: function() {
            this.timer = 0;
          },

          update: function(dt) {
            var param = 0;

            this.timer += dt;

            param = jb.transitions.transitionerParamToEaseInOut(Math.max(0.0, Math.min(1.0, this.timer / this.RETURN_TIME)));

            this.bounds.l = this.dropX * (1.0 - param) + this.startX * param;
            this.bounds.t = this.dropY * (1.0 - param) + this.startY * param;

            if (Math.abs(param - 1.0) < jb.EPSILON) {
              this.stateMachineStop();
            }
          },

          exit: function() {
            this.bounds.l = this.startX;
            this.bounds.t = this.startY;
          }
        },

        fadeState: {
          enter: function() {
            this.spriteSetAlpha(1.0);
            this.timer = 0.0;
          },

          update: function(dt) {
            var param = 0;

            this.timer += dt;

            param = jb.transitions.transitionerParamToEaseInOut(Math.max(0.0, Math.min(1.0, this.timer / this.FADE_TIME)));
            this.spriteSetAlpha(1.0 - param);

            if (param < jb.EPSILON) {
              this.stateMachineStop();
            }
          },
          
          exit: function() {
            // TODO: test to see if we were dropped on a unique
            // adventurer, and if so, start the combat sequence.
            this.spriteHide();
            this.touchableDisable();
            this.spriteSetAlpha(1.0);
            jb.messages.send("startAdventurerAttack");
          }
        }
      }
    );

    blueprints.make("combatDie", "touchable");
    blueprints.make("combatDie", "sprite");
    blueprints.make("combatDie", "stateMachine");

    blueprints.draft(
      "diceBay",

      {
        // Data
        backImage: null,
        x: 0,
        y: 0,
        dice: [null, null, null, null, null], // There can be, at most, 5 dice.
        nDice: 0,                             // Dice available to the current party. At least 2, at most 5.

        WIDTH: 200,
        HEIGHT: 38,
        BORDER: 6,
        MIN_DICE: 2,
      },

      {
        // Methods
        onCreate: function(sheet, x, y) {
          var nDice = 0,
              i = 0;

          this.backImage = jb.createCanvas(this.WIDTH + this.BORDER, this.HEIGHT + this.BORDER);

          jb.drawRoundedRect(this.backImage.context, this.BORDER / 2, this.BORDER / 2, this.WIDTH, this.HEIGHT, this.BORDER, "#0000ff", "#88aaff", this.BORDER / 2);
          this.x = x;
          this.y = y;

          // TEMP: create a random number of dice (2-5).
          for (i=0; i<this.dice.length; ++i) {
            this.dice[i] = blueprints.build("combatDie", sheet);
          }

          jb.messages.listen("initDice", this);
          this.initDice();
        },

        initDice: function(howMany) {
          var i = 0,
              dieX = 0,
              dieY = 0;

          this.nDice = howMany || Math.floor(Math.random() * (this.dice.length - 1)) + 2;
          this.nDice = Math.max(this.MIN_DICE, this.nDice);

          for (i=0; i<this.nDice; ++i) {
            dieX = Math.round(this.x - (this.dice[i].bounds.w / 5 + this.dice[i].bounds.w) * (this.nDice / 2 - 0.5 - i));
            dieY = Math.round(this.y);
            this.dice[i].moveTo(dieX, dieY);
            this.dice[i].roll(1 + Math.round(Math.random() * 12));
          }

          for (i=this.nDice; i<this.dice.length; ++i) {
            this.dice[i].spriteHide();
            this.dice[i].touchableDisable();
          }
        },

        update: function(dt) {
          var i = 0;

          for (i=0; i<this.dice.length; ++i) {
            this.dice[i].update(dt);
          }
        },

        draw: function(ctxt) {
          var i = 0;

          jb.drawImage(ctxt, this.backImage.canvas, this.x, this.y, 0.5, 0.5);
          for (i=0; i<this.dice.length; ++i) {
            this.dice[i].draw(ctxt);
          }
        },
      }
    );

    blueprints.make("diceBay", "transitioner");
    blueprints.make("diceBay", "stateMachine");
  }
};

rmk.diceBay.create();
