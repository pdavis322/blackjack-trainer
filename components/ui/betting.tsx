import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const CHIP_VALUES = [10, 25, 50, 100];

const CHIP_COLORS: Record<number, { bg: string; border: string }> = {
    10: { bg: '#2563EB', border: '#1D4ED8' }, // Blue
    25: { bg: '#16A34A', border: '#15803D' }, // Green
    50: { bg: '#DC2626', border: '#B91C1C' }, // Red
    100: { bg: '#1F2937', border: '#111827' }, // Black
};

export function Chip({
    value,
    onPress,
    selected = false
}: {
    value: number;
    onPress?: () => void;
    selected?: boolean;
}) {
    const colors = CHIP_COLORS[value];

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }: { pressed: boolean }) => [
                styles.chip,
                {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.95 : selected ? 1.1 : 1 }],
                    opacity: pressed ? 0.9 : 1,
                },
                selected && styles.chipSelected,
            ]}
        >
            <View style={styles.chipInner}>
                <Text style={styles.chipValue}>{value}</Text>
            </View>
        </Pressable>
    );
}

export function BettingPanel({
    onDeal,
    currentBet = 0,
}: {
    onDeal?: (bet: number) => void;
    currentBet?: number;
}) {
    const [selectedChip, setSelectedChip] = useState<number | null>(null);
    const [bet, setBet] = useState(currentBet);

    const handleChipPress = (value: number) => {
        setSelectedChip(value);
        setBet(prev => prev + value);
    };

    const handleDeal = () => {
        if (bet > 0 && onDeal) {
            onDeal(bet);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Make Your Bet</Text>

            <View style={styles.chipsRow}>
                {CHIP_VALUES.map((value) => (
                    <Chip
                        key={value}
                        value={value}
                        onPress={() => handleChipPress(value)}
                        selected={selectedChip === value}
                    />
                ))}
            </View>

            <View style={styles.betDisplay}>
                <Text style={styles.betAmount}>{bet}</Text>
            </View>

            <Pressable
                style={({ pressed }) => [
                    styles.dealButton,
                    pressed && styles.dealButtonPressed,
                    bet === 0 && styles.dealButtonDisabled,
                ]}
                onPress={handleDeal}
                disabled={bet === 0}
            >
                <Text style={[
                    styles.dealButtonText,
                    bet === 0 && styles.dealButtonTextDisabled,
                ]}>Deal</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 24,
        textTransform: 'uppercase',
        letterSpacing: 3,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    chipsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    chip: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
    },
    chipSelected: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    chipInner: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    betDisplay: {
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    betLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    betAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FBBF24',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    dealButton: {
        backgroundColor: '#FBBF24',
        paddingHorizontal: 48,
        paddingVertical: 14,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    dealButtonPressed: {
        backgroundColor: '#F59E0B',
        transform: [{ scale: 0.98 }],
    },
    dealButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        shadowOpacity: 0,
    },
    dealButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    dealButtonTextDisabled: {
        color: 'rgba(255, 255, 255, 0.4)',
    },
});
