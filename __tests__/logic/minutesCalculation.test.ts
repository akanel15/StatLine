import {
  calculateStintMinutes,
  calculatePlayerMinutes,
  calculateAllPlayerMinutes,
  formatMinutes,
  parseClockInput,
  closePeriodStints,
  openNewPeriodStints,
  processSubstitution,
  remapStintsAfterPeriodDeletion,
} from "@/logic/minutesCalculation";
import { StintType } from "@/types/game";

describe("calculateStintMinutes", () => {
  it("calculates minutes from check-in to check-out", () => {
    const stint: StintType = { playerId: "p1", periodIndex: 0, checkInTime: 600, checkOutTime: 300 };
    expect(calculateStintMinutes(stint)).toBe(300); // 5 minutes in seconds
  });

  it("treats undefined checkOutTime as 0 (end of period)", () => {
    const stint: StintType = { playerId: "p1", periodIndex: 0, checkInTime: 600 };
    expect(calculateStintMinutes(stint)).toBe(600); // full period
  });

  it("returns 0 for same check-in and check-out", () => {
    const stint: StintType = { playerId: "p1", periodIndex: 0, checkInTime: 300, checkOutTime: 300 };
    expect(calculateStintMinutes(stint)).toBe(0);
  });

  it("returns 0 if checkOut is greater than checkIn (invalid data)", () => {
    const stint: StintType = { playerId: "p1", periodIndex: 0, checkInTime: 200, checkOutTime: 400 };
    expect(calculateStintMinutes(stint)).toBe(0);
  });
});

describe("calculatePlayerMinutes", () => {
  const stints: StintType[] = [
    { playerId: "p1", periodIndex: 0, checkInTime: 600, checkOutTime: 300 }, // 300s
    { playerId: "p2", periodIndex: 0, checkInTime: 600, checkOutTime: 0 }, // 600s
    { playerId: "p1", periodIndex: 1, checkInTime: 600, checkOutTime: 420 }, // 180s
  ];

  it("sums minutes across all stints for a player", () => {
    expect(calculatePlayerMinutes(stints, "p1")).toBe(480); // 300 + 180
  });

  it("returns 0 for player with no stints", () => {
    expect(calculatePlayerMinutes(stints, "p99")).toBe(0);
  });
});

describe("calculateAllPlayerMinutes", () => {
  it("returns minutes for all players", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600, checkOutTime: 300 }, // 300s
      { playerId: "p2", periodIndex: 0, checkInTime: 600, checkOutTime: 0 }, // 600s
      { playerId: "p1", periodIndex: 1, checkInTime: 600, checkOutTime: 420 }, // 180s
    ];
    const result = calculateAllPlayerMinutes(stints);
    expect(result).toEqual({ p1: 480, p2: 600 });
  });

  it("returns empty object for no stints", () => {
    expect(calculateAllPlayerMinutes([])).toEqual({});
  });

  it("uses currentPeriodClockTime for open stints in current period", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600 }, // open stint, current period
      { playerId: "p2", periodIndex: 0, checkInTime: 600, checkOutTime: 300 }, // closed stint
    ];
    // Clock is at 5:00 (300 seconds remaining) in period 0
    const result = calculateAllPlayerMinutes(stints, 0, 300);
    expect(result.p1).toBe(300); // 600 - 300 = 5 minutes, NOT 600 (full period)
    expect(result.p2).toBe(300); // closed stint, unaffected
  });

  it("does NOT use currentPeriodClockTime for open stints in completed periods", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600 }, // open in period 0 (completed)
      { playerId: "p1", periodIndex: 1, checkInTime: 600 }, // open in period 1 (current)
    ];
    // Current period is 1, clock at 300
    const result = calculateAllPlayerMinutes(stints, 1, 300);
    expect(result.p1).toBe(900); // period 0: 600 (full, extrapolated) + period 1: 300 (to clock)
  });

  it("backwards compatible — no currentPeriod params uses 0 for open stints", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600 }, // open
    ];
    const result = calculateAllPlayerMinutes(stints);
    expect(result.p1).toBe(600); // treats as full period (checkOut = 0)
  });
});

describe("formatMinutes", () => {
  it("formats seconds as M:SS", () => {
    expect(formatMinutes(600)).toBe("10:00");
    expect(formatMinutes(452)).toBe("7:32");
    expect(formatMinutes(65)).toBe("1:05");
    expect(formatMinutes(0)).toBe("0:00");
    expect(formatMinutes(5)).toBe("0:05");
  });
});

describe("parseClockInput", () => {
  const periodLength = 600; // 10 minutes

  it("parses valid clock input", () => {
    expect(parseClockInput("7", "32", periodLength)).toBe(452);
    expect(parseClockInput("10", "00", periodLength)).toBe(600);
    expect(parseClockInput("0", "00", periodLength)).toBe(0);
    expect(parseClockInput("0", "30", periodLength)).toBe(30);
  });

  it("returns null for non-numeric input", () => {
    expect(parseClockInput("abc", "00", periodLength)).toBeNull();
    expect(parseClockInput("7", "xx", periodLength)).toBeNull();
    expect(parseClockInput("", "", periodLength)).toBeNull();
  });

  it("returns null for seconds > 59", () => {
    expect(parseClockInput("7", "60", periodLength)).toBeNull();
    expect(parseClockInput("7", "99", periodLength)).toBeNull();
  });

  it("returns null for negative values", () => {
    expect(parseClockInput("-1", "00", periodLength)).toBeNull();
    expect(parseClockInput("7", "-5", periodLength)).toBeNull();
  });

  it("returns null if time exceeds period length", () => {
    expect(parseClockInput("11", "00", periodLength)).toBeNull();
    expect(parseClockInput("10", "01", periodLength)).toBeNull();
  });
});

describe("closePeriodStints", () => {
  it("closes open stints for the specified period", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600 }, // open
      { playerId: "p2", periodIndex: 0, checkInTime: 600, checkOutTime: 300 }, // already closed
      { playerId: "p3", periodIndex: 1, checkInTime: 600 }, // different period, stays open
    ];
    const result = closePeriodStints(stints, 0);
    expect(result[0].checkOutTime).toBe(0);
    expect(result[1].checkOutTime).toBe(300); // unchanged
    expect(result[2].checkOutTime).toBeUndefined(); // different period
  });

  it("does not mutate original array", () => {
    const stints: StintType[] = [{ playerId: "p1", periodIndex: 0, checkInTime: 600 }];
    const result = closePeriodStints(stints, 0);
    expect(stints[0].checkOutTime).toBeUndefined();
    expect(result[0].checkOutTime).toBe(0);
  });
});

describe("openNewPeriodStints", () => {
  it("creates check-in stints for all players at period start", () => {
    const existing: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600, checkOutTime: 0 },
    ];
    const result = openNewPeriodStints(existing, ["p1", "p2"], 1, 600);
    expect(result).toHaveLength(3); // 1 existing + 2 new
    expect(result[1]).toEqual({ playerId: "p1", periodIndex: 1, checkInTime: 600 });
    expect(result[2]).toEqual({ playerId: "p2", periodIndex: 1, checkInTime: 600 });
  });
});

describe("processSubstitution", () => {
  it("closes stints for subbed-out players and opens stints for subbed-in players", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600 }, // will be subbed out
      { playerId: "p2", periodIndex: 0, checkInTime: 600 }, // stays in
    ];
    const result = processSubstitution(stints, 0, 420, ["p1"], ["p3"]);

    // p1 closed at 420
    expect(result[0]).toEqual({ playerId: "p1", periodIndex: 0, checkInTime: 600, checkOutTime: 420 });
    // p2 unchanged
    expect(result[1]).toEqual({ playerId: "p2", periodIndex: 0, checkInTime: 600 });
    // p3 new stint
    expect(result[2]).toEqual({ playerId: "p3", periodIndex: 0, checkInTime: 420 });
  });

  it("handles substitution with no one entering or leaving", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600 },
    ];
    const result = processSubstitution(stints, 0, 300, [], []);
    expect(result).toHaveLength(1);
    expect(result[0].checkOutTime).toBeUndefined();
  });

  it("only closes stints in the correct period", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600 }, // period 0, open
      { playerId: "p1", periodIndex: 1, checkInTime: 600 }, // period 1, open
    ];
    const result = processSubstitution(stints, 1, 300, ["p1"], []);
    expect(result[0].checkOutTime).toBeUndefined(); // period 0 unchanged
    expect(result[1].checkOutTime).toBe(300); // period 1 closed
  });
});

describe("remapStintsAfterPeriodDeletion", () => {
  it("removes stints for deleted period and remaps later indices", () => {
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600, checkOutTime: 0 },
      { playerId: "p1", periodIndex: 1, checkInTime: 600, checkOutTime: 0 }, // deleted
      { playerId: "p1", periodIndex: 2, checkInTime: 600, checkOutTime: 0 },
      { playerId: "p1", periodIndex: 3, checkInTime: 600, checkOutTime: 0 },
    ];
    const result = remapStintsAfterPeriodDeletion(stints, 1);
    expect(result).toHaveLength(3);
    expect(result[0].periodIndex).toBe(0);
    expect(result[1].periodIndex).toBe(1); // was 2
    expect(result[2].periodIndex).toBe(2); // was 3
  });
});

describe("cross-period stint calculation", () => {
  it("calculates total minutes across multiple periods", () => {
    // Player checked in at 4:00 remaining Q1, plays through to Q2, subbed at 7:00 remaining Q2
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 240, checkOutTime: 0 }, // 4 minutes in Q1
      { playerId: "p1", periodIndex: 1, checkInTime: 600, checkOutTime: 420 }, // 3 minutes in Q2
    ];
    const total = calculatePlayerMinutes(stints, "p1");
    expect(total).toBe(420); // 7 minutes = 420 seconds
  });

  it("calculates full game minutes for a player who plays every minute", () => {
    // 4 quarters, 10 minutes each, player never subbed out
    const stints: StintType[] = [
      { playerId: "p1", periodIndex: 0, checkInTime: 600, checkOutTime: 0 },
      { playerId: "p1", periodIndex: 1, checkInTime: 600, checkOutTime: 0 },
      { playerId: "p1", periodIndex: 2, checkInTime: 600, checkOutTime: 0 },
      { playerId: "p1", periodIndex: 3, checkInTime: 600, checkOutTime: 0 },
    ];
    const total = calculatePlayerMinutes(stints, "p1");
    expect(total).toBe(2400); // 40 minutes = 2400 seconds
    expect(formatMinutes(total)).toBe("40:00");
  });
});
