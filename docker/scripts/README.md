# 🔐 Gestion des Secrets - TopBudget

Ce répertoire contient les scripts et outils pour la gestion sécurisée des secrets Docker dans TopBudget.

## 📋 Vue d'ensemble

Le système de gestion des secrets TopBudget fournit :

- **Chiffrement AES-256-GCM** pour tous les secrets
- **Rotation automatique** des secrets avec versioning
- **Sauvegarde chiffrée** et restauration
- **Monitoring** et notifications
- **Intégration Docker Secrets** native

## 🛠️ Scripts disponibles

### `manage-secrets.sh`

Script principal pour la gestion manuelle des secrets.

```bash
# Initialiser la clé maître
./manage-secrets.sh init-key

# Créer tous les secrets
./manage-secrets.sh create

# Lister les secrets existants
./manage-secrets.sh list

# Vérifier que tous les secrets requis existent
./manage-secrets.sh verify

# Afficher un secret déchiffré
./manage-secrets.sh show jwt_secret

# Créer une sauvegarde chiffrée
./manage-secrets.sh backup

# Restaurer depuis une sauvegarde
./manage-secrets.sh restore /var/backups/topbudget/secrets/backup_20241217_150000.tar.gz.enc

# Rotation manuelle des secrets
./manage-secrets.sh rotate
```

### `auto-rotate-secrets.sh`

Script pour la rotation automatique et le monitoring.

```bash
# Vérifier l'état des secrets
./auto-rotate-secrets.sh check

# Simulation de rotation (dry-run)
./auto-rotate-secrets.sh dry-run

# Rotation forcée
./auto-rotate-secrets.sh force

# Configurer les tâches cron automatiques
./auto-rotate-secrets.sh schedule

# Afficher le statut complet
./auto-rotate-secrets.sh status
```

### `update-secret-versions.sh`

Utilitaire pour mettre à jour les versions dans docker-compose.yml.

```bash
# Mettre à jour de v1 vers v2
./update-secret-versions.sh v1 v2
```

## 🔧 Architecture

### Chiffrement

- **Algorithme** : AES-256-GCM avec authentification
- **Dérivation de clé** : PBKDF2 avec 100,000 itérations
- **Clé maître** : 256 bits stockée dans `/etc/topbudget/master.key`
- **Salts** : Aléatoires pour chaque chiffrement

### Structure des fichiers

```
/etc/topbudget/
├── master.key                 # Clé maître (permissions 600)

/var/lib/docker/topbudget/secrets/
├── jwt_secret_v1.json         # Secret JWT chiffré
├── mongo_root_username_v1.json
├── mongo_root_password_v1.json
├── mongo_uri_v1.json
└── secrets_summary_v1.json    # Résumé et checksums

/var/backups/topbudget/secrets/
├── backup_20241217_150000.tar.gz.enc
└── backup_20241217_180000.tar.gz.enc

/var/log/topbudget/
└── secret-rotation.log        # Logs de rotation
```

## 🔄 Politique de rotation

| Secret               | Rotation | Notification  |
| -------------------- | -------- | ------------- |
| JWT Secret           | 90 jours | 7 jours avant |
| Mot de passe MongoDB | 30 jours | 7 jours avant |

### Rotation automatique

La rotation automatique est configurée via cron :

- **Vérification quotidienne** : 02h00
- **Rotation automatique** : Dimanche 03h00
- **Monitoring** : Toutes les 6h

## 🚀 Installation et configuration

### 1. Configuration initiale

```bash
# Rendre les scripts exécutables
chmod +x manage-secrets.sh auto-rotate-secrets.sh update-secret-versions.sh

# Initialiser la clé maître
sudo ./manage-secrets.sh init-key

# Créer les premiers secrets
sudo ./manage-secrets.sh create
```

### 2. Configuration des tâches automatiques

```bash
# Configurer les tâches cron
sudo ./auto-rotate-secrets.sh schedule

# Redémarrer le service cron
sudo systemctl restart cron
```

### 3. Vérification

```bash
# Vérifier que tous les secrets existent
./manage-secrets.sh verify

# Vérifier l'état de rotation
./auto-rotate-secrets.sh status
```

## 🔒 Sécurité

### Permissions des fichiers

- **Clé maître** : `root:root 600`
- **Secrets chiffrés** : `root:root 600`
- **Scripts** : `root:root 755`
- **Logs** : `root:adm 640`

### Bonnes pratiques

1. **Sauvegardez la clé maître** dans un coffre-fort séparé
2. **Testez les restaurations** régulièrement
3. **Surveillez les logs** de rotation
4. **Rotation d'urgence** en cas de compromission
5. **Accès limité** aux serveurs de production

### Procédure d'urgence

En cas de compromission suspectée :

```bash
# 1. Rotation immédiate
./manage-secrets.sh rotate

# 2. Mise à jour Docker Compose
./update-secret-versions.sh v1 v2

# 3. Redémarrage des services
docker compose -f docker-compose.prod.yml restart

# 4. Notification des équipes
# (configurer les webhooks dans auto-rotate-secrets.sh)
```

## 📊 Monitoring

### Logs

Les logs de rotation sont dans `/var/log/topbudget/secret-rotation.log`.

Format des logs :

```
[2024-12-17 15:30:00] [INFO] Début de la rotation automatique des secrets
[2024-12-17 15:30:05] [SUCCESS] JWT secret rotationné avec succès
[2024-12-17 15:30:10] [INFO] Redémarrage des services Docker...
```

### Notifications

Les notifications peuvent être configurées dans `auto-rotate-secrets.sh` :

- Email SMTP
- Webhooks Slack/Teams
- Syslog
- Monitoring personnalisé

## 🧪 Tests

### Test de rotation complète

```bash
# 1. Backup actuel
./manage-secrets.sh backup

# 2. Test de rotation
./auto-rotate-secrets.sh dry-run

# 3. Rotation réelle
./auto-rotate-secrets.sh rotate

# 4. Vérification
./manage-secrets.sh verify
docker compose -f docker-compose.prod.yml ps
```

### Test de restauration

```bash
# 1. Identifier une sauvegarde
ls -la /var/backups/topbudget/secrets/

# 2. Test de restauration
./manage-secrets.sh restore /var/backups/topbudget/secrets/backup_YYYYMMDD_HHMMSS.tar.gz.enc

# 3. Vérification
./manage-secrets.sh verify
```

## 🔧 Dépannage

### Erreurs courantes

**Clé maître non trouvée**

```bash
./manage-secrets.sh init-key
```

**Permissions incorrectes**

```bash
sudo chown -R root:root /var/lib/docker/topbudget/secrets/
sudo chmod 600 /var/lib/docker/topbudget/secrets/*.json
```

**Secrets corrompus**

```bash
# Restaurer depuis la dernière sauvegarde
./manage-secrets.sh restore $(ls -t /var/backups/topbudget/secrets/*.tar.gz.enc | head -1)
```

**Service ne démarre pas après rotation**

```bash
# Vérifier les logs Docker
docker compose -f docker-compose.prod.yml logs

# Revenir à la version précédente
./update-secret-versions.sh v2 v1
docker compose -f docker-compose.prod.yml restart
```

## 📚 Référence des formats

### Format JSON des secrets

```json
{
  "name": "jwt_secret",
  "version": "v1",
  "full_name": "topbudget_jwt_secret_v1",
  "encrypted_value": "salt:iv:encrypted_data",
  "created_at": "2024-12-17T15:30:00+01:00",
  "algorithm": "AES-256-GCM",
  "checksum": "sha256_hash_of_plaintext"
}
```

### Format de sauvegarde

- **Archive** : tar.gz des fichiers JSON
- **Chiffrement** : AES-256-CBC avec PBKDF2
- **Nom** : `backup_YYYYMMDD_HHMMSS.tar.gz.enc`

---

## 📞 Support

En cas de problème avec la gestion des secrets :

1. **Vérifiez les logs** : `/var/log/topbudget/secret-rotation.log`
2. **Testez la connectivité** : `./manage-secrets.sh verify`
3. **Consultez la documentation** Docker Secrets
4. **Contactez l'équipe infrastructure** pour les urgences
