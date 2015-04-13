// Create commands.
program = {
  message: null,

  start: function() {
      jb.print("Testing...testing...`");
      jb.print("Fred ate bread.`");
  },

  getInput_loop: function() {
    this.message = null;
    this.message = jb.readLine();

    return this.message === null;
  },

  echoMessage: function() {
    jb.print("`");
    jb.print("You typed, \"" + this.message + "\"");
  },
};

jb.run(program);
