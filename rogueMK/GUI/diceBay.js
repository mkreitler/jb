// Tray with draggable dice sprites
rmk.diceBay = {
  create: function() {
    blueprints.draft(
      "diceBay",

      {
        // Data
        backImage: null,
        x: 0,
        y: 0,
        dice: [],

        WIDTH: 200,
        HEIGHT: 38,
        BORDER: 6,
      },

      {
        // Methods
        onCreate: function(x, y) {
          var nDice = 0,
              i = 0,
              dieX = 0,
              dieY = 0;

          this.backImage = jb.createCanvas(this.WIDTH + this.BORDER, this.HEIGHT + this.BORDER);

          jb.drawRoundedRect(this.backImage.context, this.BORDER / 2, this.BORDER / 2, this.WIDTH, this.HEIGHT, this.BORDER, "#0000ff", "#88aaff", this.BORDER / 2);
          this.x = x;
          this.y = y;

          // TEMP: create a random number of dice (2-5).
          nDice = Math.floor(Math.random() * 5) + 1;
          for (i=0; i<nDice; ++i) {
            this.dice.push(blueprints.build("combatDie"));

            dieX = Math.round(this.x - (6 + 24) * (nDice / 2 - 0.5 - i));
            dieY = Math.round(this.y);
            this.dice[i].moveTo(dieX, dieY);
            this.dice[i].roll(5 + Math.round(Math.random() * 5));
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

    blueprints.draft(
      "combatDie",

      // Data
      {
        value: 0,
        x: -1,
        y: -1,
      },

      // Methods
      {
        onCreate: function() {
        },

        moveTo: function(x, y) {
          this.x = x;
          this.y = y;
        },

        roll: function(maxPower) {
          this.value = Math.floor(Math.random() * maxPower) + 1;
        },

        draw: function(ctxt) {
          jb.glyphs.drawToContext(ctxt, "24x24", "die00", this.x, this.y, 1, 1, 0.5, 0.5);
          jb.fonts.drawToContextAt(ctxt, "fantasy", this.x, this.y, "" + this.value, "black", 0.5, -0.5, 1);
        }
      }
    );

    blueprints.make("combatDie", "touchable");
    blueprints.make("combatDie", "stateMachine");
  }
};

rmk.diceBay.create();
