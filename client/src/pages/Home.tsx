import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Users, Monitor, LogIn } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Sistema SupPaciente
          </h1>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Operator Card */}
          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <Users size={48} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">
              Operador
            </h2>
            <p className="text-slate-600 text-center mb-6">
              Acesse como operador para chamar o monitor e criar casos
            </p>
            <Button
              onClick={() => navigate("/operator-login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Entrar como Operador
            </Button>
          </div>

          {/* Monitor Card */}
          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <Monitor size={48} className="text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">
              Monitor
            </h2>
            <p className="text-slate-600 text-center mb-6">
              Acesse como monitor para gerenciar a fila e casos
            </p>
            <Button
              onClick={() => navigate("/monitor")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Entrar como Monitor
            </Button>
          </div>
        </div>


      </div>
    </div>
  );
}
