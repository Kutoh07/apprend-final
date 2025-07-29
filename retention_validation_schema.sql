-- Table pour suivre la validation progressive de l'écran de rétention
-- Cette table permet de sauvegarder l'état d'avancement de l'utilisateur dans le stepper

CREATE TABLE retention_validation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progression dans le stepper
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 6),
  completed_steps INTEGER[] DEFAULT '{}',
  
  -- Timestamps pour chaque étape
  step_1_completed_at TIMESTAMP WITH TIME ZONE, -- Félicitations
  step_2_completed_at TIMESTAMP WITH TIME ZONE, -- C'est quoi la suite
  step_3_completed_at TIMESTAMP WITH TIME ZONE, -- Objectif module renaissance
  step_4_completed_at TIMESTAMP WITH TIME ZONE, -- Pourquoi crucial
  step_5_completed_at TIMESTAMP WITH TIME ZONE, -- Résultats recherchés
  step_6_completed_at TIMESTAMP WITH TIME ZONE, -- Comment se déroule le module
  
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

-- Policy pour que les utilisateurs ne voient que leurs propres données
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

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_retention_validation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Si l'étape courante change, marquer l'étape précédente comme complétée
  IF NEW.current_step != OLD.current_step THEN
    NEW.completed_steps = array_append(NEW.completed_steps, OLD.current_step);
    
    -- Mettre à jour le timestamp spécifique de l'étape
    CASE OLD.current_step
      WHEN 1 THEN NEW.step_1_completed_at = NOW();
      WHEN 2 THEN NEW.step_2_completed_at = NOW();
      WHEN 3 THEN NEW.step_3_completed_at = NOW();
      WHEN 4 THEN NEW.step_4_completed_at = NOW();
      WHEN 5 THEN NEW.step_5_completed_at = NOW();
      WHEN 6 THEN NEW.step_6_completed_at = NOW();
    END CASE;
  END IF;
  
  -- Si toutes les étapes sont complétées
  IF NEW.current_step > 6 OR (NEW.step_6_completed_at IS NOT NULL AND NEW.is_completed = FALSE) THEN
    NEW.is_completed = TRUE;
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_retention_validation_updated_at
  BEFORE UPDATE ON retention_validation
  FOR EACH ROW
  EXECUTE FUNCTION update_retention_validation_updated_at();

-- Fonction helper pour initialiser ou récupérer l'état de validation
CREATE OR REPLACE FUNCTION get_or_create_retention_validation(p_user_id UUID)
RETURNS retention_validation AS $$
DECLARE
  validation_record retention_validation;
BEGIN
  -- Essayer de récupérer l'enregistrement existant
  SELECT * INTO validation_record 
  FROM retention_validation 
  WHERE user_id = p_user_id;
  
  -- Si pas trouvé, créer un nouvel enregistrement
  IF NOT FOUND THEN
    INSERT INTO retention_validation (user_id, current_step)
    VALUES (p_user_id, 1)
    RETURNING * INTO validation_record;
  END IF;
  
  RETURN validation_record;
END;
$$ LANGUAGE plpgsql;
