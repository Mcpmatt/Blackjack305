// Starting game board values
var cardsInDeck;

$( document ).ready(function() {
  getCards();
  cardsInDeck = cards;
  //	Get initial tokens from URL parameter instead of LocalStorage
  const urlParams = new URLSearchParams(window.location.search);
  currentChipBalance = parseInt(urlParams.get('tokens')) || 500;
  updateVisibleChipBalances();
  // Initialize cash out button if at welcome/game over screen and params exist
  if (urlParams.get('cloudFunction') && urlParams.get('uid') && 
	($("#welcome").is(":visible") || $("#game-over").is(":visible"))) {
  	enableButton(cashOutButton, () => {
  		if (confirm(`Cash out ${currentChipBalance} tokens?`)) {
			cashOut();
            	}
        });
    } else {
        disableButton(cashOutButton);
    }

  // Debug logging
  const params = {
  cloudFunction: urlParams.get('cloudFunction'),
  uid: urlParams.get('uid'),
  blackjackTokens: urlParams.get('blackjackTokens')
  };
    
  Materialize.toast('Received URL Parameters:', params);
    
  // Verify cloud function URL format
  if (params.cloudFunction) {
        Materialize.toast('Cloud Function URL is properly formatted:');
	Materialize.toast(params.cloudFunction);
    } else {
        Materialize.toast('Cloud Function URL is missing');
    }
    
  // Verify user ID
  if (params.uid) {
        Materialize.toast('User ID is present:');
	Materialize.toast(params.uid);
    } else {
        Materialize.toast('User ID is missing');
    }
});

var currentTurn = "player";
var currentWager = 0;
//var currentChipBalance = localStorage.getItem('blackjackChips') || 500;
var gameWinner = "none"; // To be declared at end of game
var isGameOver = false;

// Dealer hand and starting totals
var dealerHand = [];
var dealerHandTotal = 0;
var dealerGameBoard = $("#dealer");
var dealerStatus = "start"; // Possible statuses are start (initial gameplay), stand, hit

// Player hand and starting totals
var playerHand = [];
var playerHandTotal = 0;
var playerGameBoard = $("#user-hand");
var playerHandTotalDisplay = $(".hand-total");
var playerStatus = "start";  // Possible statuses are start (initial gameplay), stand, hit

// Because aces can equal 1 or 11, need to quickly know if player has aces so we can
// adjust value from 11 to 1 if they go over 21 (default value is 11)
var playerHasAce = false;  

// Player split game variables only used if the player splits their hand
var splitGame = false; // default value is false, must be turned true
var playerSplitHand = [];
var playerSplitHandTotal = 0;
var playerSplitGameBoard = $("#user-split-hand");
var playerSplitHandTotalDisplay = $(".split-hand-total");
var playerSplitStatus;

// Buttons pulled from DOM
var startButton = $("#start-game-button");
var doubleDownButton = $("#double-down-button");
var hitButton = $("#hit-button");
var standButton = $("#stand-button");
var splitButton = $(".split-button");
var playAgainButton = $(".new-game-button"); 
// CashOut Button Declaration
var cashOutButton = $("#cash-out-button");

// Deactivates a button (both event listener and appearance)
function disableButton(buttonName) {
	$(buttonName).off();
	$(buttonName).addClass("disabled-button");
}

// Activates a button (both event listener and appearance)
function enableButton(buttonName, event) {
	$(buttonName).click(event);
	$(buttonName).removeClass("disabled-button");
}

// Update chip totals displayed to user throughout the game
function updateVisibleChipBalances() {
	$(".current-wager").text(currentWager);
	$(".current-chip-balance").text(currentChipBalance);
	
	//localStorage.setItem('blackjackChips', currentChipBalance);
}

// Update card hand totals displayed to user throughout the game
function updateVisibleHandTotals() {
	$(playerHandTotalDisplay).text(playerHandTotal);
	$(playerSplitHandTotalDisplay).text(playerSplitHandTotal);

	// If the dealer has not played yet or game is not over, only show value of 1st card
	// as the player is still making their initial moves
	if (dealerHand.length === 2 && isGameOver === false && dealerStatus === "start") {
		$(".dealer-hand-total").text(dealerHandTotal - dealerHand[1].value);
	} else {
		$(".dealer-hand-total").text(dealerHandTotal);
	}

}

// Called when player clicks on a chip
function selectWager(amount){
	currentWager += amount;
	updateVisibleChipBalances();
}

// 	ANIMATIONS/INTERACTIVITY:
function flipHiddenCard() {
	// If it's just the initial round, first we need to flip/reveal the hidden dealer card when this is called
	if (dealerHand.length === 2) {
		$("#dealer-card-1").addClass("flipped");
		setTimeout(function(){
			$("#dealer-card-1").attr("src", "img/" + dealerHand[1].src);
			updateVisibleHandTotals();
		}, 250);	
	} 
}

// Used in split game mode, shrinks the inactive deck and totals
function scaleDownDeck(deck, totalDisplay) {
	$(totalDisplay).addClass("splithand-scaledown");
	$(deck).addClass("splithand-scaledown");
}

// Used in split game mode, enlarges the deck and totals when turn active or when
// dome with gameplay
function enlargeDeck(deck, totalDisplay) {
	$(totalDisplay).removeClass("splithand-scaledown");
	$(deck).removeClass("splithand-scaledown");
}

// Toggling rules from main nav gives an animation effect
$(".rules-nav").click(function(){
	$("#rules").toggle("blind", 500);
});

// But clicking close does not provide an animation effect
$("#rules-close").click(function(){
	$("#rules").hide();
});

// Materialize modal
$(".modal").modal({ 
      dismissible: false, 
      opacity: .40, 
      inDuration: 300, 
      outDuration: 200, 
      startingTop: "10%", // Starting top style attribute
      endingTop: "10%", // Ending top style attribute
    }
  );

// EVENT LISTENERS:
$("#chip-10").click(function(){selectWager(10)});
$("#chip-25").click(function(){selectWager(25)});
$("#chip-50").click(function(){selectWager(50)});
$("#chip-100").click(function(){selectWager(100)});

// Button activation
$(startButton).click(startGame);
$(doubleDownButton).click(doubleDown); 
$(hitButton).click(hit);
$(standButton).click(stand);
$(playAgainButton).click(newGame);
$("#reset-game").click(resetGame);
//  We don't need $(cashOutButton).click(cashOut); because enableButton already handles this

$(".reduce-aces-button").click(   // Can only see this if player draws 2 aces, would only be reducing in 1st deck
	function(){
		reduceAcesValue(playerHand);
		disableButton(splitButton, split);
}); 
