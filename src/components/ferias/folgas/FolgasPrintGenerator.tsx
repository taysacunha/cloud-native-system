import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachWeekendOfInterval, isSaturday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

interface FolgasPrintGeneratorProps {
  year: number;
  month: number;
}

interface Setor {
  id: string;
  nome: string;
}

interface SetorChefe {
  setor_id: string;
  colaborador_id: string;
}

interface Colaborador {
  nome: string;
  nome_exibicao: string | null;
  setor_titular_id: string;
  familiar_id: string | null;
}

interface Folga {
  id: string;
  data_sabado: string;
  colaborador_id: string;
  is_excecao: boolean;
  colaborador?: Colaborador | null;
}

const getDisplayName = (colaborador: Colaborador | null | undefined): string => {
  if (!colaborador) return "—";
  if (colaborador.nome_exibicao) return colaborador.nome_exibicao;
  const parts = colaborador.nome.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export function FolgasPrintGenerator({ year, month }: FolgasPrintGeneratorProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // Get saturdays of the month
  const saturdaysOfMonth = useMemo(() => {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const weekends = eachWeekendOfInterval({ start, end });
    return weekends.filter(d => isSaturday(d)).map(d => format(d, "yyyy-MM-dd"));
  }, [year, month]);

  // Query setores
  const { data: setores = [] } = useQuery({
    queryKey: ["ferias-setores-pdf", year, month],
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

  // Query chefes de setor
  const { data: setorChefes = [] } = useQuery({
    queryKey: ["ferias-setor-chefes-pdf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_setor_chefes")
        .select("setor_id, colaborador_id");
      if (error) throw error;
      return data as SetorChefe[];
    },
  });

  // Query folgas do mês
  const { data: folgas = [], isLoading } = useQuery({
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

  // Identificar chefes
  const chefeIds = useMemo(() => {
    return new Set(setorChefes.map(sc => sc.colaborador_id));
  }, [setorChefes]);

  // Identificar pares familiares que folgam juntos
  const familiarPairsOnSameSaturday = useMemo(() => {
    const pairs = new Set<string>();
    
    folgas.forEach(folga => {
      if (!folga.colaborador?.familiar_id) return;
      
      const familiarFolga = folgas.find(
        f => f.colaborador_id === folga.colaborador?.familiar_id && 
             f.data_sabado === folga.data_sabado
      );
      
      if (familiarFolga) {
        pairs.add(folga.colaborador_id);
        pairs.add(folga.colaborador.familiar_id);
      }
    });
    
    return pairs;
  }, [folgas]);

  // Build matrix: setor x saturday -> list of colaboradores
  const matrix = useMemo(() => {
    const result: Record<string, Record<string, Folga[]>> = {};

    setores.forEach(setor => {
      result[setor.id] = {};
      saturdaysOfMonth.forEach(sat => {
        result[setor.id][sat] = [];
      });
    });

    folgas.forEach(folga => {
      const setorId = folga.colaborador?.setor_titular_id;
      if (setorId && result[setorId] && result[setorId][folga.data_sabado]) {
        result[setorId][folga.data_sabado].push(folga);
      }
    });

    return result;
  }, [setores, saturdaysOfMonth, folgas]);

  // Contagem por sábado
  const countBySaturday = useMemo(() => {
    const counts: Record<string, number> = {};
    saturdaysOfMonth.forEach(sat => {
      counts[sat] = folgas.filter(f => f.data_sabado === sat).length;
    });
    return counts;
  }, [folgas, saturdaysOfMonth]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      const originalTitle = document.title;
      const monthName = format(new Date(year, month - 1), "MMMM yyyy", { locale: ptBR })
        .replace(/^\w/, c => c.toUpperCase());
      document.title = `Folgas de Sábado - ${monthName}`;
      window.print();
      document.title = originalTitle;
      setIsPrinting(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <Button disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Carregando...
      </Button>
    );
  }

  const printContent = (
    <div id="folgas-pdf-content" style={{ padding: "5mm", backgroundColor: "white" }}>
      {/* Cabeçalho */}
      <div style={{ textAlign: "center", marginBottom: "4mm" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
          Folgas de Sábado - {format(new Date(year, month - 1), "MMMM yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
        </h1>
      </div>

      {/* Tabela */}
      <table style={{ 
        width: "100%", 
        borderCollapse: "collapse", 
        fontSize: "14px",
        pageBreakInside: "avoid"
      }}>
        <thead>
          <tr style={{ backgroundColor: "#b4b4b4" }}>
            <th style={{ 
              border: "1px solid #9ca3af", 
              padding: "3px 4px", 
              textAlign: "left",
              fontWeight: "bold",
              minWidth: "80px"
            }}>
              Setor
            </th>
            {saturdaysOfMonth.map(sat => (
              <th key={sat} style={{ 
                border: "1px solid #9ca3af", 
                padding: "3px", 
                textAlign: "center",
                fontWeight: "bold",
                minWidth: "60px"
              }}>
                <div>{format(new Date(sat + "T12:00:00"), "dd/MM", { locale: ptBR })}</div>
                <div style={{ fontSize: "7px", fontWeight: "normal", color: "#666" }}>
                  ({countBySaturday[sat]} folgas)
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {setores.map((setor, idx) => (
            <tr key={setor.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#e6e6e6" }}>
              <td style={{ 
                border: "1px solid #9ca3af", 
                padding: "3px 4px", 
                fontWeight: "600"
              }}>
                {setor.nome}
              </td>
              {saturdaysOfMonth.map(sat => {
                const folgasNaCelula = matrix[setor.id]?.[sat] || [];
                return (
                  <td key={sat} style={{ 
                    border: "1px solid #d1d5db", 
                    padding: "2px 3px",
                    verticalAlign: "middle",
                    textAlign: "center"
                  }}>
                    {folgasNaCelula.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {folgasNaCelula.map(folga => {
                          const isFamiliar = familiarPairsOnSameSaturday.has(folga.colaborador_id);
                          const isChefe = chefeIds.has(folga.colaborador_id);
                          return (
                            <div 
                              key={folga.id}
                              style={{ 
                              fontSize: "14px",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                                padding: "1px 3px",
                                borderRadius: "2px",
                                backgroundColor: isFamiliar ? "#e0f2fe" : isChefe ? "#ede9fe" : "transparent",
                                color: isFamiliar ? "#0369a1" : isChefe ? "#6b21a8" : "#000000"
                              }}
                            >
                              {getDisplayName(folga.colaborador)}
                              {folga.is_excecao && " *"}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legenda - sem símbolos */}
      <div style={{ 
        marginTop: "4mm", 
        paddingTop: "2mm", 
        borderTop: "1px solid #d1d5db",
        fontSize: "8px",
        color: "#666",
        display: "flex",
        gap: "16px",
        alignItems: "center"
      }}>
        <strong>Legenda:</strong>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "12px", height: "12px", backgroundColor: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: "2px", display: "inline-block" }}></span>
          Par familiar
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "12px", height: "12px", backgroundColor: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: "2px", display: "inline-block" }}></span>
          Chefe de setor
        </span>
        <span>* = Ajuste manual</span>
      </div>

      {/* Rodapé */}
      <div style={{ 
        marginTop: "2mm",
        fontSize: "7px",
        color: "#9ca3af",
        textAlign: "right"
      }}>
        Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </div>
    </div>
  );

  return (
    <>
      <Button variant="outline" onClick={handlePrint} disabled={isPrinting || folgas.length === 0}>
        {isPrinting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Printer className="h-4 w-4 mr-2" />
        )}
        Imprimir PDF
      </Button>

      {/* Print styles - padrão que funciona sem páginas em branco */}
      <style>
        {`
          @media screen {
            #folgas-pdf-content {
              display: none !important;
            }
          }
          @media print {
            html, body {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body > *:not(#folgas-pdf-content) {
              display: none !important;
            }
            #folgas-pdf-content {
              display: block !important;
              position: static !important;
              width: 277mm !important;
              margin: 0 !important;
              padding: 5mm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          }
        `}
      </style>

      {/* Portal for print content */}
      {createPortal(printContent, document.body)}
    </>
  );
}
