import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Gift } from "lucide-react";
import { parseISO, getMonth, getDate } from "date-fns";
import jsPDF from "jspdf";
import { toast } from "sonner";

const mesesNomes = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface Colaborador {
  id: string;
  nome: string;
  nome_exibicao: string | null;
  data_nascimento: string;
  is_broker?: boolean;
}

interface SalesBroker {
  id: string;
  name: string;
  nome_exibicao: string | null;
  birth_date: string | null;
}

const getDisplayName = (person: { nome?: string; name?: string; nome_exibicao?: string | null }): string => {
  if (person.nome_exibicao) return person.nome_exibicao;
  const fullName = person.nome || person.name || "";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export function AniversariantesCelebrePDFGenerator() {
  const currentYear = new Date().getFullYear();
  const [generating, setGenerating] = useState(false);
  const [incluirCorretores, setIncluirCorretores] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores-aniversariantes-celebre-pdf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_colaboradores")
        .select("id, nome, nome_exibicao, data_nascimento")
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return data as Colaborador[];
    },
  });

  const { data: salesBrokers } = useQuery({
    queryKey: ["sales-brokers-celebre-pdf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_brokers")
        .select("id, name, nome_exibicao, birth_date")
        .eq("is_active", true)
        .not("birth_date", "is", null);
      if (error) throw error;
      return data as SalesBroker[];
    },
  });

  const generatePDF = async () => {
    if (!colaboradores?.length && !salesBrokers?.length) {
      toast.error("Nenhum aniversariante encontrado");
      return;
    }

    setGenerating(true);

    try {
      let allPeople: Colaborador[] = (colaboradores || []).map(c => ({ ...c, is_broker: false }));
      
      if (incluirCorretores && salesBrokers) {
        const brokers: Colaborador[] = salesBrokers
          .filter(b => b.birth_date)
          .map(b => ({
            id: `broker-${b.id}`,
            nome: b.name,
            nome_exibicao: b.nome_exibicao,
            data_nascimento: b.birth_date!,
            is_broker: true,
          }));
        allPeople = [...allPeople, ...brokers];
      }

      // Agrupar por mês
      const byMonth: Record<number, Colaborador[]> = {};
      allPeople.forEach(col => {
        const month = getMonth(parseISO(col.data_nascimento));
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(col);
      });

      // Ordenar dentro de cada mês por dia
      Object.values(byMonth).forEach(list => {
        list.sort((a, b) => {
          return getDate(parseISO(a.data_nascimento)) - getDate(parseISO(b.data_nascimento));
        });
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 25;

      // Filter months based on selection
      let sortedMonths = Object.keys(byMonth).map(Number).sort((a, b) => a - b);
      if (selectedMonth !== "all") {
        const monthIdx = parseInt(selectedMonth);
        sortedMonths = sortedMonths.filter(m => m === monthIdx);
      }

      if (sortedMonths.length === 0) {
        toast.error("Nenhum aniversariante no mês selecionado");
        setGenerating(false);
        return;
      }

      sortedMonths.forEach((monthNum, pageIdx) => {
        if (pageIdx > 0) pdf.addPage();
        
        const aniversariantes = byMonth[monthNum];
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(56);
        pdf.setFont("helvetica", "bold");
        pdf.text("PARABÉNS", pageWidth / 2, 50, { align: "center" });
        
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.5);
        pdf.line(margin, 60, pageWidth - margin, 60);
        
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(28);
        pdf.setFont("helvetica", "normal");
        pdf.text(mesesNomes[monthNum].toUpperCase(), pageWidth / 2, 80, { align: "center" });
        
        pdf.line(margin, 88, pageWidth - margin, 88);
        
        const byDay: Record<number, Colaborador[]> = {};
        aniversariantes.forEach(col => {
          const day = getDate(parseISO(col.data_nascimento));
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push(col);
        });
        
        const sortedDays = Object.keys(byDay).map(Number).sort((a, b) => a - b);
        
        let yPos = 105;
        pdf.setTextColor(30, 30, 30);
        
        sortedDays.forEach(day => {
          if (yPos > pageHeight - 40) return;
          
          const people = byDay[day];
          const names = people.map(p => getDisplayName(p)).join(", ");
          
          const lineText = `${String(day).padStart(2, "0")}  —  ${names}`;
          
          pdf.setFontSize(24);
          pdf.setFont("helvetica", "normal");
          
          const maxWidth = pageWidth - margin * 2;
          const splitLines = pdf.splitTextToSize(lineText, maxWidth);
          
          splitLines.forEach((line: string) => {
            if (yPos > pageHeight - 40) return;
            pdf.text(line, pageWidth / 2, yPos, { align: "center" });
            yPos += 12;
          });
          
          yPos += 6;
        });
        
        pdf.setTextColor(120, 120, 120);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `${aniversariantes.length} aniversariante${aniversariantes.length !== 1 ? "s" : ""} em ${mesesNomes[monthNum]}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" }
        );
      });

      const monthSuffix = selectedMonth !== "all" ? `-${mesesNomes[parseInt(selectedMonth)].toLowerCase()}` : "";
      const filename = `parabens-aniversariantes${monthSuffix}-${currentYear}.pdf`;
      pdf.save(filename);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  const totalAniversariantes = (colaboradores?.length || 0) + 
    (incluirCorretores ? (salesBrokers?.length || 0) : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          PDF Aniversariantes - PARABÉNS
        </CardTitle>
        <CardDescription>
          Gera um PDF simples e limpo com uma página por mês, ideal para impressão e exposição.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="incluir-corretores" className="font-medium">Incluir Corretores</Label>
              <p className="text-sm text-muted-foreground">Adiciona os corretores do sistema de vendas</p>
            </div>
          </div>
          <Switch 
            id="incluir-corretores"
            checked={incluirCorretores}
            onCheckedChange={setIncluirCorretores}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Mês</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {mesesNomes.map((nome, idx) => (
                <SelectItem key={idx} value={String(idx)}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {totalAniversariantes} aniversariantes serão incluídos
          </span>
          <Button 
            onClick={generatePDF} 
            disabled={generating || totalAniversariantes === 0}
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Gerar PDF PARABÉNS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
