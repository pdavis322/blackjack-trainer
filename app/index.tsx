import { Hand } from '@/components/ui/card';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    // Sample cards for display
    const dealerCards = [
        { rank: 'K', suit: '♠', faceDown: false },
        { rank: '?', suit: '', faceDown: true },
    ];

    const playerCards = [
        { rank: '10', suit: '♥', faceDown: false },
        { rank: 'A', suit: '♠', faceDown: false },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.gameArea}>
                {/* Dealer's hand at the top */}
                <Hand cards={dealerCards} label="Dealer" />

                {/* Spacer */}
                <View style={styles.spacer} />

                {/* Player's hand at the bottom */}
                <Hand cards={playerCards} label="Player" />
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
