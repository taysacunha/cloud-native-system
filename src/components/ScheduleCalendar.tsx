import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const weekdaysMap: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

interface ScheduleCalendarProps {
  scheduleId: string;
}

export function ScheduleCalendar({ scheduleId }: ScheduleCalendarProps) {
  const { data: scheduleData } = useQuery({
    queryKey: ["schedule-details", scheduleId],
    queryFn: async () => {
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedules")
        .select("*")
        .eq("id", scheduleId)
        .single();

      if (scheduleError) throw scheduleError;

      const { data: brokers, error: brokersError } = await supabase
        .from("schedule_brokers")
        .select("broker_id, brokers(name)")
        .eq("schedule_id", scheduleId);

      if (brokersError) throw brokersError;

      const { data: locations, error: locationsError } = await supabase
        .from("schedule_locations")
        .select("location_id, locations(name, street, city)")
        .eq("schedule_id", scheduleId);

      if (locationsError) throw locationsError;

      return { schedule, brokers, locations };
    },
  });

  const generatePDF = () => {
    window.print();
  };

  if (!scheduleData) {
    return <div>Carregando...</div>;
  }

  const { schedule, brokers, locations } = scheduleData;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">{schedule.name}</h3>
          <p className="text-sm text-muted-foreground">
            Horário:{" "}
            {schedule.shift_type === "morning"
              ? "Manhã"
              : schedule.shift_type === "afternoon"
              ? "Tarde"
              : "Integral"}
          </p>
        </div>
        <Button onClick={generatePDF} className="print:hidden">
          <Download className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-muted">
              <th className="border p-2 text-left">Corretor</th>
              <th className="border p-2 text-left">Horário</th>
              {schedule.weekdays.map((day: string) => (
                <th key={day} className="border p-2 text-center">
                  {weekdaysMap[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brokers?.map((broker: any) => (
              <tr key={broker.broker_id}>
                <td className="border p-2 font-medium">{broker.brokers.name}</td>
                <td className="border p-2">
                  {schedule.shift_type === "morning"
                    ? "Manhã"
                    : schedule.shift_type === "afternoon"
                    ? "Tarde"
                    : "Integral"}
                </td>
                {schedule.weekdays.map((day: string) => (
                  <td key={day} className="border p-2">
                    <div className="text-sm space-y-1">
                      {locations?.map((location: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          <div className="font-medium">{location.locations.name}</div>
                          <div className="text-muted-foreground">
                            {location.locations.street}, {location.locations.city}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
