import { PlayerType } from "@/types/player";
import { StatsTable } from "./StatsTable";

type PlayerStatsTableProps = {
  player: PlayerType;
};

export function PlayerStatsTable({ player }: PlayerStatsTableProps) {
  return (
    <StatsTable
      rows={[
        {
          label: "Averages",
          stats: player.stats,
          divisor: player.gameNumbers.gamesPlayed,
        },
      ]}
    />
  );
}
