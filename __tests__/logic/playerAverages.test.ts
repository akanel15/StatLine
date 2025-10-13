import { calculatePlayerAverages } from "@/logic/playerAverages";
import { Stat, StatsType, initialBaseStats } from "@/types/stats";

describe("calculatePlayerAverages", () => {
  describe("with games played", () => {
    it("calculates correct averages for all stats", () => {
      const stats: StatsType = {
        [Stat.Points]: 60,
        [Stat.Assists]: 15,
        [Stat.DefensiveRebounds]: 20,
        [Stat.OffensiveRebounds]: 10,
        [Stat.Steals]: 8,
        [Stat.Deflections]: 12,
        [Stat.Blocks]: 6,
        [Stat.Turnovers]: 9,
        [Stat.TwoPointMakes]: 15,
        [Stat.TwoPointAttempts]: 30,
        [Stat.ThreePointMakes]: 9,
        [Stat.ThreePointAttempts]: 27,
        [Stat.FreeThrowsMade]: 12,
        [Stat.FreeThrowsAttempted]: 15,
        [Stat.FoulsCommitted]: 12,
        [Stat.FoulsDrawn]: 18,
        [Stat.PlusMinus]: 30,
      };

      const averages = calculatePlayerAverages(stats, 3);

      expect(averages[Stat.Points]).toBe(20);
      expect(averages[Stat.Assists]).toBe(5);
      expect(averages[Stat.DefensiveRebounds]).toBeCloseTo(6.67, 2);
      expect(averages[Stat.OffensiveRebounds]).toBeCloseTo(3.33, 2);
      expect(averages[Stat.Steals]).toBeCloseTo(2.67, 2);
      expect(averages[Stat.Deflections]).toBe(4);
      expect(averages[Stat.Blocks]).toBe(2);
      expect(averages[Stat.Turnovers]).toBe(3);
      expect(averages[Stat.TwoPointMakes]).toBe(5);
      expect(averages[Stat.TwoPointAttempts]).toBe(10);
      expect(averages[Stat.ThreePointMakes]).toBe(3);
      expect(averages[Stat.ThreePointAttempts]).toBe(9);
      expect(averages[Stat.FreeThrowsMade]).toBe(4);
      expect(averages[Stat.FreeThrowsAttempted]).toBe(5);
      expect(averages[Stat.FoulsCommitted]).toBe(4);
      expect(averages[Stat.FoulsDrawn]).toBe(6);
      expect(averages[Stat.PlusMinus]).toBe(10);
    });

    it("handles single game played", () => {
      const stats: StatsType = {
        [Stat.Points]: 25,
        [Stat.Assists]: 7,
        [Stat.DefensiveRebounds]: 5,
        [Stat.OffensiveRebounds]: 3,
        [Stat.Steals]: 2,
        [Stat.Deflections]: 1,
        [Stat.Blocks]: 1,
        [Stat.Turnovers]: 3,
        [Stat.TwoPointMakes]: 8,
        [Stat.TwoPointAttempts]: 12,
        [Stat.ThreePointMakes]: 3,
        [Stat.ThreePointAttempts]: 6,
        [Stat.FreeThrowsMade]: 0,
        [Stat.FreeThrowsAttempted]: 0,
        [Stat.FoulsCommitted]: 2,
        [Stat.FoulsDrawn]: 4,
        [Stat.PlusMinus]: 8,
      };

      const averages = calculatePlayerAverages(stats, 1);

      // With 1 game, averages should equal the stats
      expect(averages[Stat.Points]).toBe(25);
      expect(averages[Stat.Assists]).toBe(7);
      expect(averages[Stat.DefensiveRebounds]).toBe(5);
      expect(averages[Stat.OffensiveRebounds]).toBe(3);
      expect(averages[Stat.Steals]).toBe(2);
      expect(averages[Stat.Deflections]).toBe(1);
      expect(averages[Stat.Blocks]).toBe(1);
      expect(averages[Stat.Turnovers]).toBe(3);
      expect(averages[Stat.TwoPointMakes]).toBe(8);
      expect(averages[Stat.TwoPointAttempts]).toBe(12);
      expect(averages[Stat.ThreePointMakes]).toBe(3);
      expect(averages[Stat.ThreePointAttempts]).toBe(6);
      expect(averages[Stat.FreeThrowsMade]).toBe(0);
      expect(averages[Stat.FreeThrowsAttempted]).toBe(0);
      expect(averages[Stat.FoulsCommitted]).toBe(2);
      expect(averages[Stat.FoulsDrawn]).toBe(4);
      expect(averages[Stat.PlusMinus]).toBe(8);
    });

    it("handles fractional averages correctly", () => {
      const stats: StatsType = {
        [Stat.Points]: 50,
        [Stat.Assists]: 10,
        [Stat.DefensiveRebounds]: 11,
        [Stat.OffensiveRebounds]: 8,
        [Stat.Steals]: 5,
        [Stat.Deflections]: 7,
        [Stat.Blocks]: 4,
        [Stat.Turnovers]: 9,
        [Stat.TwoPointMakes]: 14,
        [Stat.TwoPointAttempts]: 28,
        [Stat.ThreePointMakes]: 6,
        [Stat.ThreePointAttempts]: 18,
        [Stat.FreeThrowsMade]: 10,
        [Stat.FreeThrowsAttempted]: 12,
        [Stat.FoulsCommitted]: 11,
        [Stat.FoulsDrawn]: 13,
        [Stat.PlusMinus]: 15,
      };

      const averages = calculatePlayerAverages(stats, 7);

      expect(averages[Stat.Points]).toBeCloseTo(7.14, 2);
      expect(averages[Stat.Assists]).toBeCloseTo(1.43, 2);
      expect(averages[Stat.DefensiveRebounds]).toBeCloseTo(1.57, 2);
      expect(averages[Stat.OffensiveRebounds]).toBeCloseTo(1.14, 2);
      expect(averages[Stat.Steals]).toBeCloseTo(0.71, 2);
      expect(averages[Stat.Deflections]).toBe(1);
      expect(averages[Stat.Blocks]).toBeCloseTo(0.57, 2);
      expect(averages[Stat.Turnovers]).toBeCloseTo(1.29, 2);
    });

    it("handles zero stats correctly", () => {
      const stats: StatsType = { ...initialBaseStats };

      const averages = calculatePlayerAverages(stats, 5);

      // All averages should be 0
      expect(averages[Stat.Points]).toBe(0);
      expect(averages[Stat.Assists]).toBe(0);
      expect(averages[Stat.DefensiveRebounds]).toBe(0);
      expect(averages[Stat.OffensiveRebounds]).toBe(0);
      expect(averages[Stat.Steals]).toBe(0);
      expect(averages[Stat.Deflections]).toBe(0);
      expect(averages[Stat.Blocks]).toBe(0);
      expect(averages[Stat.Turnovers]).toBe(0);
      expect(averages[Stat.TwoPointMakes]).toBe(0);
      expect(averages[Stat.TwoPointAttempts]).toBe(0);
      expect(averages[Stat.ThreePointMakes]).toBe(0);
      expect(averages[Stat.ThreePointAttempts]).toBe(0);
      expect(averages[Stat.FreeThrowsMade]).toBe(0);
      expect(averages[Stat.FreeThrowsAttempted]).toBe(0);
      expect(averages[Stat.FoulsCommitted]).toBe(0);
      expect(averages[Stat.FoulsDrawn]).toBe(0);
      expect(averages[Stat.PlusMinus]).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("returns initial stats when games played is 0", () => {
      const stats: StatsType = {
        [Stat.Points]: 100,
        [Stat.Assists]: 50,
        [Stat.DefensiveRebounds]: 30,
        [Stat.OffensiveRebounds]: 20,
        [Stat.Steals]: 15,
        [Stat.Deflections]: 10,
        [Stat.Blocks]: 8,
        [Stat.Turnovers]: 12,
        [Stat.TwoPointMakes]: 40,
        [Stat.TwoPointAttempts]: 80,
        [Stat.ThreePointMakes]: 6,
        [Stat.ThreePointAttempts]: 20,
        [Stat.FreeThrowsMade]: 14,
        [Stat.FreeThrowsAttempted]: 18,
        [Stat.FoulsCommitted]: 20,
        [Stat.FoulsDrawn]: 25,
        [Stat.PlusMinus]: 50,
      };

      const averages = calculatePlayerAverages(stats, 0);

      // Should return all zeros
      expect(averages).toEqual(initialBaseStats);
    });

    it("handles negative plus/minus correctly", () => {
      const stats: StatsType = {
        ...initialBaseStats,
        [Stat.Points]: 30,
        [Stat.PlusMinus]: -15,
      };

      const averages = calculatePlayerAverages(stats, 3);

      expect(averages[Stat.Points]).toBe(10);
      expect(averages[Stat.PlusMinus]).toBe(-5);
    });

    it("returns new object and does not mutate input", () => {
      const stats: StatsType = {
        ...initialBaseStats,
        [Stat.Points]: 60,
        [Stat.Assists]: 15,
      };

      const originalPoints = stats[Stat.Points];
      const originalAssists = stats[Stat.Assists];

      const averages = calculatePlayerAverages(stats, 3);

      // Original should be unchanged
      expect(stats[Stat.Points]).toBe(originalPoints);
      expect(stats[Stat.Assists]).toBe(originalAssists);

      // Averages should be different object
      expect(averages).not.toBe(stats);
      expect(averages[Stat.Points]).toBe(20);
      expect(averages[Stat.Assists]).toBe(5);
    });
  });
});
