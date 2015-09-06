// Generic monster class
rmk.monster = {
	create: function() {
	    blueprints.draft(
	        "monster",

	        // Data
	        {
	          health: 1,
	          slashTiles: null,
	          slashFrames: null,
	          maxHealth: 0,
	          startState: null,
	          timer: 0,

	          GENERIC_MONSTER_HEALTH: 20,
	          LOOT_COUNT: 5,
	          DROP_CHANCE: 0.25,
	          DROP_RANGE: {low: 1, high: 3},
	          SPLIT_DURATION: 0.5,
	        },

	        // Methods
	        {
	            onCreate: function(sheet, states, startState, x, y, health, slashTiles, slashFrames) {
	                this.spriteSetSheet(sheet);
	                this.spriteAddStates(states);

	                this.startState = startState;

	                x = x ? x : 0;
	                y = y ? y : 0;

	                this.maxHealth = health || this.GENERIC_MONSTER_HEALTH;
	                this.slashTiles = slashTiles;
	                this.slashFrames = slashFrames;

	                jb.messages.listen("takeDamage", this);

	                this.reanimate();

	                this.spriteMoveTo(x, y);
	            },

	            draw: function(ctxt) {
	              if (this.isDead()) {
	                this.deathSequence.draw.call(this, ctxt);
	              }
	              else {
	                this.spriteDraw(ctxt);
	              }
	            },

	            awaitDamage: function(target) {
	            	if (target === this) {
	              	this.spriteSetState("awaitDamage");
	              }
	            },

	            takeDamage: function(damage, target) {
	            	if (target === this) {
		              this.health -= damage;

		              jb.program.spurtParticle.emitAt(this.bounds.l + this.bounds.halfWidth, this.bounds.t + this.bounds.halfHeight);
		              jb.program.readoutParticle.emitAt(damage, this.bounds.l + this.bounds.halfWidth, this.bounds.t, "red");

		              if (this.health <= 0) {
		                this.stateMachineStart(this.deathSequence);
		              }
		              else {
		                if (Math.random() < this.DROP_CHANCE) {
		                  jb.messages.send("dropLoot", this.DROP_RANGE.low + Math.floor(Math.random() * (this.DROP_RANGE.high - this.DROP_RANGE.low)));
		                }
		                this.spriteSetState("idle");
		              }
		            }
	            },

	            isDead: function() {
	              return this.health <= 0;
	            },

	            reanimate: function() {
	                if (this.startState) {
	                    this.spriteSetState(this.startState);
	                }

	                this.health = this.maxHealth;
	                this.spriteShow();
	            },

	            deathSequence: {
	              enter: function() {
	                this.timer = 0;

	                if (this.slashTiles && this.slashFrames) {
	                  this.spriteHide();
	                  jb.messages.send("dropLoot", this.LOOT_COUNT);
	                }
	                else {
	                  this.stateMachineStop();
	                }
	              },

	              update: function(dt) {
	                this.timer += dt;
	                if (this.timer / this.SPLIT_DURATION >= 1.0) {
	                  this.stateMachineStop();
	                }
	              },

	              exit: function() {
	              },

	              draw: function(ctxt) {
	                var p = 1.0 - Math.min(1.0, this.timer / this.SPLIT_DURATION),
	                    oldAlpha = ctxt.globalAlpha,
	                    x = this.bounds.l - Math.round(this.bounds.w * (1.0 - p) * 0.5),
	                    y = this.bounds.t;

	                if (this.slashTiles && this.slashFrames) {
	                  ctxt.globalAlpha = p;

	                  this.slashTiles.draw(ctxt, x, y, this.slashFrames[0].row, this.slashFrames[0].col);

	                  y = y + this.bounds.halfHeight;
	                  x = this.bounds.l + Math.round(this.bounds.w * (1.0 - p) * 0.5);
	                  this.slashTiles.draw(ctxt, x, y, this.slashFrames[1].row, this.slashFrames[1].col);

	                  ctxt.globalAlpha = oldAlpha;
	                }
	              }
	            }
	        }
	    );

	    blueprints.make("monster", "touchable");
	    blueprints.make("monster", "sprite");
	    blueprints.make("monster", "stateMachine");
	    blueprints.make("monster", "transitioner");
	},
};

rmk.monster.create();
