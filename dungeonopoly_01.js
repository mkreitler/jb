///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    TILE_WIDTH: 24,
    TILE_HEIGHT: 24,
    TILE_SCALE: 2,
    TITLE_TILE_ROWS: 6,

    titleFont: null,
    textFont: null,
    spriteImages: {},
    tiles: {},
    fighterAnimState: {},
    thiefAnimState: {},
    mageAnimState: {},
    fighter: null,
    thief: null,
    mage: null,
    bStepComplete: false,
    testChoice: null,

    start: function() {
      this.titleFont = resources.loadFont("Fipps-Regular", "./res_light/fonts", "otf");
      this.textFont = resources.loadFont("alagard", "./res_light/fonts", "ttf");
      this.spriteImages["dungeonTiles"] = resources.loadImage("oryx_16bit_fantasy_world_trans.png", "./res_light/fantasy art/");
      this.spriteImages["characterTiles"] = resources.loadImage("oryx_16bit_fantasy_creatures_trans.png", "./res_light/fantasy art/");
    },

    do_waitForResources: function() {
      jb.until(resources.loadComplete());
    },

    startTitleScreen: function() {
      jb.backColor = "gray";

      this.initTitleScreenSprites();

      this.bStepComplete = false;

      jb.listenForTap();
    },

    do_titleScreen: function() {
      var i = 0,
          j = 0;

      jb.clear();

      for (i=0; i<jb.canvas.width / (this.TILE_SCALE * this.TILE_WIDTH); ++i) {
          this.tiles["dungeonBack"].drawTile(jb.ctxt, 0, 0, 0, i, 0, 11, this.TILE_SCALE, this.TILE_SCALE);
          this.tiles["dungeonBack"].drawTile(jb.ctxt, 0, this.TITLE_TILE_ROWS * this.TILE_HEIGHT * this.TILE_SCALE, 0, i, 0, 11, this.TILE_SCALE, this.TILE_SCALE);

          for (j=1; j<this.TITLE_TILE_ROWS; ++j) {
            this.tiles["dungeonBack"].drawTile(jb.ctxt, 0, 0, j, i, 0, 3, this.TILE_SCALE, this.TILE_SCALE);
          }
      }

      jb.setOpenTypeFont(this.titleFont, 50, 1.45);
      jb.drawOpenTypeFontAt(jb.ctxt, "DUNGEONOPOLY!", jb.canvas.width / 2, jb.canvas.height / 4, "gray", "black", 0.5, 1.0);

      jb.setOpenTypeFont(this.textFont, 25, 2.75);
      jb.drawOpenTypeFontAt(jb.ctxt, "Choose a Test Character", jb.relXtoScreenX(0.5), jb.relYtoScreenY(0.6), "black", "yellow", 0.5, 1.0);

      this.fighter.spriteUpdate(jb.time.deltaTime);
      this.thief.spriteUpdate(jb.time.deltaTime);
      this.mage.spriteUpdate(jb.time.deltaTime);

      this.fighter.spriteDraw(jb.ctxt);
      this.thief.spriteDraw(jb.ctxt);
      this.mage.spriteDraw(jb.ctxt);

      jb.until(this.bStepComplete);
    },

    end: function() {
      jb.print("Chose " + this.testChoice + "`");
      jb.end();
    },

    // API R&D Area ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    // Subroutines ////////////////////////////////////////////////////////////
    // ------------------------------------------
    do_WaitForTransitions: function() {
      this.updateScene();
      this.drawScene();

      jb.while(jb.transitions.isTransitioning());
    },

    endWaitForTransitions: function() {
      jb.end();
    },

    // ------------------------------------------
    do_WaitForLootTransitions: function() {
      this.updateScene();
      this.drawScene();

      jb.while(jb.transitions.isTransitioning());
    },

    // ------------------------------------------
    listenForGestures: function() {
      jb.listenForSwipe();
      jb.listenForTap();
    },

    do_waitForPlayerGesture: function() {
      this.updateScene();
      this.drawScene();

      jb.until(jb.tap.done || jb.swipe.done);
    },

    endWaitForTransitionsAndGestures: function() {
      jb.end();
    },

    // Helper Functions ///////////////////////////////////////////////////////
    testFighter: function() {
      this.testChoice = "<Fighter>";
      this.bStepComplete = true;
    },

    testThief: function() {
      this.testChoice = "<Thief>";
      this.bStepComplete = true;
    },

    testMage: function() {
      this.testChoice = "<Mage>";
      this.bStepComplete = true;
    },

    initTitleScreenSprites: function() {
      this.tiles["dungeonBack"] = jb.sprites.addSheet("dungeonBack", this.spriteImages["dungeonTiles"], 24, 24, 1, 27, this.TILE_WIDTH, this.TILE_WIDTH);
      this.tiles["dungeonFore"] = jb.sprites.addSheet("dungeonFore", this.spriteImages["dungeonTiles"], 696, 24, 1, 27, this.TILE_WIDTH, this.TILE_WIDTH);
      this.tiles["characters"] = jb.sprites.addSheet("characters", this.spriteImages["characterTiles"], 24, 24, 18, 22, this.TILE_WIDTH, this.TILE_HEIGHT);

      this.fighterAnimState["idle"] = jb.sprites.createState([{row: 0, col: 9}, {row: 1, col: 9}], 0.33, false, null);
      this.thiefAnimState["idle"] = jb.sprites.createState([{row: 6, col: 1}, {row: 7, col: 1}], 0.33, false, null);
      this.mageAnimState["idle"] = jb.sprites.createState([{row: 2, col: 7}, {row: 3, col: 7}], 0.33, false, null);

      this.fighter = blueprints.build("menuCharacter", "characters", {"idle" : this.fighterAnimState["idle"]}, "idle", 0, 0, this.testFighter.bind(this));
      this.thief = blueprints.build("menuCharacter", "characters", {"idle" : this.thiefAnimState["idle"]}, "idle", 0, 0, this.testThief.bind(this));
      this.mage = blueprints.build("menuCharacter", "characters", {"idle" : this.mageAnimState["idle"]}, "idle", 0, 0, this.testMage.bind(this));

      this.fighter.spriteSetScale(-2, 2);
      this.thief.spriteSetScale(-2, 2);
      this.mage.spriteSetScale(-2, 2);

      this.fighter.spriteSetAnchor(0.5, 0.5);
      this.thief.spriteSetAnchor(0.5, 0.5);
      this.mage.spriteSetAnchor(0.5, 0.5);

      this.fighter.spriteMoveTo(jb.relXtoScreenX(0.4), jb.relYtoScreenY(0.67));
      this.thief.spriteMoveTo(jb.relXtoScreenX(0.5), jb.relYtoScreenY(0.67));
      this.mage.spriteMoveTo(jb.relXtoScreenX(0.6), jb.relYtoScreenY(0.67));
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
blueprints.draft(
  "menuCharacter",

  // Data
  {
    onTouchedCallback: null,
  },

  // Methods
  {
    onCreate: function(sheet, states, startState, x, y, touchedCallback) {
      this.spriteSetSheet(sheet);
      this.spriteAddStates(states);

      if (startState) {
          this.spriteSetState(startState);
      }

      x = x ? x : 0;
      y = y ? y : 0;

      this.spriteMoveTo(x, y);

      this.onTouchedCallback = touchedCallback;

      jb.messages.answer("doesDieOverlap", this);
    },

    onTouched: function(x, y) {
      if (this.onTouchedCallback) {
        this.onTouchedCallback();
      }
    },

    onUntouched: function(x, y) {
    },
  }
);

blueprints.make("menuCharacter", "touchable");
blueprints.make("menuCharacter", "sprite");



