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

    // Functions ///////////////////////////////////////////////////////////////
    intro: function() {
        // Print the title info.
        jb.printAt("Acey-Ducey Card Game`", 1, 26);
        jb.printAt("Based on Bill Pambley's BASIC Game`", 2, 19);

        // Move down 3 rows.
        jb.cursorMove(3, 0);

        // Print instructions.
        jb.print("Acey-ducey is played in the following manner:`");
        jb.print("The dealer (computer) deals two cards face up.`");
        jb.print("You have the option to bet or not bet, depending`");
        jb.print("on whether or not you feel the card will have a`");
        jb.print("value between the first two.`");
        jb.print("If you do not want to bet, input a 0.`");
        jb.print("`");

        this.playerCash = 100;
        this.bet = 100;
    },

    showTurnInfo: function() {
        jb.print("You now have ");
        jb.print("" + this.playerCash);
        jb.print(" " + "dollars.`");
        jb.print("`");
        jb.print("Here are your next two cards:`");

        // Generate a card (from 0 (ace) to 12 (king))
        this.firstCard = Math.floor(Math.random() * 13);
        this.secondCard = Math.floor(Math.random() * 13);

        // Show the cards
        jb.print(this.cardNames[this.firstCard] + "`");
        jb.print(this.cardNames[this.secondCard] + "`");

        jb.print("What is your bet? ");
    },

    waitForInput_loop: function() {
        this.bet = jb.readLine();

        return this.bet === null;
    },

    processBet: function() {
        jb.print("`");

        // Convert what the player typed into a number.
        this.bet = parseInt(this.bet);

        if (this.bet > this.playerCash) {
            jb.print("Sorry, my friend, but you don't have that much.`");
        }
        else if (this.bet === 0) {
            jb.print("Chicken!!`");
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

            if (playerWon) {
                jb.print("Nice guess! You won this time!`");
                this.playerCash += this.bet;
            }
            else {
                jb.print("Too bad -- you lost!`");
                this.playerCash -= this.bet;

                if (this.playerCash <= 0) {
                    jb.cursorMove(1, 0);
                    jb.print("You shot your wad. Game over!`");
                    this.gameOver = true;
                }
            }
        }

        jb.print("<Hit a key to continue>");
    },

    waitForKeyPress_loop: function() {
        return jb.readKey() === null;
    },

    nextTurnOrEnd: function() {
        if (this.gameOver) {
            jb.end();
        }
        else {
            jb.clear();
            jb.goto("showTurnInfo");
        }
    },
};

// Star the game!
jb.run(game);
