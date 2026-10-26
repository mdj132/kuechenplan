// Liest ein Rezept von einer Website (schema.org/Recipe in JSON-LD) und gibt es vereinfacht zurück.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function isRecipe(o: any) {
  const t = o?.["@type"];
  return t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
}
function findRecipe(o: any): any {
  if (!o || typeof o !== "object") return null;
  if (Array.isArray(o)) { for (const x of o) { const r = findRecipe(x); if (r) return r; } return null; }
  if (isRecipe(o)) return o;
  for (const k of ["@graph", "mainEntity", "itemListElement"]) { const r = findRecipe(o[k]); if (r) return r; }
  return null;
}
const clean = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
function steps(ins: any): string[] {
  if (!ins) return [];
  if (typeof ins === "string") return ins.split(/\n+|(?<=\.)\s{2,}/).map(clean).filter(Boolean);
  if (Array.isArray(ins)) return ins.flatMap(steps);
  if (ins.itemListElement) return steps(ins.itemListElement);
  if (ins.text) return [clean(String(ins.text))];
  if (ins.name) return [clean(String(ins.name))];
  return [];
}
function minutes(iso?: string): number | null {
  if (!iso || typeof iso !== "string") return null;
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return null;
  const v = (+(m[1] || 0)) * 1440 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
  return v || null;
}
function blockedHost(h: string) {
  return h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") ||
    /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[)/.test(h);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { url } = await req.json();
    const u = new URL(String(url));
    if (!/^https?:$/.test(u.protocol) || blockedHost(u.hostname)) return json({ error: "Ungültiger Link" }, 400);
    const res = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Kuechenplan Rezeptimport)", "Accept-Language": "de-DE,de;q=0.9" }, redirect: "follow" });
    if (!res.ok) return json({ error: `Seite antwortet mit ${res.status}` }, 502);
    const html = (await res.text()).slice(0, 3_000_000);
    const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    let rec: any = null;
    for (const b of blocks) { try { rec = findRecipe(JSON.parse(b.trim())); } catch { /* ungültiges JSON überspringen */ } if (rec) break; }
    if (!rec) return json({ error: "Kein Rezept auf der Seite gefunden" }, 422);
    return json({
      name: clean(String(rec.name || "")),
      minutes: minutes(rec.totalTime) || minutes(rec.cookTime),
      servings: rec.recipeYield ? clean(String(Array.isArray(rec.recipeYield) ? rec.recipeYield[0] : rec.recipeYield)) : null,
      ingredients: (rec.recipeIngredient || rec.ingredients || []).map((x: any) => clean(String(x))).filter(Boolean),
      steps: steps(rec.recipeInstructions),
      source: u.toString(),
    });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
