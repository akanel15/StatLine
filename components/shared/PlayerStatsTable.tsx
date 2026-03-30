import { PlayerType } from "@/types/player";
import { StatsTable } from "./StatsTable";

type PlayerStatsTableProps = {
  player: PlayerType;
  mpg?: number | null;
};

export function PlayerStatsTable({ player, mpg }: PlayerStatsTableProps) {
  return (
    <StatsTable
      rows={[
        {
          label: "Averages",
          stats: player.stats,
          divisor: player.gameNumbers.gamesPlayed,
        },
      ]}
      mpg={mpg}
    />
  );
}
