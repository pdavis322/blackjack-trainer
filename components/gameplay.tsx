import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
    calculateHandValue,
    calculatePayout,
    canDouble,
    canSplit,
    canSurrender,
    Card,
    dealerHasBlackjack,
    dealerShouldHit,
    determineOutcome,
    drawCard
} from '../utils/blackjack';
import { Hand } from './ui/card';
import { DiscardTray } from './ui/discard-tray';

type GameState = 'dealing' | 'playerTurn' | 'dealerTurn' | 'complete' | 'discarding';

interface PlayerHand {
    cards: Card[];
    bet: number;
    isDoubled: boolean;
    isFromSplit: boolean;
    isSplitAces: boolean;
    result?: 'win' | 'lose' | 'push' | 'blackjack' | 'surrender';
}

export function GamePlay({
    bet,
    initialShoe,
    onGameEnd,
    onBetChange,
    discardCount = 0,
}: {
    bet: number;
    initialShoe: Card[];
    onGameEnd: (winnings: number, cardsUsed: number, remainingShoe: Card[]) => void;
    onBetChange?: (additionalBet: number) => void;
    discardCount?: number;
}) {
    const [shoe, setShoe] = useState<Card[]>([]);
    const [dealerCards, setDealerCards] = useState<Card[]>([]);
    const [playerHands, setPlayerHands] = useState<PlayerHand[]>([]);
    const [activeHandIndex, setActiveHandIndex] = useState(0);
    const [gameState, setGameState] = useState<GameState>('dealing');
    const [isFirstAction, setIsFirstAction] = useState(true);
    const [message, setMessage] = useState('');

    const activeHand = playerHands[activeHandIndex];
    const handValue = activeHand ? calculateHandValue(activeHand.cards) : null;

    // Deal initial cards when component mounts
    useEffect(() => {
        // Use the passed shoe instead of creating a new one
        const newShoe = [...initialShoe];

        // Deal cards: player gets 2, dealer gets 2 (one face down)
        const playerCard1 = newShoe.pop()!;
        const dealerCard1 = { ...newShoe.pop()!, faceDown: false };
        const playerCard2 = newShoe.pop()!;
        const dealerCard2 = { ...newShoe.pop()!, faceDown: true };

        setShoe(newShoe);
        setDealerCards([
            { ...dealerCard1, isNew: true },
            { ...dealerCard2, isNew: true },
        ]);
        setPlayerHands([{
            cards: [
                { ...playerCard1, isNew: true },
                { ...playerCard2, isNew: true },
            ],
            bet,
            isDoubled: false,
            isFromSplit: false,
            isSplitAces: false,
        }]);

        // Check for dealer blackjack (peek)
        const dealerHasBJ = dealerHasBlackjack([dealerCard1, { ...dealerCard2, faceDown: false }]);
        const playerResult = calculateHandValue([playerCard1, playerCard2]);

        if (dealerHasBJ) {
            // Reveal dealer's hole card
            setDealerCards([dealerCard1, { ...dealerCard2, faceDown: false }]);
            if (playerResult.isBlackjack) {
                setMessage('Both have Blackjack - Push!');
                setPlayerHands([{
                    cards: [playerCard1, playerCard2],
                    bet,
                    isDoubled: false,
                    isFromSplit: false,
                    isSplitAces: false,
                    result: 'push',
                }]);
            } else {
                setMessage('Dealer has Blackjack!');
                setPlayerHands([{
                    cards: [playerCard1, playerCard2],
                    bet,
                    isDoubled: false,
                    isFromSplit: false,
                    isSplitAces: false,
                    result: 'lose',
                }]);
            }
            setGameState('complete');
        } else if (playerResult.isBlackjack) {
            setMessage('Blackjack!');
            setPlayerHands([{
                cards: [playerCard1, playerCard2],
                bet,
                isDoubled: false,
                isFromSplit: false,
                isSplitAces: false,
                result: 'blackjack',
            }]);
            // Reveal dealer's hole card
            setDealerCards([dealerCard1, { ...dealerCard2, faceDown: false }]);
            setGameState('complete');
        } else {
            setGameState('playerTurn');
        }
    }, [bet]); // Still depends on bet to trigger (assuming key/mount changes)

    // Track winnings and cards for game end
    const gameEndDataRef = useRef<{ winnings: number; cardsUsed: number; remainingShoe: Card[] } | null>(null);

    // Calculate total winnings when complete and start discard animation
    useEffect(() => {
        if (gameState === 'complete' && playerHands.length > 0 && playerHands.every(h => h.result)) {
            const totalWinnings = playerHands.reduce((sum, hand) => {
                return sum + calculatePayout(hand.bet, hand.result!);
            }, 0);

            // Count all cards used in this hand
            const playerCardCount = playerHands.reduce((sum, hand) => sum + hand.cards.length, 0);
            const dealerCardCount = dealerCards.length;
            const cardsUsed = playerCardCount + dealerCardCount;

            // Store for later use, including the current remaining shoe
            gameEndDataRef.current = { winnings: totalWinnings, cardsUsed, remainingShoe: shoe };

            // Start discard animation after showing results
            const discardTimer = setTimeout(() => {
                setGameState('discarding');
            }, 1500);

            return () => clearTimeout(discardTimer);
        }
    }, [gameState, playerHands, dealerCards, shoe]);

    // End game after discard animation
    useEffect(() => {
        if (gameState === 'discarding' && gameEndDataRef.current) {
            const endTimer = setTimeout(() => {
                const { winnings, cardsUsed, remainingShoe } = gameEndDataRef.current!;
                gameEndDataRef.current = null;
                onGameEnd(winnings, cardsUsed, remainingShoe);
            }, 700);

            return () => clearTimeout(endTimer);
        }
    }, [gameState, onGameEnd]);

    const handleHit = () => {
        setIsFirstAction(false);
        const result = drawCard(shoe);
        if (!result) return;

        const newCards = [...activeHand.cards.map(c => ({ ...c, isNew: false })), { ...result.card, isNew: true }];
        const newValue = calculateHandValue(newCards);

        const updatedHands = [...playerHands];
        updatedHands[activeHandIndex] = { ...activeHand, cards: newCards };

        setShoe(result.remainingShoe);
        setPlayerHands(updatedHands);

        if (newValue.isBusted) {
            updatedHands[activeHandIndex].result = 'lose';
            setPlayerHands(updatedHands);
            moveToNextHand(updatedHands, result.remainingShoe);
        }
    };

    const handleStand = () => {
        setIsFirstAction(false);
        moveToNextHand(playerHands, shoe);
    };

    const handleDouble = () => {
        setIsFirstAction(false);
        const result = drawCard(shoe);
        if (!result) return;

        const newCards = [...activeHand.cards.map(c => ({ ...c, isNew: false })), { ...result.card, isNew: true }];
        const newValue = calculateHandValue(newCards);

        // Deduct additional bet for double
        onBetChange?.(activeHand.bet);

        const updatedHands = [...playerHands];
        updatedHands[activeHandIndex] = {
            ...activeHand,
            cards: newCards,
            bet: activeHand.bet * 2,
            isDoubled: true,
            result: newValue.isBusted ? 'lose' : undefined,
        };

        setShoe(result.remainingShoe);
        setPlayerHands(updatedHands);
        moveToNextHand(updatedHands, result.remainingShoe);
    };

    const handleSplit = () => {
        setIsFirstAction(false);
        const [card1, card2] = activeHand.cards;
        const isAces = card1.rank === 'A';

        // Deduct additional bet for split
        onBetChange?.(activeHand.bet);

        // Draw one card for each new hand
        let currentShoe = [...shoe];
        const draw1 = drawCard(currentShoe);
        if (!draw1) return;
        currentShoe = draw1.remainingShoe;

        const draw2 = drawCard(currentShoe);
        if (!draw2) return;
        currentShoe = draw2.remainingShoe;

        const hand1: PlayerHand = {
            cards: [card1, draw1.card],
            bet: activeHand.bet,
            isDoubled: false,
            isFromSplit: true,
            isSplitAces: isAces,
        };

        const hand2: PlayerHand = {
            cards: [card2, draw2.card],
            bet: activeHand.bet,
            isDoubled: false,
            isFromSplit: true,
            isSplitAces: isAces,
        };

        const updatedHands = [...playerHands];
        updatedHands.splice(activeHandIndex, 1, hand1, hand2);

        setShoe(currentShoe);
        setPlayerHands(updatedHands);

        // If split aces, no more actions allowed - go straight to dealer
        if (isAces) {
            playDealerTurn(updatedHands, currentShoe);
        } else {
            // For non-aces, stay on the first split hand and allow actions
            setIsFirstAction(true);
        }
    };

    const handleSurrender = () => {
        const updatedHands = [...playerHands];
        updatedHands[activeHandIndex] = { ...activeHand, result: 'surrender' };
        setPlayerHands(updatedHands);
        setMessage('Surrendered');
        moveToNextHand(updatedHands, shoe);
    };

    const moveToNextHand = (currentHands: PlayerHand[], currentShoe: Card[]) => {
        const nextIndex = activeHandIndex + 1;
        if (nextIndex < currentHands.length) {
            setActiveHandIndex(nextIndex);
            setIsFirstAction(true);
        } else {
            // All hands done, dealer's turn
            playDealerTurn(currentHands, currentShoe);
        }
    };

    const playDealerTurn = (currentHands: PlayerHand[], currentShoe: Card[]) => {
        setGameState('dealerTurn');

        // Reveal hole card and clear isNew from existing cards
        let currentDealerCards = dealerCards.map(c => ({ ...c, faceDown: false, isNew: false }));
        let workingShoe = [...currentShoe];

        // Dealer draws according to rules
        while (dealerShouldHit(currentDealerCards)) {
            const result = drawCard(workingShoe);
            if (!result) break;
            currentDealerCards = [...currentDealerCards, { ...result.card, faceDown: false, isNew: true }];
            workingShoe = result.remainingShoe;
        }

        setDealerCards(currentDealerCards);
        setShoe(workingShoe);

        // Determine outcomes for all hands
        const dealerValue = calculateHandValue(currentDealerCards);
        const updatedHands = currentHands.map(hand => {
            if (hand.result) return hand; // Already has a result (busted/surrendered)

            const playerValue = calculateHandValue(hand.cards);
            const outcome = determineOutcome(
                playerValue.value,
                playerValue.isBlackjack && !hand.isFromSplit,
                playerValue.isBusted,
                dealerValue.value,
                dealerValue.isBlackjack,
                dealerValue.isBusted
            );

            return { ...hand, result: outcome };
        });

        setPlayerHands(updatedHands);
        setGameState('complete');
    };

    // Determine available actions
    const showHit = gameState === 'playerTurn' && activeHand && !activeHand.isSplitAces;
    const showStand = gameState === 'playerTurn' && activeHand;
    const showDouble = gameState === 'playerTurn' && activeHand &&
        canDouble(activeHand.cards, activeHand.isFromSplit);
    const showSplit = gameState === 'playerTurn' && activeHand &&
        canSplit(activeHand.cards, playerHands.length - 1, activeHand.isSplitAces);
    const showSurrender = gameState === 'playerTurn' && activeHand &&
        canSurrender(activeHand.cards, isFirstAction) && !activeHand.isFromSplit;

    return (
        <View style={styles.container}>
            {/* Dealer area centered */}
            <View style={styles.dealerArea}>
                <Hand cards={dealerCards} animateNewCards={true} discarding={gameState === 'discarding'} />
                <Text style={styles.handValueText}>
                    {calculateHandValue(dealerCards).value || '?'}
                </Text>
            </View>

            {/* Discard tray below dealer, floated left */}
            <View style={styles.discardTrayRow}>
                <DiscardTray cardCount={discardCount} />
            </View>

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={styles.spacer} />

            {/* Show all player hands */}
            {playerHands.map((hand, index) => (
                <View key={index} style={[
                    styles.handWrapper,
                    index === activeHandIndex && gameState === 'playerTurn' && styles.activeHand,
                ]}>
                    {playerHands.length > 1 && (
                        <Text style={styles.handLabel}>Hand {index + 1}</Text>
                    )}
                    <Hand cards={hand.cards} animateNewCards={true} discarding={gameState === 'discarding'} />
                    <Text style={styles.handValueText}>
                        {calculateHandValue(hand.cards).value}
                        {hand.result && ` - ${hand.result.toUpperCase()}`}
                    </Text>
                </View>
            ))}

            {/* Action Buttons */}
            {gameState === 'playerTurn' && (
                <View style={styles.actionsRow}>
                    {showSurrender && (
                        <Pressable style={styles.actionButton} onPress={handleSurrender}>
                            <Text style={styles.actionButtonText}>Surrender</Text>
                        </Pressable>
                    )}
                    {showHit && (
                        <Pressable style={[styles.actionButton, styles.hitButton]} onPress={handleHit}>
                            <Text style={styles.actionButtonText}>Hit</Text>
                        </Pressable>
                    )}
                    {showStand && (
                        <Pressable style={[styles.actionButton, styles.standButton]} onPress={handleStand}>
                            <Text style={styles.actionButtonText}>Stand</Text>
                        </Pressable>
                    )}
                    {showDouble && (
                        <Pressable style={[styles.actionButton, styles.doubleButton]} onPress={handleDouble}>
                            <Text style={styles.actionButtonText}>Double</Text>
                        </Pressable>
                    )}
                    {showSplit && (
                        <Pressable style={[styles.actionButton, styles.splitButton]} onPress={handleSplit}>
                            <Text style={styles.actionButtonText}>Split</Text>
                        </Pressable>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    discardTrayRow: {
        alignSelf: 'flex-start',
        marginTop: 16,
        marginLeft: 0,
    },
    dealerArea: {
        alignItems: 'center',
        alignSelf: 'center',
    },
    betLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    betAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FBBF24',
    },
    message: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FBBF24',
        marginBottom: 16,
    },
    spacer: {
        flex: 1,
    },
    handWrapper: {
        alignItems: 'center',
        marginBottom: 8,
    },
    activeHand: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 12,
        paddingVertical: 8,
    },
    handLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 4,
    },
    handValueText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 8,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 24,
        flexWrap: 'wrap',
    },
    actionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    hitButton: {
        backgroundColor: '#16A34A',
    },
    standButton: {
        backgroundColor: '#DC2626',
    },
    doubleButton: {
        backgroundColor: '#2563EB',
    },
    splitButton: {
        backgroundColor: '#9333EA',
    },
});
