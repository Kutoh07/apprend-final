# 🔧 Guide de Configuration OAuth Google - Supabase

## Problème : Impossible de se connecter via Google OAuth

### Étapes de diagnostic et résolution

#### 1. 🔍 Utiliser le diagnostic intégré
1. Allez sur la page `/auth`
2. Cliquez sur le bouton rouge "🔍 Diagnostic OAuth (DEV ONLY)"
3. Ouvrez la console du navigateur (F12)
4. Analysez les logs pour identifier le problème

#### 2. ⚙️ Vérifier la configuration Supabase Dashboard

##### A. Configuration du Provider Google
1. Allez dans votre **Supabase Dashboard**
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers**
4. Trouvez **Google** et cliquez sur **Configure**

##### B. Paramètres requis :
```
✅ Google enabled: TRUE
✅ Client ID: [Votre Google Client ID]
✅ Client Secret: [Votre Google Client Secret]
```

##### C. Redirect URLs (TRÈS IMPORTANT) :

**Configuration Google Cloud Console :**
```
https://[votre-projet-supabase].supabase.co/auth/v1/callback
```

**Configuration Supabase Dashboard :**
```
http://localhost:3000/dashboard
https://[votre-domaine]/dashboard
```

⚠️ **ATTENTION** : 
- Dans Google Cloud Console : Utilisez l'URL Supabase officielle
- Dans Supabase Dashboard : Utilisez votre URL de destination finale

#### 3. 🔑 Configuration Google Cloud Console

##### A. Créer/Vérifier les credentials OAuth :
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet ou créez-en un
3. Activez l'API **Google+ API** ou **Google People API**
4. Allez dans **APIs & Services** > **Credentials**
5. Créez un **OAuth 2.0 Client ID** de type **Web application**

##### B. Configured redirect URIs :

**Dans Google Cloud Console > Credentials > OAuth 2.0 Client IDs :**
```
https://[votre-projet-supabase].supabase.co/auth/v1/callback
```

**Exemple concret :**
Si votre URL Supabase est `https://abcdefgh.supabase.co`, alors utilisez :
```
https://abcdefgh.supabase.co/auth/v1/callback
```

⚠️ **NE PAS utiliser** votre domaine Next.js ici !

#### 4. 🌐 Variables d'environnement

Vérifiez votre fichier `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://[votre-projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre-clé-publique]
```

#### 5. 🚨 Erreurs courantes et solutions

##### Erreur : `invalid_request` / `redirect_uri_mismatch`
**Solution :** 
- Vérifiez que l'URL de redirection dans Google Cloud Console correspond exactement
- Format exact : `https://[projet].supabase.co/auth/v1/callback`

##### Erreur : `no-code-received`
**Solution :** 
- **Problème principal** : Mauvaise configuration de l'URL de redirection
- **Action 1** : Dans Google Cloud Console, utilisez UNIQUEMENT l'URL Supabase officielle :
  ```
  https://[votre-projet].supabase.co/auth/v1/callback
  ```
- **Action 2** : Dans votre code, utilisez `redirectTo` vers votre page de destination :
  ```javascript
  redirectTo: `${window.location.origin}/dashboard`
  ```
- **Action 3** : Supprimez toute route `/auth/callback` personnalisée
- **Action 4** : Videz le cache du navigateur et retestez

##### Erreur : `access_denied`
**Solution :** 
- L'utilisateur a refusé l'autorisation
- Vérifiez les scopes demandés
- Assurez-vous que l'app Google Cloud est en production ou que l'utilisateur est dans les testeurs

##### Erreur : `Session exchange failed`
**Solution :** 
- Vérifiez le Client Secret dans Supabase
- Vérifiez que les APIs Google sont activées
- Contrôlez les logs dans Supabase Dashboard > Logs

#### 6. 🧪 Test étape par étape

##### Test 1 : Configuration de base
```javascript
// Dans la console du navigateur
window.diagnoseProblem.checkSupabaseConfig()
```

##### Test 2 : Connexion Supabase
```javascript
window.diagnoseProblem.testConnection()
```

##### Test 3 : OAuth Google
```javascript
window.diagnoseProblem.testGoogleOAuth()
```

#### 7. 📋 Checklist finale

- [ ] Google Cloud Console : Projet créé et APIs activées
- [ ] Google Cloud Console : OAuth Client ID configuré avec bonnes URLs
- [ ] Supabase Dashboard : Provider Google activé
- [ ] Supabase Dashboard : Client ID et Secret configurés
- [ ] Supabase Dashboard : Redirect URLs ajoutées
- [ ] Variables d'environnement : Correctement définies
- [ ] Application : Redémarrage après changement de config

#### 8. 🚀 Test final

1. Videz le cache du navigateur
2. Redémarrez votre application Next.js
3. Testez la connexion Google
4. Si problème persiste, utilisez le diagnostic intégré

#### 8. 🚀 Test immédiat après correction

**ÉTAPES CRITIQUES À SUIVRE :**

1. **Trouvez votre URL Supabase** :
   - Allez dans votre Supabase Dashboard
   - Copiez l'URL du projet (ex: `https://abcdefgh.supabase.co`)

2. **Configurez Google Cloud Console** :
   - Allez dans Credentials > OAuth 2.0 Client IDs
   - **Remplacez** l'URL de redirection par :
     ```
     https://[votre-projet-supabase].supabase.co/auth/v1/callback
     ```

3. **Vérifiez Supabase Dashboard** :
   - Authentication > URL Configuration
   - Site URL : `http://localhost:3000` (développement)
   - Redirect URLs : `http://localhost:3000/dashboard`

4. **Testez** :
   - Redémarrez votre application : `npm run dev`
   - **Videz le cache du navigateur :**
     - **Méthode rapide :** `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
     - **Méthode complète :** `Ctrl + Shift + Delete` → Sélectionnez "Cache" → Effacer
     - **Chrome :** F12 → Clic droit sur 🔄 → "Vider le cache et actualisation forcée"
   - Testez la connexion Google
   - Si erreur persiste, refaites le diagnostic

### 📞 Support

Si le problème persiste après toutes ces vérifications :
1. Exportez les logs du diagnostic
2. Vérifiez les logs Supabase Dashboard
3. Contrôlez la configuration Google Cloud Console
4. Supprimez le bouton de diagnostic en production

---

**Note :** Le bouton de diagnostic ne s'affiche qu'en mode développement et doit être supprimé avant le déploiement en production.
