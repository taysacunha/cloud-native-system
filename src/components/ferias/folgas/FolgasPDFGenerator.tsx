import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachWeekendOfInterval, isSaturday } from "date-fns";
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

interface FolgasPDFGeneratorProps {
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

export function FolgasPDFGenerator({ year, month }: FolgasPDFGeneratorProps) {
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

  // Identificar pares familiares
  const familiarPairsOnSameSaturday = new Set<string>();
  folgas.forEach(folga => {
    if (!folga.colaborador?.familiar_id) return;
    const familiarFolga = folgas.find(
      f => f.colaborador_id === folga.colaborador?.familiar_id && 
           f.data_sabado === folga.data_sabado
    );
    if (familiarFolga) {
      familiarPairsOnSameSaturday.add(folga.colaborador_id);
      familiarPairsOnSameSaturday.add(folga.colaborador.familiar_id);
    }
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
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 25, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("MAPA DE FOLGAS DE SÁBADO", pageWidth / 2, 12, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${mesesNomes[month - 1]} de ${year}`, pageWidth / 2, 20, { align: "center" });

      pdf.setTextColor(0, 0, 0);
      let yPos = 32;

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
      const setorColWidth = 55;
      const satColWidth = (pageWidth - margin * 2 - setorColWidth) / saturdaysOfMonth.length;
      const rowHeight = 20;

      // Header row
      pdf.setFillColor(180, 180, 180);
      pdf.rect(margin, yPos, pageWidth - margin * 2, 14, "F");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("SETOR", margin + 4, yPos + 10);
      
      saturdaysOfMonth.forEach((sat, idx) => {
        const x = margin + setorColWidth + (idx * satColWidth);
        const dayText = format(new Date(sat + "T12:00:00"), "dd/MM (EEE)", { locale: ptBR });
        pdf.text(dayText, x + satColWidth / 2, yPos + 10, { align: "center" });
      });
      
      yPos += 14;
      pdf.setTextColor(0, 0, 0);

      // Data rows with zebra striping
      const zebraColors = {
        even: [255, 255, 255],      // white
        odd: [230, 230, 230]        // light gray
      };

      setores.forEach((setor, rowIdx) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage();
          yPos = 15;
          
          // Re-draw header on new page
          pdf.setFillColor(180, 180, 180);
          pdf.rect(margin, yPos, pageWidth - margin * 2, 14, "F");
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("SETOR", margin + 4, yPos + 10);
          saturdaysOfMonth.forEach((sat, idx) => {
            const x = margin + setorColWidth + (idx * satColWidth);
            const dayText = format(new Date(sat + "T12:00:00"), "dd/MM", { locale: ptBR });
            pdf.text(dayText, x + satColWidth / 2, yPos + 10, { align: "center" });
          });
          yPos += 14;
          pdf.setTextColor(0, 0, 0);
        }

        // Zebra striping
        const bgColor = rowIdx % 2 === 0 ? zebraColors.even : zebraColors.odd;
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(margin, yPos, pageWidth - margin * 2, rowHeight, "F");

        // Draw cell borders
        pdf.setDrawColor(203, 213, 225); // slate-300
        pdf.setLineWidth(0.3);
        pdf.rect(margin, yPos, pageWidth - margin * 2, rowHeight);
        
        // Vertical lines for columns
        pdf.line(margin + setorColWidth, yPos, margin + setorColWidth, yPos + rowHeight);
        saturdaysOfMonth.forEach((_, colIdx) => {
          if (colIdx < saturdaysOfMonth.length - 1) {
            const x = margin + setorColWidth + ((colIdx + 1) * satColWidth);
            pdf.line(x, yPos, x, yPos + rowHeight);
          }
        });

        // Setor name
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(setor.nome.substring(0, 28), margin + 3, yPos + rowHeight / 2 + 2);

        // Colaboradores in each cell
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(14);
        saturdaysOfMonth.forEach((sat, colIdx) => {
          const x = margin + setorColWidth + (colIdx * satColWidth);
          const cellCenterX = x + satColWidth / 2;
          const folgasNaCelula = matrix[setor.id]?.[sat] || [];
          
          if (folgasNaCelula.length > 0) {
            let cellY = yPos + 7;
            folgasNaCelula.forEach((folga, folgaIdx) => {
              const isFamiliar = familiarPairsOnSameSaturday.has(folga.colaborador_id);
              const name = getDisplayName(folga.colaborador);
              
              // Highlight familiar with heart
              if (isFamiliar) {
                pdf.setTextColor(219, 39, 119);
                pdf.text("♥ " + name.substring(0, 12), cellCenterX, cellY, { align: "center" });
              } else if (folga.is_excecao) {
                pdf.setTextColor(217, 119, 6);
                pdf.text("* " + name.substring(0, 12), cellCenterX, cellY, { align: "center" });
              } else {
                pdf.setTextColor(0, 0, 0);
                pdf.text(name.substring(0, 14), cellCenterX, cellY, { align: "center" });
              }
              cellY += 6;
            });
            pdf.setTextColor(0, 0, 0);
          }
        });

        yPos += rowHeight;
      });

      // Legend
      yPos += 5;
      if (yPos > pageHeight - 20) {
        pdf.addPage();
        yPos = 15;
      }
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Legenda:", margin, yPos);
      pdf.setTextColor(219, 39, 119);
      pdf.text("♥ Familiar junto", margin + 20, yPos);
      pdf.setTextColor(217, 119, 6);
      pdf.text("* Exceção/Ajuste", margin + 55, yPos);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} | ${folgas.length} folgas em ${setores.length} setores`, pageWidth / 2, pageHeight - 6, { align: "center" });

      const filename = `mapa-folgas-${mesesNomes[month - 1].toLowerCase()}-${year}.pdf`;
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
