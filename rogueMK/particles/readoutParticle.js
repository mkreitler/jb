rmk.readoutParticle = {
  create: function() {
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
          jb.messages.listen("setTargetOrigin", this);
        },

        setTargetOrigin: function(targetBounds, bPlayer) {
          this.bounds.moveTo(targetBounds.l, targetBounds.t);
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
};

rmk.readoutParticle.create();
