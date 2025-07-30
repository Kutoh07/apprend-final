# 🛠️ Guide de Configuration - Table retention_validation

## 🎯 Problème

Vous recevez ces erreurs dans la console :
- `❌ Erreur lors de la création: {}`
- `❌ Erreur lors du chargement de l'état: {}`

**Cause :** La table `retention_validation` n'existe pas dans votre base de données Supabase.

## ✅ Solution en 3 étapes

### Étape 1 : Aller dans Supabase
1. Ouvrez [Supabase](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Exécuter le script SQL
1. Cliquez sur **New Query**
2. Copiez-collez tout le contenu du fichier `retention_validation_schema.sql`
3. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 3 : Vérifier la création
1. Allez dans **Database** > **Tables**
2. Vérifiez que la table `retention_validation` apparaît
3. Rafraîchissez votre application

## 📋 Script SQL à exécuter

```sql
-- Table pour suivre la validation progressive de l'écran de rétention
CREATE TABLE retention_validation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progression dans le stepper
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
  completed_steps INTEGER[] DEFAULT '{}',
  
  -- Timestamps pour chaque étape
  step_1_completed_at TIMESTAMP WITH TIME ZONE,
  step_2_completed_at TIMESTAMP WITH TIME ZONE,
  step_3_completed_at TIMESTAMP WITH TIME ZONE,
  step_4_completed_at TIMESTAMP WITH TIME ZONE,
  step_5_completed_at TIMESTAMP WITH TIME ZONE,
  step_6_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Statut global
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  UNIQUE(user_id)
);

-- RLS (Row Level Security)
ALTER TABLE retention_validation ENABLE ROW LEVEL SECURITY;

-- Policies de sécurité
CREATE POLICY "Users can view own retention validation" ON retention_validation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retention validation" ON retention_validation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retention validation" ON retention_validation
  FOR UPDATE USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX idx_retention_validation_user_id ON retention_validation(user_id);
CREATE INDEX idx_retention_validation_current_step ON retention_validation(current_step);
CREATE INDEX idx_retention_validation_completed ON retention_validation(is_completed);
```

## 🔧 Résolution des autres erreurs

### Erreur Renaissance "❌ Erreur axes: {}"
Cette erreur vient du dashboard qui essaie de charger les axes Renaissance. Elle sera résolue une fois que :
1. La table `retention_validation` existe
2. L'utilisateur a terminé le parcours de rétention

### Vérification que tout fonctionne
1. Ouvrez la console du navigateur (F12)
2. Allez sur `/programme/retention`
3. Vous devriez voir des logs détaillés au lieu d'erreurs vides

## 📞 Support

Si vous continuez à avoir des problèmes :
1. Vérifiez que votre utilisateur Supabase a les bonnes permissions
2. Assurez-vous que RLS est bien configuré
3. Consultez les logs Supabase dans l'onglet Logs

Une fois la table créée, le stepper de rétention fonctionnera parfaitement ! 🎉
