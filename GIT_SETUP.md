# Guide de configuration Git pour ChatAlimi

Ce guide vous explique comment configurer votre projet pour pouvoir le pousser sur Git et le cloner sur un autre PC sans problèmes.

## Configuration initiale

### 1. Configurer votre identité Git (à faire une seule fois sur chaque PC)

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@exemple.com"
```

### 2. Créer un dépôt sur GitHub, GitLab ou autre service Git

1. Créez un compte sur [GitHub](https://github.com/) si vous n'en avez pas déjà un
2. Créez un nouveau dépôt (repository) sur GitHub
3. Ne pas initialiser le dépôt avec un README, .gitignore ou licence (car votre projet existe déjà)

### 3. Connecter votre dépôt local au dépôt distant

```bash
# Remplacez l'URL par celle de votre dépôt
git remote add origin https://github.com/votre-nom/chatalimi.git

# Vérifiez que la connexion est établie
git remote -v
```

## Pousser votre code sur Git

```bash
# Ajoutez tous les fichiers au suivi Git (sauf ceux dans .gitignore)
git add .

# Créez un commit avec vos modifications
git commit -m "Premier commit"

# Poussez votre code vers le dépôt distant
git push -u origin master
# ou si vous utilisez la branche main
git push -u origin main
```

## Cloner le projet sur un autre PC

### 1. Installer les prérequis sur le second PC

- Installez Node.js (v16 ou supérieur)
- Installez Git

### 2. Cloner le dépôt

```bash
git clone https://github.com/votre-nom/chatalimi.git
cd chatalimi
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Configurer les variables d'environnement

Créez un fichier `.env.local` dans le répertoire racine du projet avec le contenu suivant :

```
REACT_APP_GITHUB_TOKEN=votre_token_github_ici
```

### 5. Lancer l'application

```bash
npm start
```

## Bonnes pratiques pour éviter les problèmes

1. **Toujours tirer (pull) avant de pousser (push)**
   ```bash
   git pull origin main
   # puis
   git push origin main
   ```

2. **Utiliser des branches pour les nouvelles fonctionnalités**
   ```bash
   git checkout -b nouvelle-fonctionnalite
   # travaillez sur vos modifications
   git add .
   git commit -m "Ajout de nouvelle fonctionnalité"
   git push -u origin nouvelle-fonctionnalite
   ```

3. **Ne pas pousser de fichiers sensibles**
   - Vérifiez que `.env.local` et autres fichiers de configuration sensibles sont dans `.gitignore`
   - Ne stockez jamais de mots de passe, clés API ou tokens directement dans le code

4. **Gérer les conflits**
   Si vous avez des conflits lors d'un pull, Git vous les indiquera. Vous devrez les résoudre manuellement en éditant les fichiers concernés, puis :
   ```bash
   git add .
   git commit -m "Résolution des conflits"
   git push
   ```

5. **Synchroniser régulièrement**
   Faites des commits et des push réguliers pour éviter les gros conflits.

En suivant ces instructions, vous pourrez travailler sur votre projet depuis plusieurs ordinateurs sans problème. 