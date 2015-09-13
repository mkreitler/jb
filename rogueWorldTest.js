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
      jb.resize(Math.floor(jb.canvas.width / this.CELL.WIDTH) * this.CELL.WIDTH,
                Math.floor(jb.canvas.height / this.CELL.HEIGHT) * this.CELL.HEIGHT);
      this.spriteImages["dungeonTiles"] = resources.loadImage("oryx_16bit_fantasy_world_trans.png", "./res/fantasy art/");
      // jb.listenForTap();
    },

    do_waitForResources: function() {
      jb.until(resources.loadComplete());
    },

    // do_waitForDebug: function() {
    //  jb.until(jb.tap.done);
    // },

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
      ROUGHAGE: 4,
      ROUGHAGE_VARIANCE: 3,
      ROUGHOUT: 4,
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
          bounds = {xMin:Number.MAX_VALUE, xMax:-1, yMin:Number.MAX_VALUE, yMax: -1},
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
          roughage = 0,
          roughout = 0,
          visited = [],
          massPercentage = this.TERRAIN.MIN_MASS_PERCENTAGE,
          tileVal = 0;

      // Initialize.
      this.world = {grid: [], timer: 0, animOffset: 0, landMasses: []};
      for (iRow = 0; iRow < rows; ++iRow) {
        this.world.grid.push([]);
        for (iCol = 0; iCol < cols; ++iCol) {
          this.world.grid[iRow].push(this.TERRAIN.TYPES["water"]);
        }
      }

      this.world.addTileToMass = function(bAddLandMass, iRow, iCol, visited) {
        var tile = this.grid[iRow][iCol],
            i = 0,
            id = -1,
            landMass = null;

          if (tile.tileVal && visited.indexOf(tile) < 0) {
            if (bAddLandMass) {
              this.landMasses.push({tiles: [], bounds: {minRow: Number.MAX_VALUE, maxRow: -1, minCol: Number.MAX_VALUE, maxCol: -1}});
            }

            id = this.landMasses.length - 1;

            visited.push(tile);

            tile.landMass = id;
            this.landMasses[id].tiles.push(tile);

            this.addTileToMass(false, iRow - 1, iCol, visited);
            this.addTileToMass(false, iRow, iCol + 1, visited);
            this.addTileToMass(false, iRow + 1, iCol, visited);
            this.addTileToMass(false, iRow, iCol - 1, visited);
          }

          return landMass;
      };

      this.world.boundLandMasses = function() {
        var iMass = 0,
            iTile = 0,
            mass = null,
            tile = null;

        for (iMass=0; iMass<this.landMasses.length; ++iMass) {
          for (iTile=0; iTile<this.landMasses[iMass].tiles.length; ++iTile) {
            mass = this.landMasses[iMass];
            tile = mass.tiles[iTile];

            if (tile.row < mass.bounds.minRow) {
              mass.bounds.minRow = tile.row;
            }

            if (tile.row > mass.bounds.maxRow) {
              mass.bounds.maxRow = tile.row;
            }

            if (tile.col < mass.bounds.minCol) {
              mass.bounds.minCol = tile.col;
            }

            if (tile.col > mass.bounds.maxCol) {
              mass.bounds.maxCol = tile.col;
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
            x = 0,
            y = 0,
            w = 0,
            h = 0,
            colors = ["red", "white", "grey", "yellow", "orange", "pink"],
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

          // DEBUG: draw land mass bounds.
          // for (i=0; i<this.landMasses.length; ++i) {
          //  ctxt.beginPath();
          //  ctxt.strokeStyle = colors[i];

          //  x = this.landMasses[i].bounds.minCol * jb.program.CELL.WIDTH;
          //  y = this.landMasses[i].bounds.minRow * jb.program.CELL.HEIGHT;
          //  w = (this.landMasses[i].bounds.maxCol - this.landMasses[i].bounds.minCol + 1) * jb.program.CELL.WIDTH;
          //  h = (this.landMasses[i].bounds.maxRow - this.landMasses[i].bounds.minRow + 1) * jb.program.CELL.HEIGHT;

          //  ctxt.rect(x, y, w, h);
          //  ctxt.closePath();
          //  ctxt.stroke(); 
          // }
        }
      }

      // Create base terrain.
      for (seeds = 0; seeds<this.TERRAIN.nSEEDS;) {
        row = Math.round(Math.random() * rows);
        col = Math.round(Math.random() * cols);

        if (row > 0 && row < rows - 1 &&
            col > 0 && col < cols - 1 &&
          this.world.grid[row][col].type === "water") {
          flatEarth.push({row:row, col:col, tileVal:-1, landMass: null});
          this.world.grid[row][col] = flatEarth[flatEarth.length - 1];
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
                  newEarth.push({row: iRow, col: iCol, tileVal:-1, landMass: null});
                  this.world.grid[iRow][iCol] = newEarth[newEarth.length - 1];
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

      // Roughen edges.
      // Horizontal first.
      for (iRow=0; iRow<rows; ++iRow) {
        dCol = 0;
        roughage = this.TERRAIN.ROUGHAGE + Math.round(Math.round(Math.random() * 2 - 1) * this.TERRAIN.ROUGHAGE_VARIANCE);
        for (iCol=0; iCol<cols; ++iCol) {
          tile = this.world.grid[iRow][iCol];
          if (tile.tileVal &&
              this.world.grid[iRow][iCol - 1].tileVal &&
              this.world.grid[iRow - 1][iCol].type &&
              this.world.grid[iRow - 1][iCol - 1].type) {
            dCol += 1;

            if (dCol > roughage) {
              roughout = Math.round(Math.random() * this.TERRAIN.ROUGHOUT);
              for (i=0; i<roughout; ++i) {
                if (iCol + i < cols) {
                  this.world.grid[iRow][iCol + i] = this.TERRAIN.TYPES["water"];
                }
              }
              roughage = this.TERRAIN.ROUGHAGE + Math.round(Math.round(Math.random() * 2 - 1) * this.TERRAIN.ROUGHAGE_VARIANCE);
              dCol = 0;
            }
          }
          else {
            dCol = 0;
          }
        }
      }

      for (iRow=0; iRow<rows; ++iRow) {
        dCol = 0;
        roughage = this.TERRAIN.ROUGHAGE + Math.round(Math.round(Math.random() * 2 - 1) * this.TERRAIN.ROUGHAGE_VARIANCE);
        for (iCol=0; iCol<cols; ++iCol) {
          tile = this.world.grid[iRow][iCol];
          if (tile.tileVal &&
              this.world.grid[iRow][iCol - 1].tileVal &&
              this.world.grid[iRow + 1][iCol].type &&
              this.world.grid[iRow + 1][iCol - 1].type) {
            dCol += 1;

            if (dCol > roughage) {
              roughout = Math.round(Math.random() * this.TERRAIN.ROUGHOUT);
              for (i=0; i<roughout; ++i) {
                if (iCol + i < cols) {
                  this.world.grid[iRow][iCol + i] = this.TERRAIN.TYPES["water"];
                }
              }
              roughage = this.TERRAIN.ROUGHAGE + Math.round(Math.round(Math.random() * 2 - 1) * this.TERRAIN.ROUGHAGE_VARIANCE);
              dCol = 0;
            }
          }
          else {
            dCol = 0;
          }
        }
      }

      // Vertical second.
      for (iCol=0; iCol<cols; ++iCol) {
        dRow = 0;
        roughage = this.TERRAIN.ROUGHAGE + Math.round(Math.round(Math.random() * 2 - 1) * this.TERRAIN.ROUGHAGE_VARIANCE);
        for (iRow=0; iRow<rows; ++iRow) {
          tile = this.world.grid[iRow][iCol];
          if (tile.tileVal &&
              this.world.grid[iRow - 1][iCol].tileVal &&
              this.world.grid[iRow][iCol - 1].type &&
              this.world.grid[iRow - 1][iCol - 1].type) {
            dRow += 1;

            if (dRow > roughage) {
              roughout = Math.round(Math.random() * this.TERRAIN.ROUGHOUT);
              for (i=0; i<roughout; ++i) {
                if (iRow + i < rows) {
                  this.world.grid[iRow + i][iCol] = this.TERRAIN.TYPES["water"];
                }
              }
              roughage = this.TERRAIN.ROUGHAGE + Math.round(Math.round(Math.random() * 2 - 1) * this.TERRAIN.ROUGHAGE_VARIANCE);
              dRow = 0;
            }
          }
          else {
            dRow = 0;
          }
        }
      }

      for (iCol=0; iCol<cols; ++iCol) {
        dRow = 0;
        roughage = this.TERRAIN.ROUGHAGE + Math.round(Math.round(Math.random() * 2 - 1) * this.TERRAIN.ROUGHAGE_VARIANCE);
        for (iRow=0; iRow<rows; ++iRow) {
          tile = this.world.grid[iRow][iCol];
          if (tile.tileVal &&
              this.world.grid[iRow - 1][iCol].tileVal &&
              this.world.grid[iRow][iCol + 1].type &&
              this.world.grid[iRow - 1][iCol + 1].type) {
            dRow += 1;

            if (dRow > roughage) {
              roughout = Math.round(Math.random() * this.TERRAIN.ROUGHOUT);
              for (i=0; i<roughout; ++i) {
                if (iRow + i < rows) {
                  this.world.grid[iRow + i][iCol] = this.TERRAIN.TYPES["water"];
                }
              }
              roughage = this.TERRAIN.ROUGHAGE + Math.round(Math.round(Math.random() * 2 - 1) * this.TERRAIN.ROUGHAGE_VARIANCE);
              dRow = 0;
            }
          }
          else {
            dRow = 0;
          }
        }
      }

      // DEBUG TERRAIN: 2x2 island at center of map.
      /*
      this.world.grid = [];
      for (iRow=0; iRow<rows; ++iRow) {
        this.world.grid.push([]);
        for (iCol=0; iCol<cols; ++iCol) {
          if ((iRow === Math.floor(rows / 2) || iRow === Math.floor(rows / 2) + 1) &&
              (iCol === Math.floor(cols / 2) || iCol === Math.floor(cols / 2) + 1)) {
            this.world.grid[iRow].push({row: iRow, col: iCol, tileVal:-1, landMass:null});
          }
          else {
            this.world.grid[iRow].push(this.TERRAIN.TYPES["water"]);
          }
        }
      }
      */

      // Construct bounds.
      for (iRow=0; iRow<rows; ++iRow) {
        for (iCol=0; iCol<cols; ++iCol) {
          tile = this.world.grid[iRow][iCol];
          if (tile.tileVal) {
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

      // Center.
      dRow = Math.floor(rows * 0.5 - (bounds.yMax - bounds.yMin + 1) * 0.5) - bounds.yMin;
      dCol = Math.floor(cols * 0.5 - (bounds.xMax - bounds.xMin + 1) * 0.5) - bounds.xMin;

      for (iRow=0; iRow<rows; ++iRow) {
        for (iCol=0; iCol<cols; ++iCol) {
          tile = this.world.grid[iRow][iCol];
          if (tile.tileVal) {
            tile.row += dRow;
            tile.col += dCol;
          }
        }
      }

      if (dRow !== 0) {
        if (rows - bounds.yMax > bounds.yMin) {
          // More space at the bottom. Shift down.
          while (dRow > 0) {
            this.world.grid.unshift(this.world.grid.pop());
            dRow -= 1;
          }
        }
        else {
          // More space at the top. Shift up.
          while (dRow < 0) {
            this.world.grid.push(this.world.grid.shift());
            dRow += 1;
          }
        }
      }

      if (dCol !== 0) {
        // More space on the right side. Shift right.
        while (dCol > 0) {
          for (iRow=0; iRow<rows; ++iRow) {
            this.world.grid[iRow].unshift(this.world.grid[iRow].pop());
          }
          dCol -= 1;
        }
        // More space on the left side. Shift left.
        while (dCol < 0) {
          for (iRow=0; iRow<rows; ++iRow) {
            this.world.grid[iRow].push(this.world.grid[iRow].shift());
          }
          dCol += 1;
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

      // Build land masses.
      for (iRow=0; iRow<rows; ++iRow) {
        for (iCol=0; iCol<cols; ++iCol) {
          if (this.world.grid[iRow][iCol].tileVal &&
              visited.indexOf(this.world.grid[iRow][iCol]) < 0) {
            this.world.addTileToMass(true, iRow, iCol, visited);
          }
        }
      }

      this.world.boundLandMasses();
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




