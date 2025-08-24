# Git Blueprint / Guide Git 🚀

## Quick Commands / Commandes Rapides

### 1. Daily Workflow / Flux Quotidien

```bash
# Update from main / Mise à jour depuis main
git fetch origin
git switch main
git pull origin main

# Create feature branch / Créer branche fonctionnalité
git switch -c feature/ma-fonction

# Stage and commit / Ajouter et valider
git add .
git commit -m "feat: add new feature"

# Push changes / Pousser les changements
git push origin feature/ma-fonction
```

### 2. Commit Types / Types de Commits

- `feat`: new feature / nouvelle fonctionnalité
- `fix`: bug fix / correction de bug
- `docs`: documentation
- `style`: formatting / formatage
- `refactor`: code restructuring / restructuration
- `test`: adding tests / ajout de tests
- `chore`: maintenance

### 3. Clean & Reset / Nettoyage & Réinitialisation

```bash
# Discard changes / Annuler les changements
git checkout -- .

# Clean untracked files / Nettoyer fichiers non suivis
git clean -df

# Reset to remote branch / Réinitialiser à la branche distante
git fetch origin
git reset --hard origin/feature/ma-fonction
```

### 4. Fix Mistakes / Corriger les Erreurs

```bash
# Modify last commit / Modifier dernier commit
git add .
git commit --amend --no-edit

# Undo last commit (keep changes) / Annuler dernier commit (garder changements)
git reset --soft HEAD~1

# Reset completely / Réinitialiser complètement
git reset --hard HEAD~1
```

## Best Practices / Bonnes Pratiques

1. **Branch Names / Noms de Branches**
   - `feature/description`
   - `fix/bug-description`
   - `docs/what-changed`

2. **Commit Messages / Messages de Commit**
   ```
   type(scope): description courte
   
   Description longue si nécessaire
   ```

3. **Before Push / Avant de Pousser**
   - Run tests / Lancer les tests
   - Check linting / Vérifier le linting
   - Test locally / Tester localement

4. **Merge Process / Processus de Fusion**
   ```bash
   git fetch origin
   git switch main
   git pull origin main
   git merge --no-ff feature/ma-fonction
   git push origin main
   ```

## Recovery Commands / Commandes de Récupération

```bash
# Find lost commits / Trouver commits perdus
git reflog

# Restore deleted branch / Restaurer branche supprimée
git checkout -b feature/ma-fonction SHA_DU_COMMIT

# Remove from git but keep file / Retirer du git mais garder fichier
git rm --cached file.txt
```

## Deploy Checklist / Liste de Déploiement

1. ✅ Frontend build works locally / Build frontend marche en local
2. ✅ Backend health check passes / Vérification santé backend passe
3. ✅ All changes committed / Tout est commité
4. ✅ Pushed to correct branch / Poussé sur la bonne branche
5. ✅ Environment variables set / Variables d'environnement définies

## Local Dev Setup / Configuration Dev Locale

```bash
# Clone and setup / Cloner et configurer
git clone https://github.com/firasmrabet/augment.git
cd augment

# Create branch / Créer branche
git switch -c feature/nouvelle-fonction

# Install and build / Installer et construire
cd frontend
npm install
npm run build

cd ../backend
npm install
npm start
```
