///////////////////////////////////////////////////////////////////////////////
// Sprite Test
///////////////////////////////////////////////////////////////////////////////
jb.program = {
    spriteImages: {},
    tiles: {},
    dungeonCard: null,
    cameraManager: null,
    worldMap: null,
    waterColor: "rgb(56, 96, 168)",

    CELL: {WIDTH: 24, HEIGHT: 24},
    TILE_LOOKUP: [{row:0, col:0}, // 0
                  {row:1, col:6}, // 1
                  {row:1, col:1}, // 2
                  {row:0, col:8}, // 3
                  {row:1, col:4}, // 4
                  {row:1, col:17}, // 5
                  {row:0, col:7}, // 6
                  {row:0, col:5}, // 7
                  {row:1, col:3}, // 8
                  {row:0, col:9}, // 9
                  {row:1, col:16}, // 10
                  {row:0, col:4}, // 11
                  {row:0, col:6}, // 12
                  {row:0, col:3}, // 13
                  {row:0, col:2}, // 14
                  {row:0, col:1}, // 15
                ],

    start: function() {
      this.spriteImages["dungeonTiles"] = resources.loadImage("oryx_16bit_fantasy_world_trans.png", "./res/fantasy art/");
    },

    do_waitForResources: function() {
      jb.until(resources.loadComplete());
    },

    initSprites: function() {
      var sheets = [];

      jb.setViewScale(1);
      jb.setViewOrigin(0, 0);
      jb.setBackColor(this.waterColor);

      this.tiles["dungeonBack"] = jb.sprites.addSheet("dungeonBack", this.spriteImages["dungeonTiles"], 24, 24, 1, 27, 24, 24);
      this.tiles["dungeonFore"] = jb.sprites.addSheet("dungeonFore", this.spriteImages["dungeonTiles"], 696, 24, 1, 27, 24, 24);
      this.tiles["earth"] = jb.sprites.addSheet("earth", this.spriteImages["dungeonTiles"], 696, 384, 19, 25, 24, 24);
      this.tiles["water"] = jb.sprites.addSheet("water", this.spriteImages["dungeonTiles"], 120, 672, 11, 3, 24, 24);

      sheets.push(this.tiles["dungeonBack"]);
      sheets.push(this.tiles["dungeonFore"]);

      this.dungeonCard = new rmk.DungeonCard(sheets);
      this.dungeonCard.setCard("hallway01");

      this.worldMap = this.createWorldMap();

      this.cameraManager = blueprints.build("cameraManager");
      this.cameraManager.startFadeOut();

      this.createWorldMap();

      jb.listenForTap();
    },

    do_waitForAdventurerAttack: function() {
      this.updateScene();
      this.drawScene();

      jb.until(jb.tap.done);
    },

    end: function() {
      jb.end();
    },

    ///////////////////////////////////////////////////////////////////////////
    // API R&D Area
    ///////////////////////////////////////////////////////////////////////////
    TERRAIN: {
      nSEEDS: 7,
      ANIM_PERIOD: 0.67,
      MASS_VARIANCE: 0.2,
      MIN_MASS_PERCENTAGE: 50,
      TYPES: {
        "water": {tileSet: "water", row: 3, col: 0, type: "water"},
        "land": {tileSet: "earth", row: 0, col: 3, type: "land"},
      }
    },

    createWorldMap: function() {
      var cols = Math.floor(jb.canvas.width / jb.program.CELL.WIDTH),
          rows = Math.floor(jb.canvas.height / jb.program.CELL.HEIGHT),
          iRow = 0,
          iCol = 0,
          row = 0,
          col = 0,
          pass = 0,
          bounds = {xMin:cols + 1, xMax:-1, yMin:rows + 1, yMax: -1},
          i = 0,
          seeds = 0,
          nLand = 0,
          iro = 0,
          ico = 0,
          dRow = 0,
          dCol = 0,
          flatEarth = [],
          newEarth = [],
          baseBit = 0,
          massPercentage = this.TERRAIN.MIN_MASS_PERCENTAGE,
          tileVal = 0;

      // Initialize.
      this.world = {grid: [], timer: 0, animOffset: 0};
      for (iRow = 0; iRow < rows; ++iRow) {
        this.world.grid.push([]);
        for (iCol = 0; iCol < cols; ++iCol) {
          this.world.grid[iRow].push(this.TERRAIN.TYPES["water"]);
        }
      }

      // Create base terrain.
      for (seeds = 0; seeds<this.TERRAIN.nSEEDS;) {
        row = Math.round(Math.random() * rows);
        col = Math.round(Math.random() * cols);

        if (row > 0 && row < rows - 1 &&
            col > 0 && col < cols - 1 &&
          this.world.grid[row][col].type === "water") {
          flatEarth.push({row:row, col:col, tileVal:0});
          this.world.grid[row][col] = flatEarth[flatEarth.length - 1];
          if (row < bounds.yMin) {
            bounds.yMin = row;
          }
          if (row > bounds.yMax) {
            bounds.yMax = row;
          }
          if (col < bounds.xMin) {
            bounds.xMin = col;
          }
          if (col > bounds.xMax) {
            bounds.xMax = col;
          }
          seeds += 1;
        }
      }

//      while (this.TERRAIN.MIN_MASS_PERCENTAGE > Math.random() * Math.floor(flatEarth.length / (rows * cols) * 100)) {
      massPercentage = Math.round(massPercentage * (Math.random() * this.TERRAIN.MASS_VARIANCE - this.TERRAIN.MASS_VARIANCE * 0.5) + 1.0);
      while (this.TERRAIN.MIN_MASS_PERCENTAGE > Math.floor(flatEarth.length / (rows * cols) * 100)) {
        // Grow the landmass.
        for (i=0; i<flatEarth.length; ++i) {
          jb.randomizeArray(flatEarth);
          for (iRow=flatEarth[i].row - 1; iRow <= flatEarth[i].row + 1; ++iRow) {
            for (iCol=flatEarth[i].col - 1; iCol <= flatEarth[i].col + 1; ++iCol) {
              if (iRow > 0 && iRow < rows - 1 &&
                  iCol > 0 && iCol < cols - 1 &&
                  this.world.grid[iRow][iCol].type === "water") {
                for (iro = -1; iro <= 1; iro++) {
                  for (ico = -1; ico <= 1; ico++) {
                    if (typeof(this.world.grid[iRow + iro][iCol + ico].type) === "undefined") {
                      nLand += 1;
                    }
                  }
                }

                if (Math.floor(Math.random() * 9) < nLand) {
                  newEarth.push({row: iRow, col: iCol, tileVal:0});
                  this.world.grid[iRow][iCol] = newEarth[newEarth.length - 1];

                  if (iRow < bounds.yMin) {
                    bounds.yMin = iRow;
                  }
                  if (iRow > bounds.yMax) {
                    bounds.yMax = iRow;
                  }
                  if (iCol < bounds.xMin) {
                    bounds.xMin = iCol;
                  }
                  if (iCol > bounds.xMax) {
                    bounds.xMax = iCol;
                  }
                }
              }
            }
          }
        }

        for (i=0; i<newEarth.length; ++i) {
          flatEarth.push(newEarth[i]);
        }

        newEarth.length = 0;
      }

      // Center.
      dRow = Math.floor((rows - 2 - (bounds.yMax - bounds.yMin + 1)) * 0.5);
      dCol = Math.floor((cols - 2 - (bounds.xMax - bounds.xMin + 1)) * 0.5);

      if (dRow > 0) {
        if (rows - bounds.yMax > bounds.yMin) {
          // More space at the bottom. Shift down.
          while (dRow > 0) {
            this.world.grid.unshift(this.world.grid.pop());
            dRow -= 1;
          }
        }
        else {
          // More space at the top. Shift up.
          while (dRow > 0) {
            this.world.grid.push(this.world.grid.shift());
            dRow -= 1;
          }
        }
      }

      if (dCol > 0) {
        for (iRow=0; iRow<rows; ++iRow) {
          if (cols - bounds.xMax > bounds.xMin) {
            // More space on the right side. Shift right.
            this.world.grid[iRow].unshift(this.world.grid[iRow].pop());
          }
          else {
            // More space on the left side. Shift left.
            this.world.grid[iRow].push(this.world.grid[iRow].shift());
          }

          dCol -= 1;
        }
      }

      // Adjust land tile shapes depending on surrounding terrain.
      for (iRow = 0; iRow < rows; ++iRow) {
        for (iCol = 0; iCol < cols; ++iCol) {
          tile = this.world.grid[iRow][iCol];
          
          if (typeof(tile.tileVal) !== "undefined") {
            tile.tileVal = 0;

            if (typeof(this.world.grid[iRow - 1][iCol].tileVal) !== "undefined") {
              tile.tileVal += 1;
            }
            if (typeof(this.world.grid[iRow][iCol + 1].tileVal) !== "undefined") {
              tile.tileVal += 2;
            }
            if (typeof(this.world.grid[iRow + 1][iCol].tileVal) !== "undefined") {
              tile.tileVal += 4;
            }
            if (typeof(this.world.grid[iRow][iCol - 1].tileVal) !== "undefined") {
              tile.tileVal += 8;
            }
          }
        }
      }

      // Define World object.
      this.world.update = function(dt) {
        this.timer += dt;
        this.animOffset = Math.floor(this.timer / jb.program.TERRAIN.ANIM_PERIOD) % 2;
      }

      this.world.draw = function(ctxt) {
        var iRow = 0,
            iCol = 0,
            row = null,
            tile = null,
            tiles = jb.program.tiles;

        if (ctxt && tiles) {
          for (iRow = 0; iRow < rows; ++iRow) {
            row = this.grid[iRow];
            for (iCol = 0; iCol < cols; ++iCol) {
              tile = row[iCol];

              if (tile.tileVal) {
                tiles["earth"].draw(ctxt, iCol * jb.program.CELL.WIDTH, iRow * jb.program.CELL.HEIGHT, jb.program.TILE_LOOKUP[tile.tileVal].row, jb.program.TILE_LOOKUP[tile.tileVal].col);
              }
              else if (tile.tileSet && tiles[tile.tileSet]) {
                tiles[tile.tileSet].draw(ctxt, iCol * jb.program.CELL.WIDTH, iRow * jb.program.CELL.HEIGHT, tile.row + (tile.row + this.animOffset) % 2, tile.col);
              }
            }
          }
        }
      }

      // 1) Create the landmass.
      

      // 2) Seed terrain types into the world.
      
    },

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
    do_WaitForTransitionsAndGestures: function() {
      this.updateScene();
      this.drawScene();

      jb.while(jb.transitions.isTransitioning());
    },

    listenForGestures: function() {
      jb.listenForSwipe();
      jb.listenForTap();
    },

    do_waitForPlayerGesture: function() {
      this.updateScene();
      this.drawScene();

      jb.until(jb.tap.done);
    },

    endWaitForTransitionsAndGestures: function() {
      jb.end();
    },

    // Helper Functions ///////////////////////////////////////////////////////
    updateScene: function() {
      if (this.world) {
        this.world.update(jb.time.deltaTime);
      }
    },

    drawScene: function() {
      jb.clear();

      // this.dungeonCard.draw(jb.ctxt);

      if (this.world) {
        this.world.draw(jb.ctxt);
      }
    },

    drawGUI: function(ctxt) {
      jb.assert(ctxt, "Undefined ctxt!");

      if (this.diceBay && this.cameraManager) {
        ctxt.save();
        ctxt.scale(2, 2);

        // Draw GUI here...

        ctxt.restore();

        this.cameraManager.draw(ctxt);
      }
    },
};




