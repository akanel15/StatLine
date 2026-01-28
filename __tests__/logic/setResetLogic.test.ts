import { shouldResetSet } from "@/logic/setResetLogic";
import { Stat } from "@/types/stats";

describe("Set Reset Logic", () => {
  describe("shouldResetSet", () => {
    describe("Your team actions", () => {
      test("should NOT reset on made shot (2PT)", () => {
        const stats = [Stat.TwoPointMakes, Stat.TwoPointAttempts];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on made shot (3PT)", () => {
        const stats = [Stat.ThreePointMakes, Stat.ThreePointAttempts];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on made free throw", () => {
        const stats = [Stat.FreeThrowsMade, Stat.FreeThrowsAttempted];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on missed shot (2PT)", () => {
        const stats = [Stat.TwoPointAttempts];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on missed shot (3PT)", () => {
        const stats = [Stat.ThreePointAttempts];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on missed free throw", () => {
        const stats = [Stat.FreeThrowsAttempted];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on assist", () => {
        const stats = [Stat.Assists];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on offensive rebound", () => {
        const stats = [Stat.OffensiveRebounds];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on defensive rebound", () => {
        const stats = [Stat.DefensiveRebounds];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on steal", () => {
        const stats = [Stat.Steals];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on block", () => {
        const stats = [Stat.Blocks];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on deflection", () => {
        const stats = [Stat.Deflections];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on foul committed", () => {
        const stats = [Stat.FoulsCommitted];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should NOT reset on foul drawn", () => {
        const stats = [Stat.FoulsDrawn];
        expect(shouldResetSet(stats, false)).toBe(false);
      });

      test("should RESET on turnover", () => {
        const stats = [Stat.Turnovers];
        expect(shouldResetSet(stats, false)).toBe(true);
      });
    });

    describe("Opponent actions", () => {
      test("should RESET on opponent made shot (2PT)", () => {
        const stats = [Stat.TwoPointMakes, Stat.TwoPointAttempts];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should RESET on opponent made shot (3PT)", () => {
        const stats = [Stat.ThreePointMakes, Stat.ThreePointAttempts];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should RESET on opponent made free throw", () => {
        const stats = [Stat.FreeThrowsMade, Stat.FreeThrowsAttempted];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should RESET on opponent missed shot", () => {
        const stats = [Stat.TwoPointAttempts];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should RESET on opponent defensive rebound", () => {
        const stats = [Stat.DefensiveRebounds];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should RESET on opponent offensive rebound", () => {
        const stats = [Stat.OffensiveRebounds];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should RESET on opponent steal", () => {
        const stats = [Stat.Steals];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should RESET on opponent block", () => {
        const stats = [Stat.Blocks];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should RESET on opponent turnover", () => {
        const stats = [Stat.Turnovers];
        expect(shouldResetSet(stats, true)).toBe(true);
      });

      test("should NOT reset on opponent foul committed", () => {
        const stats = [Stat.FoulsCommitted];
        expect(shouldResetSet(stats, true)).toBe(false);
      });

      test("should NOT reset on opponent foul drawn", () => {
        const stats = [Stat.FoulsDrawn];
        expect(shouldResetSet(stats, true)).toBe(false);
      });

      test("should NOT reset on opponent deflection", () => {
        const stats = [Stat.Deflections];
        expect(shouldResetSet(stats, true)).toBe(false);
      });
    });

    describe("Edge cases", () => {
      test("should NOT reset on empty stats array", () => {
        expect(shouldResetSet([], false)).toBe(false);
        expect(shouldResetSet([], true)).toBe(false);
      });
    });

    describe("Real game scenarios", () => {
      describe("Scenario 1: Made Shot + Assist (Fixed)", () => {
        test("made shot keeps set active", () => {
          const stats = [Stat.ThreePointMakes, Stat.ThreePointAttempts];
          expect(shouldResetSet(stats, false)).toBe(false);
        });

        test("assist keeps set active (same set!)", () => {
          const stats = [Stat.Assists];
          expect(shouldResetSet(stats, false)).toBe(false);
        });

        test("opponent made shot resets set", () => {
          const stats = [Stat.TwoPointMakes, Stat.TwoPointAttempts];
          expect(shouldResetSet(stats, true)).toBe(true);
        });
      });

      describe("Scenario 2: Missed Shot + Offensive Rebound", () => {
        test("missed shot keeps set active", () => {
          const stats = [Stat.TwoPointAttempts];
          expect(shouldResetSet(stats, false)).toBe(false);
        });

        test("offensive rebound keeps set active (same possession)", () => {
          const stats = [Stat.OffensiveRebounds];
          expect(shouldResetSet(stats, false)).toBe(false);
        });

        test("made shot keeps set active", () => {
          const stats = [Stat.TwoPointMakes, Stat.TwoPointAttempts];
          expect(shouldResetSet(stats, false)).toBe(false);
        });

        test("opponent defensive rebound resets set", () => {
          const stats = [Stat.DefensiveRebounds];
          expect(shouldResetSet(stats, true)).toBe(true);
        });
      });

      describe("Scenario 3: And-1 (Foul on Made Shot)", () => {
        test("made shot keeps set active", () => {
          const stats = [Stat.TwoPointMakes, Stat.TwoPointAttempts];
          expect(shouldResetSet(stats, false)).toBe(false);
        });

        test("opponent foul does NOT reset set (and-1 possibility)", () => {
          const stats = [Stat.FoulsCommitted];
          expect(shouldResetSet(stats, true)).toBe(false);
        });

        test("free throw make keeps set active", () => {
          const stats = [Stat.FreeThrowsMade, Stat.FreeThrowsAttempted];
          expect(shouldResetSet(stats, false)).toBe(false);
        });

        test("opponent defensive rebound resets set", () => {
          const stats = [Stat.DefensiveRebounds];
          expect(shouldResetSet(stats, true)).toBe(true);
        });
      });

      describe("Scenario 4: Turnover", () => {
        test("your turnover resets set immediately (lost possession)", () => {
          const stats = [Stat.Turnovers];
          expect(shouldResetSet(stats, false)).toBe(true);
        });
      });

      describe("Scenario 5: Opponent turnover (we get ball)", () => {
        test("opponent turnover resets set (indicates possession change)", () => {
          const stats = [Stat.Turnovers];
          expect(shouldResetSet(stats, true)).toBe(true);
        });
      });

      describe("Scenario 6: Technical foul (edge case)", () => {
        test("opponent foul does not reset", () => {
          const stats = [Stat.FoulsCommitted];
          expect(shouldResetSet(stats, true)).toBe(false);
        });
      });

      describe("Scenario 7: Deflection without turnover", () => {
        test("opponent deflection keeps set active (touched ball, no possession)", () => {
          const stats = [Stat.Deflections];
          expect(shouldResetSet(stats, true)).toBe(false);
        });
      });
    });
  });
});
