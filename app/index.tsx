import { BettingPanel } from '@/components/ui/betting';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const dealerCards = [
        { rank: 'K', suit: '♠', faceDown: false },
        { rank: '?', suit: '', faceDown: true },
    ];

    const playerCards = [
        { rank: '10', suit: '♥', faceDown: false },
        { rank: 'A', suit: '♠', faceDown: false },
    ];

    const handleDeal = (bet: number) => {
        console.log('Deal pressed with bet:', bet);
        // TODO: Start the game with this bet amount
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.gameArea}>
                {/* <Hand cards={dealerCards} label="Dealer" />
                <View style={styles.spacer} />
                <Hand cards={playerCards} label="Player" /> */}
                <BettingPanel onDeal={handleDeal} />
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
});
