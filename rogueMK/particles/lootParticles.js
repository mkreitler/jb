// Basic loot particle
rmk.lootParticles = {
  create: function() {
    blueprints.draft(
      "lootParticle",

      // Data
      {
        bounces: 0,
        position: {x:0, y:0},
        velocity: {x:0, y:0},
        endX: 0,
        startY: 0,
        endY: 0,
        lifetime: 0,
        snatchSheet: null,
        snatchStates: null,
        snatchX: 0,
        snatchY: 0,

        GRAVITY: 80,
        COLLECT_DY: 50,
        FADE_IN_TIME: 0.33,
        X_VELOCITY: -40,
        ELASTICITY: -0.33,
        MAX_BOUNCES: 3,
        COLLECT_TIME: 0.5,
        TIME_MULTIPLIER: 3.5,
        DIST_MULTIPLIER: 0.8,
        SNATCH_ROTATION: .55 * Math.PI,
      },

      // Methods
      {
        onCreate: function(stateName, sheet, row, col, snatchSheet, snatchStates) {
          var lootState = null,
              states = {};

          this.spriteSetSheet(sheet);

          lootState = jb.sprites.createState([{row: 3, col: 8}], 1, true, null);

          states[stateName] = lootState;
          this.spriteAddStates(states);
          this.spriteSetAnchor(0.5, 1.0);
          this.spriteHide();

          this.onTouchedFn = this.onTouched;

          this.snatchSheet = snatchSheet;
          this.snatchStates = snatchStates;

          jb.messages.listen("setTargetOrigin", this);
        },

        setTargetOrigin: function(targetBounds, bPlayer) {
          this.bounds.moveTo(targetBounds.l, targetBounds.t);
        },

        draw: function(ctxt) {
          this.spriteDraw(ctxt);

          if (this.stateMachineIsInState(this.collectedState)) {
            this.collectedState.draw.call(this, ctxt);
          }
        },

        drawSnatchParticle: function(ctxt) {
          var stage = Math.floor(this.lifetime / this.COLLECT_TIME * this.snatchStates.length),
              oldAlpha = ctxt.globalAlpha,
              newAlpha = Math.max(0.0, 1.0 - this.lifetime / this.COLLECT_TIME);

          if (this.snatchSheet && this.snatchStates && stage < this.snatchStates.length) {
            ctxt.globalAlpha = Math.sqrt(newAlpha);
            this.snatchSheet.draw(ctxt, this.snatchX, this.snatchY, this.snatchStates[stage].row, this.snatchStates[stage].col, Math.max(newAlpha, 0.01), newAlpha * this.SNATCH_ROTATION);
            ctxt.globalAlpha = oldAlpha;
          }
        },

        onSwiped: function() {

        },

        onSwipedDefault: function() {

        },

        onSwipedWhenDropped: function() {
          this.stateMachineStart(this.collectedState);
        },

        emitAt: function(x, y, xDist, yFloor, state) {
          var flightTime = 0;

          this.startY = y + this.bounds.halfHeight;
          this.endY = yFloor;
          this.spriteMoveTo(x, this.startY);
          this.position.x = x;
          this.position.y = y;
          this.bActive = true;

          this.bounces = 0;

          // Compute the velocity needed to reach the
          // destination in the desired time.
          xDist *= this.DIST_MULTIPLIER;
          flightTime = Math.abs(xDist / this.X_VELOCITY);
          this.endX = x + xDist;
          this.velocity.x = this.X_VELOCITY;

          // Y = Yo + VoyT + 1/2gT^2
          // (Y - Yo) - 1/2gT^2 = VoyT
          // Voy = ((Y- Yo) - 1/2gT^2) / T
          this.velocity.y = (this.endY - this.startY - 0.5 * this.GRAVITY * flightTime * flightTime) / flightTime;

          this.stateMachineStart(this.dropState);
          this.spriteSetState(state);
        },

        dropState: {
          enter: function() {
            this.lifetime = 0;
            this.spriteSetAlpha(0.0);
            this.spriteShow();
            this.onSwiped = this.onSwipedWhenDropped;
          },

          update: function(dt) {
            var newAlpha = 0,
                oldVy = this.velocity.y,
                dy = 0;

            dt *= this.TIME_MULTIPLIER;

            this.lifetime += dt;
            this.id = this.id;

            newAlpha = Math.min(1.0, this.lifetime / this.FADE_IN_TIME);
            this.spriteSetAlpha(newAlpha);

            this.position.x += this.velocity.x * dt;

            this.velocity.y += this.GRAVITY * dt;
            dy = (oldVy + this.velocity.y) * 0.5 * dt;

            if (this.position.y + dy >= this.endY) {
              if (this.bounces < this.MAX_BOUNCES) {
                this.velocity.y *= this.ELASTICITY;
                this.position.y = this.endY - (this.position.y + dy - this.endY) * this.ELASTICITY;
                this.bounces += 1;
              }
              else {
                this.position.y = this.endY;
                this.stateMachineStop();
              }
            }
            else {
              this.position.y += dy;
            }

            this.spriteMoveTo(Math.round(this.position.x), Math.round(this.position.y));
          },

          exit: function() {
            // this.spriteMoveTo(this.endX, this.endY);
            this.swipeableActive = true;
            this.spriteSetAlpha(1.0);
          }
        },

        collectedState: {
          enter: function() {
            this.spriteSetAlpha(1.0);
            this.startY = this.bounds.t + this.bounds.h;
            this.endY = this.startY - this.COLLECT_DY;
            this.lifetime = 0,
            this.snatchX = this.bounds.l + this.bounds.halfWidth - Math.round(this.snatchSheet.getCellWidth() * 0.5),
            this.snatchY = this.bounds.t + this.bounds.halfHeight - Math.round(this.snatchSheet.getCellHeight() * 0.5);
            this.onSwiped = this.onSwipedDefault;
          },

          draw: function(ctxt) {
            this.drawSnatchParticle(ctxt);
          },

          update: function(dt) {
            var param = 0;

            this.lifetime += dt;
            param = Math.min(this.lifetime / this.COLLECT_TIME, 1.0);
            param = Math.sin(param * Math.PI * 0.5);
            param = Math.max(0.0, 1.0 - param * param);

            this.spriteSetAlpha(param);
            this.spriteMoveTo(this.bounds.l + this.bounds.halfWidth, this.startY * param + this.endY * (1.0 - param));

            if (Math.abs(param) < jb.EPSILON) {
              this.stateMachineStop();
            }
          },

          exit: function() {
            jb.program.collectLoot(this);
            this.swipeableActive = false;
            this.spriteSetAlpha(0);
            this.spriteHide();
          }
        }
      }
    );

    blueprints.make("lootParticle", "sprite");
    blueprints.make("lootParticle", "swipeable");
    blueprints.make("lootParticle", "stateMachine");
    blueprints.make("lootParticle", "transitioner");
  },
};

rmk.lootParticles.create();
