import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalesTeams } from "@/hooks/useSalesTeams";

interface TeamFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TeamFilter({ value, onChange, className }: TeamFilterProps) {
  const { data: teams = [] } = useSalesTeams();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || "w-[160px]"}>
        <SelectValue placeholder="Todas equipes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas equipes</SelectItem>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
