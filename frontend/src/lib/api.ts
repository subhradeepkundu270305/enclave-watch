const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  health:             () => get<any>("/health"),
  alerts:             (params?: Record<string, string>) =>
                        get<any>(`/alerts?${new URLSearchParams(params ?? {})}`),
  alertEvidence:      (id: string) => get<any>(`/alerts/${id}/evidence`),
  verifyAlert:        (id: string) => post<any>(`/verify/${id}`),
  tamperTest:         (id: string) => post<any>(`/tamper-test/${id}`),
  ipHistory:          () => get<any>("/ip-history"),
  analyticsByType:    () => get<any>("/analytics/by-type"),
  analyticsBySeverity:() => get<any>("/analytics/by-severity"),
  recentEvents:       (limit = 100) => get<any>(`/recent-events?limit=${limit}`),
  detectors:          () => get<any>("/detectors"),
  settings:           () => get<any>("/settings"),
  demoGenerate:       (type: string) => post<any>(`/demo/generate/${type}`),
  demoRunAll:         () => post<any>("/demo/run-all"),
};

export const WS_URL = BASE.replace(/^http/, "ws") + "/ws";
