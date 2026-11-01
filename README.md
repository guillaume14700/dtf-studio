# DTF Studio Pro

Studio DTF professionnel **100 % autonome** — aucune base de données, aucun service externe payant.
Projet indépendant (aucun lien avec d'autres applications).

## Modules

| Module | Fonction |
|---|---|
| **Éditeur de design** | Création façon Photoshop : calques, textes (11 polices), formes, pinceau, images, filtres, modes de fusion, suppression du fond blanc. Formats prêts (t-shirt 30×40 cm, logo poitrine, casquette, A4/A3, personnalisé en mm). **Export PNG 300 DPI** exact. |
| **Mockup 3D textile** | T-shirt, hoodie, casquette — tailles **S à XXXL**, 20 couleurs + personnalisée, rotation 3D, ombrage textile, placement du visuel, export PNG de la maquette. |
| **RIP DTF** | **Canal blanc automatique** (seuil alpha, opacité, choke/retrait), **miroir** standard DTF, vues Couleur/Blanc/Fusion, **gang sheet** multi-designs (glisser-déposer, rotation), profils **Epson ET-8550 / XP-15000 / rouleaux 30 & 60 cm / A4**, estimation **encre (ml) + film (€)** avec tarifs modifiables, exports PNG 300 DPI. |
| **Kit clé USB** | Génère les lanceurs (Windows `.url`, Mac `.webloc`, universel `.html`) + mode d'emploi à copier sur une clé USB : chez le client, double-clic → le studio s'ouvre. |

Les designs sont enregistrés dans le **navigateur du poste** (localStorage) — comme un logiciel local.
Exportez régulièrement les PNG 300 DPI pour archiver.

## 🚀 Déploiement (gratuit, SANS base de données)

1. Créez un dépôt **GitHub** (ex. `dtf-studio`) et uploadez ce projet.
2. Sur **vercel.com** : *Add New → Project* → importez le dépôt → **Deploy**.
   Aucune variable d'environnement, aucun Storage : ça fonctionne directement.
3. Votre studio est en ligne sur `https://votre-projet.vercel.app`.
   La page **Clé USB** génère des lanceurs pointant automatiquement sur cette adresse.

### Local

```bash
npm install
npm run dev   # http://localhost:3000
```

## 🖥️ Version exécutable native (.exe / .dmg)

Le studio est une application web installable (PWA). Pour un exécutable natif hors-ligne,
ce code se package directement avec **Electron** ou **Tauri** (comptez 1 à 2 jours de
mission développeur) — aucune modification du code n'est nécessaire.

## 🖨️ Note impression DTF

Les exports sont des fichiers **prêts à imprimer** (300 DPI, miroir, blanc séparé ou fusionné).
Sur imprimante convertie (ET-8550, XP-15000…), imprimez via le pilote en qualité photo 300 DPI
sur film PET ; la gestion du canal blanc dépend de votre configuration d'encre blanche
(canal dédié ou double passe). Les RIP pilotant les canaux d'encre (type AcroRIP) consomment
directement ces PNG. Rappel procédé : poudre adhésive → four/presse 110-120 °C 12-15 s →
transfert presse 150-160 °C 12-15 s → retrait du film.
