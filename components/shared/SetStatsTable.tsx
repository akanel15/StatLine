import { SetType } from "@/types/set";
import { StatsTable } from "./StatsTable";

type SetStatsTableProps = {
  set: SetType;
};

export function SetStatsTable({ set }: SetStatsTableProps) {
  return (
    <StatsTable
      rows={[
        {
          label: "Per Run",
          stats: set.stats,
          divisor: set.runCount,
        },
      ]}
    />
  );
}
