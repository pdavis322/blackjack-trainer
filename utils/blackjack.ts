// Blackjack Game Logic Helper
// Rules: 6 decks, 75% penetration, H17, DAS allowed, RSA not allowed,
// late surrender allowed, max 3 splits, dealer peeks for blackjack

// Types
export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    rank: Rank;
    suit: Suit;
    faceDown?: boolean;
    isNew?: boolean;
}

export interface HandResult {
    value: number;
    isSoft: boolean;
    isBusted: boolean;
    isBlackjack: boolean;
}

export interface GameConfig {
    numDecks: number;
    penetration: number;
    dealerHitsSoft17: boolean;
    dasAllowed: boolean;
    rsaAllowed: boolean;
    lateSurrenderAllowed: boolean;
    maxSplits: number;
}

// Default game configuration
export const DEFAULT_CONFIG: GameConfig = {
    numDecks: 6,
    penetration: 0.75,
    dealerHitsSoft17: true,
    dasAllowed: true,
    rsaAllowed: false,
    lateSurrenderAllowed: true,
    maxSplits: 3,
};

// Card value lookup
const CARD_VALUES: Record<Rank, number> = {
    'A': 11,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 10,
    'Q': 10,
    'K': 10,
};

/**
 * Create a shoe with the specified number of decks, shuffled
 */
export function createShoe(numDecks: number = 6): Card[] {
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const shoe: Card[] = [];

    for (let d = 0; d < numDecks; d++) {
        for (const suit of suits) {
            for (const rank of ranks) {
                shoe.push({ rank, suit });
            }
        }
    }

    return shuffleCards(shoe);
}

/**
 * Shuffle an array of cards using Fisher-Yates algorithm
 */
export function shuffleCards(cards: Card[]): Card[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Check if the shoe needs to be reshuffled based on penetration
 */
export function needsReshuffle(shoe: Card[], config: GameConfig = DEFAULT_CONFIG): boolean {
    const totalCards = config.numDecks * 52;
    const cutPoint = totalCards * config.penetration;
    const cardsUsed = totalCards - shoe.length;
    return cardsUsed >= cutPoint;
}

/**
 * Calculate the value of a hand
 */
export function calculateHandValue(cards: Card[]): HandResult {
    // Filter out face-down cards for calculation
    const visibleCards = cards.filter(c => !c.faceDown);

    let value = 0;
    let aces = 0;

    for (const card of visibleCards) {
        value += CARD_VALUES[card.rank];
        if (card.rank === 'A') {
            aces++;
        }
    }

    // Convert aces from 11 to 1 as needed to avoid busting
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    const isSoft = aces > 0 && value <= 21;
    const isBusted = value > 21;
    const isBlackjack = visibleCards.length === 2 && value === 21;

    return { value, isSoft, isBusted, isBlackjack };
}

/**
 * Check if a hand can be split
 */
export function canSplit(
    hand: Card[],
    numSplitsDone: number,
    isAces: boolean,
    config: GameConfig = DEFAULT_CONFIG
): boolean {
    // Can't split if max splits reached
    if (numSplitsDone >= config.maxSplits) {
        return false;
    }

    // Can't resplit aces if RSA not allowed
    if (isAces && !config.rsaAllowed && numSplitsDone > 0) {
        return false;
    }

    // Must have exactly 2 cards of the same rank
    if (hand.length !== 2) {
        return false;
    }

    // Check if both cards have the same value (10s and face cards count as same)
    const rank1 = hand[0].rank;
    const rank2 = hand[1].rank;

    // Exact rank match
    if (rank1 === rank2) {
        return true;
    }

    // 10-value cards can be split together
    const tenValues: Rank[] = ['10', 'J', 'Q', 'K'];
    if (tenValues.includes(rank1) && tenValues.includes(rank2)) {
        return true;
    }

    return false;
}

/**
 * Check if a hand can be doubled
 */
export function canDouble(
    hand: Card[],
    isAfterSplit: boolean,
    config: GameConfig = DEFAULT_CONFIG
): boolean {
    // Must have exactly 2 cards
    if (hand.length !== 2) {
        return false;
    }

    // Check DAS rule
    if (isAfterSplit && !config.dasAllowed) {
        return false;
    }

    return true;
}

/**
 * Check if surrender is allowed
 */
export function canSurrender(
    hand: Card[],
    isFirstAction: boolean,
    config: GameConfig = DEFAULT_CONFIG
): boolean {
    // Late surrender only allowed on first action with 2 cards
    return config.lateSurrenderAllowed && isFirstAction && hand.length === 2;
}

/**
 * Check if dealer should hit (H17 rule)
 */
export function dealerShouldHit(
    dealerCards: Card[],
    config: GameConfig = DEFAULT_CONFIG
): boolean {
    const result = calculateHandValue(dealerCards);

    if (result.value < 17) {
        return true;
    }

    // H17: dealer hits on soft 17
    if (result.value === 17 && result.isSoft && config.dealerHitsSoft17) {
        return true;
    }

    return false;
}

/**
 * Check if dealer has blackjack (for peek rule)
 */
export function dealerHasBlackjack(dealerCards: Card[]): boolean {
    if (dealerCards.length !== 2) {
        return false;
    }

    // Reveal both cards to check
    const cards = dealerCards.map(c => ({ ...c, faceDown: false }));
    const result = calculateHandValue(cards);
    return result.isBlackjack;
}

/**
 * Determine the outcome of a hand vs dealer
 */
export function determineOutcome(
    playerValue: number,
    playerBlackjack: boolean,
    playerBusted: boolean,
    dealerValue: number,
    dealerBlackjack: boolean,
    dealerBusted: boolean
): 'win' | 'lose' | 'push' | 'blackjack' {
    // Player busted
    if (playerBusted) {
        return 'lose';
    }

    // Dealer busted
    if (dealerBusted) {
        return 'win';
    }

    // Both have blackjack
    if (playerBlackjack && dealerBlackjack) {
        return 'push';
    }

    // Player has blackjack
    if (playerBlackjack) {
        return 'blackjack';
    }

    // Dealer has blackjack
    if (dealerBlackjack) {
        return 'lose';
    }

    // Compare values
    if (playerValue > dealerValue) {
        return 'win';
    } else if (playerValue < dealerValue) {
        return 'lose';
    } else {
        return 'push';
    }
}

/**
 * Calculate payout based on outcome
 */
export function calculatePayout(bet: number, outcome: 'win' | 'lose' | 'push' | 'blackjack' | 'surrender'): number {
    switch (outcome) {
        case 'blackjack':
            return bet * 2.5; // 3:2 payout (original bet + 1.5x)
        case 'win':
            return bet * 2; // 1:1 payout (original bet + 1x)
        case 'push':
            return bet; // Return original bet
        case 'surrender':
            return bet * 0.5; // Return half bet
        case 'lose':
            return 0;
    }
}

/**
 * Draw a card from the shoe
 */
export function drawCard(shoe: Card[]): { card: Card; remainingShoe: Card[] } | null {
    if (shoe.length === 0) {
        return null;
    }

    const newShoe = [...shoe];
    const card = newShoe.pop()!;
    return { card, remainingShoe: newShoe };
}
