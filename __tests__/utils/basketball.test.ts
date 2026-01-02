import { getPointsForAction, getPointsForPlay } from "@/utils/basketball";
import { Stat } from "@/types/stats";
import { PlayByPlayType } from "@/types/game";

describe("Basketball Utilities", () => {
  describe("getPointsForAction", () => {
    it("should return 3 points for three point makes", () => {
      expect(getPointsForAction(Stat.ThreePointMakes)).toBe(3);
    });

    it("should return 2 points for two point makes", () => {
      expect(getPointsForAction(Stat.TwoPointMakes)).toBe(2);
    });

    it("should return 1 point for free throws made", () => {
      expect(getPointsForAction(Stat.FreeThrowsMade)).toBe(1);
    });

    it("should return 0 points for non-scoring stats", () => {
      expect(getPointsForAction(Stat.Assists)).toBe(0);
      expect(getPointsForAction(Stat.DefensiveRebounds)).toBe(0);
      expect(getPointsForAction(Stat.OffensiveRebounds)).toBe(0);
      expect(getPointsForAction(Stat.Steals)).toBe(0);
      expect(getPointsForAction(Stat.Blocks)).toBe(0);
      expect(getPointsForAction(Stat.Turnovers)).toBe(0);
      expect(getPointsForAction(Stat.FoulsCommitted)).toBe(0);
      expect(getPointsForAction(Stat.Deflections)).toBe(0);
    });
  });

  describe("getPointsForPlay", () => {
    it("should return correct points for scoring plays", () => {
      const threePointPlay: PlayByPlayType = {
        id: "test-1",
        playerId: "player-1",
        action: Stat.ThreePointMakes,
      };
      expect(getPointsForPlay(threePointPlay)).toBe(3);

      const twoPointPlay: PlayByPlayType = {
        id: "test-2",
        playerId: "player-2",
        action: Stat.TwoPointMakes,
      };
      expect(getPointsForPlay(twoPointPlay)).toBe(2);

      const freeThrowPlay: PlayByPlayType = {
        id: "test-3",
        playerId: "player-3",
        action: Stat.FreeThrowsMade,
      };
      expect(getPointsForPlay(freeThrowPlay)).toBe(1);
    });

    it("should return 0 points for non-scoring plays", () => {
      const assistPlay: PlayByPlayType = {
        id: "test-4",
        playerId: "player-1",
        action: Stat.Assists,
      };
      expect(getPointsForPlay(assistPlay)).toBe(0);

      const reboundPlay: PlayByPlayType = {
        id: "test-5",
        playerId: "Opponent",
        action: Stat.DefensiveRebounds,
      };
      expect(getPointsForPlay(reboundPlay)).toBe(0);
    });

    it("should handle opponent plays correctly", () => {
      const opponentPlay: PlayByPlayType = {
        id: "test-6",
        playerId: "Opponent",
        action: Stat.ThreePointMakes,
      };
      expect(getPointsForPlay(opponentPlay)).toBe(3);
    });
  });
});
