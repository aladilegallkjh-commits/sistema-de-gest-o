import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await refresh();
      setLocation("/");
    },
    onError: (err) => {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    registerMutation.mutate({ name, username, password });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0f0f0f] p-4">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-zinc-700/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-zinc-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/logo.png"
            alt="Multiply Engineering"
            className="h-14 w-auto object-contain"
            style={{ mixBlendMode: "screen" }}
          />
        </div>

        <Card className="border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-2 pb-4 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-zinc-800 shadow-lg shadow-black/40 mb-2">
              <UserPlus className="h-6 w-6 text-zinc-100" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Criar sua conta
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Preencha os dados abaixo para começar
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300 font-medium text-sm">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-300 font-medium text-sm">
                  Usuário
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Seu nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300 font-medium text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-white/10 bg-white/5 pr-10 text-white placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">Mínimo de 6 caracteres</p>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-4 pb-8 pt-2">
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-zinc-100 text-zinc-900 font-semibold hover:bg-white transition-all hover:shadow-lg hover:shadow-white/10"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                Criar conta
              </Button>

              <p className="text-sm text-zinc-500 text-center">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-zinc-300 font-semibold hover:text-white transition-colors underline underline-offset-4"
                >
                  Fazer login
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
