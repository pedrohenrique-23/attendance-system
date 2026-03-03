import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, LogOut, Download, Lock, User, X, Bell, Eye } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useBackgroundNotifications } from "@/hooks/useBackgroundNotifications";
import { PushNotificationManager } from "@/components/PushNotificationManager";

type NotificationOptions = {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
};

const MONITORS = [
  "Pedro Henrique",
  "Ruan Paixão",
  "Solon Alves",
  "Vitória Naira",
  "Maria Eduarda",
  "Mateus Alves",
  "Leonardo Amaro",
  "Keyser Sousa",
  "Amanda Leite",
  "Marcos Paulo",
  "Elivelton Oliveira",
  "Geiciele Rodrigues",
  "Pedro Costa",
  "Albislene Neves",
];

interface QueueItem {
  id: number;
  operatorName: string;
  operatorPa: string;
  createdAt: Date;
}

interface Case {
  id: number;
  operatorName: string;
  operatorPa: string;
  title: string;
  description: string;
  status: string;
  monitorName: string | null;
  resolution: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

interface Operator {
  id: number;
  name: string;
  pa: string;
  lastLogin: Date;
}

export default function MonitorDashboard() {
  const [isMonitor, setIsMonitor] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [, navigate] = useLocation();
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [resolution, setResolution] = useState("");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const { notify, requestPermission, permission } = useNotifications();
  const { sendLocalNotification } = usePushNotifications();
  const { notifyQueueUpdate, notifyCaseUpdate } = useBackgroundNotifications({
    enabled: isMonitor,
    interval: 2000,
  });
  const previousQueueLength = useRef<number | null>(null);
  const previousCasesLength = useRef<number | null>(null);

  const { data: queue = [], refetch: refetchQueue } = trpc.operator.getQueue.useQuery(undefined, {
    refetchInterval: 2000,
    enabled: isMonitor,
  });

  const { data: allCases = [], refetch: refetchCases } = trpc.operator.getAllCases.useQuery(undefined, {
    refetchInterval: 2000,
    enabled: isMonitor,
  });

  const { data: loggedInOperators = [] } = trpc.operator.getLoggedInOperators.useQuery(undefined, {
    refetchInterval: 2000,
    enabled: isMonitor,
  });

  const pendingCases = allCases.filter((c: Case) => c.status === "pending" || c.status === "in_progress");
  const completedCases = allCases.filter((c: Case) => c.status === "completed");

  const handleViewCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowCaseModal(true);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("pt-BR");
  };

  const attendMutation = trpc.operator.removeFromQueue.useMutation({
    onSuccess: () => {
      toast.success("Operador atendido!");
      refetchQueue();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atender operador");
    },
  });

  const assignMonitorMutation = trpc.operator.assignMonitor.useMutation({
    onSuccess: () => {
      toast.success("Caso assumido com sucesso!");
      refetchCases();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atribuir monitor");
    },
  });

  const completeCaseMutation = trpc.operator.completeCase.useMutation({
    onSuccess: () => {
      toast.success("Caso concluído!");
      setShowResolutionModal(false);
      setSelectedCaseId(null);
      setResolution("");
      refetchCases();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao concluir caso");
    },
  });

  const { data: completedCasesForExport = [] } = trpc.operator.getCompletedCasesToday.useQuery(undefined, {
    enabled: isMonitor,
  });

  const handleDownloadReport = async () => {
    try {
      const data = completedCasesForExport;
      const headers = ["ID", "Operador", "PA", "Título", "Descrição", "Monitor", "Resolução", "Data"];
      const rows = data.map((c: Case) => [
        c.id,
        c.operatorName,
        c.operatorPa,
        c.title,
        c.description,
        c.monitorName || "N/A",
        c.resolution || "N/A",
        new Date(c.createdAt).toLocaleString("pt-BR"),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row: (string | number)[]) => row.map((cell: string | number) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `atendimentos_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Relatório baixado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao baixar relatório");
    }
  };

  const handleZeroReport = async () => {
    if (confirm("Tem certeza que deseja limpar todos os casos resolvidos? Esta ação não pode ser desfeita.")) {
      await deleteDataMutation.mutateAsync();
    }
  };

  const deleteDataMutation = trpc.operator.deleteCompletedCases.useMutation({
    onSuccess: () => {
      toast.success("Dados de casos concluídos removidos!");
      refetchCases();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao limpar dados");
    },
  });

  useEffect(() => {
    const monitorAuth = sessionStorage.getItem("monitorAuth");
    const storedMonitor = sessionStorage.getItem("monitorName");
    if (monitorAuth && storedMonitor) {
      setIsMonitor(true);
      setSelectedMonitor(storedMonitor);
      // Solicitar permissão de notificação ao entrar
      requestPermission();
    } else {
      setShowAuthForm(true);
    }
  }, [requestPermission]);

  // Notificar quando novo caso chega
  useEffect(() => {
    if (isMonitor && permission === 'granted') {
      const newCasesCount = pendingCases.length;
      // Se previousCasesLength é null, é a primeira vez, então inicializar
      if (previousCasesLength.current === null) {
        previousCasesLength.current = newCasesCount;
      } else if (newCasesCount > previousCasesLength.current) {
        // Novo caso chegou
        const newCase = pendingCases[pendingCases.length - 1];
        notify('📋 Novo Caso Chegou!', {
          body: `${newCase.operatorName} (PA: ${newCase.operatorPa}) - ${newCase.title}`,
          tag: 'new-case',
          requireInteraction: true,
          soundType: 'case',
        });
        // Enviar também como push notification (funciona em qualquer aba)
        notifyCaseUpdate(newCasesCount);
        previousCasesLength.current = newCasesCount;
      }
    }
  }, [pendingCases, isMonitor, permission, notify, notifyCaseUpdate]);

  // Notificar quando operador chama
  useEffect(() => {
    if (isMonitor && permission === 'granted') {
      const newQueueLength = queue.length;
      // Se previousQueueLength é null, é a primeira vez, então inicializar
      if (previousQueueLength.current === null) {
        previousQueueLength.current = newQueueLength;
      } else if (newQueueLength > previousQueueLength.current) {
        // Novo chamado chegou
        const newItem = queue[queue.length - 1];
        notify('📞 Operador Chamando!', {
          body: `${newItem.operatorName} (PA: ${newItem.operatorPa}) está na fila`,
          tag: 'queue-alert',
          requireInteraction: true,
          soundType: 'call',
        });
        // Enviar também como push notification (funciona em qualquer aba)
        notifyQueueUpdate(newQueueLength);
        previousQueueLength.current = newQueueLength;
      }
    }
  }, [queue, isMonitor, permission, notify, notifyQueueUpdate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonitor.trim()) {
      toast.error("Selecione um monitor!");
      return;
    }
    if (password === "Monitor@123") {
      sessionStorage.setItem("monitorAuth", "true");
      sessionStorage.setItem("monitorName", selectedMonitor);
      setIsMonitor(true);
      setShowAuthForm(false);
      setPassword("");
      toast.success(`Bem-vindo, ${selectedMonitor}!`);
    } else {
      toast.error("Senha incorreta!");
      setPassword("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("monitorAuth");
    sessionStorage.removeItem("monitorName");
    setIsMonitor(false);
    setShowAuthForm(true);
    setSelectedMonitor("");
    navigate("/");
  };

  const handleAttendQueue = async (queueId: number, operatorName: string) => {
    await attendMutation.mutateAsync({ queueId });
    // Notificação é enviada via tRPC para o operador
  };

  const handleAssumeCase = async (caseId: number) => {
    await assignMonitorMutation.mutateAsync({
      caseId,
      monitorName: selectedMonitor,
    });
  };

  const handleCompleteCase = async () => {
    if (!selectedCaseId) return;
    await completeCaseMutation.mutateAsync({
      caseId: selectedCaseId,
      resolution: resolution || undefined,
    });
    // Notificação é enviada via tRPC para o operador
  };

  const openResolutionModal = (caseId: number) => {
    setSelectedCaseId(caseId);
    setResolution("");
    setShowResolutionModal(true);
  };

  if (showAuthForm && !isMonitor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-purple-100 rounded-full">
              <Lock size={32} className="text-purple-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
            Acesso do Monitor
          </h1>
          <p className="text-center text-slate-600 mb-6">
            Selecione seu nome e digite a senha
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Monitor
              </label>
              <select
                value={selectedMonitor}
                onChange={(e) => setSelectedMonitor(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">Selecione um monitor</option>
                {MONITORS.map((monitor) => (
                  <option key={monitor} value={monitor}>
                    {monitor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (!isMonitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Painel do Monitor
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <User size={16} className="text-purple-600" />
              <p className="text-slate-600">
                Conectado como: <span className="font-semibold text-purple-600">{selectedMonitor}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {permission !== 'granted' && (
              <Button
                onClick={requestPermission}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <Bell size={18} />
                Ativar Notificações
              </Button>
            )}
            {permission === 'granted' && (
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <Bell size={18} className="animate-pulse" />
                Notificações Ativas
              </div>
            )}
            <Button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Download size={18} />
              Baixar Relatório do Dia
            </Button>
            <Button
              onClick={handleZeroReport}
              disabled={deleteDataMutation.isPending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <X size={18} />
              Zerar Relatório/Casos
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={18} />
              Sair
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue Section */}
          <Card className="lg:col-span-1 p-6 bg-white shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Fila de Atendimento ({queue.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {queue.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  Nenhum operador aguardando
                </p>
              ) : (
                queue.map((item: QueueItem) => (
                  <div
                    key={item.id}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow animate-pulse"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.operatorName}
                        </p>
                        <p className="text-sm text-slate-600">PA: {item.operatorPa}</p>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold">
                        {new Date(item.createdAt).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleAttendQueue(item.id, item.operatorName)}
                      disabled={attendMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                      Atender
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Cases Grid */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Pending Cases */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Casos Pendentes ({pendingCases.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {pendingCases.length === 0 ? (
                    <p className="text-center text-slate-500 col-span-2 py-8">
                      Nenhum caso pendente
                    </p>
                  ) : (
                    pendingCases.map((caseItem: Case) => (
                      <Card
                        key={caseItem.id}
                        className={`p-4 border-l-4 shadow-md hover:shadow-lg transition-shadow ${
                          caseItem.monitorName
                            ? "bg-gradient-to-br from-green-50 to-green-100 border-green-400"
                            : "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400"
                        }`}
                      >
                        <div className="mb-3">
                          <h3 className="font-bold text-slate-900 mb-1">
                            {caseItem.title}
                          </h3>
                          <p className="text-xs text-slate-600 mb-2">
                            {caseItem.operatorName} - PA: {caseItem.operatorPa}
                          </p>
                          {caseItem.monitorName && (
                            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                              <User size={12} />
                              Verificando: {caseItem.monitorName}
                            </p>
                          )}
                          <p className="text-sm text-slate-700 line-clamp-3 mb-3">
                            {caseItem.description}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {!caseItem.monitorName && (
                            <Button
                              onClick={() => handleAssumeCase(caseItem.id)}
                              disabled={assignMonitorMutation.isPending}
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 rounded-lg transition-colors"
                            >
                              Assumir Caso
                            </Button>
                          )}
                          <Button
                            onClick={() => handleViewCase(caseItem)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye size={16} />
                            Ver Caso
                          </Button>
                          <Button
                            onClick={() => openResolutionModal(caseItem.id)}
                            disabled={completeCaseMutation.isPending}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
                          >
                            Concluir
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Completed Cases */}
              {completedCases.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    Casos Concluídos ({completedCases.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {completedCases.map((caseItem: Case) => (
                      <Card
                        key={caseItem.id}
                        className="p-4 border-l-4 border-blue-400 shadow-md bg-gradient-to-br from-blue-50 to-blue-100"
                      >
                        <div className="mb-3">
                          <h3 className="font-bold text-slate-900 mb-1">
                            {caseItem.title}
                          </h3>
                          <p className="text-xs text-slate-600 mb-2">
                            {caseItem.operatorName} - PA: {caseItem.operatorPa}
                          </p>
                          <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                            <User size={12} />
                            Resolvido por: {caseItem.monitorName}
                          </p>
                          <p className="text-sm text-slate-700 line-clamp-2 mb-2">
                            {caseItem.description}
                          </p>
                          {caseItem.resolution && (
                            <div className="bg-white bg-opacity-60 p-2 rounded mb-2">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Resolução:</p>
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {caseItem.resolution}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-slate-500">
                            {caseItem.completedAt && new Date(caseItem.completedAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleViewCase(caseItem)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye size={16} />
                          Ver Caso
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Registrar Resolução</h2>
              <button
                onClick={() => setShowResolutionModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  O que foi feito para resolver?
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Descreva a ação tomada para resolver o caso..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowResolutionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCompleteCase}
                  disabled={completeCaseMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {completeCaseMutation.isPending ? "Salvando..." : "Concluir Caso"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Visualizau00e7u00e3o de Caso */}
      <Dialog open={showCaseModal} onOpenChange={setShowCaseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {selectedCase?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Descriu00e7u00e3o</h3>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {selectedCase.description}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Operador:</span> {selectedCase.operatorName} (PA: {selectedCase.operatorPa})
                </p>
              </div>

              {selectedCase.monitorName && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-700">
                    u2713 Monitor Responsável: {selectedCase.monitorName}
                  </p>
                </div>
              )}

              {selectedCase.status === "completed" && selectedCase.resolution && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Resolução</h3>
                  <p className="text-slate-700 whitespace-pre-wrap bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {selectedCase.resolution}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-semibold text-slate-900">
                    {selectedCase.status === "pending" ? "Pendente" : "Resolvido"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Criado em</p>
                  <p className="font-semibold text-slate-900">
                    {formatDate(selectedCase.createdAt)}
                  </p>
                </div>
                {selectedCase.completedAt && (
                  <div>
                    <p className="text-slate-500">Resolvido em</p>
                    <p className="font-semibold text-slate-900">
                      {formatDate(selectedCase.completedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
