/**
 * Hook central de données.
 * Fetche les 4 endpoints WordPress en parallèle au montage.
 * En cas d'erreur réseau (WP absent), retombe sur les données de démo.
 */

import { useState, useEffect } from "react";
import { api } from "./api";
import type { Project, Fragment, ResearchQuestion, Text, SiteSettings } from "./api";
import {
  FALLBACK_PROJECTS,
  FALLBACK_FRAGMENTS,
  FALLBACK_RESEARCH,
  FALLBACK_TEXTS,
  FALLBACK_SETTINGS,
} from "./fallback-data";

export interface SiteData {
  projects:  Project[];
  fragments: Fragment[];
  research:  ResearchQuestion[];
  texts:     Text[];
  settings:  SiteSettings;
}

export type DataStatus = "loading" | "ready" | "fallback" | "error";

export interface UseDataResult extends SiteData {
  status: DataStatus;
  error: string | null;
  reload: () => void;
}

export function useData(): UseDataResult {
  const [status, setStatus]  = useState<DataStatus>(window.MADEMO_CONFIG ? "loading" : "fallback");
  const [error,  setError]   = useState<string | null>(null);
  const [data,   setData]    = useState<SiteData>({
    projects:  FALLBACK_PROJECTS,
    fragments: FALLBACK_FRAGMENTS,
    research:  FALLBACK_RESEARCH,
    texts:     FALLBACK_TEXTS,
    settings:  FALLBACK_SETTINGS,
  });

  const load = async () => {
    // Si WordPress n'a pas injecté sa config, on est en mode preview/dev sans WP.
    // On passe directement aux données de démo sans tenter de fetch.
    if (!window.MADEMO_CONFIG) {
      setStatus("fallback");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const [projects, fragments, research, texts, settings] = await Promise.all([
        api.projects(),
        api.fragments(),
        api.research(),
        api.texts(),
        api.settings(),
      ]);
      setData({ projects, fragments, research, texts, settings });
      setStatus("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus("fallback");
    }
  };

  useEffect(() => { load(); }, []);

  return { ...data, status, error, reload: load };
}
