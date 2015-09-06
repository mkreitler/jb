// Generic adventurer
rmk.adventurer = {
  create: function() {
      blueprints.draft(
        "adventurer",

        // Data
        {
          startX: 0,
          target: null,
          bMetTarget: false,
          bLeftTarget: false,
          damageDone: 0,

          BASE_DAMAGE: 10,
          DAMAGE_RANGE: 10,
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

            jb.messages.answer("doesDieOverlap", this);
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
              jb.messages.send("awaitDamage", this.target);
            }

            if (this.target && !this.bLeftTarget && this.bounds.l + this.bounds.w > this.target.bounds.l + this.target.bounds.w) {
              this.bLeftTarget = true;
              this.damageDone = this.BASE_DAMAGE + Math.round(Math.random() * this.DAMAGE_RANGE);
              jb.messages.send("takeDamage", this.damageDone, this.target);
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

      blueprints.make("adventurer", "touchable");
      blueprints.make("adventurer", "sprite");
      blueprints.make("adventurer", "transitioner");
  },
};

rmk.adventurer.create();

