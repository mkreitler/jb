rmk.slashParticle = {
  create: function() {
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

          jb.messages.listen("setTargetOrigin", this);
        },

        setTargetOrigin: function(targetBounds, bPlayer) {
          this.bounds.moveTo(targetBounds.l + targetBounds.halfWidth, targetBounds.t + targetBounds.halfHeight);
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
};

rmk.slashParticle.create();
