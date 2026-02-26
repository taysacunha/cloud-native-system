import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExportButton } from "./ExportButton";
import { exportToExcel, formatBasicQueryForExport } from "@/lib/exportUtils";
import { TablePagination } from "@/components/vendas/TableControls";

const weekdayMap: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

interface BasicQueriesTabProps {
  enabled?: boolean;
}

type SortField = "assignment_date" | "location" | "broker" | "shift_type";
type SortDirection = "asc" | "desc";

export const BasicQueriesTab = ({ enabled = true }: BasicQueriesTabProps) => {
  const [selectedBroker, setSelectedBroker] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Broker tab pagination/sorting
  const [brokerCurrentPage, setBrokerCurrentPage] = useState(1);
  const [brokerItemsPerPage, setBrokerItemsPerPage] = useState(10);
  const [brokerSortField, setBrokerSortField] = useState<SortField>("assignment_date");
  const [brokerSortDirection, setBrokerSortDirection] = useState<SortDirection>("asc");
  
  // Location tab pagination/sorting
  const [locationCurrentPage, setLocationCurrentPage] = useState(1);
  const [locationItemsPerPage, setLocationItemsPerPage] = useState(10);
  const [locationSortField, setLocationSortField] = useState<SortField>("assignment_date");
  const [locationSortDirection, setLocationSortDirection] = useState<SortDirection>("asc");

  const { data: brokers } = useQuery({
    queryKey: ["brokers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brokers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data: locations } = useQuery({
    queryKey: ["locations-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data: brokerAssignments, refetch: refetchBroker } = useQuery({
    queryKey: ["broker_assignments", selectedBroker, startDate, endDate],
    queryFn: async () => {
      if (!selectedBroker || !startDate || !endDate) return [];
      const { data, error } = await supabase
        .from("schedule_assignments")
        .select(`
          *,
          location:locations(id, name, street, number, city, state)
        `)
        .eq("broker_id", selectedBroker)
        .gte("assignment_date", startDate)
        .lte("assignment_date", endDate)
        .order("assignment_date");
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const { data: locationAssignments, refetch: refetchLocation } = useQuery({
    queryKey: ["location_assignments", selectedLocation, startDate, endDate],
    queryFn: async () => {
      if (!selectedLocation || !startDate || !endDate) return [];
      const { data, error } = await supabase
        .from("schedule_assignments")
        .select(`
          *,
          broker:brokers(id, name, creci)
        `)
        .eq("location_id", selectedLocation)
        .gte("assignment_date", startDate)
        .lte("assignment_date", endDate)
        .order("assignment_date");
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  // Sorted and paginated broker assignments
  const sortedBrokerAssignments = useMemo(() => {
    if (!brokerAssignments) return [];
    return [...brokerAssignments].sort((a: any, b: any) => {
      let comparison = 0;
      if (brokerSortField === "assignment_date") {
        comparison = a.assignment_date.localeCompare(b.assignment_date);
      } else if (brokerSortField === "location") {
        comparison = (a.location?.name || "").localeCompare(b.location?.name || "");
      } else if (brokerSortField === "shift_type") {
        comparison = a.shift_type.localeCompare(b.shift_type);
      }
      return brokerSortDirection === "asc" ? comparison : -comparison;
    });
  }, [brokerAssignments, brokerSortField, brokerSortDirection]);

  const brokerTotalPages = Math.ceil((sortedBrokerAssignments?.length || 0) / brokerItemsPerPage);
  const paginatedBrokerAssignments = useMemo(() => {
    const start = (brokerCurrentPage - 1) * brokerItemsPerPage;
    return sortedBrokerAssignments.slice(start, start + brokerItemsPerPage);
  }, [sortedBrokerAssignments, brokerCurrentPage, brokerItemsPerPage]);

  // Sorted and paginated location assignments
  const sortedLocationAssignments = useMemo(() => {
    if (!locationAssignments) return [];
    return [...locationAssignments].sort((a: any, b: any) => {
      let comparison = 0;
      if (locationSortField === "assignment_date") {
        comparison = a.assignment_date.localeCompare(b.assignment_date);
      } else if (locationSortField === "broker") {
        comparison = (a.broker?.name || "").localeCompare(b.broker?.name || "");
      } else if (locationSortField === "shift_type") {
        comparison = a.shift_type.localeCompare(b.shift_type);
      }
      return locationSortDirection === "asc" ? comparison : -comparison;
    });
  }, [locationAssignments, locationSortField, locationSortDirection]);

  const locationTotalPages = Math.ceil((sortedLocationAssignments?.length || 0) / locationItemsPerPage);
  const paginatedLocationAssignments = useMemo(() => {
    const start = (locationCurrentPage - 1) * locationItemsPerPage;
    return sortedLocationAssignments.slice(start, start + locationItemsPerPage);
  }, [sortedLocationAssignments, locationCurrentPage, locationItemsPerPage]);

  const handleBrokerSort = (field: SortField) => {
    if (brokerSortField === field) {
      setBrokerSortDirection(brokerSortDirection === "asc" ? "desc" : "asc");
    } else {
      setBrokerSortField(field);
      setBrokerSortDirection("asc");
    }
    setBrokerCurrentPage(1);
  };

  const handleLocationSort = (field: SortField) => {
    if (locationSortField === field) {
      setLocationSortDirection(locationSortDirection === "asc" ? "desc" : "asc");
    } else {
      setLocationSortField(field);
      setLocationSortDirection("asc");
    }
    setLocationCurrentPage(1);
  };

  const SortIcon = ({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) => {
    if (field !== currentField) return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground" />;
    return direction === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const handleExportBroker = () => {
    if (brokerAssignments && brokerAssignments.length > 0) {
      const formatted = formatBasicQueryForExport(brokerAssignments, 'broker');
      const brokerName = brokers?.find(b => b.id === selectedBroker)?.name || 'Corretor';
      exportToExcel(formatted, `Plantoes_${brokerName}_${startDate}_${endDate}`, 'Plantões');
    }
  };

  const handleExportLocation = () => {
    if (locationAssignments && locationAssignments.length > 0) {
      const formatted = formatBasicQueryForExport(locationAssignments, 'location');
      const locationName = locations?.find(l => l.id === selectedLocation)?.name || 'Local';
      exportToExcel(formatted, `Plantoes_${locationName}_${startDate}_${endDate}`, 'Plantões');
    }
  };

  const handleBrokerSearch = () => {
    setBrokerCurrentPage(1);
    refetchBroker();
  };

  const handleLocationSearch = () => {
    setLocationCurrentPage(1);
    refetchLocation();
  };

  return (
    <Tabs defaultValue="broker" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="broker">Por Corretor</TabsTrigger>
        <TabsTrigger value="location">Por Local</TabsTrigger>
      </TabsList>

      <TabsContent value="broker" className="space-y-4">
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="broker">Corretor</Label>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um corretor" />
                </SelectTrigger>
                <SelectContent>
                  {brokers?.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBrokerSearch}
              disabled={!selectedBroker || !startDate || !endDate}
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            {brokerAssignments && brokerAssignments.length > 0 && (
              <ExportButton onClick={handleExportBroker} />
            )}
          </div>
        </div>

        {brokerAssignments && brokerAssignments.length > 0 && (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleBrokerSort("assignment_date")}
                    >
                      <div className="flex items-center">
                        Data
                        <SortIcon field="assignment_date" currentField={brokerSortField} direction={brokerSortDirection} />
                      </div>
                    </TableHead>
                    <TableHead>Dia</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleBrokerSort("location")}
                    >
                      <div className="flex items-center">
                        Local
                        <SortIcon field="location" currentField={brokerSortField} direction={brokerSortDirection} />
                      </div>
                    </TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleBrokerSort("shift_type")}
                    >
                      <div className="flex items-center">
                        Horário
                        <SortIcon field="shift_type" currentField={brokerSortField} direction={brokerSortDirection} />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBrokerAssignments.map((assignment: any) => {
                    const date = new Date(assignment.assignment_date + "T00:00:00");
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          {format(date, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{weekdayMap[date.getDay()]}</TableCell>
                        <TableCell className="font-medium">
                          {assignment.location?.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {assignment.location?.street}, {assignment.location?.number} -{" "}
                          {assignment.location?.city}/{assignment.location?.state}
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.shift_type === "morning" ? "default" : "secondary"}>
                            {assignment.shift_type === "morning" ? "☀️ Manhã" : "🌙 Tarde"}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {assignment.start_time?.substring(0, 5)} - {assignment.end_time?.substring(0, 5)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={brokerCurrentPage}
              totalPages={brokerTotalPages}
              itemsPerPage={brokerItemsPerPage}
              onPageChange={setBrokerCurrentPage}
              onItemsPerPageChange={(count) => {
                setBrokerItemsPerPage(count);
                setBrokerCurrentPage(1);
              }}
              totalItems={sortedBrokerAssignments.length}
            />
          </>
        )}

        {brokerAssignments && brokerAssignments.length === 0 && selectedBroker && (
          <div className="text-center p-8 text-muted-foreground">
            Nenhuma alocação encontrada para este período
          </div>
        )}
      </TabsContent>

      <TabsContent value="location" className="space-y-4">
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location">Local</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um local" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate2">Data Inicial</Label>
              <Input
                id="startDate2"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate2">Data Final</Label>
              <Input
                id="endDate2"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleLocationSearch}
              disabled={!selectedLocation || !startDate || !endDate}
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            {locationAssignments && locationAssignments.length > 0 && (
              <ExportButton onClick={handleExportLocation} />
            )}
          </div>
        </div>

        {locationAssignments && locationAssignments.length > 0 && (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleLocationSort("assignment_date")}
                    >
                      <div className="flex items-center">
                        Data
                        <SortIcon field="assignment_date" currentField={locationSortField} direction={locationSortDirection} />
                      </div>
                    </TableHead>
                    <TableHead>Dia</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleLocationSort("broker")}
                    >
                      <div className="flex items-center">
                        Corretor
                        <SortIcon field="broker" currentField={locationSortField} direction={locationSortDirection} />
                      </div>
                    </TableHead>
                    <TableHead>CRECI</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleLocationSort("shift_type")}
                    >
                      <div className="flex items-center">
                        Horário
                        <SortIcon field="shift_type" currentField={locationSortField} direction={locationSortDirection} />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLocationAssignments.map((assignment: any) => {
                    const date = new Date(assignment.assignment_date + "T00:00:00");
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          {format(date, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{weekdayMap[date.getDay()]}</TableCell>
                        <TableCell className="font-medium">
                          {assignment.broker?.name}
                        </TableCell>
                        <TableCell>{assignment.broker?.creci}</TableCell>
                        <TableCell>
                          <Badge variant={assignment.shift_type === "morning" ? "default" : "secondary"}>
                            {assignment.shift_type === "morning" ? "☀️ Manhã" : "🌙 Tarde"}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {assignment.start_time?.substring(0, 5)} - {assignment.end_time?.substring(0, 5)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={locationCurrentPage}
              totalPages={locationTotalPages}
              itemsPerPage={locationItemsPerPage}
              onPageChange={setLocationCurrentPage}
              onItemsPerPageChange={(count) => {
                setLocationItemsPerPage(count);
                setLocationCurrentPage(1);
              }}
              totalItems={sortedLocationAssignments.length}
            />
          </>
        )}

        {locationAssignments && locationAssignments.length === 0 && selectedLocation && (
          <div className="text-center p-8 text-muted-foreground">
            Nenhuma alocação encontrada para este período
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
