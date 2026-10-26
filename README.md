# Küchenplan Familie Jaeger

Rezepte, Wochenplan (Mo–Fr) und Abstimmung für Marc, Kathrin, Julie und Jil – als installierbare Web-App.

## Aufs Handy holen
- **iPhone:** Link in Safari öffnen → unten „Teilen“ → „Zum Home-Bildschirm“.
- **Android:** Link in Chrome öffnen → „Als App installieren“ (oder Menü ⋮ → „App installieren“).

Danach oben den eigenen Namen antippen – fertig.

## Aufbau
- `index.html` – die App (ohne Build-Schritt)
- `config.js` – Supabase-URL und öffentlicher Schlüssel
- `sw.js`, `manifest.webmanifest`, Icons (`icon-*.png`) – Installation und Offline-Start
- `supabase-schema.sql` – Tabelle `kv` (Pläne, Stimmen, Wünsche, Abwahlen, geänderte Rezepte)
- `supabase-import-recipe.ts` (Edge Function `import-recipe`) – liest Rezepte per Link (schema.org/Recipe)

Hinweis: Die App hat kein Passwort. Wer den Link kennt, kann abstimmen und Rezepte ändern.
