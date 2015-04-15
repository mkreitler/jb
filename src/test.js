// Create commands.
program = {
  message: null,

  start: function() {
      jb.print("Testing...testing...`");
      jb.print("Fred ate bread.`");
      jb.print("Test swipe:`");

      jb.listenForSwipe();
  },

  // getInput_loop: function() {
  //   this.message = null;
  //   this.message = jb.readLine();

  //   return this.message === null;
  // },

  // echoMessage: function() {
  //   jb.print("`");
  //   jb.print("You typed, \"" + this.message + "\"");
  // },

  testSwipe_loop: function() {
    jb.clearLine(5);
    jb.printAt("(" + jb.swipe.endX + ", " + jb.swipe.endY + ")", 5, 1);
    return !jb.swipe.done;
  },

  initTap: function() {
    jb.cursorTo(7, 0);
    jb.print("Waiting for tap...`");
    jb.listenForTap();
  },

  testTap_loop: function() {
    return !jb.tap.done;
  },

  showTapResults: function() {
    if (!jb.tap.isDoubleTap) {
      jb.print("Tapped at (" + jb.tap.x + ", " + jb.tap.y + ")");
    }
    else {
      jb.print("Double-tapped at (" + jb.tap.x + ", " + jb.tap.y + ")");
    }
  }
};

jb.run(program);
