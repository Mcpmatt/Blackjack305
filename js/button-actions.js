// This file contains key interactions that will occur after the player has clicked a button

var startGame = function() {
	// Disable cash out button during gameplay
    	disableButton(cashOutButton);
	
	getCards();
	if (currentWager === 0) {
		Materialize.toast("You must select a bet to play", 1000);
	} else if (currentChipBalance < 0) {
		Materialize.toast("You're out of chips! Please Cash Out and Withdraw more chips" , 2000);
	} else if (currentChipBalance < currentWager) {
		Materialize.toast("Insufficient chip balance, please select a lower bet" , 1500);
	} else {
		// Track the bet being placed
	        betsPlaced++;
	        totalBetAmount += currentWager;
		currentChipBalance -= currentWager; 
		updateVisibleChipBalances();
		$("#welcome").hide();
		$("#game-over").hide();
		$(".brand-logo").text("blackjack"); 
		$("#game-board").show("fade", 1000);
		cardsInDeck = cards;
		cardsInDeck.sort(function() {return 0.5 - Math.random()});
		for (let i = 0; i <= 1; i++) {
			setTimeout(function(){
				currentTurn = "player";
				dealCard(playerHand, playerGameBoard);
				currentTurn = "dealer";
				dealCard(dealerHand, dealerGameBoard);
			}, i*1500);
		}
		setTimeout(function(){
			currentTurn = "player";
			if (playerHand.length === 2 && playerHand[0].name === playerHand[1].name) {
				enableButton(splitButton, split);
			}
		}, 2500);
			
	}
}

var hit = function() {
	if (currentTurn === "player") {
		playerStatus = "hit";
		dealCard(playerHand, playerGameBoard);
	} else if (currentTurn === "playerSplit") {
		playerSplitStatus = "hit";
		dealCard(playerSplitHand, playerSplitGameBoard);
	}
}

var stand = function() {
	if (currentTurn === "player") {
		changeHand(playerStatus);
	} else if (currentTurn === "playerSplit") {
		changeHand(playerSplitStatus);
	}
}

var split = function() {
	splitGame = true; 
	playerHandTotal = playerHandTotal - playerHand[1].value;
	playerSplitHandTotal = playerHand[1].value;
	updateVisibleHandTotals();
	$(".split-hand-total").removeClass("inactive").show(); 
	$(playerSplitGameBoard).removeClass("inactive").show();	
	var splitCard = playerHand.pop();
	playerSplitHand.push(splitCard);
	var cardImage = $("#player-card-1").attr("id", "playerSplit-card-0");

	cardImage.hide(); // Hide it at first to allow for the transition to occur
	// This is the first card in the deck, so want to cancel out the previous offset/stacking and have it go to the initial normal spot
	cardImage.appendTo($(playerSplitGameBoard)).offset({left: 60}).css("margin-right", "auto").show();

	currentChipBalance -= currentWager; 
	currentWager = currentWager * 2;
	updateVisibleChipBalances();

	// Then, deal 1 new card for each newly split deck
	currentTurn = "player";
	dealCard(playerHand, playerGameBoard);
	currentTurn = "playerSplit";
	dealCard(playerSplitHand, playerSplitGameBoard);

	// Make split button no longer clickable as in this game you can only split once
	disableButton(splitButton);

	// Shrink the inactive deck to both signal what deck they are playing and to make room on the board
	setTimeout(function(){
		scaleDownDeck(playerSplitGameBoard, playerSplitHandTotalDisplay);
		currentTurn = "player"; 
	}, 1000);

}

var cashOut = function() {
    // Get the cloud function URL and user ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const cloudFunctionUrl = urlParams.get('cloudFunction');
    const userId = urlParams.get('uid');
    const finalBalance = currentChipBalance;

    // Disable button during processing to prevent double-clicks
    disableButton(cashOutButton);
    
    Materialize.toast('Attempting cash out...', 2000);
    Materialize.toast(`Amount: ${finalBalance} tokens`, 2000);

    fetch(cloudFunctionUrl, {
        method: 'POST',
        mode: 'cors', // Explicitly set CORS mode
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            uid: userId,
            finalBalance: finalBalance,
	    has_cashed_out: true, //Update Firebase Conditional
	    betsPlaced: betsPlaced,
            totalBetAmount: totalBetAmount
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                Materialize.toast(`Server error: ${text}`, 3000);
                throw new Error(text);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            Materialize.toast('Success! Tokens added to your account.', 2000);
	    currentChipBalance = 0; //Reset Chip Balance upon successful Cash Out
	    // Reset tracking variables
            betsPlaced = 0;
            totalBetAmount = 0;
	    updateVisibleChipBalances();
            setTimeout(() => {
                window.location.href = 'fitness305casino://cash-out-complete';
            }, 2000);
        }
    })
    .catch(error => {
        Materialize.toast(`Error: ${error.message}`, 3000);
	enableButton(cashOutButton, cashOut);
    });
};

function doubleDown() {
	if (currentChipBalance - currentWager <= 0) {
		Materialize.toast("Insufficient chip balance" , 1000);
	}
	else {
		currentChipBalance -= currentWager; //subtracts the same value again from current balance
		currentWager = currentWager * 2;
		updateVisibleChipBalances();
		disableButton(doubleDownButton);
	}
}

function newGame() {
	getCards();
	cardsInDeck = cards;
	gameWinner = "none";
	dealerHand = [];
	dealerHandTotal = 0;
	dealerStatus = "start";
	playerHand = [];
	playerHandTotal = 0;
	playerStatus = "start";  
	playerHasAce = false;  
	splitGame = false; 
	isGameOver = false;
	playerSplitHand = [];
	playerSplitHandTotal = 0;
	playerSplitStatus = "start";

	if (currentWager === 0) { 
		Materialize.toast("You must select a bet to play", 1000);
	} else {	
		$(playerSplitGameBoard).hide();
		$(".split-hand-total").hide();
		enableButton(standButton, stand);
		enableButton(hitButton, hit);
		enableButton(doubleDownButton, doubleDown);
		dealerGameBoard.empty();
		playerGameBoard.empty();
		playerSplitGameBoard.empty();
		updateVisibleHandTotals();
		startGame(); 		
	}
}

function resetGame() {
	//currentChipBalance = currentChipBalance + currentWager;
	currentWager = 0;
	updateVisibleChipBalances();
	//location.reload();
}
