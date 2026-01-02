import { getPointsForPlay } from "@/utils/basketball";
import { GameType, PeriodType, Team, PeriodInfo } from "@/types/game";
import { Stat } from "@/types/stats";
import { initialBaseStats } from "@/types/stats";

describe("PlayByPlay Cumulative Scoring Logic", () => {
  const createMockGame = (periods: PeriodInfo[]): GameType => ({
    id: "test-game-id",
    teamId: "team-1",
    opposingTeamName: "Opponent Team",
    activePlayers: [],
    activeSets: [],
    gamePlayedList: [],
    periodType: PeriodType.Quarters,
    statTotals: {
      [Team.Us]: { ...initialBaseStats },
      [Team.Opponent]: { ...initialBaseStats },
    },
    periods: periods,
    boxScore: {},
    isFinished: false,
    sets: {},
  });

  describe("Cumulative Score Calculation Logic", () => {
    it("should calculate cumulative scores correctly across periods", () => {
      const mockGame = createMockGame([
        // Period 0: Team scores 5 (3+2), Opponent scores 3
        {
          [Team.Us]: 5,
          [Team.Opponent]: 3,
          playByPlay: [
            { id: "play-0-0", playerId: "player-2", action: Stat.TwoPointMakes }, // +2 = 5
            { id: "play-0-1", playerId: "Opponent", action: Stat.ThreePointMakes }, // +3 = 3
            { id: "play-0-2", playerId: "player-1", action: Stat.ThreePointMakes }, // +3 = 3
          ],
        },
        // Period 1: Team scores 4 more, Opponent scores 2 more
        {
          [Team.Us]: 4,
          [Team.Opponent]: 2,
          playByPlay: [
            { id: "play-1-0", playerId: "player-1", action: Stat.TwoPointMakes }, // Should show 9-5 cumulative
            { id: "play-1-1", playerId: "Opponent", action: Stat.TwoPointMakes }, // Should show 7-5 cumulative
            { id: "play-1-2", playerId: "player-2", action: Stat.TwoPointMakes }, // Should show 7-3 cumulative
          ],
        },
      ]);

      // Test the cumulative calculation logic manually
      // This mimics what the useMemo hook would calculate
      const cumulativePeriodTotals = mockGame.periods.reduce(
        (acc, periodInfo, pIndex) => {
          const periodTotals = periodInfo.playByPlay.reduce(
            (pAcc, play) => {
              const points = getPointsForPlay(play);
              if (play.playerId === "Opponent") {
                pAcc.opponent += points;
              } else {
                pAcc.team += points;
              }
              return pAcc;
            },
            { team: 0, opponent: 0 },
          );

          const lastTotal = acc[pIndex - 1] ?? { team: 0, opponent: 0 };
          acc[pIndex] = {
            team: lastTotal.team + periodTotals.team,
            opponent: lastTotal.opponent + periodTotals.opponent,
          };

          return acc;
        },
        [] as { team: number; opponent: number }[],
      );

      // Verify period 0 totals
      expect(cumulativePeriodTotals[0].team).toBe(5); // 3 + 2
      expect(cumulativePeriodTotals[0].opponent).toBe(3); // 3

      // Verify period 1 cumulative totals
      expect(cumulativePeriodTotals[1].team).toBe(9); // 5 + 4
      expect(cumulativePeriodTotals[1].opponent).toBe(5); // 3 + 2
    });
  });

  describe("Running Score Calculation Within Period", () => {
    it("should calculate running scores correctly within a period", () => {
      const mockGame = createMockGame([
        // First period with 10 total team points, 8 total opponent points
        {
          [Team.Us]: 10,
          [Team.Opponent]: 8,
          playByPlay: [
            { id: "play-0-0", playerId: "player-1", action: Stat.TwoPointMakes }, // Most recent: +2 team
            { id: "play-0-1", playerId: "Opponent", action: Stat.TwoPointMakes }, // +2 opponent
            { id: "play-0-2", playerId: "player-2", action: Stat.ThreePointMakes }, // +3 team
            { id: "play-0-3", playerId: "Opponent", action: Stat.ThreePointMakes }, // +3 opponent
            { id: "play-0-4", playerId: "player-1", action: Stat.FreeThrowsMade }, // +1 team
            { id: "play-0-5", playerId: "player-1", action: Stat.TwoPointMakes }, // +2 team
            { id: "play-0-6", playerId: "Opponent", action: Stat.ThreePointMakes }, // +3 opponent
            { id: "play-0-7", playerId: "player-1", action: Stat.TwoPointMakes }, // Oldest: +2 team
          ],
        },
      ]);

      const period = 0;
      const playByPlay = mockGame.periods[period].playByPlay;

      // Test score calculation for play at index 0 (most recent play)
      // Since plays are in reverse chronological order, we slice from index to end
      const scoreAtIndex0 = playByPlay.slice(0).reduce(
        (acc, play) => {
          const points = getPointsForPlay(play);
          if (play.playerId === "Opponent") {
            acc.opponent += points;
          } else {
            acc.team += points;
          }
          return acc;
        },
        { team: 0, opponent: 0 },
      );

      expect(scoreAtIndex0.team).toBe(10); // All team points
      expect(scoreAtIndex0.opponent).toBe(8); // All opponent points

      // Test score calculation for play at index 2 (3rd most recent)
      const scoreAtIndex2 = playByPlay.slice(2).reduce(
        (acc, play) => {
          const points = getPointsForPlay(play);
          if (play.playerId === "Opponent") {
            acc.opponent += points;
          } else {
            acc.team += points;
          }
          return acc;
        },
        { team: 0, opponent: 0 },
      );

      expect(scoreAtIndex2.team).toBe(8); // Excludes first 2 team plays (2+3 points)
      expect(scoreAtIndex2.opponent).toBe(6); // Excludes first opponent play (2 points)
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty periods in cumulative calculation", () => {
      const mockGame = createMockGame([
        {
          [Team.Us]: 0,
          [Team.Opponent]: 0,
          playByPlay: [],
        },
        {
          [Team.Us]: 3,
          [Team.Opponent]: 2,
          playByPlay: [
            { id: "play-1-0", playerId: "player-1", action: Stat.ThreePointMakes },
            { id: "play-1-1", playerId: "Opponent", action: Stat.TwoPointMakes },
          ],
        },
      ]);

      // Calculate cumulative totals with empty first period
      const cumulativePeriodTotals = mockGame.periods.reduce(
        (acc, periodInfo, pIndex) => {
          const periodTotals = periodInfo.playByPlay.reduce(
            (pAcc, play) => {
              const points = getPointsForPlay(play);
              if (play.playerId === "Opponent") {
                pAcc.opponent += points;
              } else {
                pAcc.team += points;
              }
              return pAcc;
            },
            { team: 0, opponent: 0 },
          );

          const lastTotal = acc[pIndex - 1] ?? { team: 0, opponent: 0 };
          acc[pIndex] = {
            team: lastTotal.team + periodTotals.team,
            opponent: lastTotal.opponent + periodTotals.opponent,
          };

          return acc;
        },
        [] as { team: number; opponent: number }[],
      );

      // Empty first period should have 0 points
      expect(cumulativePeriodTotals[0].team).toBe(0);
      expect(cumulativePeriodTotals[0].opponent).toBe(0);

      // Second period should build on top of first (which was 0)
      expect(cumulativePeriodTotals[1].team).toBe(3);
      expect(cumulativePeriodTotals[1].opponent).toBe(2);
    });

    it("should handle games with no periods", () => {
      const mockGame = createMockGame([]);

      // Empty periods array should return empty cumulative totals
      const cumulativePeriodTotals = mockGame.periods.reduce(
        (acc, periodInfo, pIndex) => {
          const periodTotals = periodInfo.playByPlay.reduce(
            (pAcc, play) => {
              const points = getPointsForPlay(play);
              if (play.playerId === "Opponent") {
                pAcc.opponent += points;
              } else {
                pAcc.team += points;
              }
              return pAcc;
            },
            { team: 0, opponent: 0 },
          );

          const lastTotal = acc[pIndex - 1] ?? { team: 0, opponent: 0 };
          acc[pIndex] = {
            team: lastTotal.team + periodTotals.team,
            opponent: lastTotal.opponent + periodTotals.opponent,
          };

          return acc;
        },
        [] as { team: number; opponent: number }[],
      );

      expect(cumulativePeriodTotals).toEqual([]);
    });
  });
});
