import { Text, View, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { PlayByPlayType } from '@/types/game';
import { getPlayerDisplayNameWithNumber } from '@/utils/displayHelpers';
import { Stat } from '@/types/stats';
import Ionicons from '@expo/vector-icons/Ionicons';

interface SwipeablePlayTileProps {
  play: PlayByPlayType;
  isActive: boolean;
  score?: string;
}

// Convert Stat enum to display text
const formatAction = (action: Stat): string => {
  const actionMap: Record<Stat, string> = {
    [Stat.TwoPointMakes]: '2pm',
    [Stat.TwoPointMisses]: '2pm miss',
    [Stat.ThreePointMakes]: '3pm',
    [Stat.ThreePointMisses]: '3pm miss',
    [Stat.FreeThrowsMade]: 'FT made',
    [Stat.FreeThrowsMissed]: 'FT miss',
    [Stat.Assists]: 'Assist',
    [Stat.DefensiveRebounds]: 'Def Rebound',
    [Stat.OffensiveRebounds]: 'Off Rebound',
    [Stat.Steals]: 'Steal',
    [Stat.Blocks]: 'Block',
    [Stat.Turnovers]: 'Turnover',
    [Stat.PersonalFouls]: 'Foul',
    [Stat.Points]: 'Points',
    [Stat.FieldGoalAttempts]: 'FGA',
    [Stat.FieldGoalMakes]: 'FGM',
    [Stat.FreeThrowAttempts]: 'FTA',
    [Stat.ThreePointAttempts]: '3PA',
    [Stat.TotalRebounds]: 'Rebound',
  };

  return actionMap[action] || action;
};

export default function SwipeablePlayTile({
  play,
  isActive,
  score,
}: SwipeablePlayTileProps) {
  const isOpponent = play.playerId === 'Opponent';
  const displayName = getPlayerDisplayNameWithNumber(play.playerId);
  const actionText = formatAction(play.action);
  const isScoringPlay = score !== undefined && score !== '';

  return (
    <View
      style={[
        styles.container,
        isOpponent ? styles.opponentBackground : styles.playerBackground,
      ]}
    >
      {/* Drag Handle - visible when active */}
      {isActive && (
        <View style={styles.dragHandle}>
          <Ionicons name="reorder-three-outline" size={20} color={theme.colorGrey} />
        </View>
      )}

      <Text style={[styles.playerInfo, isOpponent && styles.opponentText]}>
        {displayName}
      </Text>

      <Text style={[styles.action, isScoringPlay && styles.boldText]}>
        {actionText}
      </Text>

      <Text style={styles.score}>{score || ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorLightGrey,
    minHeight: 56,
  },
  dragHandle: {
    marginRight: 8,
    paddingRight: 4,
  },
  playerBackground: {
    backgroundColor: theme.colorWhite,
  },
  opponentBackground: {
    backgroundColor: theme.colorLightGrey,
  },
  playerInfo: {
    width: 140,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colorOnyx,
  },
  opponentText: {
    color: theme.colorRedCrayola,
  },
  action: {
    flex: 1,
    fontSize: 14,
    color: theme.colorOnyx,
  },
  boldText: {
    fontWeight: 'bold',
  },
  score: {
    width: 72,
    fontSize: 16,
    textAlign: 'right',
    color: theme.colorBlack,
  },
});
