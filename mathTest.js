  ///////////////////////////////////////////////////////////////////////////////
  // Number Line Test
  ///////////////////////////////////////////////////////////////////////////////
  jb.program = {
  THICKNESS: 0.01,
  WIDTH: 0.95,
  TICK: {SPACING: 0.045,
         HEIGHT: 0.03,
         WIDTH: 0.01},
  TEST_STRING: "3 + 7",
  VECTOR_COLORS: ["red", "orange", "yellow", "green", "blue", "purple"],

  drawNumberLine: function() {
    var width = jb.canvas.width,
        height = jb.canvas.height,
        i = 0,
        x = 0,
        y = 0,
        w = jb.canvas.width * this.WIDTH;
        h = jb.canvas.height * this.THICKNESS;

    jb.ctxt.strokeStyle = 'green';
    jb.ctxt.fillStyle = 'green';

    x = Math.round(width / 2 - w / 2);
    y = Math.round(height / 2 - h / 2);

    jb.ctxt.fillRect(x, y, w, h);

    h = h * 3;
    y = Math.round(height / 2 - h / 2);
    w = Math.round(jb.canvas.width * this.WIDTH * this.TICK.WIDTH);
    for (i = 0; i<Math.floor(jb.canvas.width * this.WIDTH * 0.5 / (jb.canvas.width * this.WIDTH * this.TICK.SPACING)); ++i) {
      x = jb.canvas.width / 2 + (i * (jb.canvas.width * this.WIDTH * this.TICK.SPACING)) - w * 0.5;
      x = Math.round(x);

      if (i === 0) {
        jb.ctxt.fillRect(x, Math.round(y - h / 2), w, h * 2);
      }
      else {
        jb.ctxt.fillRect(x, y, w, h);
      }
    }
    for (i = 0; i<Math.floor(jb.canvas.width * this.WIDTH * 0.5 / (jb.canvas.width * this.WIDTH * this.TICK.SPACING)); ++i) {
      x = jb.canvas.width / 2 - (i * (jb.canvas.width * this.WIDTH * this.TICK.SPACING)) - w * 0.5;
      x = Math.round(x);

      if (i === 0) {
        jb.ctxt.fillRect(x, Math.round(y - h / 2), w, h * 2);
      }
      else {
        jb.ctxt.fillRect(x, y, w, h);
      }
    }
  },

  drawVectors: function() {
    var start = 0,
        i = 0,
        terms = this.TEST_STRING.split("+");

    for (i=0; i<terms.length; ++i) {
      this.drawArrow(start, parseInt(terms[i]), this.VECTOR_COLORS[i % this.VECTOR_COLORS.length]);
      start += parseInt(terms[i]);
    }
  },

  end: function() {
      jb.end();
  },

  drawArrow: function(start, value, color) {
    var width = jb.canvas.width,
        height = jb.canvas.height,
        w = jb.canvas.width * this.WIDTH,
        h = jb.canvas.height * this.THICKNESS,
        x0 = jb.canvas.width / 2 + (start * (jb.canvas.width * this.WIDTH * this.TICK.SPACING)),
        x1 = jb.canvas.width / 2 + ((start + value) * (jb.canvas.width * this.WIDTH * this.TICK.SPACING)),
        y = Math.round(height / 2 - h / 2),
        radius = Math.floor(this.TICK.SPACING * jb.canvas.width * this.WIDTH * 0.15);

      jb.ctxt.beginPath();
      jb.ctxt.strokeStyle = color;
      jb.ctxt.lineWidth = 2;
      jb.ctxt.moveTo(x0, y);
      jb.ctxt.lineTo(x1, y);
      jb.ctxt.closePath();
      jb.ctxt.stroke();

      jb.ctxt.beginPath();
      jb.ctxt.fillStyle = color;
      jb.ctxt.arc(x1, y, radius, 0, 2 * Math.PI, true);
      jb.ctxt.closePath();
      jb.ctxt.fill();
  },
};

  ///////////////////////////////////////////////////////////////////////////////
  // Gosub Test
  ///////////////////////////////////////////////////////////////////////////////
  jb.programTest = {
  start: function() {
      jb.print("Waiting for tap...");
      jb.gosub("startWaitForTap");
  },

  mid: function() {
      jb.print("done!`");
      jb.print("Waiting for another tap...");
      jb.gosub("startWaitForTap");
  },

  end: function() {
      jb.print("done!`");
      jb.end();
  },

  ///////////////////////////////////////////////////////////////////////////
  startWaitForTap: function() {
      jb.listenForTap();
  },

  do_waitForTap: function() {
      jb.until(jb.tap.done);
  },

  endWaitForTap: function() {
      jb.end();
  },
  };

  ///////////////////////////////////////////////////////////////////////////////
  // Touch Test
  ///////////////////////////////////////////////////////////////////////////////
  jb.programBlueprint = {
  touchKnight: null,

  setup: function() {
      blueprints.draft(
          // Template name
          "testKnight",

          // Template data
          {
              x: -1,
              y: -1,
              size: null,
              glyph: null
          },

          // Template actions and shared data
          {
              onCreate: function(x, y, size, glyph) {
                  this.x = x;
                  this.y = y;
                  this.size = size;
                  this.glyph = glyph;
                  
                  jb.glyphs.getBounds(this.size, this.glyph, 2, 2, this.bounds);
              },

              moveTo: function(x, y) {
                  var dx = x - this.x,
                      dy = y - this.y;

                  this.x = x;
                  this.y = y;
                  this.bounds.moveBy(dx, dy);
              },

              moveBy: function(dx, dy) {
                  this.x += dx;
                  this.y += dy;
                  this.bounds.moveBy(dx, dy);
              }
          }
      );

      blueprints.make("testKnight", "touchable");

      this.touchKnight = blueprints.build("testKnight", 0, 0, "16x16", "knight");
      this.touchKnight.moveTo(100, 50);

      jb.listenForSwipe();
  },

  do_touchKnight: function() {
      jb.clear("black");
      jb.glyphs.draw(this.touchKnight.size, this.touchKnight.glyph, this.touchKnight.x, this.touchKnight.y, 2, 2);

      if (jb.swipe.touched) {
          jb.swipe.touched.bounds.draw("red");
          jb.swipe.touched.moveTo(jb.swipe.endX, jb.swipe.endY);
      }

      jb.until(jb.swipe.done);
  },
  };



