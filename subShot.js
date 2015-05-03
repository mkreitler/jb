// Acey-ducey card game

// Create an object that will be the game:
game = {
    // Variables and data //////////////////////////////////////////////////////
    BACK_COLOR: "rgba(0, 32, 128, 1)",
    SKY_COLOR: "rgba(64, 128, 255, 1)",
    NUM_LANES: 10,
    SKY_HEIGHT: 0.2,
    MAX_CLOUDS: 8,
    MAX_CLOUD_SCALE: 4,
    STATE: {DEAD: 0, OK: 1},
    SHIP: {X: 50, Y: 12, SCALE_X: 4, SCALE_Y: 2},
    HIDE_SUB_TIME: 2,
    MISSILE_LAUNCH_X: 16,
    MISSILE_SPEED: 500,
    FLAME_ANIM_TIME: 0.25,
    RIPPLE_TIME: 0.33,
    NUM_RIPPLES: 3,
    RIPPLE_SPACING: 3,
    RIPPLE_RADIUS: 100,
    RIPPLE_ASPECT: 0.25,
    FIREBALL_RAD: 200,
    FIREBALL_TIME: 0.25,
    WINNING_SCORE: 3,

    message: null,
    messageRGB: "0, 0, 0",
    clouds: [],
    yTop: 0,
    laneHeight: 0,
    destroyer: {lane: -1, state: 0, target: -1, score: 0},
    sub: {lane: -1, state: 0, hidingSpots: [], score: 0},
    missile: {x: 0, y: 0, animFrames: ["missile01up", "missile01up2"], frame: 0, targetY: 0, targetLane: 0, scale_x: 1, scale_y: 2},

    // DEBUG:
    fps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    iFPS: -1,

    // Functions ///////////////////////////////////////////////////////////////
    setUp: function() {
        // Pre-compute position of clouds.
        var numClouds = 0,
            iCloud = 0,
            scale = 1,
            cloudGlyph = null,
            newCloud = null;

        // Compute constants used to draw the shipping lanes.
        this.yTop = Math.round(jb.canvas.height * game.SKY_HEIGHT);
        this.laneHeight = Math.round((jb.canvas.height - this.yTop) / game.NUM_LANES);

        jb.setBackColor(game.BACK_COLOR);
        jb.resize(jb.canvas.width, this.yTop + this.NUM_LANES * this.laneHeight);
        jb.clear();

        // Randomly position some clouds (but don't draw them, yet!).
        for (iCloud = 0; iCloud < this.MAX_CLOUDS; ++iCloud) {
            numClouds += Math.round(Math.random());
        }

        scale = 2 + Math.floor(Math.random() * this.MAX_CLOUD_SCALE);

        for (iCloud = 0; iCloud < numClouds; ++iCloud) {
            newCloud = {glyph: null, xScale: scale, yScale: scale - Math.round(Math.random()), x: 0, y: 0};
            newCloud.glyph = Math.random() < 0.5 ? "cloud01" : "cloud02";
            newCloud.x = Math.floor(Math.random() * (jb.canvas.width - 16 * newCloud.xScale));
            newCloud.y = Math.floor(Math.random() * (jb.canvas.height * game.SKY_HEIGHT - 16 * newCloud.yScale));

            // Add this cloud to the list.
            this.clouds.push(newCloud);
        }
    },

    instructions: function() {
        jb.fonts.printAt("military", 1, 40, "***Sub Shot***", "yellow", 0.5, 0.0, 4);
        jb.fonts.printAt("military", 4, 40, "Sink the enemy sub before it sinks you!`", "gray", 0.5, 0.0, 2);
        jb.fonts.printAt("military", 6, 40, "Place your destroyer in one of the shipping lanes.`", "gray", 0.5, 0.0, 1);
        jb.fonts.printAt("military", 7, 40, "Then, tap a lane to launch an anti-submarine missile.`", "gray", 0.5, 0.0, 1);
        jb.fonts.printAt("military", 8, 40, "After each launch, the sub will surface and fire a torpedo.`", "gray", 0.5, 0.0, 1);
        jb.fonts.printAt("military", 9, 40, "If you survive, you can fire another missile, but the sub`", "gray", 0.5, 0.0, 1);
        jb.fonts.printAt("military", 10, 40, "moves to a new lane each turn. It will never return to a lane`", "gray", 0.5, 0.0, 1);
        jb.fonts.printAt("military", 11, 40, "from which it has already fired.`", "gray", 0.5, 0.0, 1);
        jb.fonts.printAt("military", 13, 40, "<TAP> to start!", "gray", 0.5, 0.0, 2);

        this.message = "<TAP> a blue shipping lane to position your destroyer.";
        jb.listenForTap();
    },

    setupNewGame: function() {
        this.destroyer.score = 0;
        this.destroyer.state = this.STATE.OK;

        this.sub.score = 0;
        this.sub.state = this.STATE.OK;
        this.sub.hidingSpots.length = 0;
    },

    waitForStartTap_loop: function() {
        var bDone = jb.tap.done;

        return !bDone;
    },

    setupPlaceDestroyer: function() {
        jb.listenForTap();
    },

    placeDestroyer_loop: function() {
        var lane = this.laneFromTap();

        this.drawBoard();

        if (lane >= 0) {
            this.destroyer.lane = lane;
            this.destroyer.state = this.STATE.OK;
            jb.startTimer("hideSub");
        }

        return lane < 0;
    },

    hideSub_loop: function() {
        var timePassed = jb.timer("hideSub"),
            bContinueLoop = true;

        this.message = "Sub is hiding";

        if (timePassed < this.HIDE_SUB_TIME * 0.25) {
            this.messageRGB = "0, 0, 0";
        }
        else if (timePassed < this.HIDE_SUB_TIME * 0.5) {
            this.messageRGB = "255, 0, 0";
        }
        else if (timePassed < this.HIDE_SUB_TIME * 0.75) {
            this.messageRGB = "0, 0, 0";
        }
        else {
            this.messageRGB = "255, 0, 0";
        }

        if (jb.timer("hideSub") > this.HIDE_SUB_TIME) {
            this.moveSubToNewLane();
            this.messageRGB = "0, 0, 0";
            this.message = "<Tap> a lane to fire a missile.";
            bContinueLoop = false;
        }

        this.drawBoard();
        this.drawDestroyer();

        return bContinueLoop;
    },

    setupPlayerShot: function() {
        // Proceed to the next phase, where we wait for the player
        // to fire a missile.
        this.messageRGB = "0, 0, 0";
        jb.listenForTap();
    },

    waitForPlayerShot_loop: function() {
        var lane = this.laneFromTap();

        if (lane >= 0) {
            // User selected a valid target lane, so set up the missile launch.
            this.missile.scale_y = 2;
            this.missile.x = this.SHIP.X + this.MISSILE_LAUNCH_X;
            this.missile.y = this.yFromLane(this.destroyer.lane) + this.SHIP.Y + 16 * this.SHIP.SCALE_Y - 8 * this.missile.scale_y;
            this.missile.targetY = Math.round(this.yFromLane(lane) + this.laneHeight * 0.5);
            this.missile.frame = 0;
            this.missile.targetLane = lane;
            jb.startTimer("missileFlame");
            this.message = null;
        }

        this.drawBoard();
        this.drawDestroyer();

        return lane < 0;
    },

    missileUp_loop: function() {
        var missileOnScreen = this.missile.y > -8 * this.missile.scale_y;

        this.missile.y -= Math.round(this.MISSILE_SPEED * jb.time.deltaTime);

        if (jb.timer("missileFlame") > this.FLAME_ANIM_TIME) {
            this.missile.frame += 1;
            this.missile.frame %= this.missile.animFrames.length;
            jb.setTimer("missileFlame", jb.timer("missileFlame") - this.FLAME_ANIM_TIME);
        }

        this.drawBoard();
        this.drawMissile();
        this.drawDestroyer();

        if (!missileOnScreen) {
            // Reverse direction of missile and move it
            // to the opposite side of the screen.
            this.missile.x = jb.canvas.width - 16 * this.SHIP.SCALE_X;
            this.missile.scale_y = -2;
            jb.startTimer("missileFlame");
        }

        return missileOnScreen;
    },

    missileDown_loop: function() {
        var missileAtTarget = this.missile.y > this.missile.targetY;

        this.missile.y += Math.round(this.MISSILE_SPEED * jb.time.deltaTime);

        if (jb.timer("missileFlame") > this.FLAME_ANIM_TIME) {
            this.missile.frame += 1;
            this.missile.frame %= this.missile.animFrames.length;

            jb.setTimer("missileFlame", jb.timer("missileFlame") - this.FLAME_ANIM_TIME);
        }

        this.drawBoard();
        this.drawMissile();
        this.drawDestroyer();

        return !missileAtTarget;
    },

    setMissileSplashdown: function() {
        // Force the missile to end in exactly the right place.
        this.missile.y = this.yForLane(this.missile.targetLane) + Math.round(this.laneHeight * 0.5);

        jb.startTimer("ripples");
    },

    missilesSplashdown_loop: function() {
        var i = 0,
            rippleAlpha = 0,
            radX = 0;

        radX = jb.timer("ripples") * this.RIPPLE_RADIUS;

        this.drawBoard();
        this.drawDestroyer();

        jb.ctxt.save();
        jb.ctxt.translate(this.missile.x + 8 / 2 * this.missile.scale_x, this.missile.y - 8 / 2 * this.missile.scale_y);
        jb.ctxt.scale(1, this.RIPPLE_ASPECT);

        rippleAlpha = 1.0 - radX / (this.RIPPLE_TIME * this.RIPPLE_RADIUS);
        rippleAlpha = Math.max(0, rippleAlpha);

        for (i = 0; i < this.NUM_RIPPLES && radX > 0; ++i) {
            jb.ctxt.beginPath();
            jb.ctxt.fillStyle = "rgba(255, 255, 255, " + rippleAlpha + ")";
            jb.ctxt.arc(0, 0, radX, 0, 2 * Math.PI, false);
            jb.ctxt.fill();

            radX -= this.RIPPLE_SPACING;

            if (radX > 0) {
                jb.ctxt.beginPath();
                jb.ctxt.fillStyle = this.getLaneColor(this.missile.targetLane);
                jb.ctxt.arc(0, 0, radX, 0, 2 * Math.PI, false);
                jb.ctxt.fill();
                radX -= this.RIPPLE_SPACING;
            }
        }

        jb.ctxt.restore();

        if (jb.timer("ripples") >= this.RIPPLE_TIME) {
            // Check for hit on sub.
            if (this.missile.targetLane === this.sub.lane) {
                jb.goto("hitSub");
            }
            else {
                this.message = "Missed. <Tap> to fire again.";
                jb.goto("setupPlayerShot");
            }
        }

        return jb.timer("ripples") < this.RIPPLE_TIME;
    },

    hitSub: function() {
        this.destroyer.score += 1;
        this.sub.state = this.STATE.DEAD;
        jb.startTimer("explosion");
    },

    hitSub_loop: function() {
        // Fireball.
        var rad = 0,
            x = Math.round(this.missile.x + 8 * this.missile.scale_x * 0.5),
            y = Math.round(this.missile.y - 8 * this.missile.scale_y * 0.5),
            yStart = Math.round(y + this.FIREBALL_RAD * 0.0167),
            alpha = Math.max(0, 1.0 - jb.timer("explosion") / this.FIREBALL_TIME);

        this.drawBoard();

        rad = Math.round(jb.timer("explosion") * this.FIREBALL_RAD);
        y -= Math.round(jb.timer("explosion") * this.laneHeight * 0.1);

        jb.ctxt.save();

        jb.ctxt.beginPath();
        jb.ctxt.fillStyle = "rgba(255, 128, 0, " + alpha + ")";
        jb.ctxt.arc(x, y, rad, 0, 2 * Math.PI, false);
        jb.ctxt.fill();

        jb.ctxt.beginPath();
        jb.ctxt.fillStyle = this.getLaneColor(this.missile.targetLane);
        jb.ctxt.fillRect(x - rad, yStart, 2 * rad, this.yForLane(this.missile.targetLane + 1) - yStart);

        this.drawLane(this.missile.targetLane + 1);

        jb.ctxt.beginPath();
        jb.ctxt.fillStyle = "rgba(255, 255, 255, " + Math.sqrt(alpha) + ")";
        jb.ctxt.fillRect(x - Math.round(rad * 1.25), yStart, Math.round(2.5 * rad), 1);

        jb.ctxt.restore();

        this.drawDestroyer();

        return jb.timer("explosion") < this.FIREBALL_TIME;
    },

    setupEndRound: function() {
        jb.listenForTap();

        if (this.sub.state === this.STATE.DEAD) {
            this.messageRGB = "0, 128, 0";
            this.message = "You hit the sub! Score: " + this.destroyer.score + " to " + this.sub.score;
        }
        else if (this.destroyer.state === this.STATE.DEAD) {
            this.messageRGB = "255, 0, 0";
            this.message = "You got hit! Score: " + this.destroyer.score + " to " + this.sub.score;
        }
    },

    endRound_loop: function() {
        this.drawBoard();

        if (this.destroyer.score >= this.WINNING_SCORE) {
            this.drawDestroyer();
        }

        if (this.sub.score >= this.WINNING_SCORE) {
            this.drawSub();
        }

        return !jb.tap.done;
    },

    endRound: function() {
        if (this.destroyer.score >= this.WINNING_SCORE ||
            this.sub.score >= this.WINNING_SCORE) {
            jb.goto("gameOver");
        }
        else if (this.sub.state === this.STATE.DEAD) {
            jb.goto("hideSub_loop");
        }
        else if (this.destroyer === this.STATE.DEAD) {
            jb.goto("setupPlaceDestroyer");
        }
    },

    gameOver: function() {
        this.messageRGB = "0, 0, 0";
        this.message = "<TAP> to play again.";

        if (this.destroyer.score >= this.WINNING_SCORE) {
            this.banner = "YOU WIN!";
        }

        if (this.sub.score >= this.WINNING_SCORE) {
            this.banner = "YOU LOSE";
        }

        jb.listenForTap();
    },

    gameOver_loop: function() {
        this.drawBoard();

        if (this.destroyer.score >= this.WINNING_SCORE) {
            this.banner = "YOU WIN!";
            this.drawDestroyer();
        }

        if (this.sub.score >= this.WINNING_SCORE) {
            this.banner = "YOU LOSE";
            this.drawSub();
        }

        return !jb.tap.done;
    },

    playAgain: function() {
        jb.goto("setupNewGame");
    },

    // Helper Functions ///////////////////////////////////////////////////////
    showFPS: function() {
        var i = 0,
            total = 0;

        this.iFPS += 1;
        this.iFPS %= this.fps.length;

        this.fps[this.iFPS] = jb.time.deltaTime;

        for (i=0; i<this.fps.length; ++i) {
            total += this.fps[i];
        }

        total = Math.round(total / this.fps.length * 1000);
        this.message = "Ave DT: " + total + " ms";
    },

    laneFromTap: function() {
        var lane = -1;

        if (jb.tap.done) {
            lane = (jb.tap.y - this.yTop) / this.laneHeight;

            if (lane >= 0) {
                lane = Math.floor(lane);
                lane = Math.min(lane, this.NUM_LANES - 1);
            }
            else {
                // User tapped the sky. Try again.
                jb.listenForTap();
            }
        }

        return lane;
    },

    yFromLane: function(lane) {
        return Math.round(this.yTop + Math.min(Math.max(0, lane), this.NUM_LANES - 1) * this.laneHeight);
    },

    yForLane: function(lane) {
        return lane * this.laneHeight + this.yTop;
    },

    getLaneColor: function(lane) {
        return "rgba(0, 0, " + 25 * (lane + 1) + ", 1)";
    },

    drawBoard: function() {
        var iWave = 0,
            iCloud = 0;

        // Fill background
        jb.setBackColor(game.SKY_COLOR);
        jb.clear();

        for (iWave = 0; iWave < game.NUM_LANES; ++iWave) {
            jb.ctxt.fillStyle = this.getLaneColor(iWave);
            jb.ctxt.fillRect(0, this.yTop + this.laneHeight * iWave, jb.canvas.width, this.laneHeight); 
        }

        jb.ctxt.fillRect(0, this.yTop + this.laneHeight * (game.NUM_LANES - 1), jb.canvas.width, jb.canvas.height - this.laneHeight * (game.NUM_LANES - 1));

        // Draw the clouds
        for (iCloud = 0; iCloud < this.clouds.length; ++iCloud) {
            jb.glyphs.draw("16x16",
                           this.clouds[iCloud].glyph,
                           this.clouds[iCloud].x,
                           this.clouds[iCloud].y,
                           this.clouds[iCloud].xScale,
                           this.clouds[iCloud].yScale);
        }

        if (this.message) {
            jb.colorRows("rgba(" + this.messageRGB + ", 0.85)", 3);
            jb.fonts.printAt("military", 3, 40, this.message, "white", 0.5, 0.5, 1);
        }

        if (this.banner) {
            jb.fonts.printAt("military", Math.round(jb.rows / 2), 40, this.banner, "white", 0.5, 0.0, 4);
        }
    },

    drawLane: function(lane) {
        if (lane < this.NUM_LANES) {
            jb.ctxt.fillStyle = this.getLaneColor(lane);
            jb.ctxt.fillRect(0, this.yTop + this.laneHeight * lane, jb.canvas.width, this.laneHeight); 
        }
    },

    drawDestroyer: function() {
        if (this.destroyer.state === this.STATE.OK) {
            jb.glyphs.draw("16x16",
                           "destroyerRight",
                           this.SHIP.X,
                           this.yFromLane(this.destroyer.lane) + this.SHIP.Y,
                           this.SHIP.SCALE_X,
                           this.SHIP.SCALE_Y);
        }
    },

    drawSub: function() {
        if (this.sub.state === this.STATE.OK) {
            jb.glyphs.draw("16x16",
                           "submarineLeft",
                           jb.canvas.width - this.SHIP.X - 16 * this.SHIP.SCALE_X,
                           this.yFromLane(this.sub.lane) + this.SHIP.Y,
                           this.SHIP.SCALE_X,
                           this.SHIP.SCALE_Y);
        }
    },

    drawMissile: function() {
        jb.glyphs.draw("8x8",
                       this.missile.animFrames[this.missile.frame],
                       this.missile.x,
                       this.missile.y,
                       this.missile.scale_x,
                       this.missile.scale_y);
    },

    moveSubToNewLane: function() {
        var bHidden = false,
            lane = 0,
            i = 0;

        lane = Math.floor(Math.random() * this.NUM_LANES);
        while (!bHidden) {
            bHidden = true;

            // Look through the hiding spots already used...
            for (i=0; i<this.sub.hidingSpots.length; ++i) {
                // ...if this is a used lane...
                if (this.sub.hidingSpots[i] === lane) {
                    // ...move to the next lane...
                    lane = lane + 1;

                    // ...wrap around, if necessary...
                    lane = lane % this.NUM_LANES;

                    // ...and try again with this new lane.
                    bHidden = false;
                    break;
                }
            }
        }

        this.sub.lane = lane;
        this.sub.hidingSpots.push(this.sub.lane);
    }
};

// Start the game!
window.onload = function() {
    jb.run(game);
};
