# Work Tracker 🕒

Un outil CLI simple, rapide et robuste pour noter vos heures de travail, gérer vos projets.

## 🚀 Installation

1. **Cloner et installer les dépendances** :
   ```bash
   npm install
   ```

2. **Compiler le projet** :
   ```bash
   npm run build
   ```

3. **Lier la commande globalement** (optionnel mais recommandé) :
   ```bash
   npm link
   ```
   *Une fois lié, vous pouvez utiliser la commande `work` directement.*

## 📂 Stockage des données
Les données sont stockées dans le répertoire `~/.work/` :
- `logs.txt` : Le journal de vos saisies (format lisible et éditable manuellement).
- `projects.txt` : La liste de vos projets pour l'auto-complétion.

---

## 🛠️ Utilisation

L'aide détaillée pour chaque commande est accessible via `work --help` ou `work [commande] --help`.

### 1. Démarrer un chronomètre (`start`)
Pour commencer à travailler sur un projet en temps réel.

- **Avec sélection interactive** :
  ```bash
  work start
  ```
  *Propose la liste de vos projets existants ou d'en créer un nouveau.*

- **En spécifiant le projet** :
  ```bash
  work start "Nom du Projet"
  ```

### 2. Arrêter le chronomètre (`stop`)
Pour terminer la tâche en cours.

```bash
work stop
```
*L'outil vous demandera un commentaire optionnel sur le travail effectué.*

### 3. Saisie manuelle (`log`)
Pour enregistrer du temps passé a posteriori (ex: réunion de ce matin).

```bash
work log
```
*Suivez les étapes : Sélection du projet -> Durée (ex: "1h30" ou "45m") -> Commentaire.*

### 4. Rapports et déclarations (`report`)
Visualisez le temps accumulé par projet pour préparer vos déclarations.

- **Pour avoir le détail jour par jour** :
  ```bash
  work report --detail
  ```

- **Mois en cours** (par défaut) :
  ```bash
  work report
  ```

- **Aujourd'hui** :
  ```bash
  work report --period today
  ```

- **Semaine en cours** :
  ```bash
  work report --period week
  ```

- **Mois dernier** :
  ```bash
  work report --period last-month
  ```

### 5. Édition manuelle (`edit`)
Ouvre votre fichier de logs directement dans votre éditeur de texte par défaut (configuré via la variable `$EDITOR`).

```bash
work edit
```

### 6. Correction manuelle directe
Puisque le format est du texte brut, vous pouvez également corriger une erreur de saisie en ouvrant manuellement le fichier `~/.work/logs.txt`.

---

## 🍏 Intégration macOS (Barre de menus & Raccourcis)

Vous pouvez intégrer `work` directement dans macOS pour une productivité maximale.

### 1. Barre de menus (via SwiftBar)
Affichez votre chrono actif en permanence en haut de votre écran.

1.  Installez [SwiftBar](https://github.com/swiftbar/SwiftBar) (`brew install --cask swiftbar`).
2.  Créez un fichier nommé `work.1m.sh` dans votre dossier de plugins SwiftBar :
    ```bash
    #!/bin/bash
    # <bitbar.title>Work Tracker Status</bitbar.title>
    
    # Pour que SwiftBar trouve 'node' (surtout avec nvm/asdf/brew), 
    # nous ajoutons les chemins habituels au PATH.
    export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ | tail -1)/bin:$PATH"
    # Note : Si vous utilisez nvm dans un autre dossier, adaptez le chemin ci-dessus.

    # Exécute la commande status
    work status
    ```
3.  Rendez le fichier exécutable : `chmod +x work.1m.sh`.

*Astuce : Si l'erreur 'env:node: No such file' persiste, utilisez 'which node' et 'which work' dans votre terminal pour obtenir les chemins absolus et utilisez-les directement :*
```bash
/Users/VOTRE_NOM/.config/nvm/versions/node/v24.12.0/bin/node /Users/VOTRE_NOM/.config/nvm/versions/node/v24.12.0/bin/work status
```

### 2. Raccourci Clavier Global (via l'app Raccourcis)
Basculez l'état de votre chronomètre (Démarrer/Arrêter) avec une simple combinaison de touches.

1.  Ouvrez l'application **Raccourcis** (Shortcuts) de macOS.
2.  Créez un nouveau raccourci nommé "Work Toggle".
3.  Ajoutez l'action **"Exécuter un script shell"**.
4.  Contenu du script : `/usr/local/bin/work toggle`.
5.  Dans les réglages du raccourci (onglet Détails/Icône "i"), cliquez sur **"Ajouter un raccourci clavier"**.
6.  Choisissez votre combinaison (ex: `Cmd + Option + W`).

*Note : Si aucun chrono n'est lancé, une fenêtre surgissante macOS vous demandera de choisir ou de saisir un projet.*

---

## 📝 Format du journal (`logs.txt`)
Le format est conçu pour être simple à lire :
```text
[2026-04-30_09:00@2026-04-30_10:30]
ProjetAlpha: Analyse de la spécification

[2026-04-30_10:30@]
ProjetBeta:
```

---

## 🛠️ Développement

### Stack Technique
- **Runtime** : Node.js
- **Langage** : TypeScript
- **CLI Framework** : Commander.js
- **UI/Interactions** : @clack/prompts
- **Date Handling** : Day.js
- **Tests** : Vitest

### Architecture du projet
Le projet suit les principes de l'**Architecture Hexagonale (Ports et Adaptateurs)** pour garantir une séparation nette entre la logique métier et les détails techniques :
- `src/domain/entities` : Contient les modèles de données métier.
- `src/domain/usecases` : Contient la logique métier pure (ex: démarrer un timer, générer un rapport).
- `src/domain/ports` : Définit les interfaces (contrats) pour les dépendances externes.
- `src/adapters` : Implémente les détails techniques (CLI via Commander, stockage via le Système de Fichiers).

### Tests unitaires
Pour lancer la suite de tests et vérifier le bon fonctionnement de la logique métier :
```bash
npm test
```
