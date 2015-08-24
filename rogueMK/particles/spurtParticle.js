rmk.spurtParticle = {
  create: function() {
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

          jb.messages.listen("setTargetOrigin", this);
        },

        setTargetOrigin: function(targetBounds, bPlayer) {
          // TODO: reposition self relative to attacker.
          this.bounds.moveTo(targetBounds.l, targetBounds.t);
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
};

rmk.spurtParticle.create();
