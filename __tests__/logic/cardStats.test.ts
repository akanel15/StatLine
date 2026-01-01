import {
  formatStatForCard,
  calculateTeamPPG,
  calculatePlayerCardStats,
  formatRecord,
} from "@/logic/cardStats";
import { PlayerType } from "@/types/player";
import { TeamType } from "@/types/team";
import { Stat, initialBaseStats } from "@/types/stats";
import { Team } from "@/types/game";

// Helper functions to create test data
function createPlayer(
  id: string,
  name: string,
  number: string,
  teamId: string,
  imageUri?: string,
): PlayerType {
  return {
    id,
    name,
    number,
    teamId,
    imageUri,
    gameNumbers: {
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
    },
    stats: { ...initialBaseStats },
  };
}

function createTeam(id: string, name: string, imageUri?: string): TeamType {
  return {
    id,
    name,
    imageUri,
    gameNumbers: {
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
    },
    stats: {
      [Team.Us]: { ...initialBaseStats },
      [Team.Opponent]: { ...initialBaseStats },
    },
  };
}

describe("cardStats", () => {
  describe("formatStatForCard", () => {
    it("should format decimal numbers to 1 decimal place", () => {
      expect(formatStatForCard(12.456)).toBe("12.5");
      expect(formatStatForCard(8.12)).toBe("8.1");
    });

    it("should format whole numbers without decimals", () => {
      expect(formatStatForCard(0)).toBe("0");
      expect(formatStatForCard(10)).toBe("10");
      expect(formatStatForCard(5)).toBe("5");
    });

    it("should round correctly", () => {
      expect(formatStatForCard(12.44)).toBe("12.4");
      expect(formatStatForCard(12.46)).toBe("12.5");
      expect(formatStatForCard(12.49)).toBe("12.5");
      expect(formatStatForCard(12.51)).toBe("12.5");
    });

    it("should handle negative numbers", () => {
      expect(formatStatForCard(-5.3)).toBe("-5.3");
      expect(formatStatForCard(-0.456)).toBe("-0.5");
    });
  });

  describe("calculateTeamPPG", () => {
    it("should return 0 when no games played", () => {
      const team = createTeam("team1", "Lakers");
      expect(calculateTeamPPG(team)).toBe(0);
    });

    it("should calculate correct PPG for team", () => {
      const team = createTeam("team1", "Lakers");
      team.gameNumbers.gamesPlayed = 5;
      team.stats[Team.Us][Stat.Points] = 450;

      expect(calculateTeamPPG(team)).toBe(90);
    });

    it("should handle decimal PPG values", () => {
      const team = createTeam("team1", "Lakers");
      team.gameNumbers.gamesPlayed = 3;
      team.stats[Team.Us][Stat.Points] = 256;

      expect(calculateTeamPPG(team)).toBeCloseTo(85.33, 2);
    });

    it("should handle single game", () => {
      const team = createTeam("team1", "Lakers");
      team.gameNumbers.gamesPlayed = 1;
      team.stats[Team.Us][Stat.Points] = 88;

      expect(calculateTeamPPG(team)).toBe(88);
    });

    it("should handle zero points", () => {
      const team = createTeam("team1", "Lakers");
      team.gameNumbers.gamesPlayed = 5;
      team.stats[Team.Us][Stat.Points] = 0;

      expect(calculateTeamPPG(team)).toBe(0);
    });
  });

  describe("calculatePlayerCardStats", () => {
    it("should return zeros when player has no games", () => {
      const player = createPlayer("player1", "LeBron James", "23", "team1");

      const result = calculatePlayerCardStats(player);

      expect(result).toEqual({
        ppg: 0,
        rpg: 0,
        apg: 0,
        gamesPlayed: 0,
      });
    });

    it("should calculate correct averages for player with games", () => {
      const player = createPlayer("player1", "LeBron James", "23", "team1");
      player.gameNumbers.gamesPlayed = 5;
      player.stats[Stat.Points] = 125;
      player.stats[Stat.Assists] = 35;
      player.stats[Stat.OffensiveRebounds] = 15;
      player.stats[Stat.DefensiveRebounds] = 25;

      const result = calculatePlayerCardStats(player);

      expect(result.ppg).toBe(25);
      expect(result.apg).toBe(7);
      expect(result.rpg).toBe(8); // 15 + 25 = 40, 40 / 5 = 8
      expect(result.gamesPlayed).toBe(5);
    });

    it("should handle single game stats", () => {
      const player = createPlayer("player1", "LeBron James", "23", "team1");
      player.gameNumbers.gamesPlayed = 1;
      player.stats[Stat.Points] = 30;
      player.stats[Stat.Assists] = 10;
      player.stats[Stat.OffensiveRebounds] = 2;
      player.stats[Stat.DefensiveRebounds] = 8;

      const result = calculatePlayerCardStats(player);

      expect(result.ppg).toBe(30);
      expect(result.apg).toBe(10);
      expect(result.rpg).toBe(10);
      expect(result.gamesPlayed).toBe(1);
    });

    it("should handle decimal averages", () => {
      const player = createPlayer("player1", "LeBron James", "23", "team1");
      player.gameNumbers.gamesPlayed = 3;
      player.stats[Stat.Points] = 80;
      player.stats[Stat.Assists] = 20;
      player.stats[Stat.OffensiveRebounds] = 5;
      player.stats[Stat.DefensiveRebounds] = 10;

      const result = calculatePlayerCardStats(player);

      expect(result.ppg).toBeCloseTo(26.67, 2);
      expect(result.apg).toBeCloseTo(6.67, 2);
      expect(result.rpg).toBe(5); // (5 + 10) / 3 = 5
      expect(result.gamesPlayed).toBe(3);
    });

    it("should handle player with only offensive rebounds", () => {
      const player = createPlayer("player1", "LeBron James", "23", "team1");
      player.gameNumbers.gamesPlayed = 2;
      player.stats[Stat.Points] = 40;
      player.stats[Stat.Assists] = 10;
      player.stats[Stat.OffensiveRebounds] = 8;
      player.stats[Stat.DefensiveRebounds] = 0;

      const result = calculatePlayerCardStats(player);

      expect(result.ppg).toBe(20);
      expect(result.apg).toBe(5);
      expect(result.rpg).toBe(4); // Only offensive rebounds
      expect(result.gamesPlayed).toBe(2);
    });

    it("should handle player with only defensive rebounds", () => {
      const player = createPlayer("player1", "LeBron James", "23", "team1");
      player.gameNumbers.gamesPlayed = 2;
      player.stats[Stat.Points] = 40;
      player.stats[Stat.Assists] = 10;
      player.stats[Stat.OffensiveRebounds] = 0;
      player.stats[Stat.DefensiveRebounds] = 12;

      const result = calculatePlayerCardStats(player);

      expect(result.ppg).toBe(20);
      expect(result.apg).toBe(5);
      expect(result.rpg).toBe(6); // Only defensive rebounds
      expect(result.gamesPlayed).toBe(2);
    });

    it("should handle player with zero stats", () => {
      const player = createPlayer("player1", "Bench Player", "12", "team1");
      player.gameNumbers.gamesPlayed = 3;
      // All stats remain at 0

      const result = calculatePlayerCardStats(player);

      expect(result.ppg).toBe(0);
      expect(result.apg).toBe(0);
      expect(result.rpg).toBe(0);
      expect(result.gamesPlayed).toBe(3);
    });
  });

  describe("formatRecord", () => {
    it("should format record with all zeros", () => {
      const gameNumbers = {
        wins: 0,
        losses: 0,
        draws: 0,
        gamesPlayed: 0,
      };

      expect(formatRecord(gameNumbers)).toBe("0-0-0");
    });

    it("should format record with wins only", () => {
      const gameNumbers = {
        wins: 5,
        losses: 0,
        draws: 0,
        gamesPlayed: 5,
      };

      expect(formatRecord(gameNumbers)).toBe("5-0-0");
    });

    it("should format record with losses only", () => {
      const gameNumbers = {
        wins: 0,
        losses: 3,
        draws: 0,
        gamesPlayed: 3,
      };

      expect(formatRecord(gameNumbers)).toBe("0-3-0");
    });

    it("should format record with draws only", () => {
      const gameNumbers = {
        wins: 0,
        losses: 0,
        draws: 2,
        gamesPlayed: 2,
      };

      expect(formatRecord(gameNumbers)).toBe("0-0-2");
    });

    it("should format mixed record", () => {
      const gameNumbers = {
        wins: 12,
        losses: 4,
        draws: 2,
        gamesPlayed: 18,
      };

      expect(formatRecord(gameNumbers)).toBe("12-4-2");
    });

    it("should format record with double-digit numbers", () => {
      const gameNumbers = {
        wins: 25,
        losses: 15,
        draws: 10,
        gamesPlayed: 50,
      };

      expect(formatRecord(gameNumbers)).toBe("25-15-10");
    });

    it("should handle typical basketball season", () => {
      const gameNumbers = {
        wins: 8,
        losses: 3,
        draws: 1,
        gamesPlayed: 12,
      };

      expect(formatRecord(gameNumbers)).toBe("8-3-1");
    });
  });
});
