// Define the jb objects
jb = {};

// Virtual Machine /////////////////////////////////////////////////////////////
jb.instructions     = []
jb.bStarted         = false;
jb.pc               = -1;    // Program counter
jb.fnIndex          = 0;
jb.loopingRoutine   = null;
jb.context          = null;
jb.LOOP_ID          = "_LOOP"

// OS Commands /////////////////////////////////////////////////////////////////
jb.add = function(fn, label) {
    jb.instructions.push({type: "block", code: fn, label: label || "fn" + jb.fnIndex});
    jb.fnIndex += 1;
};

// Loop code, when added, will continue to execute as long as it returns 'true'.
jb.addLoop = function(loop, label) {
    jb.instructions.push({type: "loop", code: loop, label: label || "fn" + jb.fnIndex});
    jb.fnIndex += 1;
};

jb.run = function(program) {
    var key = null;

    if (program) {
        if (!jb.bStarted) {
            jb.create();
            jb.bStarted = true;
        }

        // Move the program's functions into the jb virtual machine.
        for (key in program) {
            if (typeof(program[key]) === "function") {
                if (key.length >= jb.LOOP_ID.length && key.substr(key.length - jb.LOOP_ID.length).toUpperCase() === jb.LOOP_ID) {
                    jb.addLoop(program[key], key);
                }
                else {
                    jb.add(program[key], key);
                }
            }
        }

        jb.context = program;
        jb.pc = -1;
        jb.clear();
        jb.nextInstruction();
    }
};

// Runtime Commands ////////////////////////////////////////////////////////////
jb.goto = function(label) {
    var i;

    label = label.toUpperCase();

    for (i=0; i<jb.instructions.length; ++i) {
        if (jb.instructions[i] &&
            jb.instructions[i].label.toUpperCase() === label) {
            jb.pc = i - 1;
            jb.loopingRoutine = false;
            break;
        }
    }
};

jb.end = function() {
    if (jb.loopingRoutine) {
        jb.loopingRoutine = null;
        jb.nextInstruction();
    }
    else {
        jb.pc = jb.instructions.length;
    }
};

// Interal Methods /////////////////////////////////////////////////////////////
jb.loop = function() {
    if (jb.loopingRoutine) {
        if (jb.loopingRoutine.bind(jb.context)()) {
            // Check for existence of loopingRoutine again, in case it was
            // nulled out during execution of the routine.
            if (jb.loopingRoutine) {
                requestAnimationFrame(jb.loop);
            }
            else {
                jb.nextInstruction();
            }
        }
        else {
            jb.nextInstruction();
        }
    }
    else {
        jb.nextInstruction();
    }
};

jb.nextInstruction = function() {
    var instr = null;

    for (jb.pc += 1; jb.pc<jb.instructions.length; jb.pc++) {
        instr = jb.instructions[jb.pc];

        jb.reset();
        jb.resetBlink();
        jb.bForcedBreak = false;
        jb.loopingRoutine = null;

        if (instr.type === "block") {
            instr.code.bind(jb.context)();
        }
        else {
            jb.loopingRoutine = instr.code;
            jb.loop();
            break;
        }
    }

    if (jb.pc >= jb.instructions.length && !jb.loopingRoutine) {
        jb.print("`");
        jb.print("--- stopped ---");
    }
};

// View ////////////////////////////////////////////////////////////////////////
// Get canvas and resize to fit window.
jb.NEWLINE = "`";
jb.canvas = null;
jb.ctxt = null;
jb.columns = 80;
jb.rows = 25;
jb.COL_TO_CHAR = 12 / 20;
jb.COL_TO_CHAR_SPACING = 11.69 / 20;
jb.BLINK_INTERVAL = 0.67; // 2/3 of a second
jb.backColor = "black";
jb.foreColor = "green";
jb.fontSize = 1;
jb.row = 0;
jb.col = 0;
jb.fontInfo = null;
jb.bCursorOn = false;
jb.blinkTimer = 0;
jb.blinkClock = 0;
jb.cellSize = {width: 0, height: 0};

jb.create = function() {
    jb.canvas = document.createElement('canvas');
    document.body.appendChild(jb.canvas);
    jb.ctxt = jb.canvas.getContext("2d");
    jb.ctxt.textBaseline = "top";
    jb.resize();
};
jb.resetBlink = function() {
    jb.blinkTimer = 0;
    jb.blinkClock = Date.now();
    jb.bCursorOn = false;
};
jb.clearBlink = function() {
    var x, y;

    jb.ctxt.fillStyle = jb.backColor;
    x = jb.xFromCol(jb.col);
    y = jb.yFromRow(jb.row);
    jb.ctxt.fillRect(x, y, jb.cellSize.width, jb.cellSize.height);
    jb.resetBlink();
};
jb.blink = function() {
    var now = Date.now(),
              x,
              y;

    jb.blinkTimer += (now - jb.blinkClock) * 0.001;
    while (jb.blinkTimer >= jb.BLINK_INTERVAL) {
        jb.blinkTimer -= jb.BLINK_INTERVAL;
        jb.bCursorOn = !jb.bCursorOn;
    }

    jb.blinkClock = now;

    if (jb.bCursorOn) {
        jb.ctxt.fillStyle = jb.foreColor;
    }
    else {
        jb.ctxt.fillStyle = jb.backColor;
    }

    x = jb.xFromCol(jb.col);
    y = jb.yFromRow(jb.row);
    jb.ctxt.fillRect(x, y, jb.cellSize.width, jb.cellSize.height);
};
jb.xFromCol = function(col) {
    return col * jb.cellSize.width;
};
jb.yFromRow = function(row) {
    return row * jb.cellSize.height;
};
jb.setBackColor = function(newBack) {
    jb.backColor = jb.backColor;
};
jb.setForeColor = function(newFore) {
    jb.foreColor = newFore || jb.foreColor;
}
jb.setColumns = function(newCols) {
    jb.columns = Math.max(1, newCols);
    jb.resizeFont();
};
jb.resize = function() {
    jb.canvas.width = window.innerWidth * 0.95;
    jb.canvas.height = window.innerHeight * 0.95;
    jb.resizeFont();
};
jb.resizeFont = function() {
    var fontInfo = null
    jb.fontSize = Math.floor(jb.canvas.width / jb.columns / jb.COL_TO_CHAR);
    jb.ctxt.textBaseline = "top";
    jb.fontInfo = "" + jb.fontSize + "px Courier";
    jb.ctxt.font = jb.fontInfo;
    jb.rows = Math.floor(jb.canvas.height / jb.fontSize);
    jb.cellSize.width = Math.round(jb.fontSize * jb.COL_TO_CHAR_SPACING);
    jb.cellSize.height = Math.round(jb.fontSize);
};
jb.clear = function() {
    if (jb.backColor) {
        jb.ctxt.fillStyle = jb.backColor;
        jb.ctxt.fillRect(0, 0, jb.canvas.width, jb.canvas.height);
    }
    else {
        jb.ctxt.clearRect(0, 0, jb.canvas.width, jb.canvas.height);
    }
    
    jb.home();
}
jb.home = function() {
    jb.col = 0;
    jb.row = 0;
};
jb.cursorTo = function(row, col) {
    jb.row = row >= 0 ? Math.min(row, jb.rows) : jb.row;
    jb.col = col >= 0 ? Math.min(col, jb.columns) : jb.col;
};
jb.cursorMove = function(dRow, dCol) {
    jb.row = Math.max(0, Math.min(jb.rows, jb.row + dRow));
    jb.col = Math.max(0, Math.min(jb.columns, jb.col + dCol));
};
jb.print = function(text) {
    jb.printAt(text, 0, 0);
};
jb.printAt = function(text, newRow, newCol) {
    var x, y, cr;
    
    if (newRow > 0) {
        jb.row = newRow - 1;
    }
    if (newCol > 0) {
        jb.col = newCol - 1;
    }
    
    x = jb.xFromCol(jb.col);
    y = jb.yFromRow(jb.row);
    cr = text.indexOf(jb.NEWLINE) >= 0;
    
    if (cr) {
        text = text.replace(jb.NEWLINE, "");
    }

    jb.ctxt.save();
    jb.ctxt.fillStyle = jb.foreColor;
    jb.ctxt.strokeStyle = jb.foreColor;
    jb.ctxt.fillText(text, x, y);
    jb.ctxt.strokeText(text, x, y);
    jb.ctxt.restore();
    
    jb.col += text.length;
    if (cr) {
        jb.col = 0;
        jb.row += 1;
    }
};

// Keys ////////////////////////////////////////////////////////////////////////
jb.normal = {last: null, down:{}};
jb.special = {last: null, down: {}};
jb.lastCode = -1;
jb.got = "";
jb.input = null;
jb.inputOut = null;
jb.minCol = 0;
jb.bWantsNewInput = true;
jb.INPUT_STATES = {NONE: 0,
                     READ_LINE: 1,
                     READ_KEY: 2};
jb.inputState = jb.INPUT_STATES.NONE;

jb.readLine = function() {
    var retVal = "";

    if (jb.inputState != jb.INPUT_STATES.READ_LINE) {
        jb.minCol = jb.col;
    }

    jb.inputState = jb.INPUT_STATES.READ_LINE;
    
    retVal = jb.inputOut;
    jb.inputOut = null;
    jb.blink();
    
    return retVal;
};

jb.readKey = function() {
    var retVal = jb.got;

    jb.inputState = jb.INPUT_STATES.READ_KEY;
    
    if (retVal && retVal.length > 1) {
        if (retVal === "space") {
            retVal = " ";
        }
    }
    else if (!jb.got) {
      retVal = null;
    }

    jb.got = "";
    return retVal;
};

jb.readInput = function() {   // Legacy
    return jb.readLine();
};

jb.get = function() {         // Legacy
    return jb.readKey();
};

jb.reset = function() {
  jb.inputState = jb.INPUT_STATES.NONE;
  jb.inputOut = null;
  jb.got = null;
};

jb.onPress = function(e) {
    var charCode = e.which || e.keyCode,
        specialCode = jb.special.last;
    
    if (specialCode) {
        // User pressed a special key.
        jb.got = specialCode;
        
        if (specialCode === "enter" || specialCode === "return") {
            jb.inputOut = jb.input;
            jb.bWantsNewInput = true;
            jb.got = jb.NEWLINE;
            jb.inputState = jb.INPUT_STATES.NONE;
            jb.clearBlink();
        }
        else if (specialCode === "space") {
            if (jb.bWantsNewInput) {
                jb.input = "";
                jb.bWantsNewInput = false;
            }

            jb.clearBlink();
            jb.input += " ";
        }
    }
    else {
        // 'Normal' key.
        jb.got = String.fromCharCode(charCode);
        
        if (jb.bWantsNewInput) {
            jb.input = "";
            jb.bWantsNewInput = false;
        }
        
        jb.clearBlink();
        jb.input += jb.got;
    }

    if (jb.inputState === jb.INPUT_STATES.READ_LINE && jb.input) {
        jb.cursorTo(jb.row, jb.minCol);
        jb.printAt(jb.input.charAt(jb.input.length - 1), jb.row + 1, jb.minCol + jb.input.length);
        jb.cursorTo(jb.row, jb.minCol + jb.input.length);
    }
};

jb.onDown = function(e) {
    var keyCode = e.which || e.keyCode,
        specialCode = jb.codes["" + keyCode],
        retVal = true;
    
    jb.lastCode = keyCode;
    
    if (specialCode) {
        // User pressed a special key.
        jb.special.last = specialCode;
        jb.special.down[specialCode] = true;
        jb.normal.last = "";
        jb.got = specialCode;

        if (jb.inputState === jb.INPUT_STATES.READ_LINE) {
            if (specialCode === "left" ||
                specialCode === "backspace" ||
                specialCode === "del") {

                jb.clearBlink();
                jb.input = jb.input.substring(0, jb.input.length - 1);
                if (jb.col > jb.minCol) {
                    jb.cursorMove(0, -1);
                }
            }
        }

        if (specialCode === "backspace") {
            e.preventDefault();
            retVal = false;
        }
    }
    else {
        // 'Normal' key.
        jb.normal.last = String.fromCharCode(jb.lastCode);
        jb.got = jb.normal.last;
        jb.normal.down[jb.normal.last] = true;
        jb.special.last = "";
    }

    return retVal;
};

jb.onUp = function(e) {
    var keyCode = e.which || e.keyCode,
        specialCode = jb.codes["" + keyCode];
    
    jb.lastCode = keyCode;
    
    if (specialCode) {
        // User pressed a special key.
        jb.special.down[specialCode] = false;
    }
    else {
        // 'Normal' key.
        jb.normal.down[String.fromCharCode(jb.lastCode)] = false;
    }
};

jb.codes = {
  3:  "cancel",
  6:  "help",
  8:  "backspace",
  9:  "tab",
  12: "clear",
  13: "return",
  14: "enter",
  16: "shift",
  17: "control",
  18: "alt",
  19: "pause",
  20: "caps lock",
  27: "escape",
  32: "space",
  33: "page up",
  34: "page down",
  35: "end",
  36: "home",
  37: "left",
  38: "up",
  39: "right",
  40: "down",
  44: "printscreen",
  45: "insert",
  46: "delete",
};

document.addEventListener("keydown", jb.onDown, true);
document.addEventListener("keyup", jb.onUp, true);
document.addEventListener("keypress", jb.onPress, true);

// RequestAnimFrame ////////////////////////////////////////////////////////////
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
 
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());