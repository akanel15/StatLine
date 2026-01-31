import {
  confirmPlayerDeletion,
  confirmSetDeletion,
  confirmGameDeletion,
} from "../../utils/playerDeletion";
import { Alert } from "react-native";
import * as cascadeDelete from "../../utils/cascadeDelete";
import { useGameStore } from "../../store/gameStore";

// Mock dependencies
jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn(),
  },
  AppState: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    removeEventListener: jest.fn(),
    currentState: "active",
  },
}));

jest.mock("../../utils/cascadeDelete");
jest.mock("../../store/gameStore");

describe("playerDeletion", () => {
  const mockAlert = Alert.alert as jest.Mock;
  const mockCascadeDeletePlayer = cascadeDelete.cascadeDeletePlayer as jest.Mock;
  const mockCascadeDeleteSet = cascadeDelete.cascadeDeleteSet as jest.Mock;
  const mockCascadeDeleteGame = cascadeDelete.cascadeDeleteGame as jest.Mock;
  const mockGetPlayerDeletionInfo = cascadeDelete.getPlayerDeletionInfo as jest.Mock;
  const mockGetSetDeletionInfo = cascadeDelete.getSetDeletionInfo as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("confirmPlayerDeletion", () => {
    it("should show alert for player with no games", () => {
      const playerId = "player-1";
      const playerName = "John Doe";
      const onSuccess = jest.fn();

      mockGetPlayerDeletionInfo.mockReturnValue({
        games: [],
        players: [],
        sets: [],
      });

      confirmPlayerDeletion(playerId, playerName, onSuccess);

      expect(mockAlert).toHaveBeenCalledWith(
        "Delete John Doe?",
        expect.stringContaining("This will permanently delete John Doe and any associated data"),
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel", style: "cancel" }),
          expect.objectContaining({
            text: "Delete",
            style: "destructive",
          }),
        ]),
      );
    });

    it("should show alert for player with games and mention game removal", () => {
      const playerId = "player-1";
      const playerName = "John Doe";
      const onSuccess = jest.fn();

      mockGetPlayerDeletionInfo.mockReturnValue({
        games: [
          { id: "game-1", name: "vs Team A" },
          { id: "game-2", name: "vs Team B" },
        ],
        players: [],
        sets: [],
      });

      confirmPlayerDeletion(playerId, playerName, onSuccess);

      expect(mockAlert).toHaveBeenCalledWith(
        "Delete John Doe?",
        expect.stringContaining("The player will be removed from the following games"),
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel", style: "cancel" }),
          expect.objectContaining({
            text: "Delete",
            style: "destructive",
          }),
        ]),
      );
    });

    it("should show first 3 games and indicate more exist", () => {
      const playerId = "player-1";
      const playerName = "John Doe";
      const onSuccess = jest.fn();

      const games = Array.from({ length: 5 }, (_, i) => ({
        id: `game-${i + 1}`,
        name: `vs Team ${String.fromCharCode(65 + i)}`,
      }));

      mockGetPlayerDeletionInfo.mockReturnValue({
        games,
        players: [],
        sets: [],
      });

      confirmPlayerDeletion(playerId, playerName, onSuccess);

      const alertCall = mockAlert.mock.calls[0];
      const message = alertCall[1];

      expect(message).toContain("vs Team A");
      expect(message).toContain("vs Team B");
      expect(message).toContain("vs Team C");
      expect(message).toContain("...and 2 more");
    });

    it("should call cascadeDeletePlayer and onSuccess when confirmed", () => {
      const playerId = "player-1";
      const playerName = "John Doe";
      const onSuccess = jest.fn();

      mockGetPlayerDeletionInfo.mockReturnValue({
        games: [],
        players: [],
        sets: [],
      });

      confirmPlayerDeletion(playerId, playerName, onSuccess);

      // Simulate user clicking the delete button
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const deleteButton = buttons.find((btn: any) => btn.style === "destructive");

      deleteButton.onPress();

      expect(mockCascadeDeletePlayer).toHaveBeenCalledWith(playerId);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("confirmSetDeletion", () => {
    it("should show alert for set with no games", () => {
      const setId = "set-1";
      const setName = "Offense Set";
      const onSuccess = jest.fn();

      mockGetSetDeletionInfo.mockReturnValue({
        games: [],
        players: [],
        sets: [],
      });

      confirmSetDeletion(setId, setName, onSuccess);

      expect(mockAlert).toHaveBeenCalledWith(
        "Delete Offense Set?",
        expect.stringContaining("This will permanently delete Offense Set and any associated data"),
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel", style: "cancel" }),
          expect.objectContaining({
            text: "Delete",
            style: "destructive",
          }),
        ]),
      );
    });

    it("should show alert for set with games", () => {
      const setId = "set-1";
      const setName = "Offense Set";
      const onSuccess = jest.fn();

      mockGetSetDeletionInfo.mockReturnValue({
        games: [{ id: "game-1", name: "vs Team A" }],
        players: [],
        sets: [],
      });

      confirmSetDeletion(setId, setName, onSuccess);

      expect(mockAlert).toHaveBeenCalledWith(
        "Delete Offense Set?",
        expect.stringContaining("The set will be removed from the following games"),
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel", style: "cancel" }),
          expect.objectContaining({
            text: "Delete",
            style: "destructive",
          }),
        ]),
      );
    });

    it("should call cascadeDeleteSet and onSuccess when confirmed", () => {
      const setId = "set-1";
      const setName = "Offense Set";
      const onSuccess = jest.fn();

      mockGetSetDeletionInfo.mockReturnValue({
        games: [],
        players: [],
        sets: [],
      });

      confirmSetDeletion(setId, setName, onSuccess);

      // Simulate user clicking the delete button
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const deleteButton = buttons.find((btn: any) => btn.style === "destructive");

      deleteButton.onPress();

      expect(mockCascadeDeleteSet).toHaveBeenCalledWith(setId);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("confirmGameDeletion", () => {
    const mockGameStore = {
      games: {} as any,
    };

    beforeEach(() => {
      (useGameStore.getState as jest.Mock).mockReturnValue(mockGameStore);
    });

    it("should show error alert when game not found", () => {
      const gameId = "game-1";
      const gameName = "vs Team A";
      const onSuccess = jest.fn();

      mockGameStore.games = {};

      confirmGameDeletion(gameId, gameName, onSuccess);

      expect(mockAlert).toHaveBeenCalledWith("Error", "Game not found.");
    });

    it("should show alert for finished game", () => {
      const gameId = "game-1";
      const gameName = "vs Team A";
      const onSuccess = jest.fn();

      mockGameStore.games = {
        [gameId]: {
          id: gameId,
          isFinished: true,
        },
      };

      confirmGameDeletion(gameId, gameName, onSuccess);

      expect(mockAlert).toHaveBeenCalledWith(
        "Delete vs Team A?",
        expect.stringContaining("This will permanently delete vs Team A and all its data"),
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel", style: "cancel" }),
          expect.objectContaining({
            text: "Delete",
            style: "destructive",
          }),
        ]),
      );
    });

    it("should show warning for active game", () => {
      const gameId = "game-1";
      const gameName = "vs Team A";
      const onSuccess = jest.fn();

      mockGameStore.games = {
        [gameId]: {
          id: gameId,
          isFinished: false,
        },
      };

      confirmGameDeletion(gameId, gameName, onSuccess);

      const alertCall = mockAlert.mock.calls[0];
      const message = alertCall[1];

      expect(message).toContain("Warning: This game is still active");
      expect(message).toContain("Deleting it will lose all current progress");

      const buttons = alertCall[2];
      const deleteButton = buttons.find((btn: any) => btn.style === "destructive");
      expect(deleteButton.text).toBe("Delete");
    });

    it("should call cascadeDeleteGame and onSuccess when confirmed", () => {
      const gameId = "game-1";
      const gameName = "vs Team A";
      const onSuccess = jest.fn();

      mockGameStore.games = {
        [gameId]: {
          id: gameId,
          isFinished: true,
        },
      };

      confirmGameDeletion(gameId, gameName, onSuccess);

      // Simulate user clicking the delete button
      const alertCall = mockAlert.mock.calls[0];
      const buttons = alertCall[2];
      const deleteButton = buttons.find((btn: any) => btn.style === "destructive");

      deleteButton.onPress();

      expect(mockCascadeDeleteGame).toHaveBeenCalledWith(gameId);
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
