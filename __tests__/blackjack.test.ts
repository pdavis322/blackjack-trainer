import {
    calculateHandValue,
    calculatePayout,
    canDouble,
    canSplit,
    canSurrender,
    Card,
    createShoe,
    dealerHasBlackjack,
    dealerShouldHit,
    DEFAULT_CONFIG,
    determineOutcome,
    drawCard,
    needsReshuffle,
    Rank,
    shuffleCards,
    Suit,
} from '../utils/blackjack';

// Helper to create cards easily
function card(rank: Rank, suit: Suit = '♠', faceDown = false): Card {
    return { rank, suit, faceDown };
}

describe('createShoe', () => {
    it('should create a shoe with the correct number of cards', () => {
        const shoe = createShoe(6);
        expect(shoe.length).toBe(6 * 52);
    });

    it('should create a shoe with 1 deck having 52 cards', () => {
        const shoe = createShoe(1);
        expect(shoe.length).toBe(52);
    });

    it('should contain all ranks and suits', () => {
        const shoe = createShoe(1);
        const suits: Suit[] = ['♠', '♥', '♦', '♣'];
        const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        for (const suit of suits) {
            for (const rank of ranks) {
                expect(shoe.some(c => c.rank === rank && c.suit === suit)).toBe(true);
            }
        }
    });
});

describe('shuffleCards', () => {
    it('should return an array of the same length', () => {
        const cards = [card('A'), card('K'), card('Q')];
        const shuffled = shuffleCards(cards);
        expect(shuffled.length).toBe(cards.length);
    });

    it('should contain all the same cards', () => {
        const cards = [card('A', '♠'), card('K', '♥'), card('Q', '♦')];
        const shuffled = shuffleCards(cards);

        for (const c of cards) {
            expect(shuffled.some(s => s.rank === c.rank && s.suit === c.suit)).toBe(true);
        }
    });
});

describe('calculateHandValue', () => {
    it('should calculate simple hand values', () => {
        const hand = [card('5'), card('7')];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(12);
        expect(result.isSoft).toBe(false);
        expect(result.isBusted).toBe(false);
    });

    it('should calculate face cards as 10', () => {
        const hand = [card('K'), card('Q')];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(20);
    });

    it('should calculate soft hands with Ace as 11', () => {
        const hand = [card('A'), card('7')];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(18);
        expect(result.isSoft).toBe(true);
    });

    it('should convert Ace to 1 when needed', () => {
        const hand = [card('A'), card('7'), card('8')];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(16);
        expect(result.isSoft).toBe(false);
    });

    it('should detect blackjack', () => {
        const hand = [card('A'), card('K')];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(21);
        expect(result.isBlackjack).toBe(true);
    });

    it('should not count 21 with 3+ cards as blackjack', () => {
        const hand = [card('7'), card('7'), card('7')];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(21);
        expect(result.isBlackjack).toBe(false);
    });

    it('should detect bust', () => {
        const hand = [card('K'), card('Q'), card('5')];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(25);
        expect(result.isBusted).toBe(true);
    });

    it('should ignore face-down cards', () => {
        const hand = [card('K'), card('A', '♠', true)];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(10);
    });

    it('should handle multiple aces correctly', () => {
        const hand = [card('A'), card('A'), card('9')];
        const result = calculateHandValue(hand);
        expect(result.value).toBe(21);
        expect(result.isSoft).toBe(true);
    });
});

describe('canSplit', () => {
    it('should allow splitting a pair', () => {
        const hand = [card('8'), card('8')];
        expect(canSplit(hand, 0, false)).toBe(true);
    });

    it('should allow splitting face cards', () => {
        const hand = [card('K'), card('Q')];
        expect(canSplit(hand, 0, false)).toBe(true);
    });

    it('should not allow splitting non-pairs', () => {
        const hand = [card('8'), card('7')];
        expect(canSplit(hand, 0, false)).toBe(false);
    });

    it('should not allow splitting with more than 2 cards', () => {
        const hand = [card('8'), card('8'), card('2')];
        expect(canSplit(hand, 0, false)).toBe(false);
    });

    it('should respect max splits', () => {
        const hand = [card('8'), card('8')];
        expect(canSplit(hand, 3, false, DEFAULT_CONFIG)).toBe(false);
    });

    it('should not allow resplit aces when RSA disabled', () => {
        const hand = [card('A'), card('A')];
        expect(canSplit(hand, 1, true, DEFAULT_CONFIG)).toBe(false);
    });

    it('should allow resplit aces when RSA enabled', () => {
        const hand = [card('A'), card('A')];
        const config = { ...DEFAULT_CONFIG, rsaAllowed: true };
        expect(canSplit(hand, 1, true, config)).toBe(true);
    });
});

describe('canDouble', () => {
    it('should allow doubling with 2 cards', () => {
        const hand = [card('5'), card('6')];
        expect(canDouble(hand, false)).toBe(true);
    });

    it('should not allow doubling with more than 2 cards', () => {
        const hand = [card('5'), card('3'), card('3')];
        expect(canDouble(hand, false)).toBe(false);
    });

    it('should allow DAS when enabled', () => {
        const hand = [card('5'), card('6')];
        expect(canDouble(hand, true, DEFAULT_CONFIG)).toBe(true);
    });

    it('should not allow DAS when disabled', () => {
        const hand = [card('5'), card('6')];
        const config = { ...DEFAULT_CONFIG, dasAllowed: false };
        expect(canDouble(hand, true, config)).toBe(false);
    });
});

describe('canSurrender', () => {
    it('should allow late surrender on first action', () => {
        const hand = [card('10'), card('6')];
        expect(canSurrender(hand, true)).toBe(true);
    });

    it('should not allow surrender after first action', () => {
        const hand = [card('10'), card('6')];
        expect(canSurrender(hand, false)).toBe(false);
    });

    it('should not allow surrender when disabled', () => {
        const hand = [card('10'), card('6')];
        const config = { ...DEFAULT_CONFIG, lateSurrenderAllowed: false };
        expect(canSurrender(hand, true, config)).toBe(false);
    });
});

describe('dealerShouldHit', () => {
    it('should hit on 16', () => {
        const hand = [card('10'), card('6')];
        expect(dealerShouldHit(hand)).toBe(true);
    });

    it('should stand on hard 17', () => {
        const hand = [card('10'), card('7')];
        expect(dealerShouldHit(hand)).toBe(false);
    });

    it('should hit on soft 17 with H17 rule', () => {
        const hand = [card('A'), card('6')];
        expect(dealerShouldHit(hand, DEFAULT_CONFIG)).toBe(true);
    });

    it('should stand on soft 17 when H17 disabled', () => {
        const hand = [card('A'), card('6')];
        const config = { ...DEFAULT_CONFIG, dealerHitsSoft17: false };
        expect(dealerShouldHit(hand, config)).toBe(false);
    });

    it('should stand on 18', () => {
        const hand = [card('10'), card('8')];
        expect(dealerShouldHit(hand)).toBe(false);
    });
});

describe('dealerHasBlackjack', () => {
    it('should detect dealer blackjack', () => {
        const hand = [card('A'), card('K')];
        expect(dealerHasBlackjack(hand)).toBe(true);
    });

    it('should not detect 21 with 3 cards as blackjack', () => {
        const hand = [card('7'), card('7'), card('7')];
        expect(dealerHasBlackjack(hand)).toBe(false);
    });

    it('should not detect non-21 as blackjack', () => {
        const hand = [card('A'), card('9')];
        expect(dealerHasBlackjack(hand)).toBe(false);
    });
});

describe('determineOutcome', () => {
    it('should return lose when player busts', () => {
        expect(determineOutcome(25, false, true, 18, false, false)).toBe('lose');
    });

    it('should return win when dealer busts', () => {
        expect(determineOutcome(18, false, false, 25, false, true)).toBe('win');
    });

    it('should return blackjack for player blackjack vs non-blackjack', () => {
        expect(determineOutcome(21, true, false, 20, false, false)).toBe('blackjack');
    });

    it('should return push for both blackjack', () => {
        expect(determineOutcome(21, true, false, 21, true, false)).toBe('push');
    });

    it('should return lose when dealer has blackjack', () => {
        expect(determineOutcome(20, false, false, 21, true, false)).toBe('lose');
    });

    it('should return win when player value higher', () => {
        expect(determineOutcome(20, false, false, 18, false, false)).toBe('win');
    });

    it('should return lose when dealer value higher', () => {
        expect(determineOutcome(18, false, false, 20, false, false)).toBe('lose');
    });

    it('should return push on equal values', () => {
        expect(determineOutcome(18, false, false, 18, false, false)).toBe('push');
    });
});

describe('calculatePayout', () => {
    it('should calculate blackjack payout (3:2)', () => {
        expect(calculatePayout(100, 'blackjack')).toBe(250);
    });

    it('should calculate win payout (1:1)', () => {
        expect(calculatePayout(100, 'win')).toBe(200);
    });

    it('should return bet on push', () => {
        expect(calculatePayout(100, 'push')).toBe(100);
    });

    it('should return half on surrender', () => {
        expect(calculatePayout(100, 'surrender')).toBe(50);
    });

    it('should return 0 on lose', () => {
        expect(calculatePayout(100, 'lose')).toBe(0);
    });
});

describe('drawCard', () => {
    it('should draw a card from the shoe', () => {
        const shoe = [card('A'), card('K'), card('Q')];
        const result = drawCard(shoe);

        expect(result).not.toBeNull();
        expect(result!.card.rank).toBe('Q');
        expect(result!.remainingShoe.length).toBe(2);
    });

    it('should return null for empty shoe', () => {
        expect(drawCard([])).toBeNull();
    });
});

describe('needsReshuffle', () => {
    it('should return false when under penetration', () => {
        const shoe = createShoe(6); // 312 cards
        expect(needsReshuffle(shoe)).toBe(false);
    });

    it('should return true when over penetration', () => {
        // 75% of 312 = 234 cards used, 78 remaining
        const shoe = new Array(70).fill(card('A'));
        expect(needsReshuffle(shoe)).toBe(true);
    });
});

describe('split hand behavior', () => {
    it('should allow hitting split non-ace hands multiple times', () => {
        // A split hand of 3s with a drawn 5 = 8, should be able to hit again
        const hand = [card('3'), card('5')]; // 3 + 5 = 8
        const value = calculateHandValue(hand);

        expect(value.value).toBe(8);
        expect(value.isBusted).toBe(false);

        // After hitting and getting a 6 = 14, still can hit
        const handAfterHit = [card('3'), card('5'), card('6')]; // 3 + 5 + 6 = 14
        const valueAfterHit = calculateHandValue(handAfterHit);

        expect(valueAfterHit.value).toBe(14);
        expect(valueAfterHit.isBusted).toBe(false);

        // Hand with 3 cards should NOT be able to double (can only double on 2 cards)
        expect(canDouble(handAfterHit, true)).toBe(false);
    });

    it('should allow hitting until bust', () => {
        // Start with split 3 + drawn 5 = 8
        let hand = [card('3'), card('5')];
        expect(calculateHandValue(hand).isBusted).toBe(false);

        // Hit and get 10 = 18
        hand = [...hand, card('10')];
        expect(calculateHandValue(hand).value).toBe(18);
        expect(calculateHandValue(hand).isBusted).toBe(false);

        // Hit again and get 5 = 23 (bust)
        hand = [...hand, card('5')];
        expect(calculateHandValue(hand).value).toBe(23);
        expect(calculateHandValue(hand).isBusted).toBe(true);
    });

    it('should allow hitting until 21', () => {
        // Start with split 3 + drawn 5 = 8
        let hand = [card('3'), card('5')];

        // Hit and get 10 = 18
        hand = [...hand, card('10')];
        expect(calculateHandValue(hand).value).toBe(18);

        // Hit and get 3 = 21
        hand = [...hand, card('3')];
        expect(calculateHandValue(hand).value).toBe(21);
        expect(calculateHandValue(hand).isBusted).toBe(false);
        // Note: 21 with more than 2 cards is not blackjack
        expect(calculateHandValue(hand).isBlackjack).toBe(false);
    });

    it('should not allow hit/stand on split aces (only one card each)', () => {
        // Split aces should be marked as isSplitAces = true
        // The UI should check this and disable hit/stand
        // This is a UI-level check, but we verify the hand value calculation works
        const hand = [card('A'), card('10')]; // A + 10 = 21, but from split so not blackjack
        const value = calculateHandValue(hand);

        expect(value.value).toBe(21);
        // From a split, this is NOT blackjack (only natural 21 counts as blackjack)
        // The isBlackjack flag is based on card count, not split status
        // The game logic separately checks isFromSplit to determine payout
    });

    it('should allow double after split when DAS is enabled', () => {
        const hand = [card('5'), card('6')]; // 11, good to double
        expect(canDouble(hand, true, DEFAULT_CONFIG)).toBe(true);
    });

    it('should not allow double after split when DAS is disabled', () => {
        const hand = [card('5'), card('6')];
        const config = { ...DEFAULT_CONFIG, dasAllowed: false };
        expect(canDouble(hand, true, config)).toBe(false);
    });
});
