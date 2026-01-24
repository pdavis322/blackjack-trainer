import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

// Card component with optional animation
export function Card({
    rank,
    suit,
    faceDown = false,
    animate = false,
    animationDelay = 0,
    discarding = false,
}: {
    rank?: string;
    suit?: string;
    faceDown?: boolean;
    animate?: boolean;
    animationDelay?: number;
    discarding?: boolean;
}) {
    const translateX = useRef(new Animated.Value(animate ? 300 : 0)).current;
    const translateY = useRef(new Animated.Value(animate ? -300 : 0)).current;
    const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (animate) {
            // Reset to starting position
            translateX.setValue(300);
            translateY.setValue(-300);
            opacity.setValue(0);

            // Animate to final position with delay
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, animationDelay);
        }
    }, [animate, animationDelay, translateX, translateY, opacity]);

    useEffect(() => {
        if (discarding) {
            // Animate to discard tray (left side, shrink)
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: -400,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.3,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 400,
                    delay: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [discarding, translateX, translateY, scale, opacity]);

    const getSuitColor = (suit: string) => {
        return suit === '♥' || suit === '♦' ? '#DC2626' : '#1F2937';
    };

    const animatedStyle = {
        transform: [
            { translateX },
            { translateY },
            { scale },
        ],
        opacity,
    };

    if (faceDown) {
        return (
            <Animated.View style={[styles.card, styles.cardFaceDown, animatedStyle]}>
                <View style={styles.cardBack}>
                    <View style={styles.cardBackPattern} />
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.card, animatedStyle]}>
            <Text style={[styles.cardRank, { color: getSuitColor(suit!) }]}>{rank}</Text>
            <Text style={[styles.cardSuit, { color: getSuitColor(suit!) }]}>{suit}</Text>
            <Text style={[styles.cardRankBottom, { color: getSuitColor(suit!) }]}>{rank}</Text>
        </Animated.View>
    );
}

// Hand component to display a row of cards
export function Hand({
    cards,
    animateNewCards = false,
    discarding = false,
}: {
    cards: { rank: string; suit: string; faceDown?: boolean; isNew?: boolean }[];
    animateNewCards?: boolean;
    discarding?: boolean;
}) {
    return (
        <View style={styles.handContainer}>
            <View style={styles.cardsRow}>
                {cards.map((card, index) => (
                    <Card
                        key={`${card.rank}-${card.suit}-${index}-${card.isNew}`}
                        rank={card.rank}
                        suit={card.suit}
                        faceDown={card.faceDown}
                        animate={animateNewCards && !!card.isNew}
                        animationDelay={index * 100}
                        discarding={discarding}
                    />
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
