///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    spriteImages: {},
    tiles: {},
    dungeonCard: null,
    cameraManager: null,
    dustParticle: null,
    spurtParticle: null,
    readoutParticle: null,
    adventurer: null,
    monster: null,
    lootParticles: {unused: [], used: []},
    diceBay: null,
    cameraZoomTime: 1.0,  // NOT constant!
    GROW_PHASE_TIME: 0.1,
    FADE_PHASE_TIME: 0.33,
    CAMERA_FADE_TIME: 0.5,
    CAMERA_WHITEOUT_TIME: 0.3,
    NUM_LOOT_PARTICLES: 100,
    LOOT_WIDTH: 16,
    CELL: {WIDTH: 24, HEIGHT: 24},

    lpID: 0,

    start: function() {
      this.spriteImages["dungeonTiles"] = resources.loadImage("oryx_16bit_fantasy_world_trans.png", "./res/fantasy art/");
      this.spriteImages["creatureTiles"] = resources.loadImage("oryx_16bit_fantasy_creatures_trans.png", "./res/fantasy art/");
      this.spriteImages["FXtiles"] = resources.loadImage("oryx_16bit_fantasy_fx_trans.png", "./res/fantasy art/");
      this.spriteImages["slashParticle"] = resources.loadImage("singleSlash.png", "./res/particles/");
      this.spriteImages["lootTiles"] = resources.loadImage("oryx_16bit_fantasy_items_trans.png", "./res/fantasy art/");
    },

    do_waitForResources: function() {
      jb.until(resources.loadComplete());
    },

    initSprites: function() {
      var sheets = [],
          i = 0,
          knightIdle = null,
          beholderIdle = null,
          beholderAwaitDamage = null,
          dustGrow = null,
          dustFade = null,
          slashFade = null;

      jb.setViewScale(2);
      jb.setViewOrigin(0, 0);

      this.tiles["dungeonBack"] = jb.sprites.addSheet("dungeonBack", this.spriteImages["dungeonTiles"], 24, 24, 1, 27, 24, 24);
      this.tiles["dungeonFore"] = jb.sprites.addSheet("dungeonFore", this.spriteImages["dungeonTiles"], 696, 24, 1, 27, 24, 24);
      this.tiles["creature01"] = jb.sprites.addSheet("creature01", this.spriteImages["creatureTiles"], 24, 24, 18, 22, 24, 24);
      this.tiles["fx_24x24"] = jb.sprites.addSheet("fx_24x24", this.spriteImages["FXtiles"], 24, 24, 20, 10, 24, 24);
      this.tiles["fx_32x32"] = jb.sprites.addSheet("fx_32x32", this.spriteImages["FXtiles"], 288, 32, 11, 8, 32, 32);
      this.tiles["slashParticle"] = jb.sprites.addSheet("slashParticle", this.spriteImages["slashParticle"], 0, 0, 1, 1, 192, 3);
      this.tiles["slashCreatures"] = jb.sprites.addSheet("slashCreatures", this.spriteImages["creatureTiles"], 24, 24, 1, 1, 24, 12);
      this.tiles["loot"] = jb.sprites.addSheet("loot", this.spriteImages["lootTiles"], 16, 16, 14, 22, 16, 16);

      knightIdle = jb.sprites.createState([{row: 0, col: 0}, {row: 1, col: 0}], 0.33, false, null);
      beholderIdle = jb.sprites.createState([{row: 12, col: 4}, {row: 13, col: 4}], 0.33, false, null);
      beholderAwaitDamage = jb.sprites.createState([{row: 12, col: 4}], 1.0, false, null);
      dustGrow = jb.sprites.createState([{row: 10 , col: 4}], this.GROW_PHASE_TIME, false, null);
      dustFade = jb.sprites.createState([{row: 10 , col: 5}], this.FADE_PHASE_TIME, false, null);

      this.adventurer = blueprints.build("adventurer", "creature01", {"idle" : knightIdle}, "idle", 0, 0);
      this.monster = blueprints.build("monster", "creature01", {"idle" : beholderIdle, "awaitDamage" : beholderAwaitDamage}, "idle", 0, 0, 15 + Math.round(Math.random() * 5), this.tiles["slashCreatures"], [{row:24, col: 4}, {row: 25, col: 4}]);
      this.dustParticle = blueprints.build("dustParticle", "fx_32x32", {"grow" : dustGrow, "fade" : dustFade}, "grow", 0, 0);
      this.slashParticle = blueprints.build("slashParticle", "slashParticle");
      this.spurtParticle = blueprints.build("spurtParticle", "fx_32x32");
      this.readoutParticle = blueprints.build("readoutParticle");
      this.diceBay = blueprints.build("diceBay", Math.round(jb.canvas.width / (2 * jb.viewScale)), Math.round(jb.canvas.height * 0.875 / jb.viewScale));

      for (i=0; i<this.NUM_LOOT_PARTICLES; ++i) {
        this.lootParticles.unused.push(blueprints.build("lootParticle", "goldCoin", "loot", 3, 8, this.tiles["fx_24x24"], [{row: 19, col: 1}]));
        this.lootParticles.unused[i].swipeableActive = false;
      }

      this.adventurer.spriteSetScale(-1, 1);
      this.adventurer.setTarget(this.monster);

      sheets.push(this.tiles["dungeonBack"]);
      sheets.push(this.tiles["dungeonFore"]);
      this.dungeonCard = new rmk.DungeonCard(sheets);

      this.dungeonCard.setCard("hallway01");
      rmk.adventureParty.addMember(this.adventurer);
      rmk.monsterParty.addMember(this.monster);

      this.cameraManager = blueprints.build("cameraManager");
      this.cameraManager.startFadeOut();

      jb.messages.listen("dropLoot", this);
      jb.messages.listen("resetFight", this);

      jb.messages.send("setCombatOrigin",
                       Math.round(jb.canvas.width / (2 * jb.viewScale) - this.dungeonCard.getWidth() / 2),
                       Math.round(jb.canvas.height / (2 * jb.viewScale) - this.dungeonCard.getHeight() / 2));

      jb.listenForTap();
    },

    do_waitForPlayerTapped: function() {
      this.updateScene();
      this.drawScene();

      jb.until(jb.tap.touched === this.adventurer);
    },

    startZoomIn: function() {
      this.cameraManager.startZoomAndScale(this.adventurer.bounds.l- jb.canvas.width * 0.25 / jb.viewScale,
                                           this.adventurer.bounds.t - jb.canvas.height * 0.25 / jb.viewScale,
                                           3);
      jb.gosub("do_waitForTransitions");
    },

    playerAttack: function() {
      this.adventurer.startDash();
      this.dustParticle.emitAt(this.adventurer.bounds.l + this.adventurer.bounds.halfWidth,
                               this.adventurer.bounds.t + this.adventurer.bounds.halfHeight);

      jb.gosub("do_waitForTransitions");
    },

    startZoomOut: function() {
      this.cameraManager.startZoomAndScale(0, 0, 2);
      this.adventurer.startReset();

      jb.gosub("do_waitForTransitions");
    },

    restart: function() {
      jb.goto("do_waitForPlayerTapped");
    },

    // API R&D Area ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    // Subroutines ////////////////////////////////////////////////////////////
    do_WaitForTransitions: function() {
      this.updateScene();
      this.drawScene();

      jb.while(jb.transitions.isTransitioning());
    },

    listenForTap: function() {
      jb.listenForSwipe();
      jb.listenForTap();
    },

    do_waitForPlayerTap: function() {
      this.updateScene();
      this.drawScene();

      jb.until(jb.tap.done && this.lootParticles.used.length === 0);
    },

    endWaitForTransitions: function() {
      jb.end();
    },

    // Helper Functions ///////////////////////////////////////////////////////
    resetFight: function() {
      if (this.monster.isDead()) {
        this.monster.reanimate();
      }
    },

    getDropX: function(iCur, iMax) {
      // TODO: generalize this method to work with any source and target.
      var dx = this.monster.bounds.l - (this.adventurer.startX + this.adventurer.bounds.w + this.LOOT_WIDTH),
          dist = Math.round(dx * iCur / iMax);

          dist += dx / iMax * Math.random();

      return Math.round(this.adventurer.startX + this.adventurer.bounds.w + this.LOOT_WIDTH * 0.5 + dist - (this.monster.bounds.l + this.monster.bounds.halfWidth));
    },

    dropLoot: function(nDrops) {
      var i = 0,
          item = null,
          distX;

      for (i=0; i<nDrops; ++i) {
        distX = this.getDropX(nDrops - i - 1, nDrops);
        item = this.getNextFreeLoot();
        item.emitAt(this.monster.bounds.l + this.monster.bounds.halfWidth,
                    this.monster.bounds.t + this.monster.bounds.halfHeight,
                    distX,
                    this.monster.bounds.t + this.monster.bounds.h,
                    "goldCoin");
      }
    },

    getNextFreeLoot: function() {
      var newLoot = null;

      if (this.lootParticles.unused.length) {
        newLoot = this.lootParticles.unused.pop();
      }
      else {
        newLoot = this.lootParticles.used.shift();
      }

      this.lootParticles.used.push(newLoot);

      return newLoot;
    },

    collectLoot: function(collectedLoot) {
      // TODO: call the "collection" function to
      // add loot to player's inventory, etc.

      jb.removeFromArray(this.lootParticles.used, collectedLoot, true);
      this.lootParticles.unused.push(collectedLoot);
    },

    updateScene: function() {
      this.dustParticle.spriteUpdate(jb.time.deltaTime);      
      this.slashParticle.spriteUpdate(jb.time.deltaTime);
      this.spurtParticle.spriteUpdate(jb.time.deltaTime);
      this.updateLootParticles(jb.time.deltaTime);
      rmk.adventureParty.update(jb.time.deltaTime);
      rmk.monsterParty.update(jb.time.deltaTime);
    },

    drawScene: function() {
      jb.clear();

      this.dungeonCard.draw(jb.ctxt);
      this.dustParticle.spriteDraw(jb.ctxt);
      this.drawLootParticles(jb.ctxt);
      rmk.monsterParty.draw(jb.ctxt);
      rmk.adventureParty.draw(jb.ctxt);
      this.spurtParticle.spriteDraw(jb.ctxt);
      this.readoutParticle.draw(jb.ctxt);
      this.slashParticle.spriteDraw(jb.ctxt);
    },

    drawGUI: function(ctxt) {
      if (this.diceBay && this.cameraManager) {
        ctxt.save();
        ctxt.scale(2, 2);

        this.diceBay.draw(ctxt);

        ctxt.restore();
        
        this.cameraManager.draw(ctxt);
      }
    },

    updateLootParticles: function(dt) {
      var i = 0;

      for (i=0; i<this.lootParticles.used.length; ++i) {
        that = this.lootParticles.used[i];
        this.lootParticles.used[i].spriteUpdate(dt);
      }
    },

    drawLootParticles: function(ctxt) {
      var i = 0,
          bounds = null;

      for (i=0; i<this.lootParticles.used.length; ++i) {
        this.lootParticles.used[i].draw(jb.ctxt);

        // DEBUG        
        // this.lootParticles.used[i].bounds.draw("green");

        // jb.ctxt.strokeStyle = "yellow";
        // jb.ctxt.beginPath();

        // bounds = this.adventurer.bounds;
        // jb.ctxt.moveTo(bounds.l + bounds.halfWidth, bounds.t + bounds.halfHeight);

        // bounds = this.lootParticles.used[i].bounds;
        // jb.ctxt.lineTo(bounds.l + bounds.halfWidth, bounds.t + bounds.halfHeight);

        // jb.ctxt.closePath();
        // jb.ctxt.stroke();
      }
    },
};




