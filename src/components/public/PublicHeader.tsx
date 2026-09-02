import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoJimua from "@/assets/logo-jimua.png";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/publico/estatisticas", label: "Estatísticas" },
  { to: "/sobre", label: "Sobre a Plataforma" },
];

const PublicHeader = () => {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Link to="/" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <img
            src={logoJimua}
            alt="Logótipo da Organização de Jovens da Igreja Metodista Unida"
            className="h-11 w-auto sm:h-12"
          />
          <span className="leading-tight">
            <span className="block font-display text-sm sm:text-base font-bold text-foreground tracking-tight">Igreja Metodista Unida</span>
            <span className="block text-xs sm:text-sm text-muted-foreground">Conferência Anual do Oeste de Angola</span>
            <span className="block text-xs sm:text-sm text-primary font-semibold">Organização de Jovens Regulares</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label="Navegação pública" className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={pathname === item.to ? "page" : undefined}
                className={`rounded-md px-2.5 py-2 text-sm font-medium min-h-11 inline-flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  pathname === item.to ? "text-primary underline underline-offset-4" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button asChild size="sm" className="font-semibold min-h-11">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
