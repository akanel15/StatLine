import { StatLineButton } from "@/components/StatLineButton";
import { GameCard } from "@/components/GameCard";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTeamStore } from "@/store/teamStore";
import { theme } from "@/theme";
import { router } from "expo-router";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BackToTeamButton } from "@/components/BackToTeamButton";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { StickyShareButton } from "@/components/sharing/StickyShareButton";
import { GameSelectionHeader } from "@/components/sharing/GameSelectionHeader";
import { ShareTypeModal } from "@/components/sharing/ShareTypeModal";
import { buildExportPackage } from "@/logic/exportData";
import { shareStatLineFile } from "@/utils/shareGameData";
import { shareBoxScoreImage, shareMultipleBoxScoreImages } from "@/utils/shareBoxScore";
import { sanitizeFileName } from "@/utils/filename";
import ViewShot from "react-native-view-shot";
import ShareableBoxScore from "@/components/gamePage/ShareableBoxScore";
import type { Game } from "@/types/game";

export default function Games() {
  const games = useGameStore(state => state.games);
  const players = usePlayerStore(state => state.players);
  const gameList = Object.values(games);
  const currentTeamId = useTeamStore(state => state.currentTeamId);
  const getTeamSafely = useTeamStore(state => state.getTeamSafely);
  const teamGames = gameList.filter(game => game.teamId === currentTeamId);
  const navigation = useNavigation();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [showShareTypeModal, setShowShareTypeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingShareAction, setPendingShareAction] = useState<"image" | "data" | null>(null);
  const [shareProgress, setShareProgress] = useState<{ completed: number; total: number } | null>(
    null,
  );
  const shareableRef = useRef<ViewShot>(null);
  const shareableRefs = useRef<Record<string, ViewShot | null>>({});
  const cancelSignalRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedGameIds(new Set());
  }, []);

  const toggleSelectGame = useCallback((gameId: string) => {
    setSelectedGameIds(prev => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  }, []);

  const handleShareData = useCallback(() => {
    if (selectedGameIds.size === 0) return;
    setPendingShareAction("data");
    setShowShareTypeModal(false);
  }, [selectedGameIds.size]);

  const executeShareData = useCallback(async () => {
    if (selectedGameIds.size === 0) return;

    setIsSharing(true);
    try {
      const selectedGames = teamGames.filter(g => selectedGameIds.has(g.id));
      const team = getTeamSafely(currentTeamId);
      const teamName = team?.name || "My Team";
      const setsRecord = (await import("@/store/setStore")).useSetStore.getState().sets;
      const exportData = buildExportPackage(teamName, selectedGames, players, setsRecord);
      await shareStatLineFile(exportData, teamName);
    } finally {
      setIsSharing(false);
      exitSelectionMode();
    }
  }, [selectedGameIds, teamGames, players, currentTeamId, getTeamSafely, exitSelectionMode]);

  const buildGameFileName = useCallback((game: Game, ourTeamName: string) => {
    const opponentName = game.opposingTeamName || "Opponent";
    return sanitizeFileName(`${ourTeamName} vs ${opponentName}`);
  }, []);

  const handleCancelShare = useCallback(() => {
    cancelSignalRef.current.cancelled = true;
  }, []);

  const handleShareImage = useCallback(() => {
    if (selectedGameIds.size === 0) return;
    setPendingShareAction("image");
    setShowShareTypeModal(false);
  }, [selectedGameIds.size]);

  const executeShareImage = useCallback(async () => {
    if (selectedGameIds.size === 0) return;

    if (__DEV__) console.log("[executeShareImage] Starting, selected:", selectedGameIds.size);
    setIsSharing(true);
    setShowShareModal(true);

    setTimeout(async () => {
      try {
        const team = getTeamSafely(currentTeamId);
        const ourTeamName = team?.name || "Our-Team";
        const selectedGames = [...selectedGameIds].map(id => games[id]).filter(Boolean);
        if (__DEV__)
          console.log("[executeShareImage] setTimeout fired, games:", selectedGames.length);

        if (selectedGames.length === 1) {
          // Single game — use existing expo-sharing flow
          if (__DEV__)
            console.log(
              "[executeShareImage] Single game path, ref exists:",
              !!shareableRef.current,
            );
          if (shareableRef.current) {
            const opponentName = selectedGames[0].opposingTeamName || "Opponent";
            const gameName = `vs ${opponentName}`;
            const fileName = sanitizeFileName(`${ourTeamName} vs ${opponentName}`);
            if (__DEV__) console.log("[executeShareImage] Calling shareBoxScoreImage");
            await shareBoxScoreImage(shareableRef, gameName, fileName);
            if (__DEV__) console.log("[executeShareImage] shareBoxScoreImage completed");
          }
        } else {
          // Multiple games — capture each separately via react-native-share
          if (__DEV__)
            console.log("[executeShareImage] Multi-game path, count:", selectedGames.length);
          const refs: React.RefObject<any>[] = [];
          const fileNames: string[] = [];

          // Track duplicate filenames and add suffix
          const nameCount: Record<string, number> = {};
          for (const game of selectedGames) {
            const baseName = buildGameFileName(game, ourTeamName);
            // baseName includes .png — strip it, we'll re-add after dedup
            const nameWithoutExt = baseName.replace(/\.png$/, "");
            nameCount[nameWithoutExt] = (nameCount[nameWithoutExt] || 0) + 1;
          }

          const nameUsage: Record<string, number> = {};
          for (const game of selectedGames) {
            const ref = shareableRefs.current[game.id];
            if (ref) {
              refs.push({ current: ref });
              const baseName = buildGameFileName(game, ourTeamName).replace(/\.png$/, "");
              nameUsage[baseName] = (nameUsage[baseName] || 0) + 1;
              const suffix = nameCount[baseName] > 1 ? `-${nameUsage[baseName]}` : "";
              fileNames.push(`${baseName}${suffix}.png`);
            }
          }

          if (refs.length > 0) {
            if (__DEV__)
              console.log(
                "[executeShareImage] Calling shareMultipleBoxScoreImages, refs:",
                refs.length,
              );
            cancelSignalRef.current = { cancelled: false };
            setShareProgress({ completed: 0, total: refs.length });

            await shareMultipleBoxScoreImages(
              refs,
              fileNames,
              (completed, total) => setShareProgress({ completed, total }),
              cancelSignalRef.current,
            );
            if (__DEV__) console.log("[executeShareImage] shareMultipleBoxScoreImages completed");
          }
        }
      } finally {
        if (__DEV__) console.log("[executeShareImage] Finally block — cleaning up");
        setIsSharing(false);
        setShowShareModal(false);
        setShareProgress(null);
        exitSelectionMode();
      }
    }, 500);
  }, [selectedGameIds, games, currentTeamId, getTeamSafely, exitSelectionMode, buildGameFileName]);

  const handleShareTypeModalDismiss = useCallback(() => {
    const action = pendingShareAction;
    setPendingShareAction(null);
    if (action === "image") {
      executeShareImage();
    } else if (action === "data") {
      executeShareData();
    }
  }, [pendingShareAction, executeShareImage, executeShareData]);

  const handleHeaderSharePress = useCallback(() => {
    if (selectedGameIds.size === 0) return;
    setShowShareTypeModal(true);
  }, [selectedGameIds.size]);

  // Update header for selection mode
  useLayoutEffect(() => {
    if (selectionMode) {
      navigation.setOptions({
        headerTitle: () => (
          <GameSelectionHeader
            selectedCount={selectedGameIds.size}
            onCancel={exitSelectionMode}
            onShare={handleHeaderSharePress}
          />
        ),
        headerLeft: () => null,
        headerRight: () => null,
      });
    } else {
      // Restore original header buttons (must be explicit — undefined won't restore layout defaults)
      navigation.setOptions({
        headerTitle: undefined,
        headerLeft: () => <BackToTeamButton />,
        headerRight: () => <HeaderIconButton href="/games/newGame" iconName="plus-circle" />,
      });
    }
  }, [selectionMode, selectedGameIds.size, navigation, exitSelectionMode, handleHeaderSharePress]);

  // Cancel selection when screen blurs (tab switch)
  useLayoutEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      if (selectionMode) {
        exitSelectionMode();
      }
    });
    return unsubscribe;
  }, [navigation, selectionMode, exitSelectionMode]);

  return (
    <View style={styles.wrapper}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        data={teamGames}
        renderItem={({ item }) => (
          <GameCard
            game={item}
            selectionMode={selectionMode}
            selected={selectedGameIds.has(item.id)}
            onToggleSelect={toggleSelectGame}
          />
        )}
        ListEmptyComponent={
          <StatLineButton
            title="Add your first game"
            onPress={() => router.navigate("/games/newGame")}
          />
        }
      />
      {teamGames.length > 0 && !selectionMode && (
        <StickyShareButton
          label="Share Games"
          onPress={() => setSelectionMode(true)}
          disabled={isSharing}
          loading={isSharing}
        />
      )}

      {/* Share Type Modal */}
      <ShareTypeModal
        visible={showShareTypeModal}
        onClose={() => setShowShareTypeModal(false)}
        onShareImage={handleShareImage}
        onShareData={handleShareData}
        onDismiss={handleShareTypeModalDismiss}
      />

      {/* Hidden Modal for Capturing Box Score Image */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowShareModal(false)}
      >
        {/* Off-screen ViewShots for capture */}
        <View style={styles.hiddenModalContainer}>
          {/* Single ViewShot for 1-game sharing (expo-sharing) */}
          <ViewShot
            ref={shareableRef}
            options={{
              format: "png",
              quality: 0.9,
              result: "tmpfile",
            }}
          >
            {[...selectedGameIds]
              .map(id => games[id])
              .filter(Boolean)
              .slice(0, 1)
              .map(game => (
                <ShareableBoxScore key={game.id} game={game} players={players} />
              ))}
          </ViewShot>

          {/* Individual ViewShots for multi-game sharing (react-native-share) */}
          {[...selectedGameIds]
            .map(id => games[id])
            .filter(Boolean)
            .map(game => (
              <ViewShot
                key={game.id}
                ref={ref => {
                  shareableRefs.current[game.id] = ref;
                }}
                options={{
                  format: "png",
                  quality: 0.9,
                  result: "tmpfile",
                }}
              >
                <ShareableBoxScore game={game} players={players} />
              </ViewShot>
            ))}
        </View>

        {/* Progress overlay for multi-game capture */}
        {shareProgress !== null && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressCard}>
              <ActivityIndicator size="large" color={theme.colorOrangePeel} />
              <Text style={styles.progressText}>
                {`Capturing image ${Math.min(shareProgress.completed + 1, shareProgress.total)} of ${shareProgress.total}...`}
              </Text>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelShare}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  contentContainer: {
    padding: 12,
    shadowColor: theme.colorBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hiddenModalContainer: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressCard: {
    backgroundColor: theme.colorWhite,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    width: "80%",
    maxWidth: 320,
    gap: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  cancelButton: {
    padding: 14,
    backgroundColor: theme.colorLightGrey,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "stretch",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
});
