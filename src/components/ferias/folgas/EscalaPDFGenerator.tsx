import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Loader2, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachWeekendOfInterval, isSaturday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { toast } from "sonner";

const mesesNomes = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface Folga {
  id: string;
  data_sabado: string;
  colaborador_id: string;
  is_excecao: boolean;
  colaborador?: { 
    nome: string;
    nome_exibicao: string | null;
    setor_titular_id: string;
    familiar_id: string | null;
  } | null;
}

interface Setor {
  id: string;
  nome: string;
}

interface EscalaPDFGeneratorProps {
  year: number;
  month: number;
}

const getDisplayName = (colaborador: Folga["colaborador"]): string => {
  if (!colaborador) return "—";
  if (colaborador.nome_exibicao) return colaborador.nome_exibicao;
  const parts = colaborador.nome.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export function EscalaPDFGenerator({ year, month }: EscalaPDFGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  const saturdaysOfMonth = (() => {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const weekends = eachWeekendOfInterval({ start, end });
    return weekends.filter(d => isSaturday(d)).map(d => format(d, "yyyy-MM-dd"));
  })();

  const { data: setores = [] } = useQuery({
    queryKey: ["ferias-setores-pdf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_setores")
        .select("id, nome")
        .eq("is_active", true)
        .order("nome");
      if (error) throw error;
      return data as Setor[];
    },
  });

  const { data: folgas = [] } = useQuery({
    queryKey: ["ferias-folgas-pdf", year, month],
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("ferias_folgas")
        .select("id, data_sabado, colaborador_id, is_excecao, colaborador:ferias_colaboradores!ferias_folgas_colaborador_id_fkey(nome, nome_exibicao, setor_titular_id, familiar_id)")
        .gte("data_sabado", monthStart)
        .lte("data_sabado", monthEnd);

      if (error) throw error;
      return data as Folga[];
    },
  });

  const generatePDF = async () => {
    if (folgas.length === 0) {
      toast.error("Nenhuma folga registrada para este mês");
      return;
    }

    setGenerating(true);

    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Header
      pdf.setFillColor(59, 130, 246); // Blue
      pdf.rect(0, 0, pageWidth, 25, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("ESCALA DE FOLGAS DE SÁBADO", pageWidth / 2, 12, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${mesesNomes[month - 1]} de ${year}`, pageWidth / 2, 20, { align: "center" });

      pdf.setTextColor(0, 0, 0);
      let yPos = 35;

      // Build matrix
      const matrix: Record<string, Record<string, Folga[]>> = {};
      setores.forEach(setor => {
        matrix[setor.id] = {};
        saturdaysOfMonth.forEach(sat => {
          matrix[setor.id][sat] = [];
        });
      });

      folgas.forEach(folga => {
        const setorId = folga.colaborador?.setor_titular_id;
        if (setorId && matrix[setorId] && matrix[setorId][folga.data_sabado]) {
          matrix[setorId][folga.data_sabado].push(folga);
        }
      });

      // Calculate column widths
      const setorColWidth = 50;
      const satColWidth = (pageWidth - margin * 2 - setorColWidth) / saturdaysOfMonth.length;
      const rowHeight = 12;

      // Header row
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, yPos, pageWidth - margin * 2, 10, "F");
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Setor", margin + 2, yPos + 7);
      
      saturdaysOfMonth.forEach((sat, idx) => {
        const x = margin + setorColWidth + (idx * satColWidth);
        pdf.text(format(new Date(sat + "T12:00:00"), "dd/MM", { locale: ptBR }), x + satColWidth / 2, yPos + 7, { align: "center" });
      });
      
      yPos += 10;

      // Data rows
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      setores.forEach((setor, rowIdx) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }

        // Zebra striping
        if (rowIdx % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos, pageWidth - margin * 2, rowHeight, "F");
        }

        // Borders
        pdf.setDrawColor(229, 231, 235);
        pdf.rect(margin, yPos, pageWidth - margin * 2, rowHeight);

        // Setor name
        pdf.setFont("helvetica", "bold");
        pdf.text(setor.nome.substring(0, 25), margin + 2, yPos + 8);

        // Colaboradores
        pdf.setFont("helvetica", "normal");
        saturdaysOfMonth.forEach((sat, colIdx) => {
          const x = margin + setorColWidth + (colIdx * satColWidth);
          pdf.line(x, yPos, x, yPos + rowHeight); // Vertical line

          const folgasNaCelula = matrix[setor.id]?.[sat] || [];
          if (folgasNaCelula.length > 0) {
            const names = folgasNaCelula.map(f => getDisplayName(f.colaborador)).join(", ");
            pdf.text(names.substring(0, 15), x + 2, yPos + 8);
          }
        });

        yPos += rowHeight;
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, pageHeight - 8, { align: "center" });
      pdf.text(`Total: ${folgas.length} folgas em ${setores.length} setores`, pageWidth / 2, pageHeight - 4, { align: "center" });

      const filename = `escala-folgas-${mesesNomes[month - 1].toLowerCase()}-${year}.pdf`;
      pdf.save(filename);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={generatePDF} 
      disabled={generating || folgas.length === 0}
      size="sm"
    >
      {generating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Gerar PDF
    </Button>
  );
}