import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

interface YearMonthSelectorProps {
  selectedYear: string;
  selectedMonth: string | null;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string | null) => void;
  yearRange?: number;
  allowFullYear?: boolean;
}

export function YearMonthSelector({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  yearRange = 3,
  allowFullYear = false,
}: YearMonthSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => (currentYear - i).toString());

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select 
        value={selectedMonth ?? "all"} 
        onValueChange={(v) => onMonthChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowFullYear && <SelectItem value="all">Ano inteiro</SelectItem>}
          {MONTHS.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}