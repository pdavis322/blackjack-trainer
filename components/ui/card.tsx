import { StyleSheet, Text, View } from 'react-native';

// Card component
export function Card({ rank, suit, faceDown = false }: { rank?: string; suit?: string; faceDown?: boolean }) {
    const getSuitColor = (suit: string) => {
        return suit === '♥' || suit === '♦' ? '#DC2626' : '#1F2937';
    };

    if (faceDown) {
        return (
            <View style={[styles.card, styles.cardFaceDown]}>
                <View style={styles.cardBack}>
                    <View style={styles.cardBackPattern} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={[styles.cardRank, { color: getSuitColor(suit!) }]}>{rank}</Text>
            <Text style={[styles.cardSuit, { color: getSuitColor(suit!) }]}>{suit}</Text>
            <Text style={[styles.cardRankBottom, { color: getSuitColor(suit!) }]}>{rank}</Text>
        </View>
    );
}

// Hand component to display a row of cards
export function Hand({ cards, label }: { cards: { rank: string; suit: string; faceDown?: boolean }[]; label: string }) {
    return (
        <View style={styles.handContainer}>
            <Text style={styles.handLabel}>{label}</Text>
            <View style={styles.cardsRow}>
                {cards.map((card, index) => (
                    <Card key={index} rank={card.rank} suit={card.suit} faceDown={card.faceDown} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    handContainer: {
        alignItems: 'center',
    },
    handLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    cardsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    card: {
        width: 80,
        height: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        position: 'relative',
    },
    cardFaceDown: {
        backgroundColor: '#1E40AF',
        padding: 4,
    },
    cardBack: {
        flex: 1,
        backgroundColor: '#1E3A8A',
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBackPattern: {
        width: 40,
        height: 40,
        borderWidth: 3,
        borderColor: '#FBBF24',
        borderRadius: 20,
        transform: [{ rotate: '45deg' }],
    },
    cardRank: {
        fontSize: 20,
        fontWeight: 'bold',
        position: 'absolute',
        top: 8,
        left: 8,
    },
    cardSuit: {
        fontSize: 32,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -16 }, { translateY: -16 }],
    },
    cardRankBottom: {
        fontSize: 20,
        fontWeight: 'bold',
        position: 'absolute',
        bottom: 8,
        right: 8,
        transform: [{ rotate: '180deg' }],
    },
});
