// Define the jb objects
jb = {
    execStack: [],
};

// Virtual Machine /////////////////////////////////////////////////////////////
jb.instructions     = []
jb.bStarted         = false;
jb.fnIndex          = 0;
jb.context          = null;
jb.LOOP_ID          = "DO_";
jb.bShowStopped     = true;
jb.interrupt        = false;
jb.time             = {now: Date.now(), deltaTime: 0, deltaTimeMS: 0};
jb.timers           = {};

jb.stackFrame = function(pc) {
    this.pc               = pc;    // Program counter
    this.loopingRoutine   = null;
    this.bUntil           = false;
    this.bWhile           = false;
};

// OS Commands /////////////////////////////////////////////////////////////////
jb.add = function(fn, label) {
    jb.instructions.push({type: "block", code: fn, label: label || "fn" + jb.fnIndex});
    jb.fnIndex += 1;
};

jb.until = function(bUntil) {
    jb.execStack[0].bUntil = bUntil;
},

jb.while = function(bWhile) {
    jb.execStack[0].bWhile = bWhile;
}

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
                if (key.length >= jb.LOOP_ID.length && key.substr(0, jb.LOOP_ID.length).toUpperCase() === jb.LOOP_ID) {
                    jb.addLoop(program[key], key);
                }
                else {
                    jb.add(program[key], key);
                }
            }
        }

        jb.execStack.unshift(new jb.stackFrame(-1));

        jb.context = program;
        jb.clear();

        requestAnimationFrame(jb.loop);
    }
};

// Runtime Commands ////////////////////////////////////////////////////////////
jb.gosub = function(label) {
    var i;

    label = label.toUpperCase();

    for (i=0; i<jb.instructions.length; ++i) {
        if (jb.instructions[i] &&
            jb.instructions[i].label.toUpperCase() === label) {
            jb.bInterrupt = true;
            jb.execStack.unshift(new jb.stackFrame(i - 1));
            break;
        }
    }
};

jb.goto = function(label) {
    var i;

    label = label.toUpperCase();

    for (i=0; i<jb.instructions.length; ++i) {
        if (jb.instructions[i] &&
            jb.instructions[i].label.toUpperCase() === label) {
            jb.execStack[0].pc = i - 1;
            jb.execStack[0].loopingRoutine = null;
            break;
        }
    }
};

jb.end = function() {
    jb.execStack.shift();
    if (jb.execStack.length > 0) {
        jb.nextInstruction();
    }
};

// Interal Methods /////////////////////////////////////////////////////////////
jb.loop = function() {
    jb.updateTimers();

    if (jb.bInterrupt) {
        jb.nextInstruction();
    }
    else if (jb.execStack.length > 0) {
        if (jb.execStack[0].loopingRoutine) {
            jb.execStack[0].bWhile = null;
            jb.execStack[0].bUntil = null;
            jb.execStack[0].loopingRoutine.bind(jb.context)();

            if (jb.execStack[0].bWhile === null && jb.execStack[0].bUntil === null) {
                jb.print("Missing 'jb.while' or 'jb.until' in " + jb.instructions[jb.execStack[0].pc].label);
                jb.end();
            }
            else if (jb.execStack[0].bUntil === true) {
                jb.nextInstruction();
            }
            else if (jb.execStack[0].bWhile === false) {
                jb.nextInstruction();
            }
        }
        else if (jb.execStack[0].pc < jb.instructions.length) {
            jb.nextInstruction();
        }
    }

    jb.render();
};

jb.render = function() {
    if (jb.execStack.length <= 0 && jb.bShowStopped) {
        jb.bShowStopped = false;
        jb.print("`");
        jb.print("--- stopped ---");
    }

    // Refresh the screen.
    jb.screenBufferCtxt.drawImage(jb.canvas, 0, 0);

    // Request a new a update.
    requestAnimationFrame(jb.loop);
};

jb.nextInstruction = function() {
    var instr = null;

    if (jb.execStack.length > 0) {
        for (jb.execStack[0].pc += 1; jb.execStack[0].pc<jb.instructions.length; jb.execStack[0].pc++) {
            instr = jb.instructions[jb.execStack[0].pc];

            jb.reset();
            jb.resetBlink();
            jb.bForcedBreak = false;
            jb.execStack[0].loopingRoutine = null;

            if (instr.type === "block") {
                instr.code.bind(jb.context)();
                if (jb.bInterrupt) {
                    break;
                }
            }
            else {
                jb.execStack[0].loopingRoutine = instr.code;
                break;
            }

            if (jb.execStack.length <= 0) {
                break;
            }
        }

        if (jb.execStack.length > 0 && jb.execStack[0].pc >= jb.instructions.length) { // !jb.execStack[0].loopingRoutine && jb.bShowStopped) {
            jb.execStack.shift();
            jb.nextInstruction();
        }
    }
};

jb.updateTimers = function() {
    var key,
        lastTime = jb.time.now;

    jb.time.now = Date.now();
    jb.time.deltaTimeMS = jb.time.now - lastTime;
    jb.time.deltaTime = jb.time.deltaTimeMS * 0.001;

    for (key in jb.timers) {
        jb.timers[key].last = jb.timers[key].now;
        jb.timers[key].now += jb.time.deltaTime;
    }
};

jb.startTimer = function(timerName) {
    jb.timers[timerName] = jb.timers[timerName] || {now: 0, last: -1};

    jb.timers[timerName].now = 0;
    jb.timers[timerName].last = -1;
};

jb.setTimer = function(timerName, timerVal) {
    jb.timers[timerName].now = timerVal;
    jb.timers[timerName].last = timerVal;
};

jb.timer = function(timerName) {
    return jb.timers[timerName] ? jb.timers[timerName].now : 0;
};

jb.timerLast = function(timerName) {
    return jb.timers[timerName] ? jb.timers[timerName].last : -1;
}

// View ////////////////////////////////////////////////////////////////////////
// Get canvas and resize to fit window.
jb.NEWLINE = "`";
jb.canvas = null;
jb.screenBuffer = null;
jb.screenBufferCtxt = null;
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
jb.globalScale = 1;

jb.create = function() {
    var div = document.createElement('div');
    div.align = "center";

    jb.canvas = document.createElement('canvas');

    jb.screenBuffer = document.createElement('canvas');
    div.appendChild(jb.screenBuffer);
    document.body.appendChild(div);

    jb.ctxt = jb.canvas.getContext("2d");
    jb.screenBufferCtxt = jb.screenBuffer.getContext("2d");

    // DEBUG:
    // jb.ctxt = jb.screenBufferCtxt;

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
    jb.ctxt.fillRect(x, y, jb.cellSize.width + 1, jb.cellSize.height + 1);
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
jb.clearLine = function(row) {
    var x, y;

    if (row >= 1 && row <= jb.rows) {
        row = row - 1;
        jb.ctxt.fillStyle = jb.backColor;
        x = jb.xFromCol(0);
        y = jb.yFromRow(row);
        jb.ctxt.fillRect(x, y, jb.canvas.width, jb.cellSize.height);
    }
};
jb.colorRows = function() {
    var iArg = 0,
        x = 0,
        y = 0,
        color = arguments[0],
        row = 0;

    jb.ctxt.fillStyle = color;
    for (iArg = 1; iArg < arguments.length; ++iArg) {
        row = arguments[iArg];

        if (row >= 1 && row <= jb.rows) {
            row = row - 1;
            x = jb.xFromCol(0);
            y = jb.yFromRow(row);
            jb.ctxt.fillRect(x, y, jb.canvas.width, jb.cellSize.height);
        }
    }
};
jb.xFromCol = function(col) {
    return col * jb.cellSize.width;
};
jb.yFromRow = function(row) {
    return row * jb.cellSize.height;
};
jb.setBackColor = function(newBack) {
    jb.backColor = newBack || jb.backColor;
};
jb.setForeColor = function(newFore) {
    jb.foreColor = newFore || jb.foreColor;
}
jb.setColumns = function(newCols) {
    jb.columns = Math.max(1, newCols);
    jb.resizeFont();
};
jb.resize = function(width, height) {
    jb.canvas.width = width || window.innerWidth * 0.95;
    jb.canvas.height = height || window.innerHeight * 0.95;
    jb.screenBuffer.width = jb.canvas.width;
    jb.screenBuffer.height = jb.canvas.height;
    jb.resizeFont();
};
jb.resizeFont = function() {
    var fontInfo = null
    jb.fontSize = Math.floor(jb.canvas.width / jb.columns / jb.COL_TO_CHAR);
    jb.ctxt.textBaseline = "top";
    jb.fontInfo = "" + jb.fontSize + "px Courier";
    jb.ctxt.font = jb.fontInfo;

    jb.rows = Math.floor(jb.canvas.height / jb.fontSize);
    jb.cellSize.width = jb.ctxt.measureText("W").width;
    jb.cellSize.height = Math.floor(jb.fontSize) + 1;
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
    cr = text.indexOf(jb.NEWLINE) === text.length - 1;
    
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

// Input ///////////////////////////////////////////////////////////////////////
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
jb.DOUBLE_TAP_INTERVAL = 333; // Milliseconds
jb.pointInfo = {x:0, y:0, srcElement:null};

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
  jb.bInterrupt = false;
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

jb.getMouseX = function(e) {
    return Math.round((e.srcElement ? e.pageX - e.srcElement.offsetLeft : (e.target ? e.pageX - e.target.offsetLeft : e.pageX)) / jb.globalScale);
};

jb.getMouseY = function(e) {
    return Math.round((e.srcElement ? e.pageY - e.srcElement.offsetTop : (e.target ? e.pageY - e.target.offsetTop : e.pageY)) / jb.globalScale);
};

jb.getClientPos = function(touch) {
    // Adapted from gregers' response in StackOverflow:
    // http://stackoverflow.com/questions/5885808/includes-touch-events-clientx-y-scrolling-or-not

    var winOffsetX = window.pageXoffset;
    var winOffsetY = window.pageYoffset;
    var x = touch.clientX;
    var y = touch.clientY;

    if (touch.pageY === 0 && Math.floor(y) > Math.floor(touch.pageY) ||
        touch.pageX === 0 && Math.floor(x) > Math.floor(touch.pageX)) {
      x = x - winOffsetX;
      y = y - winOffsetY;
    }
    else if (y < (touch.pageY - winOffsetY) || x < (touch.pageX - winOffsetX)) {
      x = touch.pageX - winOffsetX;
      y = touch.pageY - winOffsetY;
    }

    jb.pointInfo.x = x;
    jb.pointInfo.y = y;
    jb.pointInfo.srcElement = jb.canvas ? jb.canvas : null;
};

jb.tap = {bListening: false, x: -1, y: -1, done: false, isDoubleTap: false, lastTapTime: 0};
jb.swipe = {bListening: false, startX: -1, startY: -1, endX: -1, endY: -1, startTime: 0, endTime: 0, done: false};

jb.listenForTap = function() {
    jb.resetTap();
    jb.tap.bListening = true;
};

jb.resetTap = function() {
    jb.tap.x = -1;
    jb.tap.y = -1;
    jb.tap.done = false;
    jb.tap.isDoubleTap = false;
    jb.tap.lastTapTime = -1;
    jb.tap.bListening = false;
};

jb.listenForSwipe = function() {
    jb.resetSwipe();
    jb.swipe.bListening = true;
};

jb.resetSwipe = function() {
    jb.swipe.startX = -1;
    jb.swipe.startY = -1;
    jb.swipe.endX = -1;
    jb.swipe.endY = -1;
    jb.swipe.startTime = 0;
    jb.swipe.endTime = 0;
    jb.swipe.done = false;
    jb.swipe.bListening = false;
};

jb.doubleTapTimedOut = function() {
    return Date.now() - jb.tap.lastTapTime >= jb.DOUBLE_TAP_INTERVAL;
};

jb.mouseDown = function(e) {
    jb.pointInfo.x = jb.getMouseX(e);
    jb.pointInfo.y = jb.getMouseY(e);
    window.addEventListener("mousemove", jb.mouseDrag, true);
    jb.gestureStart();
};

jb.mouseDrag = function(e) {
    jb.pointInfo.x = jb.getMouseX(e);
    jb.pointInfo.y = jb.getMouseY(e);
    jb.gestureContinue();
};

jb.mouseUp = function(e) {
    window.removeEventListener("mousemove", jb.mouseDrag, true);
    jb.pointInfo.x = jb.getMouseX(e);
    jb.pointInfo.y = jb.getMouseY(e);
    jb.gestureEnd();
};

jb.gestureStart = function() {
    var newNow = Date.now(),
    x = jb.pointInfo.x
    y = jb.pointInfo.y;
    

    if (jb.tap.bListening) {
        jb.tap.x = x;
        jb.tap.y = y;
        jb.tap.isDoubleTap = newNow - jb.tap.lastTapTime < jb.DOUBLE_TAP_INTERVAL;
        jb.tap.lastTapTime = newNow;
        jb.tap.done = true;
    }

    if (jb.swipe.bListening) {
        jb.swipe.startX = x;
        jb.swipe.startY = y;
        jb.swipe.endX = x;
        jb.swipe.endY = y;
        jb.swipe.startTime = newNow;
        jb.swipe.done = false;
    }
};

jb.gestureContinue = function() {
    if (jb.swipe.startTime) {
        jb.swipe.endX = jb.pointInfo.x;
        jb.swipe.endY = jb.pointInfo.y;
    }
};

jb.gestureEnd = function() {
    if (jb.swipe.startTime) {
        jb.swipe.endX = jb.pointInfo.x
        jb.swipe.endY = jb.pointInfo.y;
        jb.swipe.endTime = Date.now();
        jb.swipe.done = true;
    }
};

jb.touchStart = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
      
        if (e.touches.length === 1) {
            jb.getClientPos(e.touches[0]);
            jb.gestureStart();
        }
    }
},
  
jb.touchMove = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
      
        if (e.touches.length === 1) {
            jb.getClientPos(e.touches[0]);
            jb.gestureContinue();
        }
    }
},
  
jb.touchEnd = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    jb.gestureEnd();
},

document.addEventListener("keydown", jb.onDown, true);
document.addEventListener("keyup", jb.onUp, true);
document.addEventListener("keypress", jb.onPress, true);

window.addEventListener("mousedown", jb.mouseDown, true);
window.addEventListener("mouseup", jb.mouseUp, true);

window.addEventListener("touchstart", jb.touchStart, true);
window.addEventListener("touchmove", jb.touchMove, true);
window.addEventListener("touchend", jb.touchEnd, true);

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

// FONTS ///////////////////////////////////////////////////////////////////////
// Fonts are bitmapped character sets. They default to 16x16 size and can be
// scaled in integer amounts.
jb.fonts = {
    DEFAULT_SIZE: 16,

    print: function(fontName, text, color, hAlign, vAlign, scale) {
        jb.fonts.printAt(fontName, jb.row + 1, jb.col + 1, text, color, hAlign, vAlign, scale);        
    },

    printAt: function(fontName, newRow, newCol, text, color, hAlign, vAlign, scale) {
        var x = 0,
            y = 0,
            row = -1,
            col = -1,
            charSet = null,
            iRow = 0,
            iCol = 0,
            iChar = 0,
            curChar = null,
            fontChar = null,
            cr = null,
            image = null;

        charSet = jb.fonts[fontName];
        hAlign = hAlign || 0;
        vAlign = vAlign || 0;
        color = color || jb.foreColor;
        scale = scale || 1;
        scale = Math.round(scale);

        if (text && charSet) {   
            if (charSet.bCaseless) {
                text = text.toUpperCase();
            }

            if (newRow > 0) {
                row = newRow - 1;
            }
            else {
                newRow = jb.row;
            }

            if (newCol > 0) {
                col = newCol - 1;
            }
            else {
                newCol = jb.col;
            }

            cr = text.indexOf(jb.NEWLINE) === text.length - 1;
            
            if (cr) {
                text = text.replace(jb.NEWLINE, "");
            }
            
            // Assume top-left alignment.
            x = jb.xFromCol(col);
            y = jb.yFromRow(row);

            // Compensate for desired alignment.
            y += scale * this.DEFAULT_SIZE * (0.5 + (vAlign - 0.5)); 
            x -= scale * this.DEFAULT_SIZE * text.length * (0.5 + (hAlign - 0.5));

            jb.ctxt.save();
            jb.ctxt.fillStyle = color;
            jb.ctxt.lineWidth = scale;
            jb.ctxt.strokeStyle = color;

            for (iChar=0; iChar<text.length; ++iChar) {
                curChar = text.charAt(iChar);

                if (curChar !== ' ') {
                    fontChar = charSet[curChar];

                    if (fontChar) {
                        image = this.imageForChar(fontChar, color, scale);
                        jb.ctxt.drawImage(image, x, y);
                    }
                    else {
                        jb.ctxt.rect(x, y, scale * this.DEFAULT_SIZE, scale * this.DEFAULT_SIZE);
                    }
                }

                x += scale * this.DEFAULT_SIZE;
            }

            jb.ctxt.restore()
            
            col += text.length * scale;
            if (cr) {
                col = 0;
                row += scale;
            }

            jb.row = row;
            jb.col = col;
       }
    },

    imageForChar: function(fontChar, color, scale) {
        var key = color + scale,
            image = null,
            iRow = 0,
            iCol = 0,
            x = 0,
            y = 0,
            canvas = null,
            ctxt = null;

        if (fontChar) {
            image = fontChar.images[key];

            if (!image) {
                // This image doesn't yet exist, so we need to create it.
                canvas = document.createElement('canvas');
                canvas.width = fontChar.data[0].length * scale;
                canvas.height = fontChar.data.length * scale;
                ctxt = canvas.getContext('2d');

                ctxt.fillStyle = color;
                for (iRow=0; iRow<fontChar.data.length; ++iRow) {
                    y = scale * iRow;
                    for (iCol=0; iCol<fontChar.data[0].length; ++iCol) {
                        x = scale * iCol;
                        if (fontChar.data[iRow].charAt(iCol) !== '.') {
                            ctxt.fillRect(x, y, scale, scale);
                        }
                    }
                }

                image = canvas;
                fontChar.images[key] = image;
            }
        }

        return image;
    },

    fantasy: {
        bCaseless: true,
        Empty: {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
            ],
            images: {}
        },
        A: {
            data: ["................",
                   "........000.....",
                   ".......000000...",
                   "......000.000...",
                   "......000..000..",
                   "......000..000..",
                   ".....000...000..",
                   ".....000...000..",
                   ".0000000000000..",
                   ".0000000000000..",
                   ".00.000....000..",
                   ".0..000....000..",
                   "...000.....000..",
                   "...000.....000..",
                   "..000......000..",
                   "..000......000..",
            ],
            images: {}
        },
        B: {
            data: ["................",
                   "..0000000000....",
                   "..00000000000...",
                   "..00.000000000..",
                   "..0..000...000..",
                   "....0000...000..",
                   "....0000.0000...",
                   "....000000000...",
                   "...00000000000..",
                   "...0000...0000..",
                   "...000.....0000.",
                   "..0000......000.",
                   "..0000......000.",
                   "..000.....00000.",
                   ".0000000000000..",
                   ".000000000000...",
            ],
            images: {}
        },
        C: {
            data: ["................",
                   ".......00000....",
                   ".....0000000.00.",
                   ".....000...0000.",
                   "....000.....00..",
                   "...000......0...",
                   "..000...........",
                   "..000...........",
                   "..000...........",
                   ".000............",
                   ".000............",
                   ".000.......0....",
                   ".000......00....",
                   "..000....000....",
                   "...000000000....",
                   "....000000......",
            ],
            images: {}
        },
        D: {
            data: ["................",
                   "..00000000000...",
                   "..000000000000..",
                   "..00.000...0000.",
                   "..0.000.....000.",
                   "...000......000.",
                   "...000......000.",
                   "...000......000.",
                   "...000......000.",
                   "..000.......000.",
                   "..000......000..",
                   "..000......000..",
                   "..000.....000...",
                   ".000.....000....",
                   ".0000000000.....",
                   ".000000000......",
            ],
            images: {}
        },
        E: {
            data: ["................",
                   "..0000000000000.",
                   "..0000000000000.",
                   "..00.000....00..",
                   "..0.000......0..",
                   "...000..........",
                   "...000..........",
                   "...00000000.....",
                   "..00000000......",
                   "..000...........",
                   ".000............",
                   ".000............",
                   ".000........0...",
                   ".0000......00...",
                   ".000000000000...",
                   "..000000000.....",
            ],
            images: {}
        },
        F: {
            data: ["................",
                   "..0000000000000.",
                   "..0000000000000.",
                   "..00.000....00..",
                   "..0.000......0..",
                   "...000..........",
                   "...000..........",
                   "...00000000.....",
                   "..00000000......",
                   "..000...........",
                   ".000............",
                   ".000............",
                   ".000............",
                   ".000............",
                   ".000............",
                   "..000...........",
            ],
            images: {}
        },
        G: {
            data: ["................",
                   ".......00000....",
                   ".....0000000.00.",
                   ".....000...0000.",
                   "....000.....00..",
                   "...000......0...",
                   "...000..........",
                   "...000..........",
                   "..000...........",
                   "..000...00000...",
                   ".000....00000...",
                   ".000....0..00...",
                   ".000......000...",
                   "..000....000....",
                   "...000000000....",
                   "....000000......",
            ],
            images: {}
        },
        H: {
            data: ["................",
                   "......000....000",
                   ".....000....000.",
                   ".....000....000.",
                   ".....000....000.",
                   "....000....000..",
                   "....000....000..",
                   "....000....000..",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".00000....000...",
                   ".0.000....000...",
                   "...000....000...",
                   "..000....000....",
                   "..000....000....",
                   "..000....000....",
            ],
            images: {}
        },
        I: {
            data: ["................",
                   "......000000....",
                   "......000000....",
                   "......00.000....",
                   "......0.000.....",
                   "........000.....",
                   "........000.....",
                   ".......000......",
                   ".......000......",
                   ".......000......",
                   "......000.......",
                   "......000.......",
                   "......000.0.....",
                   ".....000.00.....",
                   ".....000000.....",
                   ".....000000.....",
            ],
            images: {}
        },
        J: {
            data: ["................",
                   ".......00000000.",
                   ".......00000000.",
                   ".......00...000.",
                   ".......0....000.",
                   "............000.",
                   "...........000..",
                   "...........000..",
                   "...........000..",
                   "..........000...",
                   "..000.....000...",
                   "..000.....000...",
                   ".000.....000....",
                   ".000.....000....",
                   ".0000000000.....",
                   "...0000000......",
            ],
            images: {}
        },
        K: {
            data: ["................",
                   "......000...000.",
                   ".....000....000.",
                   ".....000...000..",
                   ".....000..000...",
                   "....000..000....",
                   "....000..000....",
                   "....000.000.....",
                   "....0000000.....",
                   "....000.000.....",
                   "...000..000.....",
                   "...000...000....",
                   "...000....000...",
                   "..000.....000...",
                   "..000......000..",
                   "..000......000..",
            ],
            images: {}
        },
        L: {
            data: ["................",
                   "...000000.......",
                   "...000000.......",
                   "...00.000.......",
                   "...0.000........",
                   ".....000........",
                   ".....000........",
                   "....000.........",
                   "....000.........",
                   "....000.........",
                   "...000..........",
                   "...000..........",
                   "...000......0...",
                   "..000......00...",
                   "..00000000000...",
                   "..00000000000...",
            ],
            images: {}
        },
        M: {
            data: ["...............",
                   "...000.....000.",
                   "...000.....000.",
                   "...0000...0000.",
                   "...0000..00000.",
                   "...0000..00000.",
                   "..00000.00000..",
                   "..000.000.000..",
                   "..000.000.000..",
                   "..000.000.000..",
                   "..000..0..000..",
                   ".000.....000...",
                   ".000.....000...",
                   ".000.....000...",
                   ".000.....000...",
                   ".000.....000...",
            ],
            images: {}
        },
        N: {
            data: ["...............",
                   "...000.....000.",
                   "...000.....000.",
                   "...000.....000.",
                   "...0000....000.",
                   "...0000....000.",
                   "..000000..000..",
                   "..000.000.000..",
                   "..000.000.000..",
                   "..000.000.000..",
                   "..000..000000..",
                   ".000....0000...",
                   ".000....0000...",
                   ".000.....000...",
                   ".000.....000...",
                   ".000.....000...",
            ],
            images: {}
        },
        O: {
            data: ["................",
                   ".......000000...",
                   ".....000000000..",
                   ".....000....000.",
                   "....000.....000.",
                   "...000......000.",
                   "..000.......000.",
                   "..000.......000.",
                   "..000.......000.",
                   ".000.......000..",
                   ".000.......000..",
                   ".000.......000..",
                   ".000......000...",
                   "..000....000....",
                   "...000000000....",
                   "....000000......",
            ],
            images: {}
        },
        P: {
            data: ["................",
                   "..00000000000...",
                   "..000000000000..",
                   "..00.000...000..",
                   "..0.000.....000.",
                   "...000......000.",
                   "...000......000.",
                   "...0000....000..",
                   "..00000000000...",
                   "..00000000......",
                   ".000............",
                   ".000............",
                   ".000............",
                   ".000............",
                   ".000............",
                   "..000...........",
            ],
            images: {}
        },
        Q: {
            data: ["................",
                   ".......000000...",
                   ".....000000000..",
                   ".....000....000.",
                   "....000.....000.",
                   "...000......000.",
                   "..000.......000.",
                   "..000.......000.",
                   "..000.......000.",
                   ".000.......000..",
                   ".000.......000..",
                   ".000...00..000..",
                   "..000...00000...",
                   "...000000000....",
                   "....0000000000..",
                   "...........000..",
            ],
            images: {}
        },
        R: {
            data: ["................",
                   "..00000000000...",
                   "..000000000000..",
                   "..00.000...000..",
                   "..0.000.....000.",
                   "...000......000.",
                   "...000......000.",
                   "...0000....000..",
                   "..00000000000...",
                   "..000000000.....",
                   "..000...000.....",
                   "..000....000....",
                   "..000.....000...",
                   ".000......000...",
                   ".000.......000..",
                   ".000.......000..",
            ],
            images: {}
        },
        S: {
            data: ["................",
                   ".......00000....",
                   ".....0000000.00.",
                   ".....000...0000.",
                   "....000.....00..",
                   "...000......0...",
                   "...000..........",
                   "...000000.......",
                   ".....000000.....",
                   ".......000000...",
                   "..........000...",
                   "...0.......000..",
                   "..00.......000..",
                   ".0000.....000...",
                   ".00.00000000....",
                   ".....00000......",
            ],
            images: {}
        },
        T: {
            data: ["................",
                   "..0000000000000.",
                   "..0000000000000.",
                   "..00...000..00..",
                   "..0....000...0..",
                   ".......000......",
                   "......000.......",
                   "......000.......",
                   "......000.......",
                   ".....000........",
                   ".....000........",
                   ".....000........",
                   "....000.........",
                   "....000.........",
                   "....000.........",
                   ".....000........",
            ],
            images: {}
        },
        U: {
            data: ["................",
                   ".000000.....000.",
                   ".000000.....000.",
                   ".00000.....000..",
                   ".0.000.....000..",
                   "...000.....000..",
                   "...000.....000..",
                   "...000.....000..",
                   "..000.....000...",
                   "..000.....000...",
                   "..000.....000...",
                   "..000.....000...",
                   "..000.....000...",
                   "..0000...000....",
                   "...00000000.....",
                   "....000000......",
            ],
            images: {}
        },
        V: {
            data: ["................",
                   "..000.......000.",
                   "..000.......000.",
                   "..000.......000.",
                   "..000......000..",
                   "..000......000..",
                   "...000.....000..",
                   "...000....000...",
                   "...000....000...",
                   "...000....000...",
                   "...000...000....",
                   "....000..000....",
                   "....000..000....",
                   "....000.000.....",
                   "....0000000.....",
                   ".....00000......",
            ],
            images: {}
        },
        W: {
            data: ["...............",
                   "...000.....000.",
                   "...000.....000.",
                   "...000.....000.",
                   "...000.....000.",
                   "...000.....000.",
                   "..000..0..000..",
                   "..000.000.000..",
                   "..000.000.000..",
                   "..000.000.000..",
                   "..00000.00000..",
                   ".00000..0000...",
                   ".00000..0000...",
                   ".0000...0000...",
                   ".000.....000...",
                   ".000.....000...",
            ],
            images: {}
        },
        X: {
            data: ["...............",
                   "...000.....000.",
                   "...000.....000.",
                   "...000.....000.",
                   "..000.....000..",
                   "..000.....000..",
                   "..0000...0000..",
                   "...000000000...",
                   "......000......",
                   "......000......",
                   "...000000000...",
                   "..000.....000..",
                   "..000.....000..",
                   ".000......000..",
                   ".000.....000...",
                   ".000.....000...",
            ],
            images: {}
        },
        Y: {
            data: ["...............",
                   "...000.....000.",
                   "...000.....000.",
                   "...000.....000.",
                   "..000.....000..",
                   "..000.....000..",
                   "..0000...0000..",
                   "...000000000...",
                   "......000......",
                   "......000......",
                   "......000......",
                   "......000......",
                   ".....000.......",
                   ".....000.......",
                   ".....000.......",
                   ".....000.......",
            ],
            images: {}
        },
        Z: {
            data: ["................",
                   "..000000000000..",
                   "..000000000000..",
                   "..00.......000..",
                   "..0.......000...",
                   ".........000....",
                   "........000.....",
                   ".......000......",
                   "......000.......",
                   ".....000........",
                   "....000.........",
                   "...000..........",
                   "..000......0....",
                   ".000......00....",
                   ".00000000000....",
                   ".00000000000....",
            ],
            images: {}
        },
        0: {
            data: ["................",
                   "......0000000...",
                   "....0000000000..",
                   "...0000....0000.",
                   "...000......000.",
                   "..000.......000.",
                   "..000.......000.",
                   "..000.......000.",
                   ".000.......000..",
                   ".000.......000..",
                   ".000.......000..",
                   ".000......000...",
                   ".000......000...",
                   "..0000...0000...",
                   "...00000000.....",
                   ".....0000.......",
            ],
            images: {}
        },
        1: {
            data: ["................",
                   "..........0000..",
                   "........000000..",
                   ".......0000000..",
                   "......000.000...",
                   "..........000...",
                   "..........000...",
                   ".........000....",
                   ".........000....",
                   ".........000....",
                   "........000.....",
                   "........000.....",
                   "........000.....",
                   ".......000......",
                   ".......000......",
                   ".......000......",
            ],
            images: {}
        },
        2: {
            data: ["................",
                   "......000000....",
                   "....0000000000..",
                   "...0000.....000.",
                   "..000.......000.",
                   "...........000..",
                   "...........000..",
                   "..........000...",
                   ".........000....",
                   "........000.....",
                   "......000.......",
                   ".....000........",
                   "...000........0.",
                   "..000........00.",
                   "..0000000000000.",
                   "..0000000000000.",
            ],
            images: {}
        },
        3: {
            data: ["................",
                   "......000000...",
                   "....0000000000..",
                   "...0000.....000.",
                   "..000.......000.",
                   "...........000..",
                   "...........000..",
                   "........00000...",
                   "......000000....",
                   ".........0000...",
                   "..........0000..",
                   "............000.",
                   "...000......000.",
                   "..000.......000.",
                   "..000000000000..",
                   "....00000000....",
            ],
            images: {}
        },
        4: {
            data: ["................",
                   "..........0000..",
                   ".........00000..",
                   "........000.00..",
                   ".......000..00..",
                   "......000..00...",
                   ".....000...00...",
                   "....000...000...",
                   "...000....000...",
                   "..0000000000000.",
                   ".0000000000000..",
                   "........000.....",
                   "........000.....",
                   ".......000......",
                   ".......000......",
                   ".......000......",
            ],
            images: {}
        },
        5: {
            data: ["................",
                   "...000000000000.",
                   "...000000000000.",
                   "...000.....000..",
                   "...000......00..",
                   "..000.......0...",
                   "..0000..........",
                   "..00000000......",
                   "..0000000000....",
                   "........00000...",
                   "..........0000..",
                   "...0.......000..",
                   "..00.......000..",
                   ".0000.....000...",
                   ".00.00000000....",
                   ".....00000......",
            ],
            images: {}
        },
        6: {
            data: ["................",
                   "......0000000...",
                   "....0000000000..",
                   "...0000....0000.",
                   "...000.......00.",
                   "..000........0..",
                   "..000...........",
                   "..000..00000....",
                   ".0000000000000..",
                   ".0000......0000.",
                   ".000........000.",
                   ".000........000.",
                   ".000........000.",
                   "..0000.....000..",
                   "...0000000000...",
                   ".....000000.....",
            ],
            images: {}
        },
        7: {
            data: ["................",
                   "..0000000000000.",
                   "..0000000000000.",
                   "..00........000.",
                   "..0........000..",
                   "..........000...",
                   ".........000....",
                   "........000.....",
                   ".......000......",
                   "......000.......",
                   ".....000........",
                   "....000.........",
                   "...000..........",
                   "..000...........",
                   "..000...........",
                   "..000...........",
            ],
            images: {}
        },
        8: {
            data: ["................",
                   "......0000000...",
                   "....0000000000..",
                   "...0000....0000.",
                   "...000......000.",
                   "..000.......000.",
                   "..000.......000.",
                   "...0000000000...",
                   "...00000000000..",
                   "..0000.....0000.",
                   ".000........000.",
                   ".000........000.",
                   ".000........000.",
                   "..0000.....000..",
                   "...0000000000...",
                   ".....000000.....",
            ],
            images: {}
        },
        9: {
            data: ["................",
                   ".....000000.....",
                   "...0000000000...",
                   "..000.....0000..",
                   ".000........000.",
                   ".000........000.",
                   ".000........000.",
                   ".0000......0000.",
                   "..0000000000000.",
                   "....00000..000..",
                   "...........000..",
                   "..0........000..",
                   ".00.......000...",
                   ".0000....0000...",
                   "..0000000000....",
                   "...0000000......",
            ],
            images: {}
        },
        '!': {
            data: ["................",
                   "......0000000...",
                   "......0000000...",
                   "......0000000...",
                   ".....000000.....",
                   ".....000000.....",
                   ".....000000.....",
                   ".....000000.....",
                   "....00000.......",
                   "....00000.......",
                   "....0000........",
                   "....000.........",
                   "................",
                   "...00000........",
                   "...00000........",
                   "..00000.........",
            ],
            images: {}
        },
        '?': {
            data: ["................",
                   "......000000...",
                   "....0000000000..",
                   "...0000.....000.",
                   "..000.......000.",
                   "...........000..",
                   "...........000..",
                   "........00000...",
                   "......00000.....",
                   "....0000........",
                   "...0000.........",
                   "...000..........",
                   "................",
                   "...0000.........",
                   "...0000.........",
                   "..0000..........",
            ],
            images: {}
        },
        '.': {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "...0000.........",
                   "...0000.........",
                   "...0000.........",
            ],
            images: {}
        },
        ',': {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "....00..........",
                   "...0000.........",
                   "...0000.........",
                   "..000...........",
            ],
            images: {}
        },
        "'": {
            data: ["................",
                   ".......00.......",
                   "......0000......",
                   "......0000......",
                   ".....000........",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
            ],
            images: {}
        },
    },

    scifi: {
        bCaseless: true,
        Empty: {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
            ],
            images: {}
        },
        A: {
            data: ["................",
                   "...0000000000...",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "...........0000.",
                   ".0000......0000.",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        B: {
            data: ["................",
                   ".000000000000...",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "...........0000.",
                   ".000000000000...",
                   ".000000000000...",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".00000000000000.",
                   ".000000000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        C: {
            data: ["................",
                   "...0000000000...",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".00000000000000.",
                   "...0000000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        D: {
            data: ["................",
                   ".000000000000...",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "...........0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".00000000000000.",
                   ".000000000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        E: {
            data: ["................",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".0000...........",
                   ".0000...........",
                   "................",
                   ".000000000......",
                   ".000000000......",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".00000000000000.",
                   ".00000000000000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        F: {
            data: ["................",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".0000...........",
                   ".0000...........",
                   "................",
                   ".000000000......",
                   ".000000000......",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   "................",
                   "................",
            ],
            images: {}
        },
        G: {
            data: ["................",
                   "...0000000000...",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   ".0000...........",
                   ".0000...0000000.",
                   ".0000...0000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".00000000000000.",
                   "...0000000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        H: {
            data: ["................",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "...........0000.",
                   ".0000......0000.",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        I: {
            data: ["................",
                   "....00000000....",
                   "....00000000....",
                   "......0000......",
                   "......0000......",
                   "................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   ".....000000.....",
                   ".....000000.....",
                   "................",
                   "................",
            ],
            images: {}
        },
        J: {
            data: ["................",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   "................",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000000000000..",
                   "...000000000....",
                   "................",
                   "................",
             ],
            images: {}
        },
        K: {
            data: ["................",
                   ".0000......0000.",
                   ".0000.....0000..",
                   ".0000....0000...",
                   ".0000...0000....",
                   ".......0000.....",
                   ".000000000......",
                   ".00000000.......",
                   ".0000.0000......",
                   ".0000..0000.....",
                   ".0000...0000....",
                   ".0000....0000...",
                   ".0000.....0000..",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        L: {
            data: ["................",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   "................",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000000000000..",
                   ".0000000000000..",
                   "................",
                   "................",
            ],
            images: {}
        },
        M: {
            data: ["...............",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".00000....00000.",
                   ".000000..000000.",
                   ".....0000000000.",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".0000.0000.0000.",
                   ".0000..00..0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        N: {
            data: ["...............",
                   ".0000......0000.",
                   ".00000.....0000.",
                   ".000000....0000.",
                   ".0000000...0000.",
                   "...........0000.",
                   ".000000000.0000.",
                   ".00000000000000.",
                   ".0000.000000000.",
                   ".0000..00000000.",
                   ".0000...0000000.",
                   ".0000....000000.",
                   ".0000.....00000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        O: {
            data: ["................",
                   "...0000000000...",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "...........0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".00000000000000.",
                   "...0000000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        P: {
            data: ["................",
                   ".00000000000....",
                   ".0000000000000..",
                   ".0000......0000.",
                   ".0000......0000.",
                   "...........0000.",
                   ".0000......0000.",
                   ".0000000000000..",
                   ".00000000000....",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   "................",
                   "................",
            ],
            images: {}
        },
        Q: {
            data: ["................",
                   "...0000000000...",
                   ".00000000000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "...........0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000..00000000.",
                   ".00000000000000.",
                   "...0000000000...",
                   "..........0000..",
                   "................",
            ],
            images: {}
        },
        R: {
            data: ["................",
                   ".00000000000....",
                   ".0000000000000..",
                   ".0000......0000.",
                   ".0000......0000.",
                   "...........0000.",
                   ".0000......0000.",
                   ".0000000000000..",
                   ".00000000000....",
                   ".0000..0000.....",
                   ".0000...0000....",
                   ".0000....0000...",
                   ".0000.....0000..",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        S: {
            data: ["................",
                   "...000000000....",
                   ".0000000000000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   "................",
                   "..0000000.......",
                   "....00000000....",
                   ".......0000000..",
                   "..........0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000000000000..",
                   "...000000000....",
                   "................",
                   "................",
            ],
            images: {}
        },
        T: {
            data: ["................",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".00000000000000.",
                   "......0000......",
                   "................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        U: {
            data: ["................",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   "................",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000000000000..",
                   "...000000000....",
                   "................",
                   "................",
            ],
            images: {}
        },
        V: {
            data: ["................",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "..0000....0000..",
                   "..........0000..",
                   "..0000....0000..",
                   "...0000..0000...",
                   "...0000..0000...",
                   "....00000000....",
                   "....00000000....",
                   ".....000000.....",
                   ".....000000.....",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        W: {
            data: ["...............",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".......00..0000.",
                   ".0000.0000.0000.",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".000000..000000.",
                   ".00000....00000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        X: {
            data: ["...............",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "..0000....0000..",
                   ".........0000...",
                   "....00000000....",
                   ".....000000.....",
                   "....00000000....",
                   "...0000..0000...",
                   "..0000....0000..",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        Y: {
            data: ["...............",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "..0000....0000..",
                   ".........0000...",
                   "....00000000....",
                   ".....000000.....",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        Z: {
            data: ["................",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".0000000000000..",
                   ".........0000...",
                   "................",
                   ".......0000.....",
                   "......0000......",
                   ".....0000.......",
                   "....0000........",
                   "...0000.........",
                   "..0000000000000.",
                   ".00000000000000.",
                   ".00000000000000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        0: {
            data: ["................",
                   "...0000000000...",
                   ".00000000000000.",
                   ".0000.....00000.",
                   ".0000....000000.",
                   "........0000000.",
                   ".0000..00000000.",
                   ".0000.0000.0000.",
                   ".00000000..0000.",
                   ".0000000...0000.",
                   ".000000....0000.",
                   ".00000.....0000.",
                   ".00000000000000.",
                   "...0000000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        1: {
            data: ["................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        2: {
            data: ["................",
                   "...0000000000...",
                   ".0000000000000..",
                   ".0000000000000..",
                   ".0000.....0000..",
                   ".0000...........",
                   "........00000...",
                   ".......00000....",
                   ".....00000......",
                   "....00000.......",
                   "...0000.........",
                   "..000000000000..",
                   ".0000000000000..",
                   ".0000000000000..",
                   "................",
                   "................",
            ],
            images: {}
        },
        3: {
            data: ["................",
                   "...0000000000...",
                   ".0000000000000..",
                   ".0000000000000..",
                   ".0000.....0000..",
                   ".0000...........",
                   "........00000...",
                   ".......00000....",
                   "........00000...",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000000000000..",
                   ".0000000000000..",
                   "...0000000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        4: {
            data: ["................",
                   "..........0000..",
                   ".........00000..",
                   "........000000..",
                   ".......0000000..",
                   "......0000......",
                   ".....0000.0000..",
                   "....0000..0000..",
                   "...0000...0000..",
                   "..0000000000000.",
                   "..0000000000000.",
                   "..0000000000000.",
                   "..........0000..",
                   "..........0000..",
                   "................",
                   "................",
            ],
            images: {}
        },
        5: {
            data: ["................",
                   ".0000000000000..",
                   ".0000000000000..",
                   ".0000000000000..",
                   ".0000...........",
                   "................",
                   ".0000000000.....",
                   ".000000000000...",
                   ".....000000000..",
                   "..........0000..",
                   ".0000.....0000..",
                   ".00000...00000..",
                   ".000000000000...",
                   "...000000000....",
                   "................",
                   "................",
            ],
            images: {}
        },
        6: {
            data: ["................",
                   "...0000000000...",
                   ".000000000000...",
                   ".000000000000...",
                   ".0000...........",
                   "................",
                   ".0000000000.....",
                   ".000000000000...",
                   ".0000000000000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".00000...00000..",
                   "..00000000000...",
                   "...000000000....",
                   "................",
                   "................",
            ],
            images: {}
        },
        7: {
            data: ["................",
                   ".00000000000000.",
                   ".00000000000000.",
                   ".00000000000000.",
                   "..........0000..",
                   "................",
                   "........0000....",
                   ".......0000.....",
                   "......0000......",
                   ".....0000.......",
                   "....0000........",
                   "...0000.........",
                   "..0000..........",
                   ".0000...........",
                   "................",
                   "................",
            ],
            images: {}
        },
        8: {
            data: ["................",
                   "...000000000....",
                   ".0000000000000..",
                   ".00000...00000..",
                   ".0000.....0000..",
                   ".........0000...",
                   "...000000000....",
                   "...000000000....",
                   "..00000000000...",
                   ".00000...00000..",
                   ".0000.....0000..",
                   ".00000...00000..",
                   "..00000000000...",
                   "...000000000....",
                   "................",
                   "................",
            ],
            images: {}
        },
        9: {
            data: ["................",
                   "....000000000...",
                   "...00000000000..",
                   "..00000...00000.",
                   "..0000.....0000.",
                   "...........0000.",
                   "..0000000000000.",
                   "...000000000000.",
                   ".....0000000000.",
                   "...........0000.",
                   "...........0000.",
                   "...000000000000.",
                   "...000000000000.",
                   "...0000000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        '!': {
            data: ["................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        '?': {
            data: ["................",
                   "...0000000000...",
                   ".0000000000000..",
                   ".0000000000000..",
                   ".0000.....0000..",
                   ".0000...........",
                   "........00000...",
                   ".......00000....",
                   ".....00000......",
                   ".....0000.......",
                   "................",
                   ".....0000.......",
                   ".....0000.......",
                   ".....0000.......",
                   "................",
                   "................",
            ],
            images: {}
        },
        '.': {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "...0000.........",
                   "...0000.........",
                   "...0000.........",
                   "................",
                   "................",
            ],
            images: {}
        },
        ',': {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "...0000.........",
                   "...0000.........",
                   "...0000.........",
                   ".....00.........",
                   ".....0..........",
            ],
            images: {}
        },
        "'": {
            data: ["................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "........00......",
                   "........0.......",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
            ],
            images: {}
        },
    },

    military: {
        bCaseless: true,
        Empty: {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
            ],
            images: {}
        },
        A: {
            data: ["................",
                   "....000..000....",
                   "...0000..0000...",
                   "..000......000..",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..000000.",
                   ".000000..000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        B: {
            data: ["................",
                   ".000000..0000...",
                   ".000000..000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..0000...",
                   ".000000..0000...",
                   ".000000..000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..000000.",
                   ".000000..0000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        C: {
            data: ["................",
                   "...0000..0000...",
                   ".000000..000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..000000.",
                   "...0000..0000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        D: {
            data: ["................",
                   ".000000..0000...",
                   ".000000..000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..000000.",
                   ".000000..0000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        E: {
            data: ["................",
                   ".0000..00000000.",
                   ".0000..00000000.",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000..000......",
                   ".0000..000......",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000..00000000.",
                   ".0000..00000000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        F: {
            data: ["................",
                   ".0000..00000000.",
                   ".0000..00000000.",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000..000......",
                   ".0000..000......",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   "................",
                   "................",
            ],
            images: {}
        },
        G: {
            data: ["................",
                   "...00..000000...",
                   ".0000..00000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000...........",
                   ".0000...........",
                   ".0000...0000000.",
                   ".0000...0000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000..00000000.",
                   "...00..000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        H: {
            data: ["................",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..000000.",
                   ".000000..000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        I: {
            data: ["................",
                   "...00.0000.00...",
                   "...00.0000.00...",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "...00.0000.00...",
                   "...00.0000.00...",
                   "................",
                   "................",
            ],
            images: {}
        },
        J: {
            data: ["................",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".00000..000000..",
                   "...000..0000....",
                   "................",
                   "................",
             ],
            images: {}
        },
        K: {
            data: ["................",
                   ".0000......0000.",
                   ".0000.....0000..",
                   ".0000....0000...",
                   ".0000...0000....",
                   ".0000..0000.....",
                   ".0000..000......",
                   ".0000..00.......",
                   ".0000..000......",
                   ".0000..0000.....",
                   ".0000...0000....",
                   ".0000....0000...",
                   ".0000.....0000..",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        L: {
            data: ["................",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000..0000000..",
                   ".0000..0000000..",
                   "................",
                   "................",
            ],
            images: {}
        },
        M: {
            data: ["...............",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".00000....00000.",
                   "..00000..00000..",
                   ".0.0000000000.0.",
                   ".00.00000000.00.",
                   ".000.000000.000.",
                   ".0000.0000.0000.",
                   ".0000..00..0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        N: {
            data: ["...............",
                   ".0000......0000.",
                   ".00000.....0000.",
                   "..00000....0000.",
                   ".0.00000...0000.",
                   ".00.00000..0000.",
                   ".000.00000.0000.",
                   ".0000.00000.000.",
                   ".0000.000000.00.",
                   ".0000..000000.0.",
                   ".0000...000000..",
                   ".0000....000000.",
                   ".0000.....00000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        O: {
            data: ["................",
                   "...0000..0000...",
                   ".000000..000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..000000.",
                   "...0000..0000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        P: {
            data: ["................",
                   ".000000..000....",
                   ".000000..00000..",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..00000..",
                   ".000000..000....",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   ".0000...........",
                   "................",
                   "................",
            ],
            images: {}
        },
        Q: {
            data: ["................",
                   "...0000..0000...",
                   ".000000..000000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000...000.000.",
                   ".000000.0000.00.",
                   "...00000.0000...",
                   "..........0000..",
                   "................",
            ],
            images: {}
        },
        R: {
            data: ["................",
                   ".0000..00000....",
                   ".0000..0000000..",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000..00.0000..",
                   ".0000..000.0....",
                   ".0000..0000.....",
                   ".0000...0000....",
                   ".0000....0000...",
                   ".0000.....0000..",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        S: {
            data: ["................",
                   "...0000..000....",
                   ".000000..00000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".00000..........",
                   "..00000.........",
                   "....000..000....",
                   ".........00000..",
                   "..........0000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".000000..00000..",
                   "...0000..000....",
                   "................",
                   "................",
            ],
            images: {}
        },
        T: {
            data: ["................",
                   ".0000.0000.0000.",
                   ".0000.0000.0000.",
                   ".0000.0000.0000.",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        U: {
            data: ["................",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".000000..000000.",
                   "...0000..0000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        V: {
            data: ["................",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "..0000....0000..",
                   "..0000....0000..",
                   "..0000....0000..",
                   "...0000..0000...",
                   "...0000..0000...",
                   "....0000.000....",
                   "....0000.000....",
                   ".....0000.0.....",
                   ".....00000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        W: {
            data: ["...............",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000..00..0000.",
                   ".0000.0000.0000.",
                   ".000..00000.000.",
                   ".00.00.00000.00.",
                   ".0.0000.00000.0.",
                   "..00000..00000..",
                   ".00000....00000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        X: {
            data: ["...............",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "..0000....0000..",
                   "...000...0000...",
                   "....0.000000....",
                   ".....000000.....",
                   "....000000.0....",
                   "...0000...000...",
                   "..0000....0000..",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        Y: {
            data: ["...............",
                   ".0000......0000.",
                   ".0000......0000.",
                   ".0000......0000.",
                   "..0000....0000..",
                   "...0000..0000...",
                   "....00.00000....",
                   "......00000.....",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        Z: {
            data: ["................",
                   ".0000000000.000.",
                   ".000000000.0000.",
                   ".00000000.0000..",
                   ".........0000...",
                   "........0000....",
                   ".......0000.....",
                   "......0000......",
                   ".....0000.......",
                   "....0000........",
                   "...0000.........",
                   "..0000.00000000.",
                   ".0000.000000000.",
                   ".000.0000000000.",
                   "................",
                   "................",
            ],
            images: {}
        },
        0: {
            data: ["................",
                   "...00000000.....",
                   ".000000000.000..",
                   ".0000.....0000..",
                   ".0000....0000.0.",
                   ".0000...0000.00.",
                   ".0000..0000.000.",
                   ".0000.0000.0000.",
                   ".000.0000..0000.",
                   ".00.0000...0000.",
                   ".0.0000....0000.",
                   "..0000.....0000.",
                   "..000.000000000.",
                   ".....00000000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        1: {
            data: ["................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        2: {
            data: ["................",
                   "...000000000....",
                   ".0000000000.00..",
                   ".000000000.000..",
                   ".0000.....0000..",
                   ".0000....0000...",
                   "........00000...",
                   ".......00000....",
                   ".....00000......",
                   "....00000.......",
                   "...0000.........",
                   "..0000.0000000..",
                   ".0000.00000000..",
                   ".000.000000000..",
                   "................",
                   "................",
            ],
            images: {}
        },
        3: {
            data: ["................",
                   "...0000..0000...",
                   ".000000..00000..",
                   ".000000..00000..",
                   ".0000.....0000..",
                   ".0000....0000...",
                   "........00000...",
                   ".......00000....",
                   "........00000...",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".000000..00000..",
                   ".000000..00000..",
                   "...0000..0000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        4: {
            data: ["................",
                   "..........0000..",
                   "..........0000..",
                   "..........0000..",
                   ".......0..0000..",
                   "......00..0000..",
                   ".....000..0000..",
                   "....0000..0000..",
                   "...0000...0000..",
                   "..000000..00000.",
                   "..000000..00000.",
                   "..000000..00000.",
                   "..........0000..",
                   "..........0000..",
                   "................",
                   "................",
            ],
            images: {}
        },
        5: {
            data: ["................",
                   ".000000..00000..",
                   ".000000..00000..",
                   ".000000..00000..",
                   ".0000...........",
                   ".0000...........",
                   ".000000..00.....",
                   ".000000..0000...",
                   ".....00..00000..",
                   "..........0000..",
                   ".0000.....0000..",
                   ".00000...00000..",
                   ".000000..0000...",
                   "...0000..000....",
                   "................",
                   "................",
            ],
            images: {}
        },
        6: {
            data: ["................",
                   "...0000..0000...",
                   ".000000..0000...",
                   ".000000..0000...",
                   ".0000...........",
                   ".0000...........",
                   ".000000..00.....",
                   ".000000..0000...",
                   ".000000..00000..",
                   ".0000.....0000..",
                   ".0000.....0000..",
                   ".00000...00000..",
                   "..00000..0000...",
                   "...0000..000....",
                   "................",
                   "................",
            ],
            images: {}
        },
        7: {
            data: ["................",
                   ".00000000000.00.",
                   ".0000000000.000.",
                   "...........0000.",
                   "..........0000..",
                   ".........0000...",
                   "........0000....",
                   ".......0000.....",
                   "......0000......",
                   ".....0000.......",
                   "....0000........",
                   "...0000.........",
                   "..0000..........",
                   ".0000...........",
                   "................",
                   "................",
            ],
            images: {}
        },
        8: {
            data: ["................",
                   "...0000...000...",
                   ".000000...00000.",
                   ".00000....00000.",
                   ".0000......0000.",
                   "..0000....0000..",
                   "...0000..0000...",
                   "...0000..0000...",
                   "..00000..00000..",
                   ".00000....00000.",
                   ".0000......0000.",
                   ".00000....00000.",
                   "..00000..00000..",
                   "...0000..0000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        9: {
            data: ["................",
                   "....0000..000...",
                   "...00000..0000..",
                   "..00000...00000.",
                   "..0000.....0000.",
                   "..0000.....0000.",
                   "..000000..00000.",
                   "...00000..00000.",
                   ".....000..00000.",
                   "...........0000.",
                   "...........0000.",
                   "...00000..00000.",
                   "...00000..00000.",
                   "...00000..000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        '!': {
            data: ["................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        '?': {
            data: ["................",
                   "...0000000000...",
                   ".0000000000000..",
                   ".00000...00000..",
                   ".0000.....0000..",
                   ".0000....0000...",
                   "........00000...",
                   ".......00000....",
                   ".....00000......",
                   ".....0000.......",
                   "................",
                   ".....0000.......",
                   ".....0000.......",
                   ".....0000.......",
                   "................",
                   "................",
            ],
            images: {}
        },
        ':': {
            data: ["................",
                   "................",
                   "................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "................",
                   "................",
            ],
            images: {}
        },
        '.': {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "...0000.........",
                   "...0000.........",
                   "...0000.........",
                   "................",
                   "................",
            ],
            images: {}
        },
        ',': {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "...0000.........",
                   "...0000.........",
                   "...0000.........",
                   ".....00.........",
                   ".....0..........",
            ],
            images: {}
        },
        "'": {
            data: ["................",
                   "......0000......",
                   "......0000......",
                   "......0000......",
                   "........00......",
                   "........0.......",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
            ],
            images: {}
        },
        "<": {
            data: ["................",
                   ".........0000...",
                   "........0000....",
                   ".......0000.....",
                   "......0000......",
                   ".....0000.......",
                   "....0000........",
                   "...0000.........",
                   "....00.0........",
                   "......000.......",
                   "......0000......",
                   ".......0000.....",
                   "........0000....",
                   ".........0000...",
                   "................",
                   "................",
            ],
            images: {}
        },
        ">": {
            data: ["................",
                   "...0000.........",
                   "....0000........",
                   ".....0000.......",
                   "......0000......",
                   ".......000......",
                   "........0.00....",
                   ".........0000...",
                   "........0000....",
                   ".......0000.....",
                   "......0000......",
                   ".....0000.......",
                   "....0000........",
                   "...0000.........",
                   "................",
                   "................",
            ],
            images: {}
        },
        "-": {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   ".000000.000000..",
                   ".000000.000000..",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
                   "................",
            ],
            images: {}
        },
        "*": {
            data: ["................",
                   "................",
                   "................",
                   "................",
                   ".......0........",
                   "....0..0..0.....",
                   ".....0.0.0......",
                   "......000.......",
                   "...000000000....",
                   "......000.......",
                   ".....0.0.0......",
                   "....0..0..0.....",
                   ".......0........",
                   "................",
                   "................",
                   "................",
            ],
            images: {}
        },
    }
};

// GLYPHS //////////////////////////////////////////////////////////////////////
// Glyphs are pre-defined images that can be used for games and such.
// Glyphs are defined in code using an array of strings, where each
// pair of characters represents a hexidecimal lookup into one of
// 16 palettes, each of 16 colors. 00 always equals transparency.
jb.glyphs = {
    draw: function(sizeStr, glyphName, x, y, scaleX, scaleY) {
        jb.glyphs.drawToContext(jb.ctxt, sizeStr, glyphName, x, y, scaleX, scaleY);
    },

    drawToContext: function(ctxt, sizeStr, glyphName, x, y, scaleX, scaleY) {
        var glyphsAtSize = jb.glyphs[sizeStr],
            glyphData = glyphsAtSize ? glyphsAtSize[glyphName] : null,
            sx = scaleX || 1,
            sy = scaleY || 1,
            key = "" + scaleX + "x" + scaleY;

        if (jb.ctxt && glyphData) {
            if (!glyphData.image || !glyphData.image[key]) {
                jb.glyphs.init(sizeStr, glyphName, key, scaleX, scaleY);
            }

            ctxt.drawImage(glyphData.image[key], x, y);
        }
    },

    init: function(sizeStr, glyphName, key, scaleX, scaleY) {
        var glyphAtSize = jb.glyphs[sizeStr],
            glyphData = glyphAtSize ? glyphAtSize[glyphName] : null,
            pixelData = glyphData ? glyphData.pixelData : null,
            glyphImage = glyphData ? glyphData.image : null,
            iRow = 0,
            iCol = 0,
            x = 0,
            y = 0,
            iPalette = 0,
            iColor = 0,
            glyph = null,
            glyphCanvas = null,
            glyphCtxt = null,
            pixel = null,
            row = 0,
            col = 0,
            bFlipRow = scaleY < 0,
            bFlipCol = scaleX < 0;

        scaleX = Math.abs(scaleX);
        scaleY = Math.abs(scaleY);

        if (pixelData && !glyphImage) {
            // Create a new object to hold the glyph at all desired scales.
            glyphImage = {};
            glyphData.image = glyphImage;
        }

        if (pixelData && !glyphImage[key]) {
            glyphCanvas = document.createElement('canvas');
            glyphCanvas.width = pixelData[0].length / 2 * scaleX;
            glyphCanvas.height = pixelData.length * scaleY;
            glyphCtxt = glyphCanvas.getContext('2d');
            glyphCtxt.clearRect(0, 0, glyphCanvas.width * scaleX, glyphCanvas.height * scaleY);

            for (iRow=0; iRow<pixelData.length; ++iRow) {
                row = bFlipRow ? pixelData.length - 1 - iRow : iRow;

                for (iCol=0; iCol<pixelData[iRow].length; iCol+=2) {
                    col = bFlipCol ? pixelData[0].length - 1 - iCol : iCol;

                    iPalette = parseInt(pixelData[row].charAt(col), 16);
                    iColor = parseInt(pixelData[row].charAt(col + 1), 16);

                    if (isNaN(iPalette) || isNaN(iColor)) {
                        // Skip to next pixel.
                        continue;
                    }

                    glyphCtxt.fillStyle = jb.glyphs.palettes[iPalette][iColor];
                    if (scaleX > 0) {
                        x = iCol / 2 * scaleX;
                    }
                    else {
                        x = (pixelData[0].length / 2 - 2 * (iCol + 1)) * scaleX;
                    }

                    if (scaleY > 0) {
                        y = iRow * scaleY;
                    }
                    else {
                        y = (pixelData.length - (iRow + 1)) * scaleY;
                    }

                    glyphCtxt.fillRect(x, y, scaleX, scaleY);
                }
            }

            glyphData.image[key] = glyphCanvas;
        }

        return glyphImage;
    },

    "8x8": {
        empty: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
            ],
        },
        bullet01: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,0101.,.,.,",
                        ".,.,01010101.,.,",
                        ".,.,01010101.,.,",
                        ".,.,.,0101.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
            ],
        },
        missile01up: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,01.,.,.,",
                        ".,.,.,010101.,.,",
                        ".,.,.,.,01.,.,.,",
                        ".,.,.,.,01.,.,.,",
                        ".,.,.,010101.,.,",
                        ".,.,0101010101.,",
                        ".,.,.,070D07.,.,",
                        ".,.,.,.,07.,.,.,",
            ],
        },
         missile01up2: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,01.,.,.,",
                        ".,.,.,010101.,.,",
                        ".,.,.,.,01.,.,.,",
                        ".,.,.,.,01.,.,.,",
                        ".,.,.,010101.,.,",
                        ".,.,0101010101.,",
                        ".,.,.,.,07.,.,.,",
                        ".,.,.,.,.,.,.,.,",
            ],
        },
        torpedoLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,01010101.,0101",
                        "01010101010101.,",
                        ".,01010101.,0101",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,",
            ],
        },
    },

    "16x16": {
        // Ideas for other images:
        // Chess pieces
        // Card suits
        // Weather icons

        empty: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
            ],
        },
        cloud01: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,0101010101.,.,",
                        ".,.,.,.,.,.,.,.,.,010101010101.,",
                        ".,010101.,.,.,0101010101010101.,",
                        ".,.,01010101010101010101.,01.,.,",
                        ".,010101.,0101010101.,.,010101.,",
                        "010101010101.,.,010101.,01010101",
                        ".,.,010101.,.,.,.,.,0101010101.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
            ],
        },
        cloud02: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,01010101010101.,.,.,01010101.,",
                        ".,.,.,01010101010101010101.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,0101010101010101",
                        ".,.,.,.,.,010101010101.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
            ],
        },
        submarineLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,03.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,03.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,030303.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,020203.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,.,.,.,.,.,.,.,",
                        "03030303030303030303030303.,.,.,",
                        "030302030303030303030303030303.,",
                        "03030202020203030303030303030303",
                        ".,03030303030303030303030303.,.,",
                        ".,.,0303030303030303.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
            ],
        },
        destroyerRight: {  
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,03.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,03.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,030303.,.,.,.,.,.,",
                        ".,0303.,.,.,.,030303.,.,.,030303",
                        ".,030303.,.,0303030303.,0303.,.,",
                        "03030303030303030303030303030303",
                        "03020202020202020202020202020203",
                        ".,0303030303030303030303030303.,",
                        ".,0303030303030303030303030303.,",
                        ".,.,030303030303030303030303.,.,",
                        ".,.,030303030303030303030303.,.,",
            ],
         },
         knight: {  
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,020202.,.,.,.,.,.,.,",
                        ".,01.,.,.,.,020302.,.,.,.,.,.,.,",
                        ".,01.,.,.,.,020302.,.,.,.,.,.,.,",
                        ".,01.,.,03.,.,02.,.,02.,.,.,.,.,",
                        ".,01.,03020D0D0D0D0F02.,0302.,.,",
                        ".,01.,03020D0D0D0D020203030302.,",
                        ".,010302.,0D0D0D0D0F.,03030302.,",
                        ".,0102.,.,0D0D0D0D0F.,03030302.,",
                        "010101.,.,.,010103.,.,.,030302.,",
                        ".,02.,.,.,030D0D0F02.,.,030302.,",
                        ".,.,.,.,.,030D0D0F02.,.,.,02.,.,",
                        ".,.,.,.,0302.,.,.,0202.,.,.,.,.,",
                        ".,.,.,.,0302.,.,.,0202.,.,.,.,.,",
                        ".,.,.,.,0302.,.,.,0202.,.,.,.,.,",
                        ".,.,.,.,0302.,.,.,0202.,.,.,.,.,",
            ],
        },
         mage: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,0A.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,0A0A0A.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,0A110A0A.,.,.,.,.,",
                        ".,.,.,.,.,.,0A0A11110A.,.,.,.,.,",
                        ".,.,.,.,.,040A1111110A.,.,.,.,.,",
                        ".,.,.,.,04110A0A111411.,11.,.,.,",
                        ".,.,.,.,1111.,040404111111.,.,.,",
                        ".,.,.,1111.,.,04040A.,11.,.,.,.,",
                        ".,.,.,11.,.,.,0A040A.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,04040A.,.,.,.,.,.,",
                        ".,.,.,.,.,.,040A0A040A.,.,.,.,.,",
                        ".,.,.,.,.,.,040A04040A.,.,.,.,.,",
                        ".,.,.,.,.,040A040404040A.,.,.,.,",
                        ".,.,.,.,.,040A0404040A0A.,.,.,.,",
                        ".,.,.,.,1111.,.,.,.,.,1111.,.,.,",
            ],
        },
        tree01: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,05.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,050B.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,05050B.,.,.,.,.,.,",
                        ".,.,.,.,.,.,050B050B.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,0505050B.,.,.,.,.,",
                        ".,.,.,.,.,.,05050505050B.,.,.,.,",
                        ".,.,.,.,.,0505050B050B.,.,.,.,.,",
                        ".,.,.,.,.,.,0505050B050B.,.,.,.,",
                        ".,.,.,.,.,0505050505050B.,.,.,.,",
                        ".,.,.,.,.,050B050B0505050B.,.,.,",
                        ".,.,.,.,0505050B050505050B.,.,.,",
                        ".,.,.,050B.,05.,050B.,.,050B.,.,",
                        ".,.,.,.,.,.,.,0F0F.,.,.,.,.,.,.,",
                        ".,.,.,.,.00,000F0F00.,.,.,.,.,.,",
                        ".,.,.,00000000000000000000.,.,.,",
            ],
        },
        brickRight: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,030303.,.,.,.,.,.,.,.,",
                        "03030303.,030303.,.,.,.,.,.,.,.,",
                        "03030303.,030303.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,030303.,.,.,.,.,.,.,.,",
                        "03030303.,030303.,.,.,.,.,.,.,.,",
                        "03030303.,030303.,.,.,.,.,.,.,.,",
           ],
        },
        brickWedgeTopLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,03",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,03.,030303",
                        ".,.,.,.,.,.,.,.,.,.,0303.,030303",
                        ".,.,.,.,.,.,.,.,.,030303.,030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,03.,03030303030303",
                        ".,.,.,.,.,.,0303.,03030303030303",
                        ".,.,.,.,.,030303.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,03.,03030303030303.,030303",
                        ".,.,0303.,03030303030303.,030303",
                        ".,030303.,03030303030303.,030303",
           ],
        },
        brickWedgeTopRight: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,0303.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,03.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,0303.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03.,.,.,.,.,.,",
                        ".,03030303030303.,0303.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,03030303030303.,.,.,.,",
                        "03030303.,03030303030303.,03.,.,",
                        "03030303.,03030303030303.,0303.,",
           ],
        },
        brickWedgeBottomLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,030303030303.,03030303030303",
                        ".,.,.,0303030303.,03030303030303",
                        ".,.,.,.,03030303.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,030303030303.,030303",
                        ".,.,.,.,.,.,.,0303030303.,030303",
                        ".,.,.,.,.,.,.,.,03030303.,030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,0303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,03030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,03",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
           ],
        },
        brickWedgeBottomRight: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,0303030303.,.,",
                        ".,03030303030303.,03030303.,.,.,",
                        ".,03030303030303.,030303.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,0303030303.,.,.,.,.,.,",
                        "03030303.,03030303.,.,.,.,.,.,.,",
                        "03030303.,030303.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,0303030303.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303.,.,.,.,.,.,.,.,.,.,..,,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
           ],
        },
        brickBattlementCenter: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
           ],
        },
        brickBattlementLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,03030303030303.,030303",
                        ".,.,.,.,.,03030303030303.,030303",
                        ".,.,.,.,.,03030303030303.,030303",
           ],
        },
        brickBattlementRight: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,030303.,030303.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,03030303030303.,.,.,.,",
                        "03030303.,03030303030303.,.,.,.,",
                        "03030303.,03030303030303.,.,.,.,",
           ],
        },
        brickCenter: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
           ],
        },
        brickCenterLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303.,03030303030303.,030303",
                        ".,030303.,03030303030303.,030303",
                        ".,030303.,03030303030303.,030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303.,03030303030303.,030303",
                        ".,030303.,03030303030303.,030303",
                        ".,030303.,03030303030303.,030303",
           ],
        },
         brickCenterWindow: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,030303030303.,.,.,030303030303",
                        ".,.,.,.,.,03.,.,.,.,.,03.,.,.,.,",
                        "03030303.,03.,.,.,.,.,03.,030303",
                        "03030303.,03.,.,.,.,.,03.,030303",
                        "03030303.,03.,.,.,.,.,03.,030303",
                        ".,.,.,.,.,03.,.,.,.,.,03.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
           ],
        },
        brickCenterDoor: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303030303030303030303030303",
                        ".,0303030F0F0F0F0F0F0F0F03030303",
                        ".,03030F0F0F0F0F.,0F0F0F0F0F0303",
                        ".,.,0F0F.,0F0F0F.,0F0F0F.,0F.,.,",
                        "03030F0F.,0F0F0F.,0F0F0F.,0F0303",
                        "03030202020202020202020202020303",
                        "03030F0F.,0F0F0F.,0F0F0F.,0F0303",
                        ".,.,0F0F.,0F0F0F.,0F0F0F.,0F.,.,",
                        ".,030202020F0F0F.,0F0F0F.,0F0303",
                        ".,030202020F0F0F.,0F0F0F.,0F0303",
                        ".,030F0F.,0F0F0F.,0F0F0F.,0F0303",
                        ".,.,0F0F.,0F0F0F.,0F0F0F.,0F.,.,",
                        "03030202020202020202020202020303",
                        "03030F0F.,0F0F0F.,0F0F0F.,0F0303",
                        "03030F0F.,0F0F0F.,0F0F0F.,0F0303",
           ],
        },
        brickCenterDoorway: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303030303030303030303030303",
                        ".,030303.,.,.,.,.,.,.,.,03030303",
                        ".,0303.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,0303",
           ],
        },
        brickLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,030303.,030303",
                        ".,.,.,.,.,.,.,.,.,030303.,030303",
                        ".,.,.,.,.,.,.,.,.,030303.,030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,030303.,030303",
                        ".,.,.,.,.,.,.,.,.,030303.,030303",
                        ".,.,.,.,.,.,.,.,.,030303.,030303",
          ],
        },
        brickTop: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303,.030303.,030303.,030303",
                        ".,030303,..,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
           ],
        },
        brickMid: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,.,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303,.030303.,030303",
                        ".,030303.,030303,.030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303,.030303.,030303.,030303",
                        ".,030303,..,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
           ],
        },
        brickMidWindow: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,0303.,.,.,0303.,.,.,.,",
                        ".,030303.,03.,.,.,.,.,03.,030303",
                        ".,030303.,03.,.,.,.,.,03.,030303",
                        ".,030303.,03.,.,.,.,.,03.,030303",
                        ".,.,.,.,.,03.,.,.,.,.,03.,030303",
                        ".,030303.,03.,.,.,.,.,03.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303,.030303.,030303.,030303",
                        ".,030303,..,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
           ],
        },
         brickMidDoor: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,0F0F0F0F0F0F0F.,030303",
                        ".,03030F0F0F0F0F.,0F0F0F0F030303",
                        ".,030F0F.,0F0F0F.,0F0F0F.,0F.,.,",
                        ".,030F0F.,0F0F0F.,0F0F0F.,0F0303",
                        ".,030F0F.,0F0F0F,.0F0F0F.,0F0303",
                        ".,030202020202020202020202020303",
                        ".,.,0F0F.,0F0F0F.,0F0F0F.,0F0303",
                        ".,030F0F.,0F0F0F.,0F0F0F.,0F0303",
                        ".,030202020F0F0F.,0F0F0F.,0F0303",
                        ".,030202020F0F0F.,0F0F0F.,0F0303",
                        ".,030F0F,.0F0F0F.,0F0F0F.,0F.,.,",
                        ".,030F0F.,0F0F0F.,0F0F0F.,0F0303",
                        ".,030202020202020202020202020303",
                        ".,030F0F.,0F0F0F.,0F0F0F.,0F0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
           ],
        },
          brickMidDoorway: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,.,.,.,.,.,.,.,.,030303",
                        ".,0303.,.,.,.,.,.,.,.,.,.,030303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,,..,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,,..,.,.,.,.,.,.,.,.,.,.,",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
           ],
        },
        brickBottom: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,.,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303,.030303.,030303",
                        ".,030303.,030303,.030303.,030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
           ],
        },
        brickTopLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,030303.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303.,03030303030303.,030303",
                        ".,030303.,03030303030303.,030303",
                        ".,.,.,.,.,03030303030303.,030303",
                        ".,030303.,030303.,.,.,.,.,.,.,.,",
                        ".,030303.,030303.,03030303030303",
                        ".,030303,.030303.,03030303030303",
                        ".,030303,.030303.,03030303030303",
                        ".,030303.,.,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
           ],
        },
        brickTopRight: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,030303",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
                        ".,.,.,.,.,.,.,.,.,030303.,.,.,.,",
                        ".,03030303030303.,030303.,030303",
                        ".,03030303030303.,030303.,030303",
                        ".,03030303030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
                        "03030303.,030303.,030303.,030303",
                        "03030303.,030303.,030303.,030303",
                        "03030303.,.,.,.,.,030303.,.,.,.,",
             ],
        },
        brickBottomLeft: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,.,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303,.03030303030303",
                        ".,030303.,030303,.03030303030303",
                        ".,030303.,030303.,03030303030303",
                        ".,.,.,.,.,030303.,.,.,.,.,.,.,.,",
                        ".,030303.,03030303030303.3030303",
                        ".,030303.,03030303030303.3030303",
                        ".,030303.,03030303030303.3030303",
                        ".,030303.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
                        ".,03030303030303.,03030303030303",
           ],
        },
        brickBottomRight: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,030303.,030303.,030303.,030303",
                        "03030303.,030303.,030303.,030303",
                        "03030303.,030303.,030303.,030303",
                        "03030303.,030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
                        ".,03030303030303,.030303.,030303",
                        ".,03030303030303,.030303.,030303",
                        ".,03030303030303,.030303.,030303",
                        ".,.,.,.,.,.,.,.,.,030303.,.,.,.,",
                        "0303030303030303.,030303.,030303",
                        "0303030303030303.,030303.,030303",
                        "0303030303030303.,030303.,030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,030303",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
                        "03030303.,03030303030303.,030303",
           ],
        },
    },

    "32x32": {
        empty: {
            image: null,   // Built when first instance is created
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
            ],
        },
    },

    palettes: [
        // For now, all palettes are the same: primary colors and full and half brightness.
        // Default palette
        // 0 = black
        // 1 = white
        // 2 = dk gray
        // 3 = lt gray
        // 4 = red
        // 5 = green
        // 6 = blue
        // 7 = yellow
        // 8 = cyan
        // 9 = purple
        // A = dk red
        // B = dk green
        // C = dk blue
        // D = orange
        // E = dk cyan
        // F = brown (dk orange)
        ["rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(64, 64, 64, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(128, 0, 128, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(255, 128, 0, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(96, 48, 0, 255)"],

         // Flesh Tones
        ["rgba(0, 0, 0, 0)", "rgba(192, 178, 128, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],

        ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 255)", "rgba(255, 255, 255, 255)", "rgba(128, 128, 128, 255)",
         "rgba(255, 0, 0, 255)", "rgba(0, 255, 0, 255)", "rgba(0, 0, 255, 0)", "rgba(255, 255, 0, 255)",
         "rgba(0, 255, 255, 255)", "rgba(255, 0, 255, 255)", "rgba(128, 0, 0, 255)", "rgba(0, 128, 0, 255)",
         "rgba(0, 0, 128, 255)", "rgba(128, 128, 0, 255)", "rgba(0, 128, 128, 255)", "rgba(128, 0, 128, 255)"],
    ]
};

// SOUND //////////////////////////////////////////////////////////////////////
jb.sound = {
    DEFAULT_FREQ: 440, // Hz
    DEFAULT_VOL: 1.0,
    DEFAULT_DUR: 0.25, // sec
    CHANNELS: {MONO: 1, STEREO: 2},
    WAVES_PER_NOISE: 17,

    audioContext: null,
    noiseFactor: 0.33,
    channels: 1,
    dummySound: { audioNode: null, play: function() {}, stop: function() {} },

    init: function() {
        try {
          window.AudioContext = window.AudioContext || window.webkitAudioContext;
          this.audioContext = new AudioContext();
        }
        catch(e) {
          alert('Web Audio API is not supported in this browser');
        }
    },

    makeSound: function(waveform, duration, volume, startFreq, endFreq) {
        volume = volume || this.DEFAULT_VOL;
        duration = duration || this.DEFAULT_DUR;
        startFreq = startFreq || this.DEFAULT_FREQ;
        endFreq = endFreq || startFreq;

        return this.audioContext ? this.newSoundFromBuffer(this.getBuffer(waveform, startFreq, endFreq, volume, duration), duration) : this.dummySound;
    },

    waveFns: {
        sine: function(f, t, s) {
            var p = 2.0 * Math.PI * t * f;

            return Math.sin(p);
        },

        saw: function(f, t, s) {
            var p = t * f;
            p = p - Math.floor(p);

            return 2.0 * (p - 0.5);
        },

        square: function(f, t, s) {
            var p = t * f;
            p = p - Math.floor(p);

            return p < 0.5 ? 1.0 : -1.0;
        },

        noisySine: function(f, t, s) {
            return jb.sound.waveFns.sine(f, Math.abs(t + (Math.random() - 0.5) * jb.sound.noiseFactor / f), s);
        },

        noisySaw: function(f, t, s) {
            return jb.sound.waveFns.saw(f, Math.abs(t + (Math.random() - 0.5) * jb.sound.noiseFactor / f), s);
        },

        noisySquare: function(f, t, s) {
            return jb.sound.waveFns.square(f, Math.abs(t + (Math.random() - 0.5) * jb.sound.noiseFactor / f), s);
        },

        noise: function(f, t, s) {
            return 2.0 * (0.5 - Math.random());
        },
    },

    getBuffer: function(waveform, startFreq, endFreq, vol, dur) {
        var nSamples = Math.round(dur * this.audioContext.sampleRate),
            buffer = this.audioContext.createBuffer(this.channels, nSamples, this.audioContext.sampleRate),
            t = 0,
            freq = 0,
            waveFn = this.waveFns[waveform] || this.waveFns["sine"],
            iChannel = 0,
            iSample = 0,
            bPinkNoise = waveform.toUpperCase() === "PINKNOISE",
            iPhase = 0,
            iWave = 0,
            maxAmp = 0,
            numWaves = 0,
            iSamplesPerWave = 0,
            samples = null;

        for (iChannel = 0; iChannel < this.channels; ++iChannel) {
            samples = buffer.getChannelData(iChannel);

            if (bPinkNoise) {
                // Generate noise in the given frequency band by piecing together
                // square waves of random frequencies from within the band.
                numWaves = Math.min(Math.floor((endFreq - startFreq) * 0.33), jb.sound.WAVES_PER_NOISE);

                for (iWave = 0; iWave <= numWaves; ++iWave) {
                    freq = Math.round(startFreq + (endFreq - startFreq) * iWave / numWaves);
                    iSamplesPerWave = Math.floor(this.audioContext.sampleRate / freq);
                    iPhase = Math.floor(Math.random() * iSamplesPerWave);

                    freq = Math.sqrt(freq);
                    for (iSample = 0; iSample < nSamples; ++iSample) {
                        if ((iSample + iPhase) % iSamplesPerWave < iSamplesPerWave / 2) {
                            samples[iSample] += 1.0 / freq;
                        }
                        else {
                            samples[iSample] += -1.0 / freq;
                        }

                        if (Math.abs(samples[iSample]) > maxAmp) {
                            maxAmp = Math.abs(samples[iSample]);
                        }
                    }
                }
            }
            else {
                for (iSample = 0; iSample < nSamples; ++iSample) {
                    t = iSample / this.audioContext.sampleRate;
                    freq = startFreq + (endFreq - startFreq) * t / dur;
                    samples[iSample] = waveFn(freq, t, iSample);

                    if (Math.abs(samples[iSample]) > maxAmp) {
                        maxAmp = Math.abs(samples[iSample]);
                    }
                }
            }


            // Normalize and apply volume.
            for (iSample = 0; iSample < nSamples; ++iSample) {
                samples[iSample] = samples[iSample] / maxAmp * Math.min(1.0, vol);
            }

            // Ramp up the opening samples.
            samples[0] = 0.0;
            samples[1] *= 0.333;
            samples[2] *= 0.667;

            // Ramp down the closing samples.
            samples[nSamples - 1] = 0.0;
            samples[nSamples - 2] *= 0.333;
            samples[nSamples - 3] *= 0.667;
        }

        return buffer;
    },

    newSoundFromBuffer: function(buffer, duration) {
        var self = this;

        return {
                duration: duration,
                node: null,
                play: function() {
                    this.node = self.audioContext.createBufferSource();
                    this.node.buffer = buffer;
                    this.node.onEnded = function() {
                        this.node.disconnect(jb.sound.audioContext.destination);
                        this.node = null;
                    }
                    this.node.connect(jb.sound.audioContext.destination);
                    this.node.start(0);
                },
                stop: function() {
                    if (this.node) {
                        this.node.stop();
                    }
                    this.node = null;
                }
            };
    }
};

jb.sound.init();

jb.program = {
    defaultRoutine: function() {
        jb.setBackColor("black");
        jb.setForeColor("red");
        jb.print("No program defined!");
        jb.setForeColor("gray");
    }
};

// Start the game!
window.onload = function() {
    jb.run(jb.program);
};
