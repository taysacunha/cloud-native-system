import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, Loader2, Cake, Users } from "lucide-react";
import { format, parseISO, getMonth, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { toast } from "sonner";

const mesesNomes = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface Colaborador {
  id: string;
  nome: string;
  data_nascimento: string;
  setor?: { nome: string } | null;
  cargo?: { nome: string } | null;
}

interface AniversariantesPDFGeneratorProps {
  initialMonth?: string;
}

export function AniversariantesPDFGenerator({ initialMonth }: AniversariantesPDFGeneratorProps) {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth ?? "_all_");
  const [selectedSetor, setSelectedSetor] = useState<string>("_all_");
  const [generating, setGenerating] = useState(false);

  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores-aniversariantes-pdf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_colaboradores")
        .select(`
          id, nome, data_nascimento,
          setor:ferias_setores!ferias_colaboradores_setor_titular_id_fkey(nome),
          cargo:ferias_cargos(nome)
        `)
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return data as Colaborador[];
    },
  });

  const { data: setores } = useQuery({
    queryKey: ["setores-aniversariantes-pdf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_setores")
        .select("id, nome")
        .eq("is_active", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = parseISO(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const generatePDF = async () => {
    if (!colaboradores?.length) {
      toast.error("Nenhum colaborador encontrado");
      return;
    }

    setGenerating(true);

    try {
      // Filter colaboradores
      let filtered = [...colaboradores];
      
      if (selectedMonth !== "_all_") {
        const monthNum = parseInt(selectedMonth);
        filtered = filtered.filter(col => {
          const birthDate = parseISO(col.data_nascimento);
          return getMonth(birthDate) === monthNum;
        });
      }

      if (selectedSetor !== "_all_") {
        const setorNome = setores?.find(s => s.id === selectedSetor)?.nome;
        filtered = filtered.filter(col => col.setor?.nome === setorNome);
      }

      // Sort by month, then name within each month
      filtered.sort((a, b) => {
        const dateA = parseISO(a.data_nascimento);
        const dateB = parseISO(b.data_nascimento);
        const monthA = getMonth(dateA);
        const monthB = getMonth(dateB);
        
        if (monthA !== monthB) return monthA - monthB;
        return a.nome.localeCompare(b.nome);
      });

      if (filtered.length === 0) {
        toast.error("Nenhum aniversariante encontrado com os filtros selecionados");
        setGenerating(false);
        return;
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // Header
      pdf.setFillColor(236, 72, 153); // Pink for birthday theme
      pdf.rect(0, 0, pageWidth, 35, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("🎂 LISTA DE ANIVERSARIANTES", pageWidth / 2, 15, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const subtitle = selectedMonth === "_all_" 
        ? `Ano ${currentYear} - Todos os meses`
        : `${mesesNomes[parseInt(selectedMonth)]} de ${currentYear}`;
      pdf.text(subtitle, pageWidth / 2, 27, { align: "center" });

      pdf.setTextColor(0, 0, 0);
      let yPos = 45;

      // Summary
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Total: ${filtered.length} aniversariantes`, margin, yPos);
      yPos += 10;

      // Group by month if showing all
      if (selectedMonth === "_all_") {
        const byMonth: Record<number, Colaborador[]> = {};
        filtered.forEach(col => {
          const month = getMonth(parseISO(col.data_nascimento));
          if (!byMonth[month]) byMonth[month] = [];
          byMonth[month].push(col);
        });

        Object.entries(byMonth).sort(([a], [b]) => Number(a) - Number(b)).forEach(([monthStr, cols]) => {
          const monthNum = Number(monthStr);
          
          // Check if we need a new page
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = 20;
          }

          // Month header
          pdf.setFillColor(252, 231, 243);
          pdf.roundedRect(margin, yPos - 5, contentWidth, 10, 2, 2, "F");
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(157, 23, 77);
          pdf.text(`${mesesNomes[monthNum]} (${cols.length})`, margin + 5, yPos + 2);
          pdf.setTextColor(0, 0, 0);
          yPos += 12;

          // Table header
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos - 4, contentWidth, 8, "F");
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text("Dia", margin + 3, yPos);
          pdf.text("Nome", margin + 20, yPos);
          pdf.text("Setor", margin + 100, yPos);
          pdf.text("Idade", margin + 150, yPos);
          yPos += 8;

          // Table rows - FONTE MAIOR: 11 em vez de 9
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          cols.forEach(col => {
            if (yPos > pageHeight - 20) {
              pdf.addPage();
              yPos = 20;
            }

            const birthDate = parseISO(col.data_nascimento);
            const day = getDate(birthDate);
            const idade = calcularIdade(col.data_nascimento);

            pdf.text(String(day).padStart(2, "0"), margin + 3, yPos);
            pdf.text(col.nome.substring(0, 40), margin + 20, yPos);
            pdf.text((col.setor?.nome || "-").substring(0, 20), margin + 100, yPos);
            pdf.text(`${idade} anos`, margin + 150, yPos);
            yPos += 7; // Maior espaçamento
          });

          yPos += 5;
        });
      } else {
        // Single month - simple table
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, yPos - 4, contentWidth, 8, "F");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("Dia", margin + 3, yPos);
        pdf.text("Nome", margin + 20, yPos);
        pdf.text("Setor", margin + 90, yPos);
        pdf.text("Cargo", margin + 130, yPos);
        pdf.text("Idade", margin + 165, yPos);
        yPos += 8;

        // FONTE MAIOR: 11 em vez de 9
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        filtered.forEach(col => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }

          const birthDate = parseISO(col.data_nascimento);
          const day = getDate(birthDate);
          const idade = calcularIdade(col.data_nascimento);

          pdf.text(String(day).padStart(2, "0"), margin + 3, yPos);
          pdf.text(col.nome.substring(0, 35), margin + 20, yPos);
          pdf.text((col.setor?.nome || "-").substring(0, 15), margin + 90, yPos);
          pdf.text((col.cargo?.nome || "-").substring(0, 15), margin + 130, yPos);
          pdf.text(`${idade} anos`, margin + 165, yPos);
          yPos += 7; // Maior espaçamento
        });
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, pageHeight - 10, { align: "center" });

      const filename = selectedMonth === "_all_" 
        ? `aniversariantes-${currentYear}.pdf`
        : `aniversariantes-${mesesNomes[parseInt(selectedMonth)].toLowerCase()}-${currentYear}.pdf`;
      
      pdf.save(filename);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  const aniversariantesCount = colaboradores?.filter(col => {
    if (selectedMonth === "_all_") return true;
    const birthDate = parseISO(col.data_nascimento);
    return getMonth(birthDate) === parseInt(selectedMonth);
  }).length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-pink-500" />
          Lista de Aniversariantes
        </CardTitle>
        <CardDescription>
          Gera PDF com a lista de aniversariantes filtrada por mês e/ou setor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Mês</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Todos os meses</SelectItem>
                {mesesNomes.map((mes, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={selectedSetor} onValueChange={setSelectedSetor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">Todos os Setores</SelectItem>
                {setores?.map((setor) => (
                  <SelectItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={generatePDF} disabled={generating || !colaboradores?.length}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Gerar PDF
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{aniversariantesCount} aniversariantes com os filtros atuais</span>
        </div>
      </CardContent>
    </Card>
  );
}
