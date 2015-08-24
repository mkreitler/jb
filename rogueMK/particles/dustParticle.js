rmk.dustParticle = {
  create: function() {
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
          this.spriteHide();

          jb.messages.listen("setAttackOrigin", this);
        },

        setAttackOrigin: function(attackerBounds, bPlayer) {
          // TODO: reposition self relative to attacker.
          this.bounds.moveTo(attackerBounds.l + attackerBounds.halfWidth, attackerBounds.t + attackerBounds.halfHeight);
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
            this.spriteShow();
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
            this.spriteHide();
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
};

rmk.dustParticle.create();
