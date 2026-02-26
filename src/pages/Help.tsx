import { 
  HelpCircle, 
  Users, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Building2,
  Home,
  Clock,
  CalendarDays,
  UserPlus,
  Settings,
  FileText,
  Lightbulb,
  RefreshCw,
  Shuffle,
  ArrowLeftRight,
  BarChart3,
  Search,
  PieChart,
  User,
  Shield,
  Mail,
  Lock,
  History,
  Database,
  TrendingUp,
  Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Help = () => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Central de Ajuda</h1>
        </div>
        <p className="text-muted-foreground">
          Guia completo para utilizar o sistema de Gestão de Plantões
        </p>
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-2 justify-start">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="corretores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Corretores</span>
          </TabsTrigger>
          <TabsTrigger value="locais" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Locais</span>
          </TabsTrigger>
          <TabsTrigger value="periodos" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Períodos</span>
          </TabsTrigger>
          <TabsTrigger value="escalas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Escalas</span>
          </TabsTrigger>
          <TabsTrigger value="consultas" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Consultas</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil e Usuários</span>
          </TabsTrigger>
        </TabsList>

        {/* VISÃO GERAL */}
        <TabsContent value="visao-geral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                O que é o Sistema de Gestão de Plantões?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O sistema de Gestão de Plantões permite organizar e gerenciar a alocação de corretores 
                em diferentes locais de trabalho, como stands de vendas (externos) e escritórios (internos).
              </p>
              <p>
                Com ele você pode cadastrar corretores, configurar locais com seus respectivos horários,
                definir períodos de vigência e gerar escalas mensais automaticamente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Fluxo de Trabalho Recomendado
              </CardTitle>
              <CardDescription>
                Siga esta ordem para configurar o sistema corretamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col items-center text-center p-4 bg-primary/10 rounded-lg flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <Users className="h-6 w-6 mb-2 text-primary" />
                  <span className="font-medium">Corretores</span>
                  <span className="text-xs text-muted-foreground">Cadastrar equipe</span>
                </div>
                
                <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                
                <div className="flex flex-col items-center text-center p-4 bg-primary/10 rounded-lg flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <MapPin className="h-6 w-6 mb-2 text-primary" />
                  <span className="font-medium">Locais</span>
                  <span className="text-xs text-muted-foreground">Cadastrar pontos</span>
                </div>
                
                <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                
                <div className="flex flex-col items-center text-center p-4 bg-primary/10 rounded-lg flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <CalendarDays className="h-6 w-6 mb-2 text-primary" />
                  <span className="font-medium">Períodos</span>
                  <span className="text-xs text-muted-foreground">Configurar turnos</span>
                </div>
                
                <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                
                <div className="flex flex-col items-center text-center p-4 bg-primary/10 rounded-lg flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-primary">4</span>
                  </div>
                  <Calendar className="h-6 w-6 mb-2 text-primary" />
                  <span className="font-medium">Escalas</span>
                  <span className="text-xs text-muted-foreground">Gerar alocações</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Recursos Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-medium">Dashboard</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visualize estatísticas e métricas do sistema em tempo real.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    <span className="font-medium">Relatórios</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Análises detalhadas de desempenho de corretores e locais.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-5 w-5 text-primary" />
                    <span className="font-medium">Dados Históricos</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acesse dados de meses anteriores mesmo após limpar escalas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Dica importante</AlertTitle>
            <AlertDescription>
              Antes de gerar escalas, certifique-se de que todos os corretores estejam cadastrados,
              os locais configurados com períodos válidos, e os corretores associados aos locais onde podem trabalhar.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                O que é o Dashboard?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O Dashboard é a página inicial do sistema que apresenta uma visão geral das 
                estatísticas e métricas das escalas de plantões.
              </p>
              <p>
                Aqui você pode acompanhar o total de alocações, distribuição por turno, 
                top corretores e locais mais utilizados.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seletor de Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Use o seletor de mês no canto superior direito para visualizar estatísticas de meses diferentes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Selecione qualquer mês dos últimos 12 meses</li>
                <li>Os dados são atualizados automaticamente ao trocar o mês</li>
                <li>Por padrão, exibe o mês atual</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                Dados Históricos
              </CardTitle>
              <CardDescription>
                Entenda como o sistema preserva dados de meses anteriores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O sistema mantém um histórico agregado das escalas anteriores. Quando você seleciona um mês passado,
                os dados são recuperados do histórico mesmo que as escalas originais já tenham sido limpas.
              </p>
              
              <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">
                    <History className="h-3 w-3 mr-1" />
                    Dados históricos
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quando você vir este indicador, significa que os dados estão sendo exibidos a partir 
                  do histórico agregado, não das escalas ativas.
                </p>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  O histórico é salvo automaticamente quando você limpa escalas de um mês ou quando gera novas escalas.
                  Isso garante que os dados de desempenho sejam preservados para análises futuras.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Exibidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Cards de Resumo</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Total de alocações no mês</li>
                    <li>• Plantões da manhã</li>
                    <li>• Plantões da tarde</li>
                    <li>• Média de plantões por dia</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Gráficos e Rankings</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Top 5 corretores com mais plantões</li>
                    <li>• Top 5 locais mais utilizados</li>
                    <li>• Distribuição manhã vs tarde</li>
                    <li>• Taxa de participação dos corretores</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CORRETORES */}
        <TabsContent value="corretores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Como Adicionar um Corretor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li>Acesse o menu <Badge variant="outline">Corretores</Badge></li>
                <li>Clique no botão <Badge>+ Novo Corretor</Badge></li>
                <li>Preencha os campos obrigatórios:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                    <li><strong>Nome:</strong> Nome completo do corretor</li>
                    <li><strong>CRECI:</strong> Número do registro profissional</li>
                  </ul>
                </li>
                <li>Configure a disponibilidade por dia da semana (opcional)</li>
                <li>Clique em <Badge>Salvar</Badge></li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Disponibilidade por Dia/Turno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Você pode definir em quais dias da semana e turnos o corretor está disponível para trabalhar.
                Isso ajuda o sistema a fazer alocações mais precisas.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Exemplo:</p>
                <p className="text-sm text-muted-foreground">
                  Se um corretor só pode trabalhar de segunda a sexta no turno da manhã,
                  configure apenas esses dias/turnos como disponíveis.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ativar/Desativar Corretor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg border-green-500/30 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Corretor Ativo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aparece nas opções de alocação e pode ser escalado normalmente.
                  </p>
                </div>
                <div className="p-4 border rounded-lg border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Corretor Inativo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Não aparece nas opções de alocação. Útil para férias ou afastamentos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOCAIS */}
        <TabsContent value="locais" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Como Adicionar um Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li>Acesse o menu <Badge variant="outline">Locais</Badge></li>
                <li>Clique no botão <Badge>+ Novo Local</Badge></li>
                <li>Preencha os campos:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                    <li><strong>Nome:</strong> Nome do empreendimento ou local</li>
                    <li><strong>Tipo:</strong> Externo ou Interno</li>
                    <li><strong>CEP:</strong> O sistema busca o endereço automaticamente</li>
                    <li><strong>Construtora:</strong> Nome da construtora (opcional)</li>
                  </ul>
                </li>
                <li>Clique em <Badge>Salvar</Badge></li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Local Externo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Stands de vendas em empreendimentos, feiras, eventos.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Geralmente 1 corretor por turno</li>
                    <li>• Mostra se está ocupado</li>
                    <li>• Valida elegibilidade do corretor</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Local Interno</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Escritório da imobiliária, matriz, filiais.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Múltiplos corretores por turno</li>
                    <li>• Não mostra "ocupado"</li>
                    <li>• Qualquer corretor ativo pode ser alocado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Opção: "Este local tem restrição de turno por dia específico?"
              </CardTitle>
              <CardDescription>
                Esta opção define como os turnos serão configurados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">NÃO</Badge>
                    <span className="font-medium">Modo Dia da Semana</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Os turnos são configurados por dia da semana (segunda, terça, etc).
                    O mesmo horário se repete toda semana.
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Exemplo:</p>
                    <p className="text-muted-foreground">
                      "Toda segunda-feira das 8h às 12h (manhã) e das 14h às 18h (tarde)"
                    </p>
                  </div>
                  <p className="text-xs text-green-600">
                    ✓ Ideal para locais com horários fixos e previsíveis
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">SIM</Badge>
                    <span className="font-medium">Modo Data Específica</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Os turnos são configurados para datas específicas.
                    Cada dia pode ter horários diferentes.
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Exemplo:</p>
                    <p className="text-muted-foreground">
                      "Dia 15/01 das 10h às 16h, Dia 22/01 das 9h às 13h"
                    </p>
                  </div>
                  <p className="text-xs text-amber-600">
                    ✓ Ideal para eventos, feiras ou plantões esporádicos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Associar Corretores ao Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Para locais <strong>externos</strong>, você deve associar quais corretores podem trabalhar naquele local.
                Isso garante que apenas corretores qualificados/autorizados sejam alocados.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Na listagem de locais, clique no local desejado</li>
                <li>Na seção "Corretores Associados", clique em <Badge variant="outline">Gerenciar</Badge></li>
                <li>Selecione os corretores que podem trabalhar neste local</li>
                <li>Configure a disponibilidade de turno (manhã/tarde) para cada corretor</li>
              </ol>
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  Para locais internos, qualquer corretor ativo pode ser alocado, 
                  então não é necessário associar corretores específicos.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERÍODOS */}
        <TabsContent value="periodos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                O que são Períodos?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Períodos definem o intervalo de datas em que um local está ativo para plantões.
                Dentro de cada período, você configura os dias e horários de funcionamento.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Exemplo:</p>
                <p className="text-sm text-muted-foreground">
                  O empreendimento "Residencial Aurora" tem plantões de 01/01/2024 a 30/06/2024.
                  Você cria um período com essas datas e configura os turnos.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como Criar um Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li>Na página do local, acesse a aba <Badge variant="outline">Períodos</Badge></li>
                <li>Clique em <Badge>+ Novo Período</Badge></li>
                <li>Defina a data de início e fim do período</li>
                <li>Salve o período</li>
                <li>Configure os turnos de acordo com o modo do local</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurar Turnos - Modo Dia da Semana</CardTitle>
              <CardDescription>
                Para locais SEM restrição de turno por dia específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Após criar o período, você define quais dias da semana terão plantão:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Clique no período para expandir as opções</li>
                <li>Selecione os dias da semana (ex: segunda a sexta)</li>
                <li>Para cada dia, configure:
                  <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                    <li>Se tem turno da manhã e horários</li>
                    <li>Se tem turno da tarde e horários</li>
                    <li>Quantidade máxima de corretores</li>
                  </ul>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurar Turnos - Modo Data Específica</CardTitle>
              <CardDescription>
                Para locais COM restrição de turno por dia específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Neste modo, você adiciona cada data de plantão individualmente:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Clique no período para expandir</li>
                <li>Use o botão <Badge variant="outline">+ Adicionar Data</Badge></li>
                <li>Selecione a data específica do plantão</li>
                <li>Configure os horários de manhã e/ou tarde</li>
                <li>Repita para cada data necessária</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Excluir Datas (Feriados)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                No modo "Dia da Semana", você pode excluir datas específicas como feriados
                para que não sejam consideradas na geração de escalas.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>No período, clique em <Badge variant="outline">Excluir Datas</Badge></li>
                <li>Selecione a data a ser excluída</li>
                <li>Opcionalmente, informe o motivo (ex: "Feriado - Natal")</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESCALAS */}
        <TabsContent value="escalas" className="space-y-6">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Pré-requisitos para Gerar Escalas
              </CardTitle>
              <CardDescription>
                Verifique se todos os itens estão configurados antes de gerar escalas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Corretores cadastrados e ativos</p>
                    <p className="text-sm text-muted-foreground">
                      Pelo menos um corretor ativo no sistema
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Locais cadastrados e ativos</p>
                    <p className="text-sm text-muted-foreground">
                      Locais com endereço completo configurado
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Períodos configurados com datas futuras</p>
                    <p className="text-sm text-muted-foreground">
                      Períodos válidos com turnos definidos para o mês desejado
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Corretores associados aos locais externos</p>
                    <p className="text-sm text-muted-foreground">
                      Para locais externos, defina quais corretores podem trabalhar em cada local
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Como Gerar uma Escala
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li>Acesse o menu <Badge variant="outline">Escalas</Badge></li>
                <li>Selecione o mês/ano desejado no calendário</li>
                <li>Clique em <Badge>Gerar Escala</Badge></li>
                <li>Aguarde o processamento (o sistema valida as regras automaticamente)</li>
                <li>Revise as alocações geradas</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar/Editar Alocações Manualmente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Você pode adicionar ou modificar alocações manualmente após gerar a escala:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Clique no dia desejado no calendário</li>
                <li>Selecione <Badge variant="outline">+ Adicionar Alocação</Badge></li>
                <li>Escolha o turno (manhã ou tarde)</li>
                <li>Selecione o corretor</li>
                <li>Selecione o local</li>
                <li>Confirme a alocação</li>
              </ol>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Para locais externos, apenas corretores associados ao local aparecerão como opção.
                  Para locais internos, todos os corretores ativos estarão disponíveis.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-500" />
                Confirmação de Substituição
              </CardTitle>
              <CardDescription>
                Segurança ao substituir corretores em plantões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Ao substituir um corretor em um plantão, o sistema exibe um diálogo de confirmação 
                para evitar alterações acidentais.
              </p>
              <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/30">
                <p className="font-medium mb-2">O que é exibido na confirmação:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>De:</strong> Nome do corretor atual</li>
                  <li>• <strong>Para:</strong> Nome do novo corretor</li>
                  <li>• <strong>Local:</strong> Local do plantão</li>
                  <li>• <strong>Data:</strong> Data e turno do plantão</li>
                </ul>
              </div>
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  Revise atentamente as informações antes de confirmar a substituição. 
                  Após confirmada, a alteração é imediata.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exportar para PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Após gerar e revisar a escala, você pode exportá-la para PDF:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Na página de escalas, clique no botão <Badge variant="outline">Exportar PDF</Badge></li>
                <li>O sistema gerará um documento com todas as alocações do período</li>
                <li>O PDF pode ser impresso ou compartilhado com a equipe</li>
              </ol>
            </CardContent>
          </Card>

          <Alert variant="default" className="border-primary/30 bg-primary/5">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Dica</AlertTitle>
            <AlertDescription>
              Recomendamos gerar a escala no início do mês anterior, assim você tem tempo para 
              fazer ajustes manuais e comunicar a equipe com antecedência.
            </AlertDescription>
          </Alert>

          <Separator className="my-4" />

          {/* TROCA DE PLANTÕES */}
          <Card className="border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                Troca de Plantões
              </CardTitle>
              <CardDescription>
                Funcionalidade para trocar ou substituir corretores em plantões já alocados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Após gerar uma escala, você pode fazer ajustes nos plantões através das opções de troca e substituição:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Trocar Plantões</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Troca dois corretores de posição em suas respectivas alocações.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Selecione o plantão que deseja trocar</li>
                    <li>• Escolha outro plantão para fazer a troca</li>
                    <li>• Os corretores trocam de lugar</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg border-green-500/30 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Substituir Corretor</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Substitui um corretor por outro em um plantão específico.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Selecione o plantão desejado</li>
                    <li>• Escolha o novo corretor da lista de elegíveis</li>
                    <li>• O sistema valida as regras automaticamente</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  O sistema valida automaticamente se a troca ou substituição respeita as regras de alocação,
                  como dias consecutivos, limite de externos por semana, e disponibilidade do corretor.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* ROTAÇÃO JUSTA */}
          <Card className="border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5 text-purple-500" />
                Rotação Justa por Local
              </CardTitle>
              <CardDescription>
                Sistema de distribuição equilibrada de plantões entre todos os corretores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O sistema implementa uma fila de rotação para cada local externo, garantindo que
                todos os corretores disponíveis tenham a oportunidade de trabalhar no local.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <p className="font-medium">Como funciona:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Fila de prioridade:</strong> Cada local tem uma fila com todos os corretores elegíveis</li>
                  <li><strong>Priorização:</strong> Corretores que não foram ao local recentemente têm prioridade</li>
                  <li><strong>Atualização automática:</strong> Após cada alocação, o corretor vai para o final da fila</li>
                  <li><strong>Distribuição equilibrada:</strong> Todos passam pelo local antes de repetir</li>
                </ol>
              </div>

              <div className="bg-purple-500/5 p-4 rounded-lg border border-purple-500/30">
                <p className="font-medium mb-2 text-purple-700 dark:text-purple-300">Exemplo prático:</p>
                <p className="text-sm text-muted-foreground">
                  Se o local "Artus Vivence" tem 6 corretores disponíveis e 2 vagas por semana:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• <strong>Semana 1:</strong> Andrea e Italo são alocados → vão para o final da fila</li>
                  <li>• <strong>Semana 2:</strong> Cleane e João são alocados (próximos na fila)</li>
                  <li>• <strong>Semana 3:</strong> Maria e Pedro são alocados</li>
                  <li>• <strong>Semana 4:</strong> Volta para Andrea e Italo (já passaram todos)</li>
                </ul>
              </div>

              <Alert variant="default" className="border-purple-500/30 bg-purple-500/5">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  A rotação é uma <strong>preferência</strong>, não uma regra absoluta. O sistema ainda respeita
                  todas as outras regras (dias consecutivos, máximo de externos, etc). Se o corretor preferido
                  não puder ir por outra regra, o próximo na fila é escolhido.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONSULTAS */}
        <TabsContent value="consultas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Página de Consultas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A página de Consultas permite buscar plantões de forma rápida e flexível, 
                filtrando por corretor, local ou período.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Buscar por Corretor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Selecione a aba <Badge variant="outline">Por Corretor</Badge></li>
                <li>Escolha o corretor na lista suspensa</li>
                <li>Defina o período desejado (data inicial e final)</li>
                <li>Os plantões do corretor serão listados</li>
              </ol>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Informações exibidas:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Data do plantão</li>
                  <li>• Turno (manhã/tarde)</li>
                  <li>• Local de trabalho</li>
                  <li>• Tipo do local (interno/externo)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Buscar por Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Selecione a aba <Badge variant="outline">Por Local</Badge></li>
                <li>Escolha o local na lista suspensa</li>
                <li>Defina o período desejado</li>
                <li>Todos os plantões naquele local serão listados</li>
              </ol>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Informações exibidas:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Data do plantão</li>
                  <li>• Turno (manhã/tarde)</li>
                  <li>• Corretor alocado</li>
                  <li>• CRECI do corretor</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Você pode filtrar os resultados por diferentes períodos:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Períodos Pré-definidos</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Últimos 7 dias</li>
                    <li>• Últimos 30 dias</li>
                    <li>• Mês atual</li>
                    <li>• Mês anterior</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Período Personalizado</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Selecione data inicial</li>
                    <li>• Selecione data final</li>
                    <li>• Clique em Buscar</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exportar Resultados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Os resultados das consultas podem ser exportados para uso em outros sistemas:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Clique no botão de exportar após realizar uma consulta</li>
                <li>O arquivo gerado contém todos os registros filtrados</li>
                <li>Útil para relatórios externos ou auditorias</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RELATÓRIOS */}
        <TabsContent value="relatorios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Página de Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A página de Relatórios oferece análises detalhadas sobre o desempenho de corretores, 
                utilização de locais e distribuição temporal dos plantões.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Abas disponíveis:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Desempenho de Corretores:</strong> Métricas individuais</li>
                  <li>• <strong>Análise de Locais:</strong> Estatísticas por local</li>
                  <li>• <strong>Análise Temporal:</strong> Distribuição por dia da semana</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Desempenho de Corretores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Esta aba apresenta métricas de desempenho para cada corretor no período selecionado:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Métricas Exibidas</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Total de plantões</li>
                    <li>• Plantões da manhã</li>
                    <li>• Plantões da tarde</li>
                    <li>• Locais únicos visitados</li>
                    <li>• Último plantão realizado</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Gráficos</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ranking de corretores por plantões</li>
                    <li>• Distribuição manhã vs tarde</li>
                    <li>• Comparativo entre corretores</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Análise de Locais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Esta aba mostra estatísticas de utilização de cada local:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Métricas Exibidas</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Total de plantões por local</li>
                    <li>• Distribuição por turno</li>
                    <li>• Dias cobertos</li>
                    <li>• Corretores únicos que trabalharam</li>
                    <li>• Tipo e cidade do local</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Gráficos</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ranking de locais mais utilizados</li>
                    <li>• Distribuição por tipo (interno/externo)</li>
                    <li>• Ocupação por cidade</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise Temporal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Esta aba apresenta a distribuição dos plantões ao longo do tempo:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Distribuição por Dia da Semana</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Quantidade de plantões por dia</li>
                    <li>• Manhã vs tarde por dia</li>
                    <li>• Identificação de dias mais movimentados</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium mb-2">Tendências</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Evolução ao longo do período</li>
                    <li>• Padrões semanais</li>
                    <li>• Comparativos entre períodos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                Dados Históricos nos Relatórios
              </CardTitle>
              <CardDescription>
                Como os relatórios utilizam dados de meses anteriores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Os relatórios utilizam uma abordagem híbrida para exibir dados:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg border-green-500/30 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Dados ao Vivo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quando o período selecionado tem escalas ativas, os dados são obtidos 
                    diretamente das alocações atuais.
                  </p>
                </div>
                <div className="p-4 border rounded-lg border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Dados Históricos</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quando as escalas do período foram limpas, os dados são recuperados 
                    do histórico agregado preservado.
                  </p>
                </div>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  A análise temporal (distribuição por dia da semana) pode mostrar dados zerados 
                  para períodos históricos, pois essa informação granular não é preservada no histórico agregado.
                  Apenas os totais por corretor e local são mantidos.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFIL E USUÁRIOS */}
        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Gerenciamento de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A página de Perfil permite visualizar e alterar suas informações de conta.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Alterar E-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Acesse <Badge variant="outline">Perfil</Badge> no menu</li>
                <li>Na seção "Informações da Conta", clique em editar email</li>
                <li>Digite o novo e-mail</li>
                <li>Confirme a alteração</li>
              </ol>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Um e-mail de confirmação será enviado para o novo endereço. 
                  A alteração só será efetivada após a confirmação.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Acesse <Badge variant="outline">Perfil</Badge> no menu</li>
                <li>Na seção "Alterar Senha", digite a senha atual</li>
                <li>Digite a nova senha</li>
                <li>Confirme a nova senha</li>
                <li>Clique em <Badge>Salvar</Badge></li>
              </ol>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Requisitos de Senha:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Mínimo 6 caracteres</li>
                  <li>• Pelo menos uma letra maiúscula</li>
                  <li>• Pelo menos um número</li>
                  <li>• Pelo menos um caractere especial (!@#$%^&*)</li>
                </ul>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded text-center text-xs bg-red-500/20 text-red-700 dark:text-red-300">
                  Fraca
                </div>
                <div className="p-2 rounded text-center text-xs bg-orange-500/20 text-orange-700 dark:text-orange-300">
                  Média
                </div>
                <div className="p-2 rounded text-center text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                  Boa
                </div>
                <div className="p-2 rounded text-center text-xs bg-green-500/20 text-green-700 dark:text-green-300">
                  Forte
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-4" />

          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Gestão de Usuários (Administradores)
              </CardTitle>
              <CardDescription>
                Funcionalidades disponíveis apenas para administradores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Administradores podem gerenciar todos os usuários do sistema através da página 
                <Badge variant="outline" className="mx-1">Usuários</Badge> no menu.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Convidar Novos Usuários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Acesse <Badge variant="outline">Usuários</Badge> no menu</li>
                <li>Clique em <Badge>+ Convidar Usuário</Badge></li>
                <li>Informe o e-mail do novo usuário</li>
                <li>Selecione o tipo de permissão</li>
                <li>Selecione os sistemas que o usuário terá acesso</li>
                <li>Clique em <Badge>Enviar Convite</Badge></li>
              </ol>
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  O usuário receberá um e-mail com instruções para criar sua conta e acessar o sistema.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg border-red-500/30 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Administrador</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acesso total ao sistema. Pode gerenciar usuários, configurações e todos os dados.
                  </p>
                </div>
                <div className="p-4 border rounded-lg border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Gerente</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pode gerenciar corretores, locais, períodos e escalas. Não pode gerenciar outros usuários.
                  </p>
                </div>
                <div className="p-4 border rounded-lg border-green-500/30 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Corretor</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acesso de visualização. Pode ver escalas e consultar plantões, mas não pode fazer alterações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acesso aos Sistemas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O sistema possui módulos separados que podem ser habilitados individualmente para cada usuário:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="font-medium">Escalas</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gestão de plantões, corretores e locais.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-medium">Vendas</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acompanhamento de vendas, metas e avaliações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Banir/Desbanir Usuários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Administradores podem banir usuários para impedir o acesso ao sistema sem excluí-los:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg border-red-500/30 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Usuário Banido</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Não consegue fazer login</li>
                    <li>• Dados são preservados</li>
                    <li>• Pode ser desbanido posteriormente</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg border-green-500/30 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Desbanir Usuário</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Restaura acesso ao sistema</li>
                    <li>• Mantém permissões anteriores</li>
                    <li>• Histórico preservado</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <div className="text-center text-sm text-muted-foreground">
        <p>Ainda tem dúvidas? Entre em contato com o administrador do sistema.</p>
      </div>
    </div>
  );
};

export default Help;
