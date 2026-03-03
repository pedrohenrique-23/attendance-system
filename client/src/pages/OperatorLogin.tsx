import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function OperatorLogin() {
  const [name, setName] = useState("");
  const [pa, setPa] = useState("");
  const [, navigate] = useLocation();

  const loginMutation = trpc.operator.login.useMutation({
    onSuccess: (data) => {
      // Armazenar operador no localStorage para persistência entre páginas
      localStorage.setItem("operatorSession", JSON.stringify({
        operatorId: data.operator.id,
        operatorName: data.operator.name,
        operatorPa: data.operator.pa,
      }));
      toast.success("Login realizado com sucesso!");
      navigate("/operator");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pa.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    // Validar que PA contém apenas números
    if (!/^[0-9]+$/.test(pa)) {
      toast.error("PA deve conter apenas números!");
      return;
    }
    loginMutation.mutate({ name: name.trim(), pa: pa.trim() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Sistema de Atendimento
          </h1>
          <p className="text-slate-600">Login do Operador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nome
            </label>
            <Input
              type="text"
              placeholder="Digite seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loginMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              PA (Posição de Atendimento)
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Ex: 01"
              value={pa}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setPa(value);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loginMutation.isPending}
              maxLength={10}
            />
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            Acesso exclusivo para operadores.<br />
            Monitores acessem{" "}
            <button
              onClick={() => navigate("/monitor")}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              aqui
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
