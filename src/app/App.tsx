import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Search, X, Plus, Grid, List } from "lucide-react";
import { useData } from "../lib/useData";
import type { Project, Fragment, ResearchQuestion, Text, ProjectStatus, FragmentType, JournalEntry, SiteSettings } from "../lib/api";

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_ORDER: ProjectStatus[] = [
  "intuition","documentation","recherche","expérimentation","production","en pause","terminé",
];

const STATUS_PROGRESS: Record<ProjectStatus, number> = {
  intuition: 8, documentation: 22, recherche: 38, expérimentation: 55,
  production: 72, "en pause": 45, terminé: 100,
};

const CONSTELLATION_THEME_NODES = [
  { id: "corps",       label: "Corps",       x: 110, y: 95,  r: 8 },
  { id: "surréalisme", label: "Surréalisme", x: 355, y: 45,  r: 8 },
  { id: "images",      label: "Images",      x: 635, y: 95,  r: 8 },
  { id: "matière",     label: "Matière",     x: 685, y: 295, r: 9 },
  { id: "systèmes",    label: "Systèmes",    x: 565, y: 435, r: 8 },
  { id: "cultures",    label: "Cultures",    x: 120, y: 430, r: 8 },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function statusColor(status: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    intuition: "text-muted-foreground border-muted-foreground/40",
    documentation: "text-muted-foreground border-muted-foreground/50",
    recherche: "text-foreground border-foreground/40",
    expérimentation: "text-accent border-accent",
    production: "text-accent border-accent bg-accent/10",
    "en pause": "text-muted-foreground border-muted-foreground/30",
    terminé: "text-muted-foreground border-muted-foreground/30",
  };
  return map[status];
}

function journalTypeColor(type: JournalEntry["type"]): string {
  const map: Record<JournalEntry["type"], string> = {
    découverte: "text-green-800", hypothèse: "text-blue-700", expérimentation: "text-accent",
    résultat: "text-foreground", difficulté: "text-orange-700", décision: "text-purple-700",
  };
  return map[type];
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`text-[9px] tracking-[0.18em] uppercase border px-1.5 py-0.5 leading-none ${statusColor(status)}`}>
      {status}
    </span>
  );
}

function FragmentTypeBadge({ type }: { type: FragmentType }) {
  return <span className="text-[9px] tracking-[0.15em] uppercase text-accent font-mono">{type}</span>;
}

// ─── Cursor Image Follower ────────────────────────────────────────────────────

function useCursorImage() {
  const [cursor, setCursor] = useState<{ src: string; x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const onEnter = useCallback((src: string, e: React.MouseEvent) => { setCursor({ src, x: e.clientX, y: e.clientY }); }, []);
  const onMove  = useCallback((src: string, e: React.MouseEvent) => { setCursor({ src, x: e.clientX, y: e.clientY }); }, []);
  const onLeave = useCallback(() => setCursor(null), []);
  const CursorEl = cursor ? (
    <div ref={ref} className="fixed pointer-events-none z-[999]"
      style={{ left: cursor.x + 18, top: cursor.y - 100, width: 280, height: 185,
        transition: "left 0.06s ease-out, top 0.06s ease-out" }}>
      <img src={cursor.src} alt="" className="w-full h-full object-cover shadow-xl" />
    </div>
  ) : null;
  return { onEnter, onMove, onLeave, CursorEl };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="pt-11">
      <div className="px-6 lg:px-16 py-10 border-b border-border">
        <Skeleton className="h-3 w-20 mb-4" />
        <Skeleton className="h-14 w-64 mb-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-r border-b border-border" style={{ height: "42vh" }}>
            <Skeleton className="w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skip link ────────────────────────────────────────────────────────────────

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-foreground focus:text-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:outline-none">
      Passer au contenu principal
    </a>
  );
}

// ─── Focus trap ───────────────────────────────────────────────────────────────

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, onEscape?: () => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(el.querySelectorAll<HTMLElement>(sel));
    focusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onEscape?.(); return; }
      if (e.key !== "Tab") return;
      const els = focusable();
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, []);
}

// ─── Banner mode démonstration ────────────────────────────────────────────────

function FallbackBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background text-[11px] px-5 py-3 flex items-center gap-5 shadow-lg max-w-sm w-full mx-4">
      <span className="flex-1">Mode démonstration — connectez WordPress pour les vraies données.</span>
      <button onClick={onDismiss} aria-label="Fermer la bannière" className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
        <X size={12} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Atelier", page: "atelier" }, { label: "Projets", page: "projets" },
  { label: "Fragments", page: "fragments" }, { label: "Recherches", page: "recherches" },
  { label: "Textes", page: "textes" }, { label: "À propos", page: "a-propos" },
];

function MobileMenu({ page, go, isProject, onClose }: {
  page: string; go: (p: string) => void; isProject: boolean; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, onClose);
  return (
    <div id="mobile-menu" ref={ref} role="dialog" aria-modal="true" aria-label="Menu de navigation"
      className="fixed inset-0 z-40 bg-background pt-12 px-6 flex flex-col justify-center">
      {[...NAV_ITEMS, { label: "Constellation", page: "constellation" }].map(item => {
        const active = page === item.page || (item.page === "projets" && isProject);
        return (
          <button key={item.page} onClick={() => go(item.page)}
            aria-current={active ? "page" : undefined}
            className="text-4xl text-left py-5 border-b border-border hover:text-accent transition-colors"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function Nav({ page, navigate, filCount, onSearchOpen, onFilOpen }: {
  page: string; navigate: (p: string) => void;
  filCount: number; onSearchOpen: () => void; onFilOpen: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (p: string) => { navigate(p); setMenuOpen(false); };
  const isProject = page.startsWith("projet/");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 lg:px-12 h-12">
          <button onClick={() => go("atelier")} aria-label="Mademo studio — accueil"
            aria-current={page === "atelier" ? "page" : undefined}
            className="text-base leading-none text-foreground hover:text-accent transition-colors"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
            <span aria-hidden="true">Mademo studio</span>
          </button>
          <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-7">
            {NAV_ITEMS.map(item => {
              const active = page === item.page || (item.page === "projets" && isProject);
              return (
                <button key={item.page} onClick={() => go(item.page)}
                  aria-current={active ? "page" : undefined}
                  className={`text-[11px] tracking-wide transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {item.label}
                </button>
              );
            })}
            <button onClick={() => go("constellation")}
              aria-current={page === "constellation" ? "page" : undefined}
              className={`text-[11px] tracking-wide transition-colors ${page === "constellation" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Constellation
            </button>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={onSearchOpen} aria-label="Ouvrir la recherche" className="text-muted-foreground hover:text-foreground transition-colors">
              <Search size={14} aria-hidden="true" />
            </button>
            {filCount > 0 && (
              <button onClick={onFilOpen}
                aria-label={`Ouvrir le fil de recherche, ${filCount} élément${filCount > 1 ? "s" : ""}`}
                className="text-[10px] text-accent border border-accent px-2 py-0.5 hover:bg-accent hover:text-accent-foreground transition-colors">
                <span aria-hidden="true">Fil ({filCount})</span>
              </button>
            )}
            <button aria-label="Ajouter un fragment" className="text-muted-foreground hover:text-foreground transition-colors border border-muted-foreground hover:border-foreground p-0.5">
              <Plus size={12} aria-hidden="true" />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Fermer le menu de navigation" : "Ouvrir le menu de navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors text-[11px]">
              <span aria-hidden="true">{menuOpen ? "×" : "Menu"}</span>
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <MobileMenu page={page} go={go} isProject={isProject} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────

function SearchModal({ onClose, navigate, projects, fragments, texts }: {
  onClose: () => void; navigate: (p: string) => void;
  projects: Project[]; fragments: Fragment[]; texts: Text[];
}) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  const q = query.toLowerCase();
  const results = query.length > 1 ? [
    ...projects.filter(p => p.title.toLowerCase().includes(q) || p.question.toLowerCase().includes(q))
      .map(p => ({ type: "projet" as const, id: `projet/${p.id}`, label: p.title, sub: p.question })),
    ...fragments.filter(f => f.title.toLowerCase().includes(q))
      .map(f => ({ type: "fragment" as const, id: "fragments", label: `${f.number} — ${f.title}`, sub: f.type })),
    ...texts.filter(t => t.title.toLowerCase().includes(q))
      .map(t => ({ type: "texte" as const, id: "textes", label: t.title, sub: t.type })),
  ] : [];

  return (
    <div
      className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Recherche"
        className="bg-background border border-border w-full max-w-xl">
        <div className="flex items-center border-b border-border px-5">
          <Search size={14} className="opacity-40 shrink-0" aria-hidden="true" />
          <label htmlFor="search-input" className="sr-only">Rechercher un projet, fragment ou texte</label>
          <input
            id="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Chercher un projet, fragment, texte…"
            className="flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground" />
          <button onClick={onClose} aria-label="Fermer la recherche" className="opacity-40 hover:opacity-80 transition-opacity">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
        {results.length > 0 && (
          <ul aria-label="Résultats de recherche" className="max-h-72 overflow-y-auto">
            {results.map((r, i) => (
              <li key={i}>
                <button onClick={() => { navigate(r.id); onClose(); }}
                  className="w-full text-left flex items-start gap-5 px-5 py-3 border-b border-border hover:bg-card transition-colors">
                  <span className="text-[9px] tracking-widest uppercase text-accent font-mono w-12 shrink-0 mt-0.5" aria-hidden="true">{r.type}</span>
                  <div>
                    <p className="text-sm">{r.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="sr-only">{r.type} — </span>{r.sub}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.length > 1 && results.length === 0 && (
          <p role="status" className="px-5 py-5 text-sm text-muted-foreground">Aucun résultat pour « {query} »</p>
        )}
      </div>
    </div>
  );
}

// ─── Fil de recherche ─────────────────────────────────────────────────────────

function FilDeRecherche({ items, onClose, onRemove, navigate, projects, fragments }: {
  items: string[]; onClose: () => void; onRemove: (id: string) => void;
  navigate: (p: string) => void; projects: Project[]; fragments: Fragment[];
}) {
  const myProjects  = projects.filter(p => items.includes(p.id));
  const myFragments = fragments.filter(f => items.includes(f.id));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Fil de recherche"
      className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-background border-l border-border flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <p className="text-xs tracking-widest uppercase" id="fil-title">Fil de recherche</p>
        <button onClick={onClose} aria-label="Fermer le fil de recherche" className="opacity-40 hover:opacity-80 transition-opacity">
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && <p className="px-6 py-8 text-sm text-muted-foreground leading-relaxed">Ajoutez des projets ou fragments à votre fil.</p>}
        {myProjects.map(p => (
          <div key={p.id} className="border-b border-border">
            <div className="h-28 overflow-hidden bg-muted">
              {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] tracking-widest uppercase text-accent mb-1" aria-hidden="true">projet</p>
                  <p className="text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.question}</p>
                </div>
                <button onClick={() => onRemove(p.id)} aria-label={`Retirer ${p.title} du fil`} className="opacity-30 hover:opacity-70 transition-opacity shrink-0">
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
              <button onClick={() => navigate(`projet/${p.id}`)} className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mt-2">
                Ouvrir<span className="sr-only"> le projet {p.title}</span>
                <span aria-hidden="true"> →</span>
              </button>
            </div>
          </div>
        ))}
        {myFragments.map(f => (
          <div key={f.id} className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] tracking-widest uppercase text-accent mb-1" aria-hidden="true">{f.number}</p>
                <p className="text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{f.content}</p>
              </div>
              <button onClick={() => onRemove(f.id)} aria-label={`Retirer ${f.title} du fil`} className="opacity-30 hover:opacity-70 transition-opacity shrink-0">
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="border-t border-border px-6 py-5">
          <p className="text-xs text-muted-foreground" role="status">{items.length} éléments dans le fil.</p>
        </div>
      )}
    </div>
  );
}

// ─── Page: Atelier ────────────────────────────────────────────────────────────

function PageAtelier({ navigate, addToFil, projects, fragments, research }: {
  navigate: (p: string) => void; addToFil: (id: string) => void;
  projects: Project[]; fragments: Fragment[]; research: ResearchQuestion[];
}) {
  const active   = projects.filter(p => p.status !== "terminé" && p.status !== "en pause");
  const featured = active[0];
  const rest     = active.slice(1);
  const recent   = fragments.slice(0, 4);

  if (!featured) return null;

  return (
    <div className="pt-12 min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden cursor-pointer group" style={{ height: "90vh" }}
        onClick={() => navigate(`projet/${featured.id}`)}>
        {featured.image && (
          <img src={featured.image} alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.4s] ease-out" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

        {/* Masthead top */}
        <div className="absolute top-0 left-0 right-0 px-8 lg:px-16 pt-8 flex items-start justify-between">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-white/40 mb-2" aria-hidden="true">L'atelier vivant</p>
            <p className="text-4xl lg:text-6xl font-light text-white leading-none"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
              Mademo studio
            </p>
          </div>
          <p className="text-[9px] tracking-widest uppercase text-white/35 hidden lg:block leading-relaxed text-right" aria-hidden="true">
            Artiste<br />Designer<br />Photographe<br />Autrice
          </p>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-8 lg:px-16 pb-14">
          <div className="flex items-end justify-between gap-8">
            <div className="max-w-2xl">
              <StatusBadge status={featured.status} />
              <h1 className="text-4xl lg:text-7xl font-light text-white mt-4 mb-4 leading-[0.95]">{featured.title}</h1>
              <p className="text-white/75 text-xl lg:text-2xl leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
                {featured.manifeste}
              </p>
            </div>
            <div className="hidden lg:block shrink-0 text-right pb-1" aria-hidden="true">
              <p className="text-white/40 text-xs mb-1.5">{featured.fragmentCount} fragments</p>
              <p className="text-white/40 text-xs">{featured.lastUpdated}</p>
              <div className="flex items-center gap-2 mt-4 justify-end">
                <div className="w-28 h-px bg-white/20 relative">
                  <div className="absolute left-0 top-0 h-px bg-white" style={{ width: `${STATUS_PROGRESS[featured.status]}%` }} />
                </div>
                <span className="text-[9px] text-white/40">{STATUS_PROGRESS[featured.status]}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* En ce moment */}
      <div className="border-b border-border">
        <div className="px-8 lg:px-16 pt-14 pb-6 flex items-end justify-between">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">En ce moment</p>
            <p className="text-2xl lg:text-4xl font-light text-foreground/60"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
              {active.length} projets actifs
            </p>
          </div>
          <button onClick={() => navigate("projets")} className="text-[9px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors pb-1">
            Tout voir →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-border">
          {rest.map(project => (
            <div key={project.id} className="relative border-r border-b border-border overflow-hidden cursor-pointer group"
              style={{ height: "48vh" }} onClick={() => navigate(`projet/${project.id}`)}>
              {project.image && (
                <img src={project.image} alt={project.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s] ease-out" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/35 transition-colors duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <StatusBadge status={project.status} />
                  <span className="text-[9px] text-white/45" aria-hidden="true">{project.year}</span>
                </div>
                <p className="text-white text-xl lg:text-2xl font-light leading-snug">{project.title}</p>
                <p className="text-white/75 text-sm leading-relaxed mt-3 max-w-xs opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
                  {project.manifeste}
                </p>
                <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" aria-hidden="true">
                  <div className="flex-1 h-px bg-white/20 relative">
                    <div className="absolute left-0 top-0 h-px bg-white" style={{ width: `${STATUS_PROGRESS[project.status]}%` }} />
                  </div>
                  <span className="text-[9px] text-white/45 tabular-nums">{STATUS_PROGRESS[project.status]}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Derniers fragments */}
      <div className="border-b border-border">
        <div className="px-8 lg:px-16 pt-14 pb-6 flex items-end justify-between">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Derniers fragments</p>
            <p className="text-2xl lg:text-4xl font-light text-foreground/60"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
              {fragments.length} au total
            </p>
          </div>
          <button onClick={() => navigate("fragments")} className="text-[9px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors pb-1">Tout voir →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-border">
          {recent.map(fragment => (
            <div key={fragment.id} className="border-r border-b border-border group overflow-hidden">
              {fragment.image ? (
                <div className="relative overflow-hidden" style={{ height: "220px" }}>
                  <img src={fragment.image} alt={fragment.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors duration-400" />
                  <div className="absolute top-4 left-4 right-4 flex justify-between">
                    <FragmentTypeBadge type={fragment.type} />
                    <span className="text-[9px] text-white/70 font-mono">{fragment.number}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-card flex items-center justify-center border-b border-border" style={{ height: "100px" }}>
                  <span className="text-[10px] font-mono text-muted-foreground">{fragment.number}</span>
                </div>
              )}
              <div className="p-5">
                {!fragment.image && <FragmentTypeBadge type={fragment.type} />}
                <p className="text-sm leading-snug mt-2 mb-2">{fragment.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{fragment.content}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">{fragment.date}</span>
                  <button onClick={() => addToFil(fragment.id)} className="text-[9px] tracking-widest uppercase text-muted-foreground hover:text-accent transition-colors">+ Fil</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question ouverte */}
      {research[0] && (
        <div className="px-8 lg:px-16 py-20 border-b border-border grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-8">Question ouverte</p>
            <p className="text-3xl lg:text-5xl font-light leading-tight text-foreground/80"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
              {research[0].question}
            </p>
            <button onClick={() => navigate("recherches")} className="mt-8 text-[9px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
              Explorer les questions →
            </button>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 border-t border-border lg:border-t-0 lg:border-l lg:border-border pt-8 lg:pt-0 lg:pl-10">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-6">Projets liés</p>
            {research[0].projectIds.map(pid => {
              const p = projects.find(pr => pr.id === pid);
              if (!p) return null;
              return (
                <button key={pid} onClick={() => navigate(`projet/${pid}`)}
                  className="w-full text-left py-4 border-b border-border flex items-center justify-between group">
                  <span className="text-sm group-hover:text-accent transition-colors">{p.title}</span>
                  <StatusBadge status={p.status} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-8 lg:px-16 py-6 flex items-center justify-between border-t border-border">
        <span className="text-[9px] text-muted-foreground">© Mademo studio, 2025</span>
        <div className="flex gap-6">
          {["Instagram", "Vimeo", "Mail"].map(s => (
            <button key={s} className="text-[9px] text-muted-foreground hover:text-foreground transition-colors">{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page: Projets ────────────────────────────────────────────────────────────

function PageProjets({ navigate, addToFil, projects }: {
  navigate: (p: string) => void; addToFil: (id: string) => void; projects: Project[];
}) {
  const [filter, setFilter] = useState<ProjectStatus | null>(null);
  const visible = filter ? projects.filter(p => p.status === filter) : projects;
  const { onEnter, onMove, onLeave, CursorEl } = useCursorImage();

  return (
    <div className="pt-12 min-h-screen">
      {CursorEl}
      <div className="px-8 lg:px-16 pt-16 pb-10 border-b border-border">
        <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Index</p>
        <h1 className="text-5xl lg:text-8xl font-light leading-none mb-10"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
          Projets
        </h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter(null)}
            className={`text-[9px] tracking-widest uppercase px-2.5 py-1 border transition-colors ${!filter ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
            Tous
          </button>
          {STATUS_ORDER.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-[9px] tracking-widest uppercase px-2.5 py-1 border transition-colors ${filter === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-border">
        {visible.map((project, i) => (
          <div key={project.id} className="relative border-r border-b border-border overflow-hidden cursor-pointer group"
            style={{ height: "55vh" }} onClick={() => navigate(`projet/${project.id}`)}
            onMouseEnter={project.image ? e => onEnter(project.image, e) : undefined}
            onMouseMove={project.image ? e => onMove(project.image, e) : undefined}
            onMouseLeave={project.image ? onLeave : undefined}>
            {project.image && (
              <img src={project.image} alt={project.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s] ease-out" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-500" />
            <div className="absolute top-5 left-6">
              <span className="text-[9px] font-mono text-white/35">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-7">
              <StatusBadge status={project.status} />
              <h3 className="text-2xl lg:text-3xl font-light text-white mt-3 mb-2 leading-tight">{project.title}</h3>
              <p className="text-white/0 group-hover:text-white/70 text-sm leading-relaxed transition-colors duration-400 line-clamp-2"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
                {project.manifeste}
              </p>
              <div className="flex items-center justify-between mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="flex flex-wrap gap-1">
                  {project.themes.slice(0, 3).map(t => (
                    <span key={t} className="text-[9px] text-white/45 border border-white/20 px-1 py-0.5">{t}</span>
                  ))}
                </div>
                <button onClick={e => { e.stopPropagation(); addToFil(project.id); }}
                  className="text-[9px] tracking-widest uppercase text-white/45 hover:text-white transition-colors">+ Fil</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page: Projet Détail ──────────────────────────────────────────────────────

type ProjectTab = "maintenant" | "journal" | "atlas" | "recherche" | "connexions" | "synthèse";

function PageProjetDetail({ project, navigate, addToFil, projects, fragments }: {
  project: Project; navigate: (p: string) => void; addToFil: (id: string) => void;
  projects: Project[]; fragments: Fragment[];
}) {
  const [tab, setTab] = useState<ProjectTab>("maintenant");
  const projectFragments = fragments.filter(f => f.projectIds.includes(project.id));
  const idx     = projects.findIndex(p => p.id === project.id);
  const next    = projects[(idx + 1) % projects.length];
  const related = projects.filter(p => p.id !== project.id && p.themes.some(t => project.themes.includes(t))).slice(0, 3);
  const { onEnter, onMove, onLeave, CursorEl } = useCursorImage();

  const TABS: { id: ProjectTab; label: string }[] = [
    { id: "maintenant", label: "Maintenant" }, { id: "journal", label: "Journal" },
    { id: "atlas", label: "Atlas" }, { id: "recherche", label: "Recherche" },
    { id: "connexions", label: "Connexions" }, { id: "synthèse", label: "Synthèse" },
  ];

  return (
    <div className="pt-12 min-h-screen">
      {CursorEl}
      <div className="px-6 lg:px-12 py-3.5 border-b border-border flex items-center justify-between">
        <button onClick={() => navigate("projets")} className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">← Projets</button>
        <div className="flex items-center gap-4">
          <StatusBadge status={project.status} />
          <span className="text-[10px] text-muted-foreground">{project.year}</span>
          <button onClick={() => addToFil(project.id)} className="text-[10px] tracking-widest uppercase text-muted-foreground hover:text-accent transition-colors">+ Fil</button>
        </div>
      </div>

      <div className="relative overflow-hidden group" style={{ height: "78vh" }}>
        {project.image && (
          <img src={project.image} alt={project.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        <div className="absolute bottom-0 left-0 right-0 px-8 lg:px-16 pb-14">
          <h1 className="text-5xl lg:text-8xl font-light text-white leading-none mb-5"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontOpticalSizing: "auto" }}>
            {project.title}
          </h1>
          <p className="text-white/70 text-xl lg:text-2xl leading-relaxed max-w-2xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
            {project.manifeste}
          </p>
        </div>
      </div>

      <div className="px-8 lg:px-16 py-10 border-b border-border grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Question centrale</p>
          <p className="text-lg lg:text-xl leading-relaxed"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
            {project.question}
          </p>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <div className="flex flex-wrap gap-1 mb-4">
            {project.themes.map(t => (
              <span key={t} className="text-[9px] border border-border px-1.5 py-0.5 text-muted-foreground">{t}</span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{project.fragmentCount} fragments · {project.lastUpdated}</p>
        </div>
      </div>

      <div className="border-b border-border overflow-x-auto">
        <div className="flex px-6 lg:px-12">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-[11px] tracking-wide px-5 py-4 border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {tab === "maintenant" && (
          <div className="px-8 lg:px-16 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
            {[
              { label: "Ce que je cherche",       value: project.maintenant.cherche },
              { label: "Dernière avancée",         value: project.maintenant.avancee },
              ...(project.maintenant.bloque ? [{ label: "Ce qui bloque", value: project.maintenant.bloque }] : []),
              { label: "Prochaine étape",          value: project.maintenant.prochaine },
              { label: "Question encore ouverte",  value: project.maintenant.question },
            ].map((item, i) => (
              <div key={i} className="border-b border-border pb-8">
                <p className="text-[11px] tracking-[0.2em] uppercase text-accent mb-3">{item.label}</p>
                <p className="text-base leading-relaxed"
                  style={i === 4 ? { fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 } : {}}>
                  {item.value}
                </p>
              </div>
            ))}
            <div className="border-b border-border pb-8">
              <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Progression</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-px bg-border relative">
                  <div className="absolute left-0 top-0 h-px bg-accent" style={{ width: `${STATUS_PROGRESS[project.status]}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{STATUS_PROGRESS[project.status]}%</span>
                <StatusBadge status={project.status} />
              </div>
            </div>
          </div>
        )}

        {tab === "journal" && (
          <div className="px-8 lg:px-16 py-12 max-w-2xl">
            {project.journal.length === 0
              ? <p className="text-sm text-muted-foreground">Aucune entrée de journal.</p>
              : project.journal.map((entry, i) => (
                <div key={i} className="border-b border-border py-8 grid grid-cols-12 gap-5">
                  <div className="col-span-3">
                    <p className="text-[10px] text-muted-foreground">{entry.date}</p>
                    <p className={`text-[9px] tracking-widest uppercase mt-1 ${journalTypeColor(entry.type)}`}>{entry.type}</p>
                  </div>
                  <div className="col-span-9">
                    <p className="text-sm font-medium mb-2">{entry.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.content}</p>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "atlas" && (
          <div className="px-8 lg:px-16 py-12">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="col-span-2 overflow-hidden bg-muted" style={{ height: "55vh" }}>
                {project.image && <img src={project.image} alt={project.title} className="w-full h-full object-cover" />}
              </div>
              {projectFragments.filter(f => f.image).map(f => (
                <div key={f.id} className="overflow-hidden bg-muted" style={{ height: "55vh" }}>
                  <img src={f.image} alt={f.title} className="w-full h-full object-cover" />
                </div>
              ))}
              {projectFragments.filter(f => !f.image).slice(0, 4).map(f => (
                <div key={f.id} className="bg-card border border-border p-6 flex flex-col justify-between" style={{ height: "28vh" }}>
                  <FragmentTypeBadge type={f.type} />
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">{f.number}</p>
                    <p className="text-sm leading-snug">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{f.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "recherche" && (
          <div className="px-8 lg:px-16 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-6">Références</p>
              {project.references.length === 0
                ? <p className="text-sm text-muted-foreground">Aucune référence.</p>
                : project.references.map((ref, i) => (
                  <div key={i} className="py-4 border-b border-border">
                    <p className="text-sm">{ref.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ref.author}, {ref.year}</p>
                  </div>
                ))
              }
            </div>
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-6">Fragments de recherche</p>
              {projectFragments.filter(f => ["hypothèse","question","référence"].includes(f.type)).map(f => (
                <div key={f.id} className="py-4 border-b border-border">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[9px] font-mono text-muted-foreground">{f.number}</span>
                    <FragmentTypeBadge type={f.type} />
                  </div>
                  <p className="text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "connexions" && (
          <div className="px-8 lg:px-16 py-12">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-8">Projets liés par thème</p>
            <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-border">
              {related.map(p => (
                <div key={p.id} className="relative border-r border-b border-border overflow-hidden cursor-pointer group"
                  style={{ height: "42vh" }} onClick={() => navigate(`projet/${p.id}`)}
                  onMouseEnter={p.image ? e => onEnter(p.image, e) : undefined}
                  onMouseMove={p.image ? e => onMove(p.image, e) : undefined}
                  onMouseLeave={onLeave}>
                  {p.image && <img src={p.image} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <StatusBadge status={p.status} />
                    <p className="text-white text-lg mt-3 mb-2">{p.title}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.themes.filter(t => project.themes.includes(t)).map(t => (
                        <span key={t} className="text-[9px] text-white/55 border border-white/25 px-1 py-0.5">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "synthèse" && (
          <div className="px-8 lg:px-16 py-12 max-w-2xl">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-8">Version dossier</p>
            {[
              { label: "Présentation",  value: project.description },
              { label: "Intention",     value: project.manifeste },
              { label: "Médiums",       value: project.tags.join(", ") },
              { label: "Avancement",    value: `${project.status} — ${STATUS_PROGRESS[project.status]}%` },
              { label: "Mise à jour",   value: project.lastUpdated },
              { label: "Collaborations",value: project.status === "terminé" ? "Projet terminé." : "Résidences, productions, co-créations." },
            ].map(item => (
              <div key={item.label} className="border-b border-border pb-7 mb-7">
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">{item.label}</p>
                <p className="text-sm leading-relaxed">{item.value}</p>
              </div>
            ))}
            <button onClick={() => navigate("contact")} className="text-[9px] tracking-widest uppercase hover:text-accent transition-colors">Prendre contact →</button>
          </div>
        )}
      </motion.div>

      {next && (
        <div className="relative overflow-hidden cursor-pointer group border-t border-border" style={{ height: "32vh" }}
          onClick={() => navigate(`projet/${next.id}`)}>
          {next.image && <img src={next.image} alt={next.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
          <div className="absolute inset-0 bg-foreground/50 group-hover:bg-foreground/40 transition-colors duration-400" />
          <div className="absolute inset-0 flex items-center justify-between px-8 lg:px-16">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/45 mb-3">Projet suivant</p>
              <p className="text-3xl lg:text-5xl font-light text-white">{next.title}</p>
            </div>
            <span className="text-white/50 text-4xl">→</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page: Fragments ──────────────────────────────────────────────────────────

function PageFragments({ addToFil, fragments, projects }: {
  addToFil: (id: string) => void; fragments: Fragment[]; projects: Project[];
}) {
  const [filterType, setFilterType] = useState<FragmentType | null>(null);
  const [selected, setSelected]     = useState<Fragment | null>(null);
  const [view, setView]             = useState<"grid" | "list">("grid");
  const types   = [...new Set(fragments.map(f => f.type))] as FragmentType[];
  const visible = filterType ? fragments.filter(f => f.type === filterType) : fragments;

  return (
    <div className="pt-12 min-h-screen flex">
      <div className={`flex-1 transition-all duration-300 ${selected ? "lg:mr-96" : ""}`}>
        <div className="px-8 lg:px-16 pt-16 pb-10 border-b border-border">
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Système</p>
          <h1 className="text-5xl lg:text-8xl font-light leading-none mb-10"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
            Fragments
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 mr-2">
              {(["grid","list"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`p-1.5 transition-opacity ${view === v ? "opacity-100" : "opacity-30 hover:opacity-60"}`}>
                  {v === "grid" ? <Grid size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>
            <button onClick={() => setFilterType(null)}
              className={`text-[9px] tracking-widest uppercase px-2.5 py-1 border transition-colors ${!filterType ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
              Tout
            </button>
            {types.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`text-[9px] tracking-widest uppercase px-2.5 py-1 border transition-colors ${filterType === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-border">
            {visible.map(f => (
              <button key={f.id} onClick={() => setSelected(selected?.id === f.id ? null : f)}
                className={`border-r border-b border-border text-left group overflow-hidden ${selected?.id === f.id ? "bg-card" : "hover:bg-card"} transition-colors`}>
                {f.image ? (
                  <div className="relative overflow-hidden" style={{ height: "240px" }}>
                    <img src={f.image} alt={f.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/25 transition-colors duration-400" />
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                      <FragmentTypeBadge type={f.type} />
                      <span className="text-[9px] font-mono text-white/70">{f.number}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-400">
                      <p className="text-white text-sm leading-snug">{f.title}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 flex items-center justify-center border-b border-border" style={{ height: "100px" }}>
                    <span className="text-[10px] font-mono text-muted-foreground">{f.number}</span>
                  </div>
                )}
                <div className="p-5">
                  {!f.image && (
                    <div className="flex items-center justify-between mb-2">
                      <FragmentTypeBadge type={f.type} />
                      <span className="text-[9px] font-mono text-muted-foreground">{f.number}</span>
                    </div>
                  )}
                  <p className="text-sm leading-snug mb-2">{f.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{f.content}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">{f.date}</span>
                    <span className="text-[9px] tracking-widest uppercase text-muted-foreground border border-border px-1 py-0.5">{f.status}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="border-t border-border">
            {visible.map(f => (
              <button key={f.id} onClick={() => setSelected(selected?.id === f.id ? null : f)}
                className={`w-full text-left border-b border-border ${selected?.id === f.id ? "bg-card" : "hover:bg-card"} transition-colors`}>
                <div className="hidden md:grid gap-x-6 px-8 lg:px-16 py-4 items-center"
                  style={{ gridTemplateColumns: "5rem 8rem 1fr 2fr auto" }}>
                  <span className="text-[9px] font-mono text-muted-foreground">{f.number}</span>
                  <FragmentTypeBadge type={f.type} />
                  <span className="text-sm">{f.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{f.content}</span>
                  <span className="text-[9px] text-muted-foreground">{f.date}</span>
                </div>
                <div className="md:hidden px-6 py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">{f.title}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{f.number}</span>
                  </div>
                  <FragmentTypeBadge type={f.type} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="hidden lg:flex fixed right-0 top-12 bottom-0 w-96 bg-background border-l border-border flex-col z-30">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-muted-foreground">{selected.number}</span>
              <FragmentTypeBadge type={selected.type} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => addToFil(selected.id)} className="text-[9px] tracking-widest uppercase text-muted-foreground hover:text-accent transition-colors">+ Fil</button>
              <button onClick={() => setSelected(null)} className="opacity-40 hover:opacity-80 transition-opacity"><X size={14} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {selected.image && (
              <div className="w-full overflow-hidden" style={{ height: "280px" }}>
                <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="px-6 py-6">
              <p className="text-xs text-muted-foreground mb-4">{selected.date}</p>
              <h3 className="text-xl mb-4 leading-snug">{selected.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
                {selected.content}
              </p>
              <div className="border-t border-border pt-5 space-y-1 mb-5">
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Projets liés</p>
                {selected.projectIds.map(pid => {
                  const p = projects.find(pr => pr.id === pid);
                  return p ? <p key={pid} className="text-xs">{p.title}</p> : null;
                })}
              </div>
              <div className="flex flex-wrap gap-1">
                {selected.keywords.map(k => (
                  <span key={k} className="text-[9px] border border-border px-1.5 py-0.5 text-muted-foreground">{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page: Constellation ──────────────────────────────────────────────────────

function PageConstellation({ navigate, projects }: { navigate: (p: string) => void; projects: Project[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const projectPosMap = Object.fromEntries(
    projects.filter(p => p.constellation?.x).map(p => [p.id, p.constellation!])
  );

  const edges: { from: string; to: string }[] = [];
  projects.forEach(project => {
    if (!projectPosMap[project.id]) return;
    project.themes.forEach(theme => {
      const themeNode = CONSTELLATION_THEME_NODES.find(n => n.id === theme);
      if (themeNode) edges.push({ from: project.id, to: theme });
    });
  });
  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const shared = projects[i].themes.some(t => projects[j].themes.includes(t));
      if (shared && projectPosMap[projects[i].id] && projectPosMap[projects[j].id]) {
        edges.push({ from: projects[i].id, to: projects[j].id });
      }
    }
  }

  const getPos = (id: string) => projectPosMap[id] ?? CONSTELLATION_THEME_NODES.find(n => n.id === id);
  const hoveredProject = hovered ? projects.find(p => p.id === hovered) : null;

  return (
    <div className="pt-12 min-h-screen">
      <div className="px-8 lg:px-16 pt-16 pb-10 border-b border-border flex items-end justify-between">
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Vue</p>
          <h1 className="text-5xl lg:text-7xl font-light leading-none"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
            Constellation
          </h1>
        </div>
        <p className="text-xs text-muted-foreground pb-1">Survolez · cliquez pour ouvrir</p>
      </div>

      <div className="relative">
        {hoveredProject?.image && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <img src={hoveredProject.image} alt="" className="w-full h-full object-cover opacity-10 transition-opacity duration-500" />
          </div>
        )}
        <svg viewBox="0 0 760 480" className="w-full relative z-10" style={{ maxHeight: "65vh" }}
          role="img" aria-label="Carte de constellation des projets et thèmes de recherche">
          <title>Constellation des projets</title>
          <desc>Graphe interactif reliant les projets aux thèmes de recherche. Naviguez avec la touche Tab pour sélectionner chaque projet.</desc>
          {edges.map((edge, i) => {
            const from = getPos(edge.from);
            const to   = getPos(edge.to);
            if (!from || !to) return null;
            const isHighlighted = hovered && (hovered === edge.from || hovered === edge.to);
            return (
              <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="#0A0A0A"
                strokeOpacity={isHighlighted ? 0.6 : 0.08}
                strokeWidth={isHighlighted ? 1.5 : 1}
                aria-hidden="true" />
            );
          })}
          {CONSTELLATION_THEME_NODES.map(node => {
            const connected = hovered && edges.some(e => (e.from === hovered && e.to === node.id) || (e.to === hovered && e.from === node.id));
            return (
              <g key={node.id} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}
                className="cursor-default" aria-hidden="true">
                <circle cx={node.x} cy={node.y} r={node.r}
                  fill={connected ? "#0A0A0A" : "transparent"}
                  stroke={connected ? "#0A0A0A" : "#999999"}
                  strokeWidth={1} />
                <text x={node.x} y={node.y + node.r + 12} textAnchor="middle" fontSize="9"
                  fill={connected ? "#0A0A0A" : "#555555"}
                  style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
                  {node.label}
                </text>
              </g>
            );
          })}
          {projects.map(project => {
            const node = projectPosMap[project.id];
            if (!node) return null;
            const isHov  = hovered === project.id;
            const isConn = hovered && edges.some(e => (e.from === hovered && e.to === project.id) || (e.to === hovered && e.from === project.id));
            return (
              <g key={project.id}
                role="button"
                tabIndex={0}
                aria-label={`Ouvrir le projet : ${project.title} — ${project.question}`}
                onMouseEnter={() => setHovered(project.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(project.id)}
                onBlur={() => setHovered(null)}
                onClick={() => navigate(`projet/${project.id}`)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`projet/${project.id}`); } }}
                className="cursor-pointer">
                <circle cx={node.x} cy={node.y} r={node.r + 6} fill="transparent" />
                <circle cx={node.x} cy={node.y} r={node.r}
                  fill={isHov ? "#0A0A0A" : isConn ? "#555555" : "#DEDEDE"}
                  stroke={isHov ? "#0A0A0A" : "#999999"} strokeWidth={1} />
                <text x={node.x} y={node.y + node.r + 14} textAnchor="middle" fontSize="10"
                  fill={isHov ? "#0A0A0A" : "#333333"}
                  style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" }}
                  aria-hidden="true">
                  {project.title.split(" ").slice(0, 2).join(" ")}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredProject && (
          <div className="absolute bottom-6 left-8 lg:left-16 bg-background border border-border p-5 max-w-xs z-20">
            <StatusBadge status={hoveredProject.status} />
            <p className="text-sm mt-3 mb-1">{hoveredProject.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{hoveredProject.question}</p>
          </div>
        )}
      </div>

      <div className="px-8 lg:px-16 py-6 border-t border-border flex flex-wrap gap-8 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-foreground/30 bg-foreground/12" /><span>Projet</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-foreground/25" /><span>Thème</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-px bg-foreground/15" /><span>Connexion</span></div>
      </div>
    </div>
  );
}

// ─── Page: Recherches ─────────────────────────────────────────────────────────

function PageRecherches({ navigate, research, projects }: {
  navigate: (p: string) => void; research: ResearchQuestion[]; projects: Project[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const monade = projects.find(p => p.id === "la-monade");

  return (
    <div className="pt-12 min-h-screen">
      {/* En-tête */}
      <div className="px-8 lg:px-16 pt-16 pb-10 border-b border-border">
        <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Questions</p>
        <h1 className="text-5xl lg:text-8xl font-light leading-none"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
          Recherches
        </h1>
      </div>

      {/* Architecture générale — La Monade */}
      {monade && (
        <div className="px-8 lg:px-16 py-14 border-b border-border bg-card">
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-8">Architecture générale</p>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <h3 className="text-4xl lg:text-6xl font-light leading-[0.9] mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
                La Monade
              </h3>
              <p className="text-base leading-relaxed text-foreground/70 mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
                {monade.question}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">{monade.description}</p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 grid grid-cols-2 gap-8 lg:border-l lg:border-border lg:pl-10">
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Filiations</p>
                <div className="space-y-2">
                  {monade.references.map(r => (
                    <div key={r.title}>
                      <p className="text-xs text-muted-foreground leading-snug">{r.author}</p>
                      <p className="text-[9px] text-muted-foreground/50">{r.year}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Projets liés</p>
                <div className="space-y-2">
                  {projects.filter(p => p.id !== "la-monade").map(p => (
                    <button key={p.id} onClick={() => navigate(`projet/${p.id}`)}
                      className="block text-left text-xs text-muted-foreground hover:text-accent transition-colors leading-snug">
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Six territoires */}
      <div>
        {research.map((rq, i) => {
          const isOpen  = openId === rq.id;
          const related = projects.filter(p => rq.projectIds.includes(p.id));

          return (
            <div key={rq.id} className="border-b border-border">
              <button
                onClick={() => setOpenId(isOpen ? null : rq.id)}
                aria-expanded={isOpen}
                className={`w-full text-left transition-colors duration-200 group ${isOpen ? "bg-card" : "hover:bg-card/60"}`}>

                {/* Desktop */}
                <div className="hidden lg:grid px-8 lg:px-16 py-7 items-baseline gap-x-6"
                  style={{ gridTemplateColumns: "2.5rem 14rem 1fr 7rem" }}>
                  <span className={`text-[9px] font-mono tabular-nums transition-colors duration-200 ${isOpen ? "text-accent" : "text-muted-foreground"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className={`text-sm font-medium leading-snug transition-colors duration-200 ${isOpen ? "text-accent" : "text-foreground"}`}>
                    {rq.title}
                  </p>
                  <p className={`text-sm leading-relaxed transition-all duration-300 ${isOpen ? "text-foreground/80" : "text-muted-foreground"}`}
                    style={isOpen ? { fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 } : {}}>
                    {rq.question}
                  </p>
                  <div className="text-right">
                    <p className="text-[9px] text-muted-foreground tabular-nums">{rq.fragmentCount} fragments</p>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">{rq.lastUpdated}</p>
                  </div>
                </div>

                {/* Mobile */}
                <div className="lg:hidden px-6 py-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-mono ${isOpen ? "text-accent" : "text-muted-foreground"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-muted-foreground text-sm" aria-hidden>{isOpen ? "−" : "+"}</span>
                  </div>
                  <p className={`text-sm font-medium mb-2 leading-snug ${isOpen ? "text-accent" : ""}`}>{rq.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rq.question}</p>
                </div>
              </button>

              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}>
                  <div className="border-t border-border px-8 lg:px-16 pb-12 pt-8">
                    <div className="lg:pl-[calc(2.5rem+14rem+1.5rem)]">

                      {/* Mobile — question en italique */}
                      <p className="lg:hidden text-sm text-muted-foreground leading-relaxed mb-8"
                        style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
                        {rq.question}
                      </p>

                      <p className="text-sm leading-relaxed text-foreground/75 mb-10 max-w-lg">{rq.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {rq.genealogies.length > 0 && (
                          <div>
                            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Généalogies</p>
                            <div className="space-y-2">
                              {rq.genealogies.map(g => (
                                <p key={g} className="text-xs text-muted-foreground leading-snug">{g}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {rq.contemporaryArtists.length > 0 && (
                          <div>
                            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Artistes contemporains</p>
                            <div className="space-y-2">
                              {rq.contemporaryArtists.map(a => (
                                <p key={a} className="text-xs text-muted-foreground leading-snug">{a}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {rq.forms.length > 0 && (
                          <div>
                            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Formes explorées</p>
                            <div className="flex flex-wrap gap-1.5">
                              {rq.forms.map(f => (
                                <span key={f} className="text-[9px] border border-border px-1.5 py-0.5 text-muted-foreground">{f}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {related.length > 0 && (
                        <div className="mt-10 pt-8 border-t border-border">
                          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-5">Projets associés</p>
                          <div className="flex flex-wrap gap-2">
                            {related.map(p => (
                              <button key={p.id} onClick={() => navigate(`projet/${p.id}`)}
                                className="text-xs border border-border px-3 py-2 hover:border-accent hover:text-accent transition-colors text-muted-foreground">
                                {p.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page: Textes ─────────────────────────────────────────────────────────────

function PageTextes({ navigate, texts, projects }: {
  navigate: (p: string) => void; texts: Text[]; projects: Project[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { onEnter, onMove, onLeave, CursorEl } = useCursorImage();
  return (
    <div className="pt-12 min-h-screen">
      {CursorEl}
      <div className="px-8 lg:px-16 pt-16 pb-10 border-b border-border">
        <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Bibliothèque</p>
        <h1 className="text-5xl lg:text-8xl font-light leading-none"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
          Textes
        </h1>
      </div>
      <div className="border-t border-border">
        {texts.map(text => {
          const isOpen  = expanded === text.id;
          const related = projects.find(p => p.id === text.relatedProjectId);
          return (
            <div key={text.id} className="border-b border-border">
              <button onClick={() => setExpanded(isOpen ? null : text.id)}
                className="group w-full text-left hover:bg-card transition-colors"
                onMouseEnter={related?.image ? e => onEnter(related.image, e) : undefined}
                onMouseMove={related?.image ? e => onMove(related.image, e) : undefined}
                onMouseLeave={onLeave}>
                <div className="hidden md:grid gap-x-6 px-8 lg:px-16 py-6 items-baseline"
                  style={{ gridTemplateColumns: "8rem 8rem 1fr 5rem" }}>
                  <span className="text-xs text-muted-foreground">{text.date}</span>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{text.type.toLowerCase()}</span>
                  <span className="text-base group-hover:text-accent transition-colors">{text.title}</span>
                  <span className="text-xs text-muted-foreground text-right">{text.readTime}</span>
                </div>
                <div className="md:hidden px-6 py-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">{text.title}</span>
                    <span className="text-[10px] text-muted-foreground">{text.readTime}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{text.date} — {text.type}</p>
                </div>
              </button>
              {isOpen && (
                <div className="px-8 lg:px-16 pb-10 pt-2">
                  <div className="md:pl-[calc(8rem+8rem+3rem)] max-w-2xl space-y-5">
                    {related?.image && (
                      <div className="w-full overflow-hidden mb-6" style={{ height: "240px" }}>
                        <img src={related.image} alt={related.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="text-lg text-muted-foreground leading-relaxed"
                      style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", fontWeight: 300 }}>
                      {text.excerpt}
                    </p>
                    <p className="text-sm leading-relaxed">{text.body}</p>
                    {related && (
                      <button onClick={() => navigate(`projet/${related.id}`)} className="text-[9px] tracking-widest uppercase text-accent hover:opacity-70 transition-opacity">
                        → Projet lié : {related.title}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page: À propos ───────────────────────────────────────────────────────────

function PageAPropos({ navigate, projects, settings }: {
  navigate: (p: string) => void;
  projects: Project[];
  settings: SiteSettings;
}) {
  const heroImg = settings.aboutImage || projects[0]?.image;
  const blocks = [
    { label: "Pratiques",      items: settings.practices },
    { label: "Disponible pour", items: settings.available },
  ].filter(b => b.items.length > 0);

  return (
    <div className="pt-12 min-h-screen">
      <div className="relative overflow-hidden" style={{ height: "50vh" }}>
        {heroImg && <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="absolute bottom-0 left-0 right-0 px-8 lg:px-16 pb-14">
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/45 mb-4">À propos</p>
          <h1 className="text-5xl lg:text-7xl font-light text-white leading-none"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
            Mademo studio
          </h1>
          {settings.subtitle && (
            <p className="text-white/50 text-xs mt-4 tracking-widest uppercase">{settings.subtitle}</p>
          )}
        </div>
      </div>
      <div className="px-8 lg:px-16 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-border">
        <div className="lg:col-span-6 space-y-6">
          {settings.bio && <p className="text-base lg:text-lg leading-relaxed">{settings.bio}</p>}
          {settings.bioSecondary && <p className="text-sm text-muted-foreground leading-relaxed">{settings.bioSecondary}</p>}
          <button onClick={() => navigate("contact")} className="text-[9px] tracking-widest uppercase hover:text-accent transition-colors">Prendre contact →</button>
        </div>
        {blocks.length > 0 && (
          <div className="lg:col-span-4 lg:col-start-9 space-y-8">
            {blocks.map(block => (
              <div key={block.label}>
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">{block.label}</p>
                <ul className="space-y-2">{block.items.map(item => <li key={item} className="text-sm text-muted-foreground">{item}</li>)}</ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page: Contact ────────────────────────────────────────────────────────────

function PageContact({ settings }: { settings: SiteSettings }) {
  const { contact, city } = settings;
  const links = [
    contact.email     && { label: "Email",     value: contact.email,     href: contact.emailHref },
    contact.instagram && { label: "Instagram", value: contact.instagram, href: contact.instagramHref },
    contact.vimeo     && { label: "Vimeo",     value: contact.vimeo,     href: contact.vimeoHref },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  return (
    <div className="pt-12 min-h-screen">
      <div className="px-8 lg:px-16 pt-16 pb-10 border-b border-border">
        <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Écrire</p>
        <h1 className="text-5xl lg:text-7xl font-light leading-none"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
          Contact
        </h1>
      </div>
      <div className="px-8 lg:px-16 py-12 max-w-xl">
        {contact.intro && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-12">{contact.intro}</p>
        )}
        {links.map(item => (
          <a key={item.label} href={item.href} className="group flex items-baseline justify-between py-6 border-b border-border">
            <span className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">{item.label}</span>
            <span className="text-lg group-hover:text-accent transition-colors">{item.value}</span>
          </a>
        ))}
        {city && <p className="text-xs text-muted-foreground mt-10">{city}.</p>}
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page,       setPage]       = useState("atelier");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filOpen,    setFilOpen]    = useState(false);
  const [fil,        setFil]        = useState<string[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { projects, fragments, research, texts, settings, status } = useData();

  const navigate    = useCallback((p: string) => { setPage(p); window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  const addToFil    = useCallback((id: string) => { setFil(prev => prev.includes(id) ? prev : [...prev, id]); setFilOpen(true); }, []);
  const removeFromFil = useCallback((id: string) => { setFil(prev => prev.filter(x => x !== id)); }, []);

  const currentProject = projects.find(p => `projet/${p.id}` === page);

  const PAGE_TITLES: Record<string, string> = {
    atelier: "Atelier — Mademo Studio",
    projets: "Projets — Mademo Studio",
    fragments: "Fragments — Mademo Studio",
    constellation: "Constellation — Mademo Studio",
    recherches: "Recherches — Mademo Studio",
    textes: "Textes — Mademo Studio",
    "a-propos": "À propos — Mademo Studio",
    contact: "Contact — Mademo Studio",
  };

  useEffect(() => {
    const title = currentProject
      ? `${currentProject.title} — Mademo Studio`
      : (PAGE_TITLES[page] ?? "Mademo Studio");
    document.title = title;
  }, [page, currentProject]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SkipLink />
        <Nav page={page} navigate={navigate} filCount={0} onSearchOpen={() => {}} onFilOpen={() => {}} />
        <main id="main-content" tabIndex={-1} aria-busy="true" aria-label="Chargement en cours">
          <PageSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SkipLink />
      <Nav page={page} navigate={navigate} filCount={fil.length} onSearchOpen={() => setSearchOpen(true)} onFilOpen={() => setFilOpen(true)} />

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {currentProject ? currentProject.title : PAGE_TITLES[page]}
      </div>

      {searchOpen && (
        <SearchModal onClose={() => setSearchOpen(false)} navigate={navigate}
          projects={projects} fragments={fragments} texts={texts} />
      )}
      {filOpen && (
        <FilDeRecherche items={fil} onClose={() => setFilOpen(false)} onRemove={removeFromFil}
          navigate={navigate} projects={projects} fragments={fragments} />
      )}
      {status === "fallback" && window.MADEMO_CONFIG && !bannerDismissed && (
        <FallbackBanner onDismiss={() => setBannerDismissed(true)} />
      )}

      <main id="main-content" tabIndex={-1}>
        <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          {page === "atelier"         && <PageAtelier navigate={navigate} addToFil={addToFil} projects={projects} fragments={fragments} research={research} />}
          {page === "projets"         && <PageProjets navigate={navigate} addToFil={addToFil} projects={projects} />}
          {currentProject             && <PageProjetDetail project={currentProject} navigate={navigate} addToFil={addToFil} projects={projects} fragments={fragments} />}
          {page === "fragments"       && <PageFragments addToFil={addToFil} fragments={fragments} projects={projects} />}
          {page === "constellation"   && <PageConstellation navigate={navigate} projects={projects} />}
          {page === "recherches"      && <PageRecherches navigate={navigate} research={research} projects={projects} />}
          {page === "textes"          && <PageTextes navigate={navigate} texts={texts} projects={projects} />}
          {page === "a-propos"        && <PageAPropos navigate={navigate} projects={projects} settings={settings} />}
          {page === "contact"         && <PageContact settings={settings} />}
        </motion.div>
      </main>
    </div>
  );
}
