import { StyleSheet, Text, View } from 'react-native';

interface DiscardTrayProps {
    cardCount: number;
}

export function DiscardTray({ cardCount }: DiscardTrayProps) {
    // Determine the height of the deck based on discards
    // Visualize it by stacking layers 
    const numLayers = cardCount;

    // Create layers for the "Deck" 
    const deckLayers = [];

    if (cardCount > 0) {
        // Base layers (white edges)
        for (let i = 0; i < numLayers; i++) {
            deckLayers.push(
                <View
                    key={`layer-${i}`}
                    style={[
                        styles.cardLayer,
                        {
                            top: -i * 1.5, // Shift down-left in 3D space by shifting Up in screen space?
                            // Actually, with the rotation we use, shifting Y negative moves "Up" in world Z
                            zIndex: i
                        }
                    ]}
                />
            );
        }

        // Top Card (Blue Pattern)
        deckLayers.push(
            <View
                key="top-card"
                style={[
                    styles.cardLayer,
                    styles.topCard,
                    {
                        top: -numLayers,
                        zIndex: numLayers + 1
                    }
                ]}
            >
                <View style={styles.cardPattern}>
                    <View style={styles.patternCircle} />
                    <View style={styles.patternCenter} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>DISCARDS</Text>

            {/* Scene Container */}
            <View style={styles.scene}>
                {/* Rotated Tray Container */}
                <View style={styles.trayContainer}>

                    {/* Tray Base/Back (Black Platform) */}
                    <View style={[styles.trayBase, { zIndex: -1 }]} />

                    {/* The Deck of Cards */}
                    <View style={styles.deckGroup}>
                        {deckLayers}
                    </View>

                    {/* Tray Front/Glass (Optional, maybe just inferred by base) */}
                    {/* Adding a visual border or box around it */}

                </View>
            </View>

            <Text style={styles.count}>{cardCount}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: 100,
    },
    label: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    count: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 20, // Add space for the 3D projection
    },
    scene: {
        width: 100,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        // Make sure we have space for the rotation
        marginVertical: 10,
    },
    trayContainer: {
        position: 'relative',
        width: 60,
        height: 80,
        // The requested 3D transformation
        transform: [
            { perspective: 800 },
            { rotateX: '60deg' },
            { rotateZ: '30deg' },
        ],
    },
    trayBase: {
        position: 'absolute',
        top: 2,
        left: 2,
        width: 64, // Slightly larger than cards
        height: 84,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
    },
    deckGroup: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    cardLayer: {
        position: 'absolute',
        left: 0,
        width: 60,
        height: 80,
        backgroundColor: '#E5E5E5', // White-ish edge
        borderWidth: 1,
        borderColor: '#CCCCCC', // Darker edge line
        borderRadius: 3,
    },
    topCard: {
        backgroundColor: '#1E3A8A', // Blue card back
        borderColor: '#172554',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardPattern: {
        width: 50,
        height: 70,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    patternCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        position: 'absolute',
    },
    patternCenter: {
        width: 30,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        transform: [{ rotate: '45deg' }],
    }
});
