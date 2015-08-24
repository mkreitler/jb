rmk.cameraManager = {
  create: function() {
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
          jb.messages.send("resetFight");
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
  }
};

rmk.cameraManager.create();
