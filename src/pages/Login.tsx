import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoJimua from "@/assets/logo-jimua.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // TODO: integrate with Supabase auth
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Login efectuado", description: "Bem-vindo ao sistema JIMUA" });
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-primary to-navy-light opacity-90" />
      
      <Card className="relative z-10 w-full max-w-md border-0 shadow-2xl animate-fade-in">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <img src={logoJimua} alt="JIMUA" className="h-24 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Sistema Estatístico
          </h1>
          <p className="text-sm text-muted-foreground">
            Juventude da Igreja Metodista Unida de Angola
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@jimua.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-navy-dark text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} />
                  Entrar
                </span>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Acesso restrito. Contacte o Secretário Distrital para obter credenciais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
