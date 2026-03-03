import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, LogOut, Plus, User, CheckCircle, Bell, Eye } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

type NotificationOptions = {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
};

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

export default function OperatorDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [name, setName] = useState("");
  const [pa, setPa] = useState("");
  const [operatorId, setOperatorId] = useState<number | null>(null);
  const [operatorName, setOperatorName] = useState("");
  const [operatorPa, setOperatorPa] = useState("");
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [, navigate] = useLocation();
  const { notify, requestPermission, permission } = useNotifications();
  const previousCompletedCount = useRef<number | null>(null);
  const previousAttendedCount = useRef<boolean>(false);

  const loginMutation = trpc.operator.login.useMutation({
    onSuccess: (data) => {
      setOperatorId(data.operator.id);
      setOperatorName(data.operator.name);
      setOperatorPa(data.operator.pa);
      setIsLoggedIn(true);
      setShowLoginForm(false);
      setName("");
      setPa("");
      // Salvar sessão no localStorage
      localStorage.setItem("operatorSession", JSON.stringify({
        operatorId: data.operator.id,
        operatorName: data.operator.name,
        operatorPa: data.operator.pa,
      }));
      toast.success(`Bem-vindo, ${data.operator.name}!`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const callMonitorMutation = trpc.operator.callMonitor.useMutation({
    onSuccess: () => {
      toast.success("Monitor chamado! Aguarde...");
      refetchQueue();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao chamar monitor");
    },
  });

  const createCaseMutation = trpc.operator.createCase.useMutation({
    onSuccess: () => {
      toast.success("Caso criado com sucesso!");
      setCaseTitle("");
      setCaseDescription("");
      setShowCaseForm(false);
      refetchCases();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar caso");
    },
  });

  const cancelQueueMutation = trpc.operator.removeFromQueue.useMutation({
    onSuccess: () => {
      toast.success("Chamado cancelado!");
      refetchQueue();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar chamado");
    },
  });

  const updateCaseMutation = trpc.operator.updateCase.useMutation({
    onSuccess: () => {
      toast.success("Caso atualizado com sucesso!");
      setShowEditModal(false);
      setEditingCaseId(null);
      setEditTitle("");
      setEditDescription("");
      refetchCases();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar caso");
    },
  });

  const { data: queue = [], refetch: refetchQueue } = trpc.operator.getQueue.useQuery(undefined, {
    refetchInterval: 2000,
    enabled: isLoggedIn,
  });

  const { data: allCases = [], refetch: refetchCases } = trpc.operator.getAllCases.useQuery(undefined, {
    refetchInterval: 2000,
    enabled: isLoggedIn,
  });

  const myPendingCases = allCases.filter(
    (c: Case) => c.operatorName === operatorName && c.operatorPa === operatorPa && c.status === "pending"
  );

  const myCompletedCases = allCases.filter(
    (c: Case) => c.operatorName === operatorName && c.operatorPa === operatorPa && c.status === "completed"
  );

  const isInQueue = queue.some(
    (q: any) => q.operatorName === operatorName && q.operatorPa === operatorPa
  );

  // Recuperar sessão do localStorage ao carregar a página
  useEffect(() => {
    const savedSession = localStorage.getItem("operatorSession");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setOperatorId(session.operatorId);
        setOperatorName(session.operatorName);
        setOperatorPa(session.operatorPa);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Erro ao recuperar sessão:", error);
        localStorage.removeItem("operatorSession");
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pa.trim()) {
      toast.error("Nome e PA são obrigatórios!");
      return;
    }
    // Validar que PA contém apenas números
    if (!/^[0-9]+$/.test(pa)) {
      toast.error("PA deve conter apenas números!");
      return;
    }
    loginMutation.mutate({ name: name.trim(), pa: pa.trim() });
  };

  const handleCallMonitor = async () => {
    if (!operatorId) return;
    await callMonitorMutation.mutateAsync({
      operatorId,
      operatorName,
      operatorPa,
    });
  };

  const handleCancelQueue = async () => {
    const queueItem = queue.find(
      (q: any) => q.operatorName === operatorName && q.operatorPa === operatorPa
    );
    if (!queueItem) return;
    await cancelQueueMutation.mutateAsync({ queueId: queueItem.id });
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim() || !caseDescription.trim()) {
      toast.error("Titulo e Descricao sao obrigatorios!");
      return;
    }
    if (!operatorId) return;
    createCaseMutation.mutate({
      operatorId,
      operatorName,
      operatorPa,
      title: caseTitle.trim(),
      description: caseDescription.trim(),
    });
    // Notificacao do monitor eh enviada via tRPC
  };

  const handleEditCase = (caseItem: Case) => {
    setEditingCaseId(caseItem.id);
    setEditTitle(caseItem.title);
    setEditDescription(caseItem.description);
    setShowEditModal(true);
  };

  const handleSaveEditCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDescription.trim()) {
      toast.error("Titulo e Descricao sao obrigatorios!");
      return;
    }
    if (!editingCaseId) return;
    await updateCaseMutation.mutateAsync({
      caseId: editingCaseId,
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLoginForm(false);
    setOperatorId(null);
    setOperatorName("");
    setOperatorPa("");
    // Limpar sessão do localStorage
    localStorage.removeItem("operatorSession");
    navigate("/");
  };

  const handleViewCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowCaseModal(true);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("pt-BR");
  };

  // Solicitar permissão de notificação ao fazer login
  useEffect(() => {
    if (isLoggedIn) {
      requestPermission();
    }
  }, [isLoggedIn, requestPermission]);

  // Notificar quando caso é resolvido
  useEffect(() => {
    if (isLoggedIn && permission === 'granted') {
      const completedCount = myCompletedCases.length;
      // Se previousCompletedCount é null, é a primeira vez, então inicializar
      if (previousCompletedCount.current === null) {
        previousCompletedCount.current = completedCount;
      } else if (completedCount > previousCompletedCount.current) {
        // Novo caso resolvido
        const resolvedCase = myCompletedCases[myCompletedCases.length - 1];
        notify('✅ Seu Caso Foi Resolvido!', {
          body: `${resolvedCase.title} - Resolvido por: ${resolvedCase.monitorName}`,
          tag: 'case-resolved',
          requireInteraction: true,
          soundType: 'resolved',
        });
        previousCompletedCount.current = completedCount;
      }
    }
  }, [myCompletedCases, isLoggedIn, permission, notify]);

  // Notificar quando monitor atende o chamado
  useEffect(() => {
    if (isLoggedIn && permission === 'granted') {
      // Verificar se operador foi removido da fila (monitor atendeu)
      const isCurrentlyInQueue = isInQueue;
      if (previousAttendedCount.current && !isCurrentlyInQueue) {
        // Monitor atendeu
        notify('🚀 Monitor Atendendo!', {
          body: 'Um monitor está indo até sua mesa agora.',
          tag: 'attend-notification',
          requireInteraction: true,
          soundType: 'attend',
        });
      }
      previousAttendedCount.current = isCurrentlyInQueue;
    }
  }, [isInQueue, isLoggedIn, permission, notify]);

  if (!isLoggedIn && !showLoginForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <User size={32} className="text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
            Acesso do Operador
          </h1>
          <p className="text-center text-slate-600 mb-6">
            Digite seu nome e PA para acessar
          </p>

          <form onSubmit={(e) => { e.preventDefault(); setShowLoginForm(true); }} className="space-y-4">
            <Button
              type="button"
              onClick={() => setShowLoginForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Entrar como Operador
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (showLoginForm && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">
            Login do Operador
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Nome
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                PA (Posição de Atendimento)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={pa}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setPa(value);
                }}
                placeholder="Ex: 01"
                className="w-full"
                maxLength={10}
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Painel do Operador
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <User size={16} className="text-blue-600" />
              <p className="text-slate-600">
                Conectado como: <span className="font-semibold text-blue-600">{operatorName}</span> - PA: <span className="font-semibold text-blue-600">{operatorPa}</span>
              </p>
            </div>
          </div>
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
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={18} />
            Sair
          </Button>
        </div>

        <div className="space-y-6">
          {/* Call Monitor Section */}
          <Card className="p-6 bg-white shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Chamar Monitor
            </h2>
            <p className="text-slate-600 mb-4">
              Clique no botão abaixo para chamar o monitor até sua mesa.
            </p>
            {isInQueue ? (
              <div className="space-y-3">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-semibold">
                    ⛳ Vocu00ea ju00e1 estu00e1 na fila aguardando atendimento...
                  </p>
                </div>
                <Button
                  onClick={handleCancelQueue}
                  disabled={cancelQueueMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {cancelQueueMutation.isPending ? "Cancelando..." : "Cancelar Chamado"}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleCallMonitor}
                disabled={callMonitorMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {callMonitorMutation.isPending ? "Chamando..." : "Chamar Monitor"}
              </Button>
            )}
          </Card>

          {/* Cases Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                Meus Casos ({myPendingCases.length})
              </h2>
              <Button
                onClick={() => setShowCaseForm(!showCaseForm)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <Plus size={18} />
                Novo Caso
              </Button>
            </div>

            {showCaseForm && (
              <Card className="p-6 bg-white shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Criar Novo Caso
                </h3>
                <form onSubmit={handleCreateCase} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Título
                    </label>
                    <Input
                      type="text"
                      value={caseTitle}
                      onChange={(e) => setCaseTitle(e.target.value)}
                      placeholder="Ex: Erro Sistêmico"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={caseDescription}
                      onChange={(e) => setCaseDescription(e.target.value)}
                      placeholder="Descreva o problema em detalhes..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => setShowCaseForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCaseMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      {createCaseMutation.isPending ? "Criando..." : "Criar Caso"}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Pending Cases Grid */}
            {myPendingCases.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Casos Pendentes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myPendingCases.map((caseItem: Case) => (
                    <Card
                      key={caseItem.id}
                      className={`p-4 border-l-4 shadow-md ${
                        caseItem.monitorName
                          ? "bg-gradient-to-br from-green-50 to-green-100 border-green-400"
                          : "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400"
                      }`}
                    >
                      <h4 className="font-bold text-slate-900 mb-2">
                        {caseItem.title}
                      </h4>
                      <p className="text-sm text-slate-700 mb-3 line-clamp-2">
                        {caseItem.description}
                      </p>
                      {caseItem.monitorName && (
                        <div className="p-2 bg-white bg-opacity-60 rounded mb-3">
                          <p className="text-xs font-semibold text-green-700">
                            ✓ Monitor verificando: {caseItem.monitorName}
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleEditCase(caseItem)}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 flex items-center justify-center gap-2"
                        >
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleViewCase(caseItem)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 flex items-center justify-center gap-2"
                        >
                          <Eye size={16} />
                          Ver Caso
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Cases Section */}
            {myCompletedCases.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={20} className="text-blue-600" />
                  Casos Resolvidos ({myCompletedCases.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myCompletedCases.map((caseItem: Case) => (
                    <Card
                      key={caseItem.id}
                      className="p-4 border-l-4 border-blue-400 shadow-md bg-gradient-to-br from-blue-50 to-blue-100"
                    >
                      <h4 className="font-bold text-slate-900 mb-2">
                        {caseItem.title}
                      </h4>
                      <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                        {caseItem.description}
                      </p>
                      <div className="p-2 bg-white bg-opacity-60 rounded mb-3">
                        <p className="text-xs font-semibold text-slate-700 mb-1">
                          Resolvido por: {caseItem.monitorName}
                        </p>
                        {caseItem.resolution && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">
                              Resolução:
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {caseItem.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        {caseItem.completedAt && new Date(caseItem.completedAt).toLocaleString("pt-BR")}
                      </p>
                      <Button
                        onClick={() => handleViewCase(caseItem)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        Ver Caso
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {myPendingCases.length === 0 && myCompletedCases.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">
                  Você ainda não criou nenhum caso.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edicao de Caso */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Editar Caso
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditCase} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Titulo
              </label>
              <Input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ex: Erro Sistemico"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Descricao
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Descreva o problema em detalhes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setShowEditModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateCaseMutation.isPending}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {updateCaseMutation.isPending ? "Atualizando..." : "Atualizar Caso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualizacao de Caso */}
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
                <h3 className="font-semibold text-slate-900 mb-2">Descrição</h3>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {selectedCase.description}
                </p>
              </div>

              {selectedCase.monitorName && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-700">
                    ✓ Monitor Responsável: {selectedCase.monitorName}
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
