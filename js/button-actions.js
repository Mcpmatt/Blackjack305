// This file contains key interactions that will occur after the player has clicked a button

var startGame = function() {
	// Disable cash out button during gameplay
    	disableButton(cashOutButton);
	
	getCards();
	if (currentWager === 0) {
		Materialize.toast("You must select a bet to play", 1000);
	} else if (currentChipBalance < 10) {
		Materialize.toast("You're out of chips! Reset the game to continue" , 2000);
	} else if (currentChipBalance < currentWager) {
		Materialize.toast("Insufficient chip balance, please select a lower bet" , 1500);
	} else {
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
    
    // Step 1: Verify parameters
    Materialize.toast('Step 1: Checking parameters...', 2000);
    setTimeout(() => {
        Materialize.toast(`Cloud Function URL: ${cloudFunctionUrl?.substring(0, 30)}...`, 3000);
        Materialize.toast(`User ID: ${userId}`, 3000);
        Materialize.toast(`Balance to cash out: ${finalBalance}`, 3000);
    }, 2000);
    
    // Validation
    if (!cloudFunctionUrl || !userId || finalBalance === undefined) {
        Materialize.toast('Error: Missing required parameters', 3000);
        return;
    }
    
    // Step 2: Prepare request
    const requestData = {
        uid: userId,
        finalBalance: finalBalance
    };
    
    setTimeout(() => {
        Materialize.toast('Step 2: Sending request...', 2000);
        Materialize.toast(`Request data: ${JSON.stringify(requestData)}`, 3000);
    }, 5000);
    
    // Step 3: Make request
    fetch(cloudFunctionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        Materialize.toast(`Step 3: Response received (${response.status})`, 2000);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        Materialize.toast('Step 4: Processing response...', 2000);
        Materialize.toast(`Response data: ${JSON.stringify(data)}`, 3000);
        
        if (data.success) {
            // Step 5: Success handling
            Materialize.toast('Success! Processing cashout...', 2000);
            
            // Disable the button to prevent double-clicks
            disableButton(cashOutButton);
            
            setTimeout(() => {
                Materialize.toast('Successfully cashed out!', 1500);
                
                // Step 6: Return to app
                setTimeout(() => {
                    Materialize.toast('Returning to app...', 1500);
                    window.location.href = 'stepbet://cash-out-complete';
                }, 1500);
            }, 2000);
        } else {
            throw new Error(data.error || 'Cash out failed');
        }
    })
    .catch(error => {
        // Error handling
        Materialize.toast(`Error occurred: ${error.message}`, 4000);
        console.error('Cash out error:', error);
        
        // Re-enable the button on error
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
	currentChipBalance = currentChipBalance + currentWager;
	currentWager = 0;
	updateVisibleChipBalances();
	//location.reload();
}
