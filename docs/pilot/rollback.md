# Rollback

La migration `supabase/migrations/20261109150000_pilot_marketplace.sql` crée le schéma `pilot` et rien d’autre. Elle ne modifie pas les tables de la passe 1, même si cette passe était déjà appliquée.

Le script `supabase/rollback/20261109150000_pilot_marketplace.sql` fait `drop schema pilot cascade`.

Effet : les commandes, lots et écritures **du schéma pilote** disparaissent. Les tables `public` qui ne dépendent pas de `pilot` restent. L’essai local crée `public.sentinel`, lance le rollback, et relit cette ligne.

Ce n’est pas un risque nul. Si un objet futur de `public` référence `pilot`, le `DROP` échouera : il faudra retirer cette dépendance avant de relancer. Ne pas lancer ces scripts sur le projet hébergé tant que Mohamed n’a pas désigné une base de test et une sauvegarde.

Les clés AsyncStorage existantes ne sont pas migrées. Il n’y a donc rien à annuler sur les téléphones déjà en service, à part la langue si une personne en a choisi une nouvelle : elle peut revenir au français dans Langues.
