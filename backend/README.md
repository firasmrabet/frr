# Configuration du Serveur Backend

## Variables d'Environnement

### Configuration Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
RECEIVER_EMAIL=admin1@example.com,admin2@example.com
```

### Configuration Sécurité
```env
API_KEY=your-api-key
ENCRYPTION_KEY=your-encryption-key-32-bytes
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key-32-bytes
```

### Configuration PDF
```env
PDF_STORAGE_PATH=./generated-pdfs
PDF_TEMPLATE_PATH=./templates/devis-pdf.ejs
CHROME_BIN=/usr/bin/google-chrome-stable
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### Configuration Serveur
```env
NODE_ENV=production
PORT=5001
FRONTEND_ORIGIN=https://your-frontend.onrender.com
```

## Déploiement sur Render.com

1. Créez un nouveau Web Service
2. Configurez les variables d'environnement suivantes :

### Variables Requises pour Render.com
- `CHROME_BIN=/usr/bin/google-chrome-stable`
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`
- `PDF_STORAGE_PATH=./generated-pdfs`
- `PDF_TEMPLATE_PATH=./templates/devis-pdf.ejs`
- `PORT=5001`

### Commandes de Build
```bash
npm install
```

### Commande de Démarrage
```bash
node server.js
```

## Configuration Gmail

1. Activez "Access moins sécurisé" ou utilisez un mot de passe d'application
2. Utilisez le mot de passe d'application dans `SMTP_PASS`

## Structure des Dossiers
```
backend/
├── generated-pdfs/    # PDFs générés
├── templates/         # Templates EJS
│   └── devis-pdf.ejs # Template de devis
├── server.js         # Serveur principal
└── .env             # Configuration locale
```

## Notes Importantes
1. Les PDFs sont générés dans le dossier `generated-pdfs`
2. Le template de devis doit être dans `templates/devis-pdf.ejs`
3. Sur Render.com, Chrome est préinstallé à `/usr/bin/google-chrome-stable`
4. Le port par défaut est 5001

## Tests
Pour tester l'envoi d'emails et la génération de PDFs :
```bash
node test/test-simple.js
```
