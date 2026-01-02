import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';
import { theme } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { PlayByPlayType, Team } from '@/types/game';
import { getPointsForPlay } from '@/utils/basketball';
import SwipeablePlayTile from './SwipeablePlayTile';

interface PlayItem {
  id: string;
  play: PlayByPlayType;
  score: string;
}

export default function SwipeableDraggableList() {
  const games = useGameStore(state => state.games);

  // Find first game with play-by-play data and extract all plays
  const initialData = useMemo<PlayItem[]>(() => {
    // Find a high-scoring game (team score > 80) with play-by-play data
    const gamesWithPlays = Object.values(games).filter(game =>
      game.periods?.some(period => period.playByPlay && period.playByPlay.length > 0)
    );

    if (gamesWithPlays.length === 0) {
      console.log('No games with play-by-play data found');
      return [];
    }

    // Try to find a game where team scored more than 80
    let gameWithPlays = gamesWithPlays.find(game =>
      game.statTotals[Team.Us]?.Points > 80
    );

    // Fallback to game with most plays if no high-scoring game found
    if (!gameWithPlays) {
      gameWithPlays = gamesWithPlays.reduce((maxGame, game) => {
        const gamePlayCount = game.periods.reduce(
          (sum, period) => sum + (period.playByPlay?.length || 0),
          0
        );
        const maxPlayCount = maxGame.periods.reduce(
          (sum, period) => sum + (period.playByPlay?.length || 0),
          0
        );
        return gamePlayCount > maxPlayCount ? game : maxGame;
      }, gamesWithPlays[0]);
    }

    console.log(`Selected game ${gameWithPlays.id} - Team score: ${gameWithPlays.statTotals[Team.Us]?.Points || 0}`);

    const playItems: PlayItem[] = [];
    let teamScore = 0;
    let opponentScore = 0;
    let playIdCounter = 0;

    // Iterate through periods in order
    gameWithPlays.periods.forEach((period) => {
      if (!period.playByPlay || period.playByPlay.length === 0) return;

      // Plays are stored newest-first (unshift), so reverse to get chronological order
      const chronologicalPlays = [...period.playByPlay].reverse();

      chronologicalPlays.forEach((play) => {
        const points = getPointsForPlay(play);

        // Update scores
        if (play.playerId === 'Opponent') {
          opponentScore += points;
        } else {
          teamScore += points;
        }

        // Only show score for scoring plays
        const scoreText = points > 0 ? `${teamScore} - ${opponentScore}` : '';

        playItems.push({
          id: `play-${playIdCounter++}`,
          play,
          score: scoreText,
        });
      });
    });

    console.log(`Loaded ${playItems.length} plays from game ${gameWithPlays.id}`);
    return playItems;
  }, [games]);

  const [data, setData] = useState<PlayItem[]>(initialData);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    itemId: string
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteContainer,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(itemId)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleDelete = (id: string) => {
    setData((prevData) => prevData.filter((item) => item.id !== id));
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<PlayItem>) => {
    return (
      <ScaleDecorator>
        <Swipeable
          renderRightActions={(progress, dragX) =>
            renderRightActions(progress, dragX, item.id)
          }
          overshootRight={false}
        >
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={[isActive && styles.itemContainerActive]}
          >
            <SwipeablePlayTile
              play={item.play}
              isActive={isActive}
              score={item.score}
            />
          </TouchableOpacity>
        </Swipeable>
      </ScaleDecorator>
    );
  };

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No game data available</Text>
          <Text style={styles.emptySubtext}>
            Play a game and record some plays to see them here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>
        Press & hold to drag • Swipe left to delete
      </Text>
      <DraggableFlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data: newData }) => setData(newData)}
        containerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  instructions: {
    padding: 16,
    fontSize: 14,
    color: theme.colorOnyx,
    textAlign: 'center',
    backgroundColor: theme.colorCultured,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorPlatinum,
  },
  listContainer: {
    flex: 1,
  },
  itemContainerActive: {
    backgroundColor: theme.colorCultured,
    elevation: 5,
    shadowColor: theme.colorOnyx,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colorGrey,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colorGrey,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  deleteContainer: {
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'flex-end',
    minHeight: 56,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  deleteButtonText: {
    color: theme.colorWhite,
    fontWeight: '600',
    fontSize: 16,
  },
});
