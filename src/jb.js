// Define the jb objects
jb = {
    EPSILON: 0.001,
    execStack: [],
    assert: function(test, msg) {
        if (!test) {
            console.log(msg);
            debugger;
        }
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ooooooooo.   oooooooooooo  .oooooo.o   .oooooo.   ooooo     ooo ooooooooo.     .oooooo.   oooooooooooo  .oooooo.o 
// `888   `Y88. `888'     `8 d8P'    `Y8  d8P'  `Y8b  `888'     `8' `888   `Y88.  d8P'  `Y8b  `888'     `8 d8P'    `Y8 
//  888   .d88'  888         Y88bo.      888      888  888       8   888   .d88' 888           888         Y88bo.      
//  888ooo88P'   888oooo8     `"Y8888o.  888      888  888       8   888ooo88P'  888           888oooo8     `"Y8888o.  
//  888`88b.     888    "         `"Y88b 888      888  888       8   888`88b.    888           888    "         `"Y88b 
//  888  `88b.   888       o oo     .d8P `88b    d88'  `88.    .8'   888  `88b.  `88b    ooo   888       o oo     .d8P 
// o888o  o888o o888ooooood8 8""88888P'   `Y8bood8P'     `YbodP'    o888o  o888o  `Y8bood8P'  o888ooooood8 8""88888P'  
// Resources /////////////////////////////////////////////////////////////////////////////////////////////////////////
resources = {
  resourcesPending: 0,
  resourcesLoaded: 0,
  resourcesRequested: 0,
  bResourceLoadSuccessful: true,

  incPendingCount: function() {
    resources.resourcesPending += 1;
    resources.resourcesRequested += 1;
  },

  incLoadedCount: function(bLoadSuccessful) {
    resources.resourcesLoaded += 1;
    resources.resourcesPending -= 1;

    resources.bResourceLoadSuccessful &= bLoadSuccessful;
  },

  getLoadProgress: function() {
    var completion = resources.resourcesRequested > 0 ? resources.resourcesLoaded / resources.resourcesRequested : 1.0;

    if (!resources.bResourceLoadSuccessful) {
      completion *= -1.0;
    }

    return completion;
  },

  getLoadedCount: function() {
    return resources.resourcesLoaded;
  },

  loadComplete: function() {
    return resources.resourcesPending === 0 && resources.resourcesLoaded === resources.resourcesRequested;
  },

  loadSuccessful: function() {
    return resources.bResourceLoadSuccessful;
  },

  loadImage: function(imageURL, imagePath) {
    var image = new Image(),
        fullURL = (imagePath || "./res/images/") + imageURL;

    resources.incPendingCount();
  
    image.onload = function() {
      resources.incLoadedCount(true);
    }
    
    image.onerror = function() {
      resources.incLoadedCount(false);
    }
  
    image.src = fullURL;
  
    return image;
  },
  
  loadSound: function(soundURL, resourcePath, nChannels, repeatDelaySec) {
    var path = resourcePath || "./res/sounds/";

    soundURL = path + soundURL;

    resources.incPendingCount();

    return jb.sound.load(soundURL,
        function() {
          resources.incLoadedCount(true);
        },
        function() {
          resources.incLoadedCount(false);
        },
        nChannels, repeatDelaySec);
  },
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// oooooooooo.  ooooo        ooooo     ooo oooooooooooo ooooooooo.   ooooooooo.   ooooo ooooo      ooo ooooooooooooo  .oooooo.o 
// `888'   `Y8b `888'        `888'     `8' `888'     `8 `888   `Y88. `888   `Y88. `888' `888b.     `8' 8'   888   `8 d8P'    `Y8 
//  888     888  888          888       8   888          888   .d88'  888   .d88'  888   8 `88b.    8       888      Y88bo.      
//  888oooo888'  888          888       8   888oooo8     888ooo88P'   888ooo88P'   888   8   `88b.  8       888       `"Y8888o.  
//  888    `88b  888          888       8   888    "     888          888`88b.     888   8     `88b.8       888           `"Y88b 
//  888    .88P  888       o  `88.    .8'   888       o  888          888  `88b.   888   8       `888       888      oo     .d8P 
// o888bood8P'  o888ooooood8    `YbodP'    o888ooooood8 o888o        o888o  o888o o888o o8o        `8      o888o     8""88888P'  
// Blueprints //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Usage:
//
// Define a new blueprint:
// blueprints.draft(
//   "testKnight",
//
//   // Data
//   {
//     ...
//   },
//
//   // Actions
//   {
//     ...
//   },
// );
//
// Extend an existing blueprint with components:
// blueprints.make("testKnight", "touchable")
//
// Instantiate an object from a blueprint:
// blueprints.build("testKnight");
//
blueprints = {
    mixins: {},

    make: function(blueprint, extension) {
        var key = null,
            bpData = blueprints[blueprint],
            mixin = blueprints.mixins[extension],
            proto = bpData ? bpData.proto : null;

        if (bpData && mixin && proto) {
            for (key in mixin) {
                if (key.indexOf(extension) >= 0) {
                    proto[key] = mixin[key];
                }
            }

            proto._components.push(extension);
        }
    },

    draft: function(name, dataObj, classObj) {
        var args = Array.prototype.slice.call(arguments),
            propObj = {},
            key = null;

        if (!blueprints[name]) {
            classObj._components = [];
            classObj.destroy = function() {
                var i = 0;

                for (i=0; i<this._components.length; ++i) {
                    blueprints.mixins[this._components[i]].destroy(this);
                }
            }

            for (key in dataObj) {
                propObj[key] = {value: dataObj[key], writable: true, enumerable: true, configurable: true};
            }

            blueprints[name] = {data: propObj, proto: classObj};
        }
    },

    build: function(name) {
        var instance = null,
            template = blueprints[name],
            i = 0,
            mixin = null,
            args = [];

        if (template) {
            // Build argument list.
            for (i=1; i<arguments.length; ++i) {
              args.push(arguments[i]);
            }

            instance = Object.create(template.proto, JSON.parse(JSON.stringify(template.data)));

            for (i=0; i<template.proto._components.length; ++i) {
                mixin = blueprints.mixins[template.proto._components[i]];
                if (mixin) {
                    mixin.spawn(instance);
                }
            }

            if (instance.onCreate) {
                instance.onCreate.apply(instance, args);
            }
        }

        return instance;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   .oooooo.     .oooooo.   ooo        ooooo ooooooooo.     .oooooo.   ooooo      ooo oooooooooooo ooooo      ooo ooooooooooooo  .oooooo.o 
//  d8P'  `Y8b   d8P'  `Y8b  `88.       .888' `888   `Y88.  d8P'  `Y8b  `888b.     `8' `888'     `8 `888b.     `8' 8'   888   `8 d8P'    `Y8 
// 888          888      888  888b     d'888   888   .d88' 888      888  8 `88b.    8   888          8 `88b.    8       888      Y88bo.      
// 888          888      888  8 Y88. .P  888   888ooo88P'  888      888  8   `88b.  8   888oooo8     8   `88b.  8       888       `"Y8888o.  
// 888          888      888  8  `888'   888   888         888      888  8     `88b.8   888    "     8     `88b.8       888           `"Y88b 
// `88b    ooo  `88b    d88'  8    Y     888   888         `88b    d88'  8       `888   888       o  8       `888       888      oo     .d8P 
//  `Y8bood8P'   `Y8bood8P'  o8o        o888o o888o         `Y8bood8P'  o8o        `8  o888ooooood8 o8o        `8      o888o     8""88888P'  
// Components //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// All components must define 'spawn', and 'destroy' functions in order
// to be correctly added/removed by the 'blueprint' object.

///////////////////////////////////////////////////////////////////////////////
// State Machines
///////////////////////////////////////////////////////////////////////////////
jb.stateMachines = {
  machines: [],
  updating: [],
  toAdd: [],
  toRemove: [],

  addMachine: function(machine) {
    if (this.machines.indexOf(machine) < 0) {
      this.machines.push(machine);
    }
  },

  removeMachine: function(machine) {
    jb.removeFromArray(this.machines, machine);
    jb.removeFromArray(this.updating, machine, true);
  },

  transitionTo: function(that, state) {
    var bWantsUpdate = false,
        bTransitioned = false;

    that.smNextState = null;

    if (state && state !== that.smCurrentState) {
      // Exit current state.
      if (that.smCurrentState && that.smCurrentState.exit) {
        that.smCurrentState.exit.call(that);
      }

      that.smCurrentState = state;

      if (that.smCurrentState) {      
        if (that.smCurrentState.enter) {
          that.smCurrentState.enter.call(that);
        }

        bWantsUpdate = true;
      }

      bTransitioned = true;
    }
    else if (state === null) {
      that.smCurrentState = null;
    }

    return bTransitioned;
  },

  update: function() {
    var i = 0,
        that = null;

    if (this.toAdd.length) {
      for (i=0; i<this.toAdd.length; ++i) {
        that = this.toAdd[i];
        jb.assert(that.smNextState, "Starting state machine has to starting state!");
        jb.assert(!that.smCurrentState, "Starting state machine has existing state!");

        that.smCurrentState = that.smNextState;

        if (that.smNextState.enter) {
          that.smNextState.enter.call(that);
        }

        this.updating.push(this.toAdd[i]);
      }
      this.toAdd.length = 0;
    }

    for (i=0; i<this.updating.length; ++i) {
      that = this.updating[i];

      if (that.smNextState && that.smNextState !== that.smCurrentState) {
        if (that.smCurrentState.exit) {
          that.smCurrentState.exit.call(that);
        }

        that.smCurrentState = that.smNextState;
        that.smNextState = null;
      }

      if (that.smCurrentState) {
        that.smAllowStateChange = true;

        if (that.smCurrentState.update) {
          that.smCurrentState.update.call(that, jb.time.deltaTime);

          if (that.smNextState && that.smNextState !== that.smCurrentState) {
            if (that.smCurrentState.exit) {
              that.smCurrentState.exit.call(that);
            }

            if (that.smNextState.enter) {
              that.smNextState.enter.call(that);
            }

            that.smCurrentState = that.smNextState;
            that.smNextState = null;
          }
        }
        else {
          // No update state, so force a stop.
          that.stateMachineStop();
        }

        that.smAllowStateChange = false;
      }
    }

    if (this.toRemove.length) {
      for (i=0; i<this.toRemove.length; ++i) {
        that = this.toRemove[i];
        jb.assert(that.smCurrentState, "Stopping state machine has no state!");

        if (that.smCurrentState.exit) {
          that.smCurrentState.exit.call(that);
        }

        that.smCurrentState = null;

        jb.removeFromArray(jb.stateMachines.updating, that, true);
      }
      this.toRemove.length = 0;
    }
  },

  // Blueprint Interface //////////////////////////////////////////////////////
  spawn: function(instance) {
    if (!instance.smCurrentState) {
      instance.smCurrentState = null;
    }

    if (!instance.smNextState) {
      instance.smNextState = null;
    }

    if (!instance.smAllowStateChange) {
      instance.smAllowStateChange = false;
    }

    this.addMachine(instance);
  },

  destroy: function(instance) {
    this.removeMachine(instance);
  },

  // Mixins ///////////////////////////////////////////////////////////////////
  stateMachineStart: function(state) {
    jb.assert(!this.smCurrentState, "State machine already started!");
    jb.assert(jb.stateMachines.updating.indexOf(this) < 0, "State machine already in update list!");

    this.smAllowStateChange = true;
    this.stateMachineSetNextState(state);
    this.smAllowStateChange = false;

    if (jb.stateMachines.toAdd.indexOf(this) < 0) {
      jb.stateMachines.toAdd.push(this);
    }
  },

  stateMachineSetNextState: function(nextState) {
    jb.assert(this.smAllowStateChange, "Illegal state change in state machine!");

    if (this.smCurrentState != nextState) {
      this.smNextState = nextState;
    }
  },

  stateMachineIsInState: function(testState) {
    return testState === this.smCurrentState;
  },

  stateMachineStop: function() {
    jb.assert(this.smCurrentState, "State machine already stopped");
    jb.assert(jb.stateMachines.updating.indexOf(this) >= 0, "State machine not in update list!");

    if (jb.stateMachines.toRemove.indexOf(this) < 0) {
      jb.stateMachines.toRemove.push(this);
    }
  }
};

blueprints.mixins["stateMachine"] = jb.stateMachines;

///////////////////////////////////////////////////////////////////////////////
// Sprites
///////////////////////////////////////////////////////////////////////////////
// Sprites are (possibly) animated images that reference image resources.
// Usage (deprecated):
// jb.sprites.create(spriteSheet, x, y, [states], [startState], [anchorX], [anchorY]);
// Where spriteSheet is a spriteSheet reference,
//   anchorX and anchorY are floating point offsets for the sprite's origin
//   states is an object containing arrays of frame indeces into the source
//     spriteSheet, for example:
//     {
//       idle:[0],
//       run: [1, 2]
//     }
jb.sprites = {
  sheets: {},
  allSprites: [],

  addSheet: function(name, srcImg, left, top, rows, cols, cellDx, cellDy) {
    var sheet = null;

    if (this.sheets[name]) {
      sheet = this.sheets[name];
    }
    else {
      // Add the sheet.
      sheet = new jb.tileSheetObj(srcImg, top, left, rows, cols, cellDx, cellDy);
      this.sheets[name] = sheet;
    }

    return sheet;
  },

  createState: function(frames, frameDt, bReset, events) {
    return {frames: frames || null,
            frameDt: frameDt || 0,
            bReset: bReset || true,
            frameIndex: 0,
            events: events || null};
  },

  makeInstance: function(instance) {
    if (!instance.bounds) {
      instance.bounds = new jb.bounds(0, 0, 0, 0);
    }

    if (!instance.alpha) {
      instance.alpha = 1.0;
    }

    instance.spriteInfo = {
      sheet: null,
      states: {},
      frameTime: 0.0,
      anchor: {x: 0.0, y: 0.0},
      state: null,
      scale: {x: 1.0, y: 1.0},
      bVisible: true
    };
  },

  // Blueprint Interface //////////////////////////////////////////////////////
  spawn: function(instance) {
    jb.sprites.makeInstance(instance);
    this.allSprites.push(instance);
  },

  destroy: function(instance) {
    jb.removeFromArray(this.allSprites, instance);
  },

  // Mixins ///////////////////////////////////////////////////////////////////
  spriteSetSheet: function(newSheet) {
    this.spriteInfo.sheet = jb.sprites.sheets[newSheet];

    if (this.spriteInfo.sheet) {
      this.bounds.resizeTo(this.spriteInfo.sheet.cellDx, this.spriteInfo.sheet.cellDy);
    }
  },

  spriteAddStates: function(stateObj) {
    var key = null;

    for (key in stateObj) {
      this.spriteInfo.states[key] = stateObj[key];
    }
  },

  spriteHide: function() {
    this.spriteInfo.bVisible = false;
  },

  spriteShow: function() {
    this.spriteInfo.bVisible = true;
  },

  spriteSetAnchor: function(x, y) {
    this.spriteInfo.anchor.x = x;
    this.spriteInfo.anchor.y = y;
  },

  spriteSetScale: function(sx, sy) {
    this.spriteInfo.scale.x = sx || 1.0;
    this.spriteInfo.scale.y = sy || 1.0;
  },

  spriteAddState: function(newStateName, newState) {
    if (newStateName && newState) {
      this.spriteInfo.states[newStateName] = newState;
      this.spriteInfo.state = newState;
    }
  },

  spriteMoveTo: function(x, y) {
    this.bounds.l = Math.round(x - this.spriteInfo.anchor.x * this.bounds.w);
    this.bounds.t = Math.round(y - this.spriteInfo.anchor.y * this.bounds.h);
  },

  spriteMoveBy: function(dx, dy) {
    this.bounds.l += dx;
    this.bounds.t += dy;
  },

  spriteSetState: function(newState) {
    var param = 0,
        curState = this.spriteInfo.state,
        newState = this.spriteInfo.states[newState];

    if (newState) {
      // If no state is currently defined, use the new state.
      if (!curState) {
        this.spriteInfo.state = newState;
      }

      if (newState === curState || newState.bReset || !curState) {
        // If we're resetting, or re-entering, or didn't have a previous state,
        // initialize to the start of the state.
        this.spriteInfo.state.frameIndex = 0;
        this.spriteInfo.frameTime = 0.0;
        this.spriteInfo.lastFrame = -1;
      }
      else if (newState) {
        // Figure out where we are in the frames of the
        // current state and advance that far into the
        // frames of the new state.
        newState.frameIndex = Math.floor(curState.frameIndex / curState.frames.length * newState.frames.length);
        this.spriteInfo.frameTime = this.spriteInfo.frameTime * newState.frameDt / curState.frameDt;
        newState.frameIndex = curState.frameIndex;
        this.spriteInfo.lastFrame = newState.frameIndex - 1;
      }
    }

    this.spriteInfo.state = newState;
  },

  spriteResetTimer: function() {
    this.spriteInfo.frameTime = 0.0;
    this.spriteInfo.lastFrame = -1;
  },

  spriteSetAlpha: function(newAlpha) {
    this.alpha = Math.max(0.0, newAlpha);
    this.alpha = Math.min(newAlpha, 1.0);
  },

  spriteUpdate: function(dt) {
    var curState = this.spriteInfo.state,
        framesPassed = 0;

    if (curState) {
      if (curState.frameDt > 0.0) {
        this.spriteInfo.frameTime += dt;

        while (this.spriteInfo.frameTime >= curState.frameDt) {
          this.spriteInfo.frameTime -= curState.frameDt;
          curState.frameIndex += 1;
          curState.frameIndex %= curState.frames.length;

          if (curState.events && curState.events[curState.frameIndex] && curState.lastFrame !== curState.frameIndex) {
            curState.events[curState.frameIndex](this);
          }

          curState.lastFrame = curState.frameIndex;
        }
      }
    }
  },

  spriteDraw: function(ctxt) {
    var destX = 0,
        destY = 0,
        centerX = 0,
        centerY = 0,
        anchorX = this.spriteInfo.anchor.x,
        anchorY = this.spriteInfo.anchor.y,
        frameInfo = null,
        bWantsScale = this.spriteInfo.scale.x !== 1 || this.spriteInfo.scale.y !== 1,
        bWantsRestore = bWantsScale || this.alpha !== ctxt.globalAlpha,
        curState = this.spriteInfo.state,
        dx = 0,
        dy = 0;

    if (this.spriteInfo.bVisible && curState && curState.frames.length > curState.frameIndex && this.spriteInfo.sheet && this.alpha > 0.0) {
      centerX = Math.round((this.bounds.l + this.bounds.halfWidth) / this.spriteInfo.scale.x);
      centerY = Math.round((this.bounds.t + this.bounds.halfHeight) / this.spriteInfo.scale.y);

      destX = centerX - this.bounds.halfWidth;
      destY = centerY - this.bounds.halfHeight;

      if (bWantsRestore) {
        ctxt.save();
      }

      if (bWantsScale) {
        ctxt.scale(this.spriteInfo.scale.x, this.spriteInfo.scale.y);
      }

      ctxt.globalAlpha = this.alpha;

      if (typeof curState.frames[curState.frameIndex] === "number") {
        // Assume frame format of single number is 1D index into frames.
        this.spriteInfo.sheet.draw(ctxt, destX, destY, curState.frames[curState.frameIndex]);
      }
      else {
        // Assume frame format of ordered pair, {rows, cols}, into frames.
        frameInfo = curState.frames[curState.frameIndex];
        this.spriteInfo.sheet.draw(ctxt, destX, destY, frameInfo.row, frameInfo.col);
      }

      // DEBUG
      // ctxt.beginPath();
      // ctxt.fillStyle = "red";
      // ctxt.fillRect(centerX - 2, centerY - 2, 4, 4);
      // ctxt.fillStyle = "blue";
      // ctxt.fillRect(destX - 2, destY - 2, 4, 4);
      // ctxt.closePath();
      // ctxt.stroke();

      if (bWantsRestore) {
        ctxt.restore();
      }
    }
  }
};

blueprints.mixins["sprite"] = jb.sprites;

///////////////////////////////////////////////////////////////////////////////
// Transitions ----------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////
jb.transitions = {
  // Blueprint Interface //////////////////////////////////////////////////////
  transitioners: [],

  spawn: function(instance) {
    jb.transitions.makeInstance(instance);
    this.transitioners.push(instance);
  },

  destroy: function(instance) {
    jb.removeFromArray(this.transitioners, instance);
  },

  // 'Transitions' Interface //////////////////////////////////////////////////
  makeInstance: function(instance) {
    if (typeof instance.transitions === "undefined") {
      instance.transitions = [];
    }

    if (typeof instance.transitionStates === "undefined") {
      instance.transitionStates = {};
    }
  },

  transitionState: function(tStart, tEnd, tNow, duration, fnUpdate, fnFinalize) {
    this.reset = function(tStart, tEnd, tNow, duration, fnUpdate, fnFinalize) {
      this.tStart = tStart;
      this.tEnd = tEnd;
      this.tNow = tNow;
      this.duration = Math.max(duration, 1);
      this.update = fnUpdate;
      this.finalize = fnFinalize;
      this.bActive = false;
    }
  },

  update: function() {
    var iTransitioner = 0,
        param = 0,
        transitioner = null;

    for (iTransitioner=0; iTransitioner<this.transitioners.length; ++iTransitioner) {
      transitioner = this.transitioners[iTransitioner];
      if (transitioner !== null) {
        transitioner.transitionerUpdate.apply(transitioner);
      }
    }
  },

  isTransitioning: function() {
    var i = 0,
        bTransitioning = false;

    for (i=0; i<this.transitioners.length; ++i) {
      if (this.transitioners[i] && this.transitioners[i].transitionerCountActiveTransitions() > 0) {
        bTransitioning = true;
        break;
      }
    }

    return bTransitioning;
  },

  // Mixins -------------------------------------------------------------------
  // All mixins must start with the prefix 'transitions' in order to be added
  // to the instance's prototype.

  bDoUpdate: true,  // DEBUG: set to 'false' to disable update look. Useful for debugging infinite loops.

  transitionerUpdate: function() {
    var param = 0,
        dt = jb.time.deltaTimeMS,
        timeUsed = 0,
        curState = this.transitions[0];

    while (jb.transitions.bDoUpdate && dt > 0 && this.transitions.length > 0 && curState) {
      curState.bActive = true;
      timeUsed = Math.min(dt, curState.tEnd - curState.tNow);
      dt -= timeUsed;
      curState.tNow += timeUsed;
      param = Math.min(1.0, (curState.tNow - curState.tStart) / curState.duration);

      curState.update(param);

      if (Math.abs(param - 1.0) < jb.EPSILON) {
        this.transitionerFinalizeCurrent();
      }

      curState = this.transitions[0];
    }
  },

  transitionerCountActiveTransitions: function() {
    return this.transitions.length;
  },

  transitionerParamToEaseInOut: function(param) {
    var easedParam = (1.0 + Math.sin(-Math.PI * 0.5 + Math.PI * param)) * 0.5;
    return easedParam * easedParam;
  },

  transitionerAdd: function(name, duration, fnUpdate, fnFinalize, bReset) {
    var newTransition = null,
        tStart = 0,
        curParam = 0;

    duration *= 1000;

    // See if this transition state already exists for us.    
    newTransition = this.transitionStates[name];

    if (!newTransition) {
      // No previous
      newTransition = new jb.transitions.transitionState()
      bReset = true;
    }

    if (!newTransition.bActive || bReset) {
      // Old transition finished or we're resetting it.
      newTransition.reset(jb.time.now, jb.time.now + duration, jb.time.now, duration, fnUpdate.bind(this), fnFinalize.bind(this));
    }
    else {
      // Old transition exists and is still active.
      // Figure out where we should start the new transition. If we're
      // already tracking a transitionState of this type, we should
      // start where the last one left off.
      curParam = (newTransition.tNow - newTransition.tStart) / newTransition.duration;
      newTransition.tEnd = newTransition.tNow + (1 - curParam) * duration;
      newTransition.reset(newTransition.tNow - curParam * duration, newTransition.tEnd, newTransition.tNow, duration, update.bind(this), finalize.bind(this));
    }

    this.transitions.push(newTransition);
    this.transitionStates[name] = newTransition;
  },

  transitionerFinalizeCurrent: function() {
    if (this.transitions[0]) {
      this.transitions[0].finalize();
      this.transitions[0].bActive = false;
      this.transitionStates[this.transitions[0].name] = null;
      this.transitions.shift();
    }
  },

  transitionerFinalizeAll: function() {
    var i = 0;

    while (this.transitions.length) {
      this.transitionerFinalizeCurrent();
    }
  }
};

blueprints.mixins["transitioner"] = jb.transitions;

///////////////////////////////////////////////////////////////////////////////
// Touchables -----------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////
jb.touchables = {
    // Blueprint Interface ////////////////////////////////////////////////////
    spawn: function(instance) {
        var i = 0,
            bInserted = false;

        jb.touchables.makeInstance(instance);
        jb.touchables.instances.unshift(instance);
    },

    destroy: function(instance) {
        var index = jb.touchables.instances.indexOf(instance);

        // Remove the instance from the instances array.
        // TODO: replace 'splice' with an optimizable function.
        if (index >= 0) {
            jb.touchables.instances.splice(index, 1);
        }
    },

    // 'Touchables' Implementation ////////////////////////////////////////////
    instances: [],

    makeInstance: function(instance) {
        if (!instance.bounds) {
            instance.bounds = new jb.bounds(0, 0, 0, 0);
        }

        if (!instance.touchLayer) {
            instance.touchLayer = 0;
        }

        if (!instance.onTouchedFn) {
          instance.onTouchedFn = null;
        }
    },

    getTouched: function(screenX, screenY) {
        var i,
            touched = null,
            x = jb.screenToWorldX(screenX),
            y = jb.screenToWorldY(screenY);

        for (i=jb.touchables.instances.length - 1; i>=0; --i) {
            if (jb.touchables.instances[i].bounds.contain(x, y)) {
                touched = jb.touchables.instances[i];
                if (touched.onTouchedFn) {
                  touched.onTouchedFn.call(touched, screenX, screenY);
                }
                break;
            }
        }

        return touched;
    },

    // Mixins ---------------------------------------------
    // All "mixin" functions must start with the prefix
    // "touchable" in order to flag their inclusion into
    // the specified prototypes.
    // e.g.:
    //     touchableGetLayer: function() { .. },
    touchableSetLayer: function(newLayer) {
      if (jb.touchables.instances.indexOf(this) >= 0) {
        jb.removeFromArray(jb.touchables.instances, this, true);
      }

      this.touchLayer = Math.max(0, newLayer);

      for (i=0; i<jb.touchables.instances.length; ++i) {
          if (instance.touchLayer <= jb.touchables.instances[i].touchLayer) {
              // Insert the instance at this point.
              // TODO: replace 'splice' with an optimizable function.                
              jb.touchables.splice(i, 0, instance);
              bInserted = true;
              break;
          }
      }

      if (!bInserted) {
          jb.touchables.instances.push(instance);
      }
    }
};

blueprints.mixins["touchable"] = jb.touchables;

///////////////////////////////////////////////////////////////////////////////
// Swipeables -----------------------------------------------------------------
///////////////////////////////////////////////////////////////////////////////
jb.swipeables = {
    // Blueprint Interface ////////////////////////////////////////////////////
    spawn: function(instance) {
        var i = 0,
            bInserted = false;

        jb.swipeables.makeInstance(instance);

        if (!bInserted) {
            jb.swipeables.instances.push(instance);
        }
    },

    destroy: function(instance) {
        var index = jb.swipeables.instances.indexOf(instance);

        // Remove the instance from the instances array.
        // TODO: replace 'splice' with an optimizable function.
        if (index >= 0) {
            jb.swipeables.instances.splice(index, 1);
        }
    },

    // 'Swipeables' Implementation ////////////////////////////////////////////
    instances: [],

    makeInstance: function(instance) {
        if (!instance.bounds) {
            instance.bounds = new jb.bounds(0, 0, 0, 0);
        }

        instance.touchLayer = 0;
        instance.swipeableActive = true;

        if (!instance.onTouchedFn) {
          instance.onTouchedFn = null;
        }
    },

    getSwiped: function() {
        var i,
            swiped = null,
            sx = jb.screenToWorldX(jb.swipe.lastX),
            sy = jb.screenToWorldY(jb.swipe.lastY),
            ex = jb.screenToWorldX(jb.swipe.endX),
            ey = jb.screenToWorldY(jb.swipe.endY);

        jb.swipe.allSwiped.length = 0;

        for (i=jb.swipeables.instances.length - 1; i>=0; --i) {
            if (jb.swipeables.instances[i].swipeableActive && (jb.swipeables.instances[i].bounds.intersectLine(sx, sy, ex, ey))) {
              swiped = jb.swipeables.instances[i];

              jb.swipe.allSwiped.push(swiped);

              if (jb.swipe.swiped.indexOf(swiped) < 0) {
                jb.swipe.swiped.push(swiped);

                if (swiped.onSwiped) {
                  swiped.onSwiped.call(swiped);
                }
              }
            }
        }
    },

    // Mixins ---------------------------------------------
    // All "mixin" functions must start with the prefix
    // "swipeable" in order to flag their inclusion into
    // the specified prototypes.
    // e.g.:
    //     swipeableGetLayer: function() { .. },
    swipeableSetLayer: function(newLayer) {
      if (jb.swipeables.instances.indexOf(this) >= 0) {
        jb.removeFromArray(jb.swipeables.instances, this, true);
      }

      this.swipeLayer = Math.max(0, newLayer);

      for (i=0; i<jb.swipeables.instances.length; ++i) {
          if (instance.swipeLayer <= jb.swipeables.instances[i].swipeLayer) {
              // Insert the instance at this point.
              // TODO: replace 'splice' with an optimizable function.                
              jb.swipeables.splice(i, 0, instance);
              bInserted = true;
              break;
          }
      }

      if (!bInserted) {
          jb.swipeables.instances.push(instance);
      }
    }
};

blueprints.mixins["swipeable"] = jb.swipeables;

/////////////////////////////////////////////////////////////////////////////////////////////
// ooooo   ooooo oooooooooooo ooooo        ooooooooo.   oooooooooooo ooooooooo.    .oooooo.o 
// `888'   `888' `888'     `8 `888'        `888   `Y88. `888'     `8 `888   `Y88. d8P'    `Y8 
//  888     888   888          888          888   .d88'  888          888   .d88' Y88bo.      
//  888ooooo888   888oooo8     888          888ooo88P'   888oooo8     888ooo88P'   `"Y8888o.  
//  888     888   888    "     888          888          888    "     888`88b.         `"Y88b 
//  888     888   888       o  888       o  888          888       o  888  `88b.  oo     .d8P 
// o888o   o888o o888ooooood8 o888ooooood8 o888o        o888ooooood8 o888o  o888o 8""88888P'  
// Helpers //////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// tileSheet Object
///////////////////////////////////////////////////////////////////////////////
jb.tileSheetObj = function(source, top, left, rows, cols, cellDx, cellDy) {
  this.source = source;
  this.top = top;
  this.left = left;
  this.rows = rows;
  this.cols = cols;
  this.cellDx = cellDx;
  this.cellDy = cellDy;
};

jb.tileSheetObj.prototype.draw = function(ctxt, destX, destY, cellRow, cellCol, scale, rotation) {
  var offsetX = 0,
      offsetY = 0,
      dx = 0,
      dy = 0,
      bCenter = Math.abs(scale ? scale : 1.0 - 1.0) > jb.EPSILON || rotation;

  if (arguments.length < 5) {
    // Assume cellRow is actually a 1D array index into the sheet.
    cellCol = cellRow % this.cols;
    cellRow = Math.floor(cellRow / this.cols);
  }

  if (bCenter) {
    ctxt.save();

    offsetX = Math.round(this.cellDx * 0.5);
    offsetY = Math.round(this.cellDy * 0.5);

    dx = destX + offsetX;
    dy = destY + offsetY;

    ctxt.translate(dx, dy);
    destX = -offsetX;
    destY = -offsetY;

    if (scale !== 1.0) {
      ctxt.scale(scale, scale);
    }

    if (rotation) {
      ctxt.rotate(rotation);
    }
  }

  ctxt.drawImage(this.source,
                 this.left + cellCol * this.cellDx,
                 this.top + cellRow * this.cellDy,
                 this.cellDx,
                 this.cellDy,
                 destX,
                 destY,
                 this.cellDx,
                 this.cellDy);

  if (bCenter) {
    ctxt.restore();
  }
};

jb.tileSheetObj.prototype.drawTile = function(ctxt, left, top, destRow, destCol, cellRow, cellCol) {
  if (arguments.length < 7) {
    // Assume cellRow is actually a 1D array index into the sheet.
    cellCol = cellRow % this.cols;
    cellRow = Math.floor(cellRow / this.cols);
  }

  ctxt.drawImage(this.source,
                 this.left + cellCol * this.cellDx,
                 this.top + cellRow * this.cellDy,
                 this.cellDx,
                 this.cellDy,
                 left + destCol * this.cellDx,
                 top + destRow * this.cellDy,
                 this.cellDx,
                 this.cellDy);
}

jb.tileSheetObj.prototype.getCellWidth = function() {
  return this.cellDx;
};

jb.tileSheetObj.prototype.getCellHeight = function() {
  return this.cellDy;
};

jb.tileSheetObj.prototype.getNumCells = function() {
  return this.rows * this.cols;
};

///////////////////////////////////////////////////////////////////////////////
// Array Utilities
///////////////////////////////////////////////////////////////////////////////
jb.removeFromArray = function(theArray, theElement, bPreserveOrder) {
    var index = theArray.indexOf(theElement),
        i = 0;

    if (index >= 0) {
      if (!bPreserveOrder) {
        if (index >= 0) {
            theArray[index] = theArray[theArray.length - 1];
        }
      }
      else {
        for (i=index; i<theArray.length - 1; ++i) {
          theArray[i] = theArray[i + 1];
        }
      }

      theArray.length -= 1;
    }
};

///////////////////////////////////////////////////////////////////////////////
// requestAnimationFrame
///////////////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////
// ooo        ooooo       .o.       ooooooooooooo ooooo   ooooo 
// `88.       .888'      .888.      8'   888   `8 `888'   `888' 
//  888b     d'888      .8"888.          888       888     888  
//  8 Y88. .P  888     .8' `888.         888       888ooooo888  
//  8  `888'   888    .88ooo8888.        888       888     888  
//  8    Y     888   .8'     `888.       888       888     888  
// o8o        o888o o88o     o8888o     o888o     o888o   o888o 
// Math ///////////////////////////////////////////////////////////////////////
jb.MathEx = {};

jb.MathEx.linesIntersect = function(x11, y11, x12, y12, x21, y21, x22, y22) {
    var vx1121 = x21 - x11,  // First point in segment 1 to first point in segment 2, x-coord.
        vy1121 = y21 - y11,  // First point in segment 1 to first point in segment 2, y-coord.
        vx1122 = x22 - x11,  // First point in segment 1 to second point in segment 2, x-coord.
        vy1122 = y22 - y11,  // First point in segment 1 to second point in segment 2, y-coord.
        c1 = vx1121 * vy1122 - vx1122 * vy1121,
        vx1221 = x21 - x12, // Second point in segment 1 to first point in segment 2, x-coord.
        vy1221 = y21 - y12, // Second point in segment 1 to first point in segment 2, y-coord.
        vx1222 = x22 - x12, // Second point in segment 1 to second point in segment 2, x-coord.
        vy1222 = y22 - y12, // Second point in segment 1 to second point in segment 2, y-coord.
        c2 = vx1221 * vy1222 - vx1222 * vy1221,
        c3 = 1,
        c4 = 1;

        if (c1 * c2 <= 0.0) {
          c3 = vx1121 * vy1221 - vy1121 * vx1221;
          c4 = vx1122 * vy1222 - vy1122 * vx1222;
        }

        return c3 * c4 <= 0.0;
};

// Cubic Splines --------------------------------------------------------------
jb.MathEx.cubic = function(a, b, c, d, u) {
   this.a = a;
   this.b = b;
   this.c = c;
   this.d = d;
};

jb.MathEx.cubic.prototype.getValueAt = function(u){
  return (((this.d * u) + this.c) * u + this.b) * u + this.a;
};

jb.MathEx.calcNaturalCubic = function(values, component, cubics) {
   var num = values.length - 1;
   var gamma = []; // new float[num+1];
   var delta = []; // new float[num+1];
   var D = []; // new float[num+1];
   var i = 0;

   /*
        We solve the equation
       [2 1       ] [D[0]]   [3(x[1] - x[0])  ]
       |1 4 1     | |D[1]|   |3(x[2] - x[0])  |
       |  1 4 1   | | .  | = |      .         |
       |    ..... | | .  |   |      .         |
       |     1 4 1| | .  |   |3(x[n] - x[n-2])|
       [       1 2] [D[n]]   [3(x[n] - x[n-1])]
       
       by using row operations to convert the matrix to upper triangular
       and then back sustitution.  The D[i] are the derivatives at the knots.
   */
   gamma.push(1.0 / 2.0);
   for(i=1; i< num; i++) {
      gamma.push(1.0/(4.0 - gamma[i-1]));
   }
   gamma.push(1.0/(2.0 - gamma[num-1]));

   p0 = values[0][component];
   p1 = values[1][component];
         
   delta.push(3.0 * (p1 - p0) * gamma[0]);
   for(i=1; i< num; i++) {
      p0 = values[i-1][component];
      p1 = values[i+1][component];
      delta.push((3.0 * (p1 - p0) - delta[i - 1]) * gamma[i]);
   }
   p0 = values[num-1][component];
   p1 = values[num][component];

   delta.push((3.0 * (p1 - p0) - delta[num - 1]) * gamma[num]);

   D.unshift(delta[num]);
   for(i=num-1; i >= 0; i--) {
      D.unshift(delta[i] - gamma[i] * D[0]);
   }

   /*
        now compute the coefficients of the cubics 
   */
   cubics.length = 0;

   for(i=0; i<num; i++) {
      p0 = values[i][component];
      p1 = values[i+1][component];

      cubics.push(new jb.MathEx.cubic(
                     p0, 
                     D[i], 
                     3*(p1 - p0) - 2*D[i] - D[i+1],
                     2*(p0 - p1) +   D[i] + D[i+1]
                   )
               );
   }
};

jb.MathEx.Spline2D = function() {
   this.points = [];
   this.xCubics = [];
   this.yCubics = [];
};

jb.MathEx.Spline2D.prototype.reset = function() {
  this.points.length = 0;
  this.xCubics.length = 0;
  this.yCubics.length = 0;
};
 
jb.MathEx.Spline2D.prototype.addPoint = function(point) {
   this.points.push(point);
};
 
jb.MathEx.Spline2D.prototype.getPoints = function() {
   return this.points;
};
 
jb.MathEx.Spline2D.prototype.calcSpline = function() {
   jb.MathEx.calcNaturalCubic(this.points, "x", this.xCubics);
   jb.MathEx.calcNaturalCubic(this.points, "y", this.yCubics);
};
 
jb.MathEx.Spline2D.prototype.getPoint = function(position) {
   position = position * this.xCubics.length; // extrapolate to the arraysize
    
   var cubicNum = Math.floor(position);
   var cubicPos = (position - cubicNum);
    
   return {x: this.xCubics[cubicNum].getValueAt(cubicPos),
           y: this.yCubics[cubicNum].getValueAt(cubicPos)};
};

jb.MathEx.Spline3D = function() {
   this.points = [];
   this.xCubics = [];
   this.yCubics = [];
   this.zCubics = [];
};

jb.MathEx.Spline3D.prototype.reset = function() {
 this.points.length = 0;
 this.xCubics.length = 0;
 this.yCubics.length = 0;
 this.zCubics.length = 0;
};

jb.MathEx.Spline3D.prototype.addPoint = function() {
  this.points.push(point);
};

jb.MathEx.Spline3D.prototype.getPoints = function() {
  return this.points;
};

jb.MathEx.Spline3D.prototype.calcSpline = function() {
  jb.MathEx.calcNaturalCubic(this.points, "x", this.xCubics);
  jb.MathEx.calcNaturalCubic(this.points, "y", this.yCubics);
  jb.MathEx.calcNaturalCubic(this.points, "z", this.zCubics);
};

jb.MathEx.Spline3D.prototype.getPoint = function(position) {
  position = position * this.xCubics.length; // extrapolate to the arraysize
  
  var cubicNum = Math.floor(position);
  var cubicPos = (position - cubicNum);
  
  return {x: this.xCubics[cubicNum].getValueAt(cubicPos),
          y: this.yCubics[cubicNum].getValueAt(cubicPos),
          z: this.zCubics[cubicNum].getValueAt(cubicPos)};
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ooo        ooooo oooooooooooo  .oooooo..o  .oooooo..o       .o.         .oooooo.    oooooooooooo  .oooooo..o      
// `88.       .888' `888'     `8 d8P'    `Y8 d8P'    `Y8      .888.       d8P'  `Y8b   `888'     `8 d8P'    `Y8      
//  888b     d'888   888         Y88bo.      Y88bo.          .8"888.     888            888         Y88bo.           
//  8 Y88. .P  888   888oooo8     `"Y8888o.   `"Y8888o.     .8' `888.    888            888oooo8     `"Y8888o.       
//  8  `888'   888   888    "         `"Y88b      `"Y88b   .88ooo8888.   888     ooooo  888    "         `"Y88b      
//  8    Y     888   888       o oo     .d8P oo     .d8P  .8'     `888.  `88.    .88'   888       o oo     .d8P      
// o8o        o888o o888ooooood8 8""88888P'  8""88888P'  o88o     o8888o  `Y8bood8P'   o888ooooood8 8""88888P' 
// Messages ///////////////////////////////////////////////////////////////////////////////////////////////////
jb.messages = {
  registry: {},
  queryRegistery: {},
  args: [],

  listen: function(message, listener) {
    var listeners = null;

    if (!this.registry[message]) {
      this.registry[message] = [];
    }

    listeners = this.registry[message];

    if (listeners.indexOf(listener) < 0) {
      listeners.push(listener);
    }
  },

  answer: function(message, questioner) {
    var answerers = null;

    if (!this.queryRegistry[message]) {
      this.queryRegistry[message] = [];
    }

    answerers = this.queryRegistry[message];

    if (answerers.indexOf(answerer) < 0) {
      answerers.push(answerer);
    }
  },

  unlisten: function(message, listener) {
    if (this.registry[message] && this.registry[message].indexOf(listener) >= 0) {
      jb.removeFromArray(this.registry[message], listener, true);
    }
  },

  unanswer: function(message, answerer) {
    if (this.queryRegistry[message] && this.queryRegistry[message].indexOf(answerer) >= 0) {
      jb.removeFromArray(this.queryRegistry[message], answerer, true);
    }
  },

  query: function(message, querier) {
    var i = 0,
        listener = null;

    if (querier && (typeof querier[message] === "function") && this.queryRegistery[message]) {
      this.args.length = 0;

      for (i=1; i<arguments.length; ++i) {
        this.args.push(arguments[i]);
      }

      for (i=0; i<this.queryRegistry[message].length; ++i) {
        // Call the querier's function, sending the current listener as the argument.
        querier[message].call(querier, this.queryRegistry[message][i]);
      }
    }
  },

  send: function(message) {
    var i = 0,
        listener = null;

    if (this.registry[message]) {
      this.args.length = 0;

      for (i=1; i<arguments.length; ++i) {
        this.args.push(arguments[i]);
      }

      for (i=0; i<this.registry[message].length; ++i) {
        listener = this.registry[message][i];

        if (listener) {
          listener[message].apply(listener, this.args);
        }
      }
    }
  }
}    

///////////////////////////////////////////////////////////////////////////////
// ooooooooooooo oooooo   oooo ooooooooo.   oooooooooooo  .oooooo.o 
// 8'   888   `8  `888.   .8'  `888   `Y88. `888'     `8 d8P'    `Y8 
//      888        `888. .8'    888   .d88'  888         Y88bo.      
//      888         `888.8'     888ooo88P'   888oooo8     `"Y8888o.  
//      888          `888'      888          888    "         `"Y88b 
//      888           888       888          888       o oo     .d8P 
//     o888o         o888o     o888o        o888ooooood8 8""88888P'  
// Types //////////////////////////////////////////////////////////////////////
jb.bounds = function(top, left, width, height) {
    this.set(top, left, width, height);
    this.isBound = true;
};

jb.bounds.prototype.draw = function(color, buffer) {
    var ctxt = buffer || jb.ctxt;

    ctxt.strokeStyle = color || "white";
    ctxt.beginPath();
    ctxt.moveTo(this.l, this.t);
    ctxt.lineTo(this.l + this.w, this.t);
    ctxt.lineTo(this.l + this.w, this.t + this.h);
    ctxt.lineTo(this.l, this.t + this.h);
    ctxt.closePath();
    ctxt.stroke();
};

jb.bounds.prototype.set = function(left, top, width, height) {
    this.t = top || 0;
    this.l = left || 0;
    this.w = width || 0;
    this.h = height || 0;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

jb.bounds.prototype.contain = function(x, y) {
    return this.l <= x && this.l + this.w >= x &&
           this.t <= y && this.t + this.h >= y;
};

jb.bounds.prototype.intersectLine = function(sx, sy, ex, ey) {
  return jb.MathEx.linesIntersect(sx, sy, ex, ey, this.l, this.t, this.l + this.w, this.t) ||
         jb.MathEx.linesIntersect(sx, sy, ex, ey, this.l + this.w, this.t, this.l + this.w, this.t + this.h) ||
         jb.MathEx.linesIntersect(sx, sy, ex, ey, this.l + this.w, this.t + this.h, this.l, this.t + this.h) ||
         jb.MathEx.linesIntersect(sx, sy, ex, ey, this.l, this.t + this.h, this.l, this.t) ||
         // These last two tests shouldn't be necessary, but inaccuracies in the above four
         // tests might make them necessary.
         this.contain(sx, sy) ||
         this.contain(ex, ey);
};

jb.bounds.prototype.copy = function(dest) {
    dest.t = this.t;
    dest.l = this.l;
    dest.w = this.w;
    dest.h = this.h;
    dest.halfWidth = this.halfWidth;
    dest.halfHeight = this.halfHeight;
};

jb.bounds.prototype.scale = function(sx, sy) {
    var xScale = sx || 1,
        yScale = sy || xScale;

    this.t *= yScale;
    this.l *= xScale;
    this.w *= xScale;
    this.h *= yScale;
    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

jb.bounds.prototype.moveTo = function(left, top) {
    this.t = top;
    this.l = left;
};

jb.bounds.prototype.moveBy = function(dl, dt) {
    this.t += dt;
    this.l += dl;
};

jb.bounds.prototype.resizeTo = function(width, height) {
    this.w = width;
    this.h = height;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

jb.bounds.prototype.resizeBy = function(dw, dh) {
    this.w += dw;
    this.h += dh;

    this.halfWidth = Math.round(this.w * 0.5);
    this.halfHeight = Math.round(this.h * 0.5);
};

jb.bounds.prototype.intersect = function(other) {
    var bInLeftRight = false,
        bInTopBottom = false;

    jb.assert(other, "jb.bounds.intersect: invalid 'other'!");

    if (this.l < other.l) {
        bInLeftRight = other.l <= this.l + this.w;
    }
    else {
        bInLeftRight = this.l <= other.l + other.w;
    }

    if (this.t < other.t) {
        bInTopBottom = other.t <= this.t + this.h;
    }
    else {
        bInTopBottom = this.t <= other.t + other.h;
    }

    return bInLeftRight && bInTopBottom;
};

jb.bounds.prototype.intersection = function(other, result) {
    jb.assert(other && other.isBound, "jb.bounds.intersection: invalid 'other'!");
    jb.assert(result && result.isBound, "jb.bounds.intersection: invalid 'result'!");

    if (this.l < other.l) {
        result.l = other.l;
        result.w = Math.min(this.l + this.w, other.l + other.w) - result.l;
    }
    else {
        result.l = this.l;
        result.w = Math.min(this.l + this.w, other.l + other.w) - result.l;
    }

    if (this.t < other.t) {
        result.t = other.t;
        result.h = Math.min(this.t + this.h, other.t + other.h) - result.l;
    }
    else {
        result.t = this.t;
        result.h = Math.min(this.t + this.h, other.t + other.h) - result.l;
    }
};

////////////////////////////////////////////////////////////////////////////////
// oooooo     oooo ooo        ooooo 
//  `888.     .8'  `88.       .888' 
//   `888.   .8'    888b     d'888  
//    `888. .8'     8 Y88. .P  888  
//     `888.8'      8  `888'   888  
//      `888'       8    Y     888  
//       `8'       o8o        o888o 
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
    jb.stateMachines.update();
    jb.transitions.update();

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
    jb.screenBufferCtxt.save();

    // Clear screen.
    jb.screenBufferCtxt.fillStyle = "black";
    jb.screenBufferCtxt.fillRect(0, 0, jb.canvas.width, jb.canvas.height);

    if (Math.abs(1 - jb.viewScale) > jb.EPSILON) {
      jb.screenBufferCtxt.scale(jb.viewScale, jb.viewScale);
    }
    jb.screenBufferCtxt.translate(-jb.viewOrigin.x, -jb.viewOrigin.y);
    jb.screenBufferCtxt.drawImage(jb.canvas, 0, 0);
    jb.screenBufferCtxt.restore();

    if (jb.program && jb.program.drawGUI) {
      jb.program.drawGUI(jb.screenBufferCtxt);
    }

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
    jb.time.deltaTimeMS = (jb.time.now - lastTime);
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

////////////////////////////////////////////////////////////////////////////////
// oooooo     oooo ooooo oooooooooooo oooooo   oooooo     oooo 
//  `888.     .8'  `888' `888'     `8  `888.    `888.     .8'  
//   `888.   .8'    888   888           `888.   .8888.   .8'   
//    `888. .8'     888   888oooo8       `888  .8'`888. .8'    
//     `888.8'      888   888    "        `888.8'  `888.8'     
//      `888'       888   888       o      `888'    `888'      
//       `8'       o888o o888ooooood8       `8'      `8'    
// View ////////////////////////////////////////////////////////////////////////
// Get canvas and resize to fit window.
jb.NEWLINE = "`";
jb.canvas = null;
jb.screenBuffer = null;
jb.screenBufferCtxt = null;
jb.ctxt = null;
jb.columns = 80;
jb.viewScale = 1;
jb.viewOrigin = {x: 0, y: 0 };
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
jb.createCanvas = function(width, height, fill) {
  var newCanvas = document.createElement('canvas'),
      newContext = newCanvas.getContext('2d');

    newCanvas.width = width;
    newCanvas.height = height;

    if (fill) {
      newContext.fillStyle = fill;
      newContext.fillRect(0, 0, width, height);
    }
    else {
      newContext.clearRect(0, 0, width, height);
    }

  return {canvas: newCanvas, context: newContext};    
};
jb.drawImage = function(ctxt, image, xa, ya, anchorX, anchorY) {
  var x = xa - anchorX * image.width,
      y = ya - anchorY * image.height;

    if (ctxt) {
      ctxt.drawImage(image, x, y);
    }
};
jb.drawImageNormalized = function(image, nx, ny, anchorX, anchorY) {
    var x = nx * jb.canvas.width,
        y = ny * jb.canvas.height,
        ax = anchorX || 0.5,
        ay = anchorY || 0.5;

    x = Math.round(x - ax * image.width);
    y = Math.round(y - ay * image.height);

    jb.ctxt.drawImage(image, x, y);
};
jb.drawRoundedRect = function(ctxt, x, y, w, h, r, borderColor, fillColor, borderWidth) {
  ctxt.save();

  ctxt.strokeStyle = borderColor || "black";
  ctxt.lineWidth = borderWidth || 1;
  ctxt.fillStyle = fillColor || "white";

  ctxt.beginPath();
  ctxt.moveTo(x + r, y);
  ctxt.lineTo(x + w - r, y);
  ctxt.quadraticCurveTo(x + w, y, x + w, y + r);
  ctxt.lineTo(x + w, y + h - r);
  ctxt.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctxt.lineTo(x + r, y + h);
  ctxt.quadraticCurveTo(x, y + h, x, y + h - r);
  ctxt.lineTo(x, y + r);
  ctxt.quadraticCurveTo(x, y, x + r, y);
  ctxt.closePath();

  ctxt.fill();
  if (borderColor) {
    ctxt.stroke();
  }

  ctxt.restore();
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

    if (row >= 0 && row <= jb.rows) {
        jb.ctxt.fillStyle = jb.backColor;
        x = jb.xFromCol(0);
        y = jb.yFromRow(row);
        jb.ctxt.fillRect(x, y, jb.canvas.width, jb.cellSize.height);

      // DEBUG:
      // jb.ctxt.beginPath();
      // jb.ctxt.strokeStyle = "red";
      // jb.ctxt.rect(x, y, jb.canvas.width, jb.cellSize.height);
      // jb.ctxt.stroke();
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
jb.screenToWorldX = function(screenX) {
  return screenX / jb.viewScale + jb.viewOrigin.x;
};
jb.screenToWorldY = function(screenY) {
  return screenY / jb.viewScale + jb.viewOrigin.y;
};
jb.setViewScale = function(newScale) {
  jb.viewScale = newScale;
};
jb.getViewScale = function() {
  return jb.viewScale;
};
jb.setViewOrigin = function(x, y) {
  jb.viewOrigin.x = x || 0;
  jb.viewOrigin.y = y || 0;
};
jb.getViewOrigin = function() {
  return jb.viewOrigin;
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

////////////////////////////////////////////////////////////////////////////////
// ooooo ooooo      ooo ooooooooo.   ooooo     ooo ooooooooooooo 
// `888' `888b.     `8' `888   `Y88. `888'     `8' 8'   888   `8 
//  888   8 `88b.    8   888   .d88'  888       8       888      
//  888   8   `88b.  8   888ooo88P'   888       8       888      
//  888   8     `88b.8   888          888       8       888      
//  888   8       `888   888          `88.    .8'       888      
// o888o o8o        `8  o888o           `YbodP'        o888o     
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

    if (jb.inputState !== jb.INPUT_STATES.READ_LINE) {
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

jb.tap = {bListening: false, x: -1, y: -1, done: false, isDoubleTap: false, lastTapTime: 0, touched: null};
jb.swipe = {bListening: false, startX: -1, startY: -1, lastX: -1, lastY: -1, endX: -1, endY: -1, startTime: 0, endTime: 0, swiped: [], allSwiped: [], done: false};

jb.listenForTap = function() {
    jb.resetTap();
    jb.tap.bListening = true;
    jb.tap.touched = false;
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
    jb.swipe.lastX = -1;
    jb.swipe.lastY = -1;
    jb.swipe.endX = -1;
    jb.swipe.endY = -1;
    jb.swipe.startTime = 0;
    jb.swipe.endTime = 0;
    jb.swipe.done = false;
    jb.swipe.started = false;
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
        jb.tap.touched = jb.touchables.getTouched(x, y);
        jb.tap.done = true;
    }

    if (jb.swipe.bListening) {
        jb.swipe.startX = x;
        jb.swipe.startY = y;
        jb.swipe.lastX = x;
        jb.swipe.lastY = y;
        jb.swipe.endX = x;
        jb.swipe.endY = y;
        jb.swipe.startTime = newNow;
        jb.swipe.swiped.length = 0;
        jb.swipe.allSwiped.length = 0;
        jb.swipe.started = true;
        jb.swipe.done = false;
    }
};

jb.gestureContinue = function() {
    if (jb.swipe.startTime) {
        jb.swipe.lastX = jb.swipe.endX;
        jb.swipe.lastY = jb.swipe.endY;
        jb.swipe.endX = jb.pointInfo.x;
        jb.swipe.endY = jb.pointInfo.y;

        jb.swipeables.getSwiped(jb.swipe.lastX, jb.swipe.lastY, jb.swipe.endX, jb.swipe.endY);
    }
};

jb.gestureEnd = function() {
    if (jb.swipe.startTime) {
        jb.swipe.lastX = jb.swipe.endX;
        jb.swipe.lastY = jb.swipe.endY;
        jb.swipe.endX = jb.pointInfo.x
        jb.swipe.endY = jb.pointInfo.y;
        jb.swipe.endTime = Date.now();
        jb.swipe.done = true;

        jb.swipeables.getSwiped(jb.swipe.lastX, jb.swipe.lastY, jb.swipe.endX, jb.swipe.endY);
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

////////////////////////////////////////////////////////////////////////////////
// oooooooooooo   .oooooo.   ooooo      ooo ooooooooooooo  .oooooo.o 
// `888'     `8  d8P'  `Y8b  `888b.     `8' 8'   888   `8 d8P'    `Y8 
//  888         888      888  8 `88b.    8       888      Y88bo.      
//  888oooo8    888      888  8   `88b.  8       888       `"Y8888o.  
//  888    "    888      888  8     `88b.8       888           `"Y88b 
//  888         `88b    d88'  8       `888       888      oo     .d8P 
// o888o         `Y8bood8P'  o8o        `8      o888o     8""88888P'  
// FONTS ///////////////////////////////////////////////////////////////////////
// Fonts are bitmapped character sets. They default to 16x16 size and can be
// scaled in integer amounts.
jb.fonts = {
    DEFAULT_SIZE: 16,

    drawToContextAt: function(ctxt, fontName, x, y, text, color, hAlign, vAlign, scale) {
        var charSet = null,
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

            // Compensate for desired alignment.
            y += scale * this.DEFAULT_SIZE * (0.5 + (vAlign - 0.5)); 
            x -= scale * this.DEFAULT_SIZE * text.length * (0.5 + (hAlign - 0.5));

            ctxt.save();
            ctxt.fillStyle = color;
            ctxt.lineWidth = scale;
            ctxt.strokeStyle = color;

            for (iChar=0; iChar<text.length; ++iChar) {
                curChar = text.charAt(iChar);

                if (curChar !== ' ') {
                    fontChar = charSet[curChar];

                    if (fontChar) {
                        image = this.imageForChar(fontChar, color, scale);
                        ctxt.drawImage(image, x, y);
                    }
                    else {
                        ctxt.rect(x, y, scale * this.DEFAULT_SIZE, scale * this.DEFAULT_SIZE);
                    }
                }

                x += scale * this.DEFAULT_SIZE;
            }

            ctxt.restore()
       }
    },

    drawAt: function(fontName, x, y, text, color, hAlign, vAlign, scale) {
      this.drawToContextAt(jb.ctxt, fontName, x, y, text, color, hAlign, vAlign, scale);
    },

    print: function(fontName, text, color, hAlign, vAlign, scale) {
        jb.fonts.printAt(fontName, jb.row + 1, jb.col + 1, text, color, hAlign, vAlign, scale);        
    },

    printAt: function(fontName, newRow, newCol, text, color, hAlign, vAlign, scale) {
        var x = 0,
            y = 0,
            row = jb.row,
            col = jb.col,
            charSet = null,

        charSet = jb.fonts[fontName];

        if (text && charSet) {   
            cr = text.indexOf(jb.NEWLINE) === text.length - 1;

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

            // Assume top-left alignment.
            x = jb.xFromCol(col);
            y = jb.yFromRow(row);

            jb.fonts.drawAt(fontName, x, y, text, color, hAlign, vAlign, scale);
            
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
                   "......000000....",
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

//////////////////////////////////////////////////////////////////////////////////
//   .oooooo.    ooooo        oooooo   oooo ooooooooo.   ooooo   ooooo  .oooooo.o 
//  d8P'  `Y8b   `888'         `888.   .8'  `888   `Y88. `888'   `888' d8P'    `Y8 
// 888            888           `888. .8'    888   .d88'  888     888  Y88bo.      
// 888            888            `888.8'     888ooo88P'   888ooooo888   `"Y8888o.  
// 888     ooooo  888             `888'      888          888     888       `"Y88b 
// `88.    .88'   888       o      888       888          888     888  oo     .d8P 
//  `Y8bood8P'   o888ooooood8     o888o     o888o        o888o   o888o 8""88888P'  
// GLYPHS ////////////////////////////////////////////////////////////////////////
// Glyphs are pre-defined images that can be used for games and such.
// Glyphs are defined in code using an array of strings, where each
// pair of characters represents a hexidecimal lookup into one of
// 16 palettes, each of 16 colors. 00 always equals transparency.
jb.glyphs = {
    draw: function(sizeStr, glyphName, x, y, scaleX, scaleY, anchorX, anchorY) {
        jb.glyphs.drawToContext(jb.ctxt, sizeStr, glyphName, x, y, scaleX, scaleY, anchorX, anchorY);
    },

    // The top and left values will represent offsets from (0, 0) at
    // which the bounds begin.
    getBounds: function(sizeStr, glyphName, scaleX, scaleY, result) {
        var glyphsAtSize = jb.glyphs[sizeStr],
            glyphData = glyphsAtSize ? glyphsAtSize[glyphName] : null,
            sx = scaleX || 1,
            sy = scaleY || 1,
            key = "" + scaleX + "x" + scaleY,
            xMin = Number.MAX_SAFE_INTEGER,
            yMin = Number.MAX_SAFE_INTEGER,
            xMax = 0,
            yMax = 0,
            iRow = 0,
            iCol = 0,
            colStart = 0,
            colEnd = 0,
            dCol = 0,
            rowStart = 0,
            rowEnd = 0,
            dRow = 0,
            pixelVal;

        if (glyphData) {
            if (!glyphData.defaultBounds) {
                if (glyphData.pixelData) {
                    rowStart = sy > 0 ? 0 : glyphData.pixelData.length - 1;
                    rowEnd = sy > 0 ? glyphData.pixelData.length : -1;
                    dRow = sy > 0 ? 1 : -1;
                    colStart = sx > 0 ? 0 : glyphData.pixelData[0].length - 2;
                    colEnd = sx > 0 ? glyphData.pixelData[0].length : -1;
                    dCol = sx > 0 ? 2 : -2;

                    iRow = rowStart;
                    do {
                        iCol = colStart;
                        do {
                            pixelVal = parseInt("" + glyphData.pixelData[iRow][iCol] + glyphData.pixelData[iRow][iCol + 1]);
                            if (!isNaN(pixelVal)) {
                                if (iRow < yMin) {
                                    yMin = iRow;
                                }
                                else if (iRow > yMax) {
                                    yMax = iRow;
                                }

                                if (iCol < xMin) {
                                    xMin = iCol;
                                }
                                else if (iCol > xMax) {
                                    xMax = iCol;
                                }
                            }
                            iCol += dCol;
                        } while (iCol !== colEnd)

                        iRow += dRow;
                    } while (iRow !== rowEnd)

                    glyphData.defaultBounds = new jb.bounds(xMin, yMin, (xMax - xMin) / 2, yMax - yMin);
                }
            }

            glyphData.defaultBounds.copy(result);
            result.scale(sx, sy);
        }
    },

    drawToContext: function(ctxt, sizeStr, glyphName, x, y, scaleX, scaleY, anchorX, anchorY) {
        var glyphsAtSize = jb.glyphs[sizeStr],
            glyphData = glyphsAtSize ? glyphsAtSize[glyphName] : null,
            sx = scaleX || 1,
            sy = scaleY || 1,
            key = "" + sx + "x" + sy,
            image = null;

        anchorX = anchorX ? anchorX : 0;
        anchorY = anchorY ? anchorY : 0;

        if (jb.ctxt && glyphData) {
            if (!glyphData.image || !glyphData.image[key]) {
                jb.glyphs.init(sizeStr, glyphName, key, sx, sy);
            }

            image = glyphData.image[key];

            x = x - Math.round(anchorX * image.width);
            y = y - Math.round(anchorY * image.height);
            ctxt.drawImage(image, x, y);
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
                        ".,030303.,.,.,.,.,.,.,.,.,.,.,,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
           ],
        },
        brickBattlementCenter: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
        brickLeftPoint: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
            pixelData: [
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,0303.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,03.,.,.,.,.,.,.,.,.,.,",
                        "03030303.,0303.,.,.,.,.,.,.,.,.,",
                        "03030303.,030303.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,030303030303.,.,.,.,.,.,.,.,.,",
                        ".,0303030303.,.,.,.,.,.,.,.,.,.,",
                        ".,03030303.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "030303.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        "0303.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
           ],
        },
        brickRightPoint: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
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
                        ".,.,.,.,.,.,.,.,.,.,030303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,0303030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,03030303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,03",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
           ],
        },
        brickCenter: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
                        ".,030303,.,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
           ],
        },
        brickMid: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
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
                        ".,030303,.,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
           ],
        },
        brickMidWindow: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
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
                        ".,030303,.,.,.,.,030303.,.,.,.,",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,030303.,030303.,030303",
                        ".,.,.,.,.,030303.,.,.,.,.,030303",
           ],
        },
         brickMidDoor: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
            pixelData: [
                        ".,030303.,030303.,030303.,030303",
                        ".,030303.,.,.,.,.,.,.,.,.,030303",
                        ".,0303.,.,.,.,.,.,.,.,.,.,030303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,.,.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,,.,.,.,.,.,.,.,.,.,.,.,",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
                        ".,03.,.,.,.,.,.,.,.,.,.,.,.,0303",
           ],
        },
        brickBottom: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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
            defaultBounds: null,    // Built when queried
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

    "24x24": {
      empty: {
        image : null,
        defaultBounds: null,
        pixelData: [
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
        ]
      },
      die00: {
        image : null,
        defaultBounds: null,
        pixelData: [
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
        ]
      },
      die01: {
        image : null,
        defaultBounds: null,
        pixelData: [
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505000005050505050505050500.,",
                    ".,00050505050505050500010100050505050505050500.,",
                    ".,00050505050505050001010101000505050505050500.,",
                    ".,00050505050505050001010101000505050505050500.,",
                    ".,00050505050505050500010100050505050505050500.,",
                    ".,00050505050505050505000005050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
        ]
      },
      die02: {
        image : null,
        defaultBounds: null,
        pixelData: [
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050500000505050500.,",
                    ".,00050505050505050505050505050001010005050500.,",
                    ".,00050505050505050505050505000101010100050500.,",
                    ".,00050505050505050505050505000101010100050500.,",
                    ".,00050505050505050505050505050001010005050500.,",
                    ".,00050505050505050505050505050500000505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505000005050505050505050500.,",
                    ".,00050505050000050505050505050505050505050500.,",
                    ".,00050505000101000505050505050505050505050500.,",
                    ".,00050500010101010005050505050505050505050500.,",
                    ".,00050500010101010005050505050505050505050500.,",
                    ".,00050505000101000505050505050505050505050500.,",
                    ".,00050505050000050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
        ]
      },
      die03: {
        image : null,
        defaultBounds: null,
        pixelData: [
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050500000505050500.,",
                    ".,00050505050505050505050505050001010005050500.,",
                    ".,00050505050505050505050505000101010100050500.,",
                    ".,00050505050505050505050505000101010100050500.,",
                    ".,00050505050505050505050505050001010005050500.,",
                    ".,00050505050505050505050505050500000505050500.,",
                    ".,00050505050505050505000005050505050505050500.,",
                    ".,00050505050505050500010100050505050505050500.,",
                    ".,00050505050505050001010101000505050505050500.,",
                    ".,00050505050505050001010101000505050505050500.,",
                    ".,00050505050505050500010100050505050505050500.,",
                    ".,00050505050505050505000005050505050505050500.,",
                    ".,00050505050000050505050505050505050505050500.,",
                    ".,00050505000101000505050505050505050505050500.,",
                    ".,00050500010101010005050505050505050505050500.,",
                    ".,00050500010101010005050505050505050505050500.,",
                    ".,00050505000101000505050505050505050505050500.,",
                    ".,00050505050000050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
        ]
      },
      die04: {
        image : null,
        defaultBounds: null,
        pixelData: [
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
        ]
      },
      die05: {
        image : null,
        defaultBounds: null,
        pixelData: [
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505050505050505000005050505050505050500.,",
                    ".,00050505050505050500010100050505050505050500.,",
                    ".,00050505050505050001010101000505050505050500.,",
                    ".,00050505050505050001010101000505050505050500.,",
                    ".,00050505050505050500010100050505050505050500.,",
                    ".,00050505050505050505000005050505050505050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
        ]
      },
      die06: {
        image : null,
        defaultBounds: null,
        pixelData: [
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050500010101010005050505000101010100050500.,",
                    ".,00050505000101000505050505050001010005050500.,",
                    ".,00050505050000050505050505050500000505050500.,",
                    ".,00050505050505050505050505050505050505050500.,",
                    ".,.,0000000000000000000000000000000000000000.,.,",
                    ".,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,",
        ]
      },
    },

    "32x32": {
        empty: {
            image: null,   // Built when first instance is created
            defaultBounds: null,    // Built when queried
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

///////////////////////////////////////////////////////////////////////////////
//  .oooooo.o   .oooooo.   ooooo     ooo ooooo      ooo oooooooooo.   
// d8P'    `Y8  d8P'  `Y8b  `888'     `8' `888b.     `8' `888'   `Y8b  
// Y88bo.      888      888  888       8   8 `88b.    8   888      888 
//  `"Y8888o.  888      888  888       8   8   `88b.  8   888      888 
//      `"Y88b 888      888  888       8   8     `88b.8   888      888 
// oo     .d8P `88b    d88'  `88.    .8'   8       `888   888     d88' 
// 8""88888P'   `Y8bood8P'     `YbodP'    o8o        `8  o888bood8P'   
// SOUND //////////////////////////////////////////////////////////////////////
jb.sound = {
    DEFAULT_FREQ: 440, // Hz
    DEFAULT_VOL: 1.0,
    DEFAULT_DUR: 0.25, // sec
    CHANNELS: {MONO: 1, STEREO: 2},
    WAVES_PER_NOISE: 17,
    FORMAT: {
        MP3: {ext: 'mp3', mime: 'audio/mpeg'},
        OGG: {ext: 'ogg', mime: 'audio/ogg; codecs=vorbis'}
      },
    DEFAULT_CHANNELS: 2,
    DEFAULT_DELAY:    0.1,
    STOP_ALL_CHANNELS:-1,
    INVALID_CHANNEL:  -99,
      
    isEnabled:       true,
    isAvailable:     window.Audio,
    preferredFormat: null,
    sounds:          {},

    masterVolume:    1.0,
    audioContext: null,
    noiseFactor: 0.33,
    channels: 1,
    dummySound: { audioNode: null, play: function() {}, stop: function() {} },

    init: function() {
        var capTester = new Audio(),
            iFormat = 0;

        // Audio resource initialization:
        for (iFormat in jb.sound.FORMAT) {
          if (capTester.canPlayType(jb.sound.FORMAT[iFormat].mime) === "probably") {
            jb.sound.preferredFormat = jb.sound.FORMAT[iFormat];
            break;
          }
        }

        if (!this.preferredFormat) {
          for (iFormat in jb.sound.FORMAT) {
            if (capTester.canPlayType(jb.sound.FORMAT[iFormat].mime) === "maybe") {
              jb.sound.preferredFormat = jb.sound.FORMAT[iFormat];
              break;
            }
          }
        }

        if (!jb.sound.preferredFormat) {
          jb.sound.isAvailable = false;
          jb.sound.isEnabled = false;
        }

        // Procedural audio initialization:
        try {
          window.AudioContext = window.AudioContext || window.webkitAudioContext;
          this.audioContext = new AudioContext();
        }
        catch(e) {
          alert('Web Audio API is not supported in this browser');
        }
    },

    // Sound Resources ----------------------------------------------
    activate: function() {
        jb.sound.isEnabled = jb.sound.isAvailable;
    },

    deactivate: function() {
        jb.sound.stopAll();
        jb.sound.isEnabled = false;
    },

    getFreeChannelIndex: function(sound, now) {
        var i = 0;
        var iChannel = jb.sound.INVALID_CHANNEL;
        var mostDelay = 0;
        var testDelay = 0;

        if (sound && sound.channels.length && sound.playing.length && sound.lastPlayTime.length) {
            for (var i=0; i<sound.channels.length; ++i) {
                testDelay = (now - sound.lastPlayTime[i]) * 0.001;
                if (testDelay > mostDelay && testDelay > sound.minDelay) {
                    mostDelay = testDelay;
                    iChannel = i;
                }
            }
        }

        return iChannel;
    },

    play: function(sound, volume) {
        var totalVolume = typeof(volume) === 'undefined' ? 1 : volume,
            playedIndex = jb.sound.INVALID_CHANNEL,
            now = Date.now();

        totalVolume = jb.sound.clampVolume(totalVolume * jb.sound.getMasterVolume());

        if (sound) {
            playedIndex = jb.sound.getFreeChannelIndex(sound, now);
      
        try {
            if (playedIndex !== jb.sound.INVALID_CHANNEL) {
                sound.iChannel = playedIndex;
                sound.lastPlayTime[playedIndex] = now;
                sound.channels[playedIndex].pause();
                sound.channels[playedIndex].loop = false;
                sound.channels[playedIndex].volume = totalVolume;
                sound.channels[playedIndex].currentTime = 0;
                sound.playing[playedIndex] = true;
                sound.channels[playedIndex].play();
            }
        }
        catch(err) {
            // Error message?
        }
    }

    return playedIndex;
    },

    loop: function(sound, volume) {
        var now = Date.now(),
            totalVolume = typeof(volume) === 'undefined' ? 1 : volume,
            playedIndex = jb.sound.INVALID_CHANNEL;

        totalVolume = jb.sound.clampVolume(totalVolume * jb.sound.getMasterVolume());

        if (sound) {
            playedIndex = jb.sound.getFreeChannelIndex(sound, now);
          
            try {
                if (playedIndex !== jb.sound.INVALID_CHANNEL) {
                  sound.iChannel = playedIndex;
                  sound.lastPlayTime[playedIndex] = now;
                  sound.channels[playedIndex].pause();
                  sound.channels[playedIndex].loop = true;
                  sound.channels[playedIndex].volume = totalVolume;
                  sound.channels[playedIndex].currentTime = 0;
                  sound.playing[playedIndex] = true;
                  sound.channels[playedIndex].play();
                }
            }
            catch(err) {
            // Error message?
            }
        }

        return playedIndex;
    },

    pause: function(sound, channelIndex) {
        var iChannel = 0,
            iStart = typeof(channelIndex) === 'undefined' || channelIndex === jb.sound.INVALID_CHANNEL ? 0 : channelIndex,
            iEnd = typeof(channelIndex) === 'undefined' || channelIndex === jb.sound.INVALID_CHANNEL ? sound.channels.length - 1 : channelIndex;

        for (iChannel = iStart; iChannel <= iEnd; ++iChannel) {
            sound.channels[iChannel].pause();
            sound.playing[iChannel] = false;
        }
    },

    resume: function(sound, channelIndex) {
        var iChannel = 0,
            iStart = typeof(channelIndex) === 'undefined' || channelIndex === jb.sound.INVALID_CHANNEL ? 0 : channelIndex,
            iEnd = typeof(channelIndex) === 'undefined' || channelIndex === jb.sound.INVALID_CHANNEL ? sound.channels.length - 1 : channelIndex;

        for (iChannel = iStart; iChannel <= iEnd; ++iChannel) {
            sound.channels[iChannel].play();
            sound.playing[iChannel] = true;
        }
    },

    stop: function(sound, channelIndex) {
        var iChannel = 0,
            iStart = typeof(channelIndex) === 'undefined' || channelIndex === jb.sound.INVALID_CHANNEL ? 0 : channelIndex,
            iEnd = typeof(channelIndex) === 'undefined' || channelIndex === jb.sound.INVALID_CHANNEL ? sound.channels.length - 1 : channelIndex;

        channelIndex = channelIndex || jb.sound.STOP_ALL_CHANNELS;

        if (channelIndex === jb.sound.STOP_ALL_CHANNELS) {
            iStart = 0;
            iEnd = sound.channels.length - 1;
        }

        try {
            for (iChannel = iStart; iChannel <= iEnd; ++iChannel) {
                sound.channels[iChannel].pause();
                sound.channels[iChannel].loop = false;
                sound.channels[iChannel].currentTime = 0;
                sound.playing[iChannel] = false;
            }
        }
        catch(err) {
            // Error message?
        }
    },

    stopAll: function() {
        var key;

        for (key in jb.sound.sounds) {
            jb.sound.stop(jb.sound.sounds[key], jb.sound.STOP_ALL_CHANNELS);
        }
    },

    setMasterVolume: function(newMasterVolume) {
        jb.sound.masterVolume = jb.sound.clampVolume(newMasterVolume);
    },

    getMasterVolume: function() {
        return jb.sound.masterVolume;
    },

    clampVolume: function(volume) {
        return Math.min(1, Math.max(0, volume));
    },

    load: function(resourceName, onLoadedCallback, onErrorCallback, nChannels, replayDelay) {
        var numChannels = nChannels || jb.sound.DEFAULT_CHANNELS,
            minReplayDelay = replayDelay || jb.sound.DEFAULT_DELAY,

            path = resourceName,
            extension = path.substring(path.lastIndexOf(".")),
            nNewChannels = 0,
            i = 0,
            newChannel = null,
            sentinel = null;

        if (jb.sound.preferredFormat) {
            if (extension) {
                path = path.replace(extension, "");
            }

            path = path + "." + jb.sound.preferredFormat.ext;

            if (!jb.sound.sounds[resourceName] ||
                jb.sound.sounds[resourceName].length < nChannels) {
                if (!jb.sound.sounds[resourceName]) {
                    jb.sound.sounds[resourceName] = {
                        channels:     [],
                        playing:      [],
                        lastPlayTime: [],
                        minDelay:     minReplayDelay,
                    };
                }
            
                nNewChannels = numChannels - jb.sound.sounds[resourceName].channels.length;
                for (i=0; i<nNewChannels; ++i) {
                    newChannel = new Audio(path);
                    sentinel = new function() { this.bFirstTime = true };
                  
                    newChannel.addEventListener('canplaythrough', function callback() {
                        // HACKy "fix" for Chrome's 'canplaythrough' bug.
                        if (sentinel.bFirstTime) {
                            if (onLoadedCallback) {
                                onLoadedCallback(jb.sound.sounds[resourceName], resourceName);
                            }
                            sentinel.bFirstTime = false;
                        }
                    }, false);
                  
                    if (onErrorCallback) {
                        newChannel.addEventListener('onerror', function callback() {
                            onErrorCallback(resourceName);
                        }, false);
                    }
                
                    newChannel.preload = "auto";
                    newChannel.load();
                    jb.sound.sounds[resourceName].channels.push(newChannel);
                    jb.sound.sounds[resourceName].playing.push(false);
                    jb.sound.sounds[resourceName].lastPlayTime.push(0);
                }
            }
        }
        else if (onLoadedCallback) {
            onLoadedCallback(resourceName, "Error: no preferred format");
        }

        return jb.sound.sounds[resourceName];
    },

    // Procedural Sound ---------------------------------------------
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
