-- Migration pour les tables d'évolution et de gamification
-- À exécuter dans Supabase SQL Editor

-- Tables pour le système d'évolution et de gamification

-- Table pour stocker les achievements/récompenses des utilisateurs
CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('streak', 'completion', 'milestone', 'time_based', 'special')),
  rarity INTEGER NOT NULL CHECK (rarity >= 1 AND rarity <= 5),
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  icon VARCHAR(100),
  color VARCHAR(50),
  requirement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Table pour stocker les données de séries temporelles d'activité
CREATE TABLE user_activity_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_count INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('programme', 'renaissance', 'global')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date, activity_type)
);

-- Table pour stocker les statistiques de motivation calculées
CREATE TABLE user_motivation_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Séries et objectifs
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  weekly_goal_progress INTEGER DEFAULT 0 CHECK (weekly_goal_progress >= 0 AND weekly_goal_progress <= 100),
  
  -- Améliorations
  accuracy_improvement DECIMAL(5,2) DEFAULT 0,
  speed_improvement DECIMAL(5,2) DEFAULT 0,
  consistency_score DECIMAL(5,2) DEFAULT 0,
  
  -- Temps total investi (en minutes)
  total_time_invested INTEGER DEFAULT 0,
  
  -- Statistiques par période
  this_week_activities INTEGER DEFAULT 0,
  this_month_activities INTEGER DEFAULT 0,
  total_activities INTEGER DEFAULT 0,
  
  -- Timestamps
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Table pour stocker les données de heatmap d'activité
CREATE TABLE user_activity_heatmap (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_count INTEGER DEFAULT 0,
  activity_level INTEGER DEFAULT 0 CHECK (activity_level >= 0 AND activity_level <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- RLS (Row Level Security) pour toutes les tables
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_motivation_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_heatmap ENABLE ROW LEVEL SECURITY;

-- Policies pour user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour user_activity_timeline
CREATE POLICY "Users can view own activity timeline" ON user_activity_timeline
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity timeline" ON user_activity_timeline
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity timeline" ON user_activity_timeline
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour user_motivation_stats
CREATE POLICY "Users can view own motivation stats" ON user_motivation_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own motivation stats" ON user_motivation_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own motivation stats" ON user_motivation_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour user_activity_heatmap
CREATE POLICY "Users can view own activity heatmap" ON user_activity_heatmap
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity heatmap" ON user_activity_heatmap
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity heatmap" ON user_activity_heatmap
  FOR UPDATE USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(user_id, unlocked);
CREATE INDEX idx_user_activity_timeline_user_date ON user_activity_timeline(user_id, date DESC);
CREATE INDEX idx_user_motivation_stats_user_id ON user_motivation_stats(user_id);
CREATE INDEX idx_user_activity_heatmap_user_date ON user_activity_heatmap(user_id, date DESC);

-- Trigger pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_motivation_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_motivation_stats_updated_at
  BEFORE UPDATE ON user_motivation_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_motivation_stats_updated_at();

-- Fonction pour initialiser les achievements par défaut pour un utilisateur
CREATE OR REPLACE FUNCTION initialize_user_achievements(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Achievements de série (streak)
  INSERT INTO user_achievements (user_id, achievement_id, title, description, type, rarity, icon, color, requirement) VALUES
  (p_user_id, 'streak_3_days', 'Première série', 'Connectez-vous 3 jours consécutifs', 'streak', 1, 'flame', 'orange', '3 jours consécutifs'),
  (p_user_id, 'streak_7_days', 'Une semaine forte', 'Connectez-vous 7 jours consécutifs', 'streak', 2, 'flame', 'orange', '7 jours consécutifs'),
  (p_user_id, 'streak_30_days', 'Mois de détermination', 'Connectez-vous 30 jours consécutifs', 'streak', 4, 'flame', 'orange', '30 jours consécutifs'),
  
  -- Achievements de completion
  (p_user_id, 'first_module', 'Premier pas', 'Complétez votre premier module', 'completion', 1, 'trophy', 'gold', '1 module complété'),
  (p_user_id, 'half_programme', 'À mi-chemin', 'Complétez 50% du programme', 'completion', 3, 'trophy', 'gold', '50% du programme'),
  (p_user_id, 'programme_complete', 'Maître du programme', 'Complétez 100% du programme', 'completion', 5, 'trophy', 'gold', '100% du programme'),
  
  -- Achievements de milestone
  (p_user_id, 'first_renaissance', 'Renaissance découverte', 'Complétez votre première session Renaissance', 'milestone', 2, 'star', 'purple', '1 session Renaissance'),
  (p_user_id, 'time_master', 'Maître du temps', 'Investissez 10 heures dans votre développement', 'time_based', 3, 'clock', 'blue', '10 heures investies'),
  
  -- Achievement spécial
  (p_user_id, 'perfectionist', 'Perfectionniste', 'Atteignez 95% de précision moyenne', 'special', 4, 'award', 'green', '95% de précision');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques d'activité
CREATE OR REPLACE FUNCTION update_user_activity_stats(p_user_id UUID, p_activity_type VARCHAR(50))
RETURNS VOID AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  activity_count INTEGER;
BEGIN
  -- Mettre à jour ou insérer dans user_activity_timeline
  INSERT INTO user_activity_timeline (user_id, date, activity_count, activity_type)
  VALUES (p_user_id, today_date, 1, p_activity_type)
  ON CONFLICT (user_id, date, activity_type)
  DO UPDATE SET 
    activity_count = user_activity_timeline.activity_count + 1;
  
  -- Calculer le niveau d'activité pour la heatmap (0-4)
  SELECT activity_count INTO activity_count
  FROM user_activity_timeline 
  WHERE user_id = p_user_id AND date = today_date AND activity_type = p_activity_type;
  
  -- Mettre à jour la heatmap
  INSERT INTO user_activity_heatmap (user_id, date, activity_count, activity_level)
  VALUES (p_user_id, today_date, activity_count, LEAST(activity_count, 4))
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    activity_count = EXCLUDED.activity_count,
    activity_level = LEAST(EXCLUDED.activity_count, 4);
    
  -- Mettre à jour les statistiques de motivation
  INSERT INTO user_motivation_stats (user_id, total_activities, last_activity_date)
  VALUES (p_user_id, 1, today_date)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_activities = user_motivation_stats.total_activities + 1,
    last_activity_date = today_date,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
