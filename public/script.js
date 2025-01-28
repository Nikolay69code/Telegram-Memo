let cards = [];
let flippedCards = [];
let attempts = 0;
let startTime;

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/cards')
        .then(response => response.json())
        .then(data => {
            cards = data.cards;
            renderCards();
        });
});

function renderCards() {
    const container = document.getElementById('game-container');
    container.innerHTML = '';
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.index = index;
        cardElement.addEventListener('click', flipCard);
        container.appendChild(cardElement);
    });
}

function flipCard(event) {
    if (flippedCards.length === 2) return;
    const cardIndex = event.target.dataset.index;
    const cardElement = event.target;
    cardElement.style.backgroundImage = `url(${cards[cardIndex].image})`;
    flippedCards.push({index: cardIndex, element: cardElement});
    if (flippedCards.length === 2) {
        checkMatch();
    } else if (flippedCards.length === 1) {
        if (!startTime) {
            startTime = Date.now();
        }
        attempts++;
    }
}

function checkMatch() {
    const [firstCard, secondCard] = flippedCards;
    if (cards[firstCard.index].id === cards[secondCard.index].id) {
        flippedCards = [];
    } else {
        setTimeout(() => {
            firstCard.element.style.backgroundImage = '';
            secondCard.element.style.backgroundImage = '';
            flippedCards = [];
        }, 1000);
    }
    if (isGameOver()) {
        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);
        alert(`Game Over! Attempts: ${attempts}, Time: ${timeTaken} seconds`);
        document.getElementById('share-result').style.display = 'block';
        // Share result logic here
    }
}

function isGameOver() {
    return flippedCards.length === 0 && cards.every(card => !card.flipped);
}

document.getElementById('share-result').addEventListener('click', () => {
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    const message = `I finished the Telegram Memo Game in ${timeTaken} seconds with ${attempts} attempts!`;
    navigator.share({
        title: 'Telegram Memo Game',
        text: message,
        url: window.location.href
    }).catch(console.error);
});