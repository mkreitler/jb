// Acey-ducey card game

// Create an object that will be the game:
game = {
    // Variables and data //////////////////////////////////////////////////////
    playerCash: 0,
    bet: 0,
    cardNames: ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"],
    firstCard: 0,
    secondCard: 0,
    gameOver: false,
    zeroBetLoss: 50,

    MAX_BET: 500,

    // Functions ///////////////////////////////////////////////////////////////
    intro: function() {
        // Print the title info.
        jb.printAt("Acey-Ducey Card Game`", 1, 26);
        jb.printAt("Based on Bill Pambley's BASIC Game`", 2, 19);

        // Move down 3 rows.
        jb.cursorMove(1, 0);

        // Print instructions.
        jb.print("Acey-ducey is played in the following manner:`");
        jb.print("The dealer (computer) deals two cards face up.`");
        jb.print("You have the option to bet or not bet, depending`");
        jb.print("on whether or not you feel the card will have a`");
        jb.print("value between the first two.`");
        jb.print("If you do not want to bet, input a 0. If you bet`");
        jb.print("0 and a winning card appears, you will lose $" + this.zeroBetLoss + ".`");
        jb.print("`");

        this.playerCash = 100;
        this.bet = 100;
    },

    showTurnInfo: function() {
        jb.print("You now have " + this.playerCash + " dollars.`");
        jb.print("`");
        jb.print("Here are your next two cards:`");

        // Generate a card (from 0 (ace) to 12 (king))
        this.firstCard = Math.floor(Math.random() * 13);
        this.secondCard = Math.floor(Math.random() * 13);

        // Show the cards
        jb.print(this.cardNames[this.firstCard] + "`");
        jb.print(this.cardNames[this.secondCard] + "`");

        jb.print(">> Swipe to bet <<`");
        jb.print("`");

        jb.listenForSwipe();
    },

    // waitForInput_loop: function() {
    //     this.bet = jb.readLine();

    //     return this.bet === null;
    // },

    waitForBet_loop: function() {
        if (jb.swipe.startTime > 0) {
            this.bet = Math.abs(jb.swipe.endX - jb.swipe.startX) / jb.canvas.width * this.MAX_BET;
        }
        else {
            this.bet = 0;
        }

        this.bet = 10 * Math.round(this.bet / 10);

        jb.clearLine(jb.row);
        jb.printAt("Your bet " + this.bet, jb.row + 1, 1);

        return !jb.swipe.done;
    },

    processBet: function() {
        jb.print("`");

        // Convert what the player typed into a number.
        this.bet = parseInt(this.bet);

        if (this.bet > this.playerCash) {
            jb.print("Sorry, my friend, but you don't have that much.`");
        }
        else {
            // Draw the next card.
            var nextCard = Math.floor(Math.random() * 13);
            var playerWon = false;

            if (this.firstCard > this.secondCard) {
                if (nextCard >= this.secondCard && nextCard <= this.firstCard) {
                    playerWon = true;
                }
            }
            else {
                if (nextCard >= this.firstCard && nextCard <= this.secondCard) {
                    playerWon = true;
                }
            }

            jb.print("The new card is " + this.cardNames[nextCard] + ".`");

            if (playerWon && this.bet > 0) {
                jb.print("Nice guess! You won this time!`");
                this.playerCash += this.bet;
            }
            else if (playerWon && this.bet === 0) {
                jb.print("You chickened out but a winning card appeared -- you lose $" + this.zeroBetLoss + "!`");
                this.playerCash -= this.zeroBetLoss;
            }
            else {
                if (this.bet === 0) {
                    jb.print("Good thing you bet 0!`");
                }
                else {
                    jb.print("Too bad -- you lost!`");
                }
                this.playerCash -= this.bet;
            }
            
            if (this.playerCash <= 0) {
                jb.cursorMove(1, 0);
                jb.print("You shot your wad. Game over!`");
                this.gameOver = true;
            }
        }

        if (this.gameOver) {
            jb.print("<Tap to end>");
        }
        else {
            jb.print("<Tap to continue>");
        }
        jb.listenForTap();
    },

    // waitForKeyPress_loop: function() {
    //     return jb.readKey() === null;
    // },

    waitForTap_loop: function() {
        return !jb.tap.done;
    },

    nextTurnOrEnd: function() {
        jb.resetTap();

        if (this.gameOver) {
            jb.end();
        }
        else {
            jb.clear();
            jb.goto("showTurnInfo");
        }
    },
};


// Start the game!
window.onload = function() {
    jb.run(game);
};
