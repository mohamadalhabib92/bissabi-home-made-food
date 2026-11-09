-- Rollback du schéma pilote. Efface les lignes du schéma `pilot` seulement.
-- Une table public créée avant ce script doit rester. Ce n'est pas un risque nul
-- si un objet futur de public dépend de pilot : le DROP échouera, et il faudra
-- retirer cette dépendance à la main avant de relancer.

drop schema if exists pilot cascade;
