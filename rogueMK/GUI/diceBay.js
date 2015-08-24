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

        WIDTH: 300,
        HEIGHT: 50,
        BORDER: 8,
      },

      {
        // Methods
        onCreate: function(x, y) {
          this.backImage = jb.createCanvas(this.WIDTH + this.BORDER, this.HEIGHT + this.BORDER);

          jb.drawRoundedRect(this.backImage.context, this.BORDER / 2, this.BORDER / 2, this.WIDTH, this.HEIGHT, this.BORDER, "#0000ff", "#88aaff", this.BORDER / 2);
          this.x = x;
          this.y = y;
        },

        draw: function(ctxt) {
          jb.drawImage(ctxt, this.backImage.canvas, this.x, this.y, 0.5, 0.5);
        },
      }
    );

    blueprints.make("diceBay", "transitioner");
    blueprints.make("diceBay", "stateMachine");
  }
};

rmk.diceBay.create();
