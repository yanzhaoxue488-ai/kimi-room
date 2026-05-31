const OMBRE_API = "/api/ombre";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${OMBRE_API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: "unknown" }));
    throw new Error(e.error ?? "Ombre API error");
  }
  return res.json();
}

function applyFilter(rows: any[], f: any): any[] {
  if (!f) return rows;
  if (f.ids?.length) rows = rows.filter((r: any) => f.ids!.includes(r.id));
  if (f.tags?.length) rows = rows.filter((r: any) => r.tags?.some((t: string) => f.tags!.includes(t)));
  if (f.activeOnly) rows = rows.filter((r: any) => r.active);
  if (f.status) rows = rows.filter((r: any) => r.reviewStatus === f.status);
  if (f.limit) rows = rows.slice(0, f.limit);
  return rows;
}

export const ombreMemoryStore = {
  async list(filter?: any): Promise<any[]> {
    const all = await req<any[]>("/memories");
    return applyFilter(all, filter);
  },
  async get(id: string): Promise<any | null> {
    try { return await req<any>(`/memories/${encodeURIComponent(id)}`); }
    catch { return null; }
  },
  async put(entry: any): Promise<any> {
    const existing = entry.id ? await this.get(entry.id!) : null;
    if (existing) {
      return req<any>(`/memories/${encodeURIComponent(entry.id!)}`, {
        method: "PUT", body: JSON.stringify(entry),
      });
    }
    return req<any>("/memories", {
      method: "POST", body: JSON.stringify(entry),
    });
  },
  async delete(id: string): Promise<void> {
    await req<void>(`/memories/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  async search(query: string, k?: number): Promise<any[]> {
    const all = await req<any[]>(`/memories?search=${encodeURIComponent(query)}`);
    return k ? all.slice(0, k) : all;
  },
};
