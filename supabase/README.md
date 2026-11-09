# Supabase — Passe 1

Migration additive : `migrations/20261102213000_passe1_foundations.sql`.

Elle n’a **pas** été appliquée. Aucun projet, aucune URL et aucune clé ne sont configurés (`YOUR_SUPABASE_URL`, `YOUR_SUPABASE_ANON_KEY`). Ne pas lancer cette migration contre un projet réel tant que Mohamed n’a pas fourni le projet et validé le schéma.

Le client Expo ne crée pas de client Supabase et n’appelle pas le réseau au démarrage. La clé `service_role` n’est pas lue par l’app.

Migration pilote (schéma `pilot` seulement, non appliquée) : `migrations/20261109150000_pilot_marketplace.sql`. Rollback : `../docs/pilot/rollback.md`. Preuve locale : `npm run test:sql`. Ne pas lancer ces scripts sur le projet hébergé.
