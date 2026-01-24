import { GamePlay } from '@/components/gameplay';
import { BettingPanel } from '@/components/ui/betting';
import { DiscardTray } from '@/components/ui/discard-tray';
import { Card, createShoe, DEFAULT_CONFIG, needsReshuffle } from '@/utils/blackjack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GamePhase = 'betting' | 'playing';

export default function HomeScreen() {
    const [shoe, setShoe] = useState<Card[]>([]);
    const [balance, setBalance] = useState(10000);
    const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
    const [currentBet, setCurrentBet] = useState(0);
    const [discardCount, setDiscardCount] = useState(0);

    // Initialize shoe on mount
    useEffect(() => {
        setShoe(createShoe(DEFAULT_CONFIG.numDecks));
    }, []);

    const handleDeal = (bet: number) => {
        console.log('Deal pressed with bet:', bet);
        setBalance(balance - bet);
        setCurrentBet(bet);
        setGamePhase('playing');
    };

    const handleGameEnd = (winnings: number, cardsUsed: number, remainingShoe: Card[]) => {
        setBalance(prev => prev + winnings);

        // Check for reshuffle
        if (needsReshuffle(remainingShoe)) {
            console.log('Reshuffling shoe...');
            setShoe(createShoe(DEFAULT_CONFIG.numDecks));
            setDiscardCount(0);
        } else {
            setShoe(remainingShoe);
            setDiscardCount(prev => prev + cardsUsed);
        }

        setGamePhase('betting');
        setCurrentBet(0);
    };

    const handleBetChange = (additionalBet: number) => {
        setBalance(prev => prev - additionalBet);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.gameArea}>
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceAmount}>${balance.toLocaleString()}</Text>
                </View>

                {gamePhase === 'betting' ? (
                    <>
                        <View style={styles.discardTrayRow}>
                            <DiscardTray cardCount={discardCount} />
                        </View>
                        <BettingPanel onDeal={handleDeal} />
                    </>
                ) : (
                    <GamePlay
                        bet={currentBet}
                        initialShoe={shoe}
                        onGameEnd={handleGameEnd}
                        onBetChange={handleBetChange}
                        discardCount={discardCount}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F4C2E', // Casino green
    },
    gameArea: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 40,
        justifyContent: 'space-between',
    },
    spacer: {
        flex: 1,
    },
    discardTrayRow: {
        alignSelf: 'flex-start',
    },
    balanceContainer: {
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    balanceAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
