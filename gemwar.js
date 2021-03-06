

jb.program = {
    tunnel: [],
    maxWidth: 8,
    minWidth: 3,
    nSegments: 100,
    blockSize: 32,
    blocksWide: 0,
    blocksHigh: 0,
    viewWidth: 800,
    viewHeight: 600,
    viewY: 0,
    scrollSpeed: 30.0,
    knightX: 0,
    knightY: 0,
    tunnelWidth: 4,

    init: function() {
        jb.resize(this.viewWidth, this.viewHeight);
        jb.setBackColor("#444444");
        jb.clear();

        this.blocksWide = Math.floor(this.viewWidth / this.blockSize);
        this.blocksHigh = Math.floor(this.viewHeight / this.blockSize);

        // Position camera so that the last row of blocks is on the bottom of the screen.
        this.cameraY = this.nSegments * this.blockSize - 1;
        this.knightX = this.viewWidth / 2 - 16;
        this.knightY = this.cameraY + this.viewHeight - 32;
    },

    buildTunnel: function() {
        var i = 0,
            left = Math.floor(this.blocksWide * 0.5 - this.tunnelWidth / 2),
            right = left + this.tunnelWidth,
            newLeft = 0,
            newRight = 0,
            bSucceeded = false;
      
        for (i=1; i<this.nSegments; ++i) {
            this.tunnel.push({left: left, right: right});
            bSucceeded = false;
            while (!bSucceeded) {
                newLeft = left + Math.floor(Math.random() * 3) - 1;
                // newRight = right + Math.floor(Math.random() * 3) - 1;
                newRight = newLeft + this.tunnelWidth;
                if (newRight - newLeft >= this.minWidth &&
                    newRight - newLeft <= this.maxWidth &&
                    newLeft >= 0 &&
                    newRight < this.blocksWide) {
                    bSucceeded = true;
                }
            }

            this.tunnel.push({left: newLeft, right: newRight});
            left = newLeft;
            right = newRight;
        }

        jb.listenForTap();
    },

    do_drawTunnel: function() {
        var iBottomBlock = 0,
            iTopBlock = 0,
            iBlock = 0,
            blockY = 0,
            blockX = 0,
            localY = 0,
            iInvBlock = 0,
            viewBottom = this.viewY + Math.floor(this.viewHeight * 0.5),
            viewTop = viewBottom - this.viewHeight,
            param = 0;

        jb.clear();

        for (iBlock = 0; iBlock < this.nSegments; ++iBlock) {
            blockY = (this.nSegments - (iBlock + 1)) * this.blockSize;

            if (blockY < this.cameraY && blockY > this.cameraY - this.viewHeight - this.blockSize) {
                // Draw this segment.
                localY = this.viewHeight - (this.cameraY - blockY);
                jb.ctxt.fillStyle = "#000000";

                if (iBlock > 0) {
                    if (this.tunnel[iBlock - 1].left < this.tunnel[iBlock].left) {
                        blockX = this.tunnel[iBlock - 1].left * this.blockSize;
                        jb.ctxt.fillRect(blockX, localY, 32, 32);
                        jb.glyphs.draw("16x16", "brickWedgeTopLeft", blockX, localY, 2, 2);
                    }
                }
                if (iBlock < this.nSegments - 1) {
                    if (this.tunnel[iBlock + 1].left < this.tunnel[iBlock].left) {
                        blockX = this.tunnel[iBlock + 1].left * this.blockSize;
                        jb.ctxt.fillRect(blockX, localY, 32, 32);
                        jb.glyphs.draw("16x16", "brickWedgeBottomLeft", blockX, localY, 2, 2);
                    }
                }

                blockX = this.tunnel[iBlock].left * this.blockSize;
                jb.ctxt.fillRect(blockX, localY, 32, 32);
                jb.glyphs.draw("16x16", "brickCenter", blockX, localY, 2, 2);

                if (iBlock > 0) {
                    if (this.tunnel[iBlock - 1].left > this.tunnel[iBlock].left) {
                        blockX = this.tunnel[iBlock - 1].left * this.blockSize;
                        jb.ctxt.fillRect(blockX, localY, 32, 32);
                        jb.glyphs.draw("16x16", "brickWedgeTopRight", blockX, localY, 2, 2);
                    }
                }
                if (iBlock < this.nSegments - 1) {
                    if (this.tunnel[iBlock + 1].left > this.tunnel[iBlock].left) {
                        blockX = this.tunnel[iBlock + 1].left * this.blockSize;
                        jb.ctxt.fillRect(blockX, localY, 32, 32);
                        jb.glyphs.draw("16x16", "brickWedgeBottomRight", blockX, localY, 2, 2);
                    }
                }

                if (iBlock > 0) {
                    if (this.tunnel[iBlock - 1].right < this.tunnel[iBlock].right) {
                        blockX = this.tunnel[iBlock - 1].right * this.blockSize;
                        jb.ctxt.fillRect(blockX, localY, 32, 32);
                        jb.glyphs.draw("16x16", "brickWedgeTopLeft", blockX, localY, 2, 2);
                    }
                }
                if (iBlock < this.nSegments - 1) {
                    if (this.tunnel[iBlock + 1].right < this.tunnel[iBlock].right) {
                        blockX = this.tunnel[iBlock + 1].right * this.blockSize;
                        jb.ctxt.fillRect(blockX, localY, 32, 32);
                        jb.glyphs.draw("16x16", "brickWedgeBottomLeft", blockX, localY, 2, 2);
                    }
                }

                blockX = this.tunnel[iBlock].right * this.blockSize;

                jb.glyphs.draw("16x16", "brickCenter", blockX, localY, 2, 2);

                if (iBlock > 0) {
                    if (this.tunnel[iBlock - 1].right > this.tunnel[iBlock].right) {
                        blockX = this.tunnel[iBlock - 1].right * this.blockSize;
                        jb.ctxt.fillRect(blockX, localY, 32, 32);
                        jb.glyphs.draw("16x16", "brickWedgeTopRight", blockX, localY, 2, 2);
                    }
                }
                if (iBlock < this.nSegments - 1) {
                    if (this.tunnel[iBlock + 1].right > this.tunnel[iBlock].right) {
                        blockX = this.tunnel[iBlock + 1].right * this.blockSize;
                        jb.ctxt.fillRect(blockX, localY, 32, 32);
                        jb.glyphs.draw("16x16", "brickWedgeBottomRight", blockX, localY, 2, 2);
                    }
                }
            }
        }

        jb.glyphs.draw("16x16", "knight", this.knightX, this.knightY - this.cameraY, 2, 2);

        this.cameraY -= this.scrollSpeed * jb.time.deltaTime;
        this.cameraY = Math.max(this.cameraY, this.viewHeight);

        param = (this.cameraY - this.viewHeight) / (this.nSegments * this.blockSize - 1 - this.viewHeight);
        this.knightY = this.cameraY + param * this.viewHeight - (32 * param);
        jb.printAt("CameraY: " + this.cameraY, 1, 1);

        jb.until(jb.tap.done || this.cameraY === this.viewHeight);
    }
};



