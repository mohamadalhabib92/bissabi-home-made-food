# Audit HMF vs Uber Eats / Shef / CookUnity / Yummy (2026-11-05)

## Déjà présent avant cette PR
- Découverte locale GPS 1–5 km, Halal, panier 1 cook, commission 15 %, créneaux à l’avance
- Allergènes OIDAl 14, checklist hygiène, studio cook, commandes + avis modérés
- Conformité OFCO (pas SCAV), FR/EN, premium UX pass (haptics, dark, Dynamic Type)

## Manques vs Uber Eats / Deliveroo / Just Eat
- Rails éditoriaux (Near you, World, Top, Family, Available today) → **ajoutés**
- Filtres riches (régime, prix, note, canton, familial) → **ajoutés**
- Photos plats réalistes → **ajoutées (WebP locaux)**
- Suivi live livreur / carte → hors scope (retrait & livraison cook)
- Paiement réel / pourboire → toujours mock (décision Mohamed)

## Manques vs Shef / CookUnity / La Belle Assiette / Yummy
- Storytelling cook + origine → **ajouté**
- Become-a-cook avec règles CH citées → **ajouté**
- Abonnement hebdo / meal plan → Phase 2
- Dégustation admin / food handler cert → documenté, pas simulé comme certif

## Catalogue démo
14 cooks fictifs, 40 plats, cantons VD/GE/FR/NE/TI/BE/ZH/BS/VS/SG, cultures multiples.
