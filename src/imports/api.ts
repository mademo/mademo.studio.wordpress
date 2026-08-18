/**
 * Client API WordPress — consomme les endpoints REST mademo/v1/*.
 * En développement local (Vite sans WordPress), l'interface peut utiliser
 * les données statiques exportées par fallback-data.ts.
 */

declare global {
  interface Window {
    MADEMO_CONFIG?: {
      apiBase: string;
      nonce: string;
      siteUrl: string;
      uploadsUrl: string;
      isLoggedIn: boolean;
    };
  }
}

const wpConfig = typeof window !== "undefined" ? window.MADEMO_CONFIG : undefined;

// URL injectée par WordPress via wp_add_inline_script, puis variable Vite,
// puis serveur WordPress local par défaut.
const rawApiBase =
  wpConfig?.apiBase ??
  import.meta.env.VITE_WP_API_BASE ??
  "http://localhost:8888/wp-json/mademo/v1";

export const API_BASE = rawApiBase.replace(/\/$/, "");
export const WP_NONCE = wpConfig?.nonce ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "intuition"
  | "documentation"
  | "recherche"
  | "expérimentation"
  | "production"
  | "en pause"
  | "terminé";

export type FragmentType =
  | "note"
  | "photographie"
  | "citation"
  | "hypothèse"
  | "question"
  | "expérience"
  | "résultat"
  | "échec"
  | "référence"
  | "décision";

export interface JournalEntry {
  date: string;
  title: string;
  content: string;
  type:
    | "découverte"
    | "hypothèse"
    | "expérimentation"
    | "résultat"
    | "difficulté"
    | "décision";
}

export interface Project {
  id: string;
  wp_id: number;
  title: string;
  category: string;
  status: ProjectStatus;
  year: string;
  question: string;
  manifeste: string;
  description: string;
  lastUpdated: string;
  themes: string[];
  tags: string[];
  image: string;
  fragmentCount: number;
  journal: JournalEntry[];
  maintenant: {
    cherche: string;
    avancee: string;
    bloque: string | null;
    prochaine: string;
    question: string;
  };
  references: { title: string; author: string; year: string }[];
}

export interface Fragment {
  id: string;
  wp_id: number;
  number: string;
  title: string;
  date: string;
  type: FragmentType;
  content: string;
  status: string;
  keywords: string[];
  projectIds: string[];
  image?: string;
}

/**
 * Une ligne du tableau de recherche du site.
 * La Monade n'est pas une ligne : elle relie tous ces territoires.
 */
export interface ResearchQuestion {
  id: string;
  wp_id: number;
  title: string;
  question: string;
  description: string;
  genealogies: string[];
  contemporaryArtists: string[];
  forms: string[];
  projectIds: string[];
  fragmentCount: number;
  lastUpdated: string;
}

export interface Text {
  id: string;
  wp_id: number;
  title: string;
  date: string;
  type: string;
  excerpt: string;
  body: string;
  relatedProjectId: string;
  readTime: string;
}

// ─── Fetcher générique ────────────────────────────────────────────────────────

async function apiFetch<T>(endpoint: string): Promise<T> {
  const headers: HeadersInit = { Accept: "application/json" };
  if (WP_NONCE) headers["X-WP-Nonce"] = WP_NONCE;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error(`API WordPress ${res.status} sur ${endpoint}`);
  }

  return res.json() as Promise<T>;
}

// ─── API publique ─────────────────────────────────────────────────────────────

export const api = {
  projects: () => apiFetch<Project[]>("/projects"),
  fragments: () => apiFetch<Fragment[]>("/fragments"),
  texts: () => apiFetch<Text[]>("/texts"),
  research: () => apiFetch<ResearchQuestion[]>("/research"),
};

