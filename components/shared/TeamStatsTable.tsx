import { Team, TeamType } from "@/types/game";
import { StatsTable } from "./StatsTable";

type TeamStatsTableProps = {
  team: TeamType;
};

export function TeamStatsTable({ team }: TeamStatsTableProps) {
  return (
    <StatsTable
      rows={[
        {
          label: "For",
          stats: team.stats[Team.Us],
          divisor: team.gameNumbers.gamesPlayed,
        },
        {
          label: "Against",
          stats: team.stats[Team.Opponent],
          divisor: team.gameNumbers.gamesPlayed,
        },
      ]}
    />
  );
}
