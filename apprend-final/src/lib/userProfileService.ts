import { supabase } from './supabase';
import { UserData } from '../app/personalisation/page';
import {
  getProfessionLabelFromValue,
  getCountryLabelFromValue,
} from './dataMappings';

export interface UserProfile extends UserData {
  id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserProfileService {
  
  // Sauvegarder ou mettre à jour le profil utilisateur
  static async saveUserProfile(userData: UserData): Promise<{ data: UserProfile | null, error: any }> {
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: 'Utilisateur non connecté' };
      }

      // Vérifier si un profil existe déjà
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const profileData = {
        user_id: user.id,
        name: userData.name,
        birth_year: userData.birthYear,
        profession: getProfessionLabelFromValue(userData.profession),
        gender: userData.gender || null,
        phone: userData.phone || null,
        country: userData.country ? getCountryLabelFromValue(userData.country) : null,
        updated_at: new Date().toISOString()
      };

      if (existingProfile) {
        // Mettre à jour le profil existant
        const { data, error } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id)
          .select()
          .single();

        return { data, error };
      } else {
        // Créer un nouveau profil
        const { data, error } = await supabase
          .from('user_profiles')
          .insert([profileData])
          .select()
          .single();

        return { data, error };
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return { data: null, error };
    }
  }

  // Récupérer le profil utilisateur
  static async getUserProfile(): Promise<{ data: UserProfile | null, error: any }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: 'Utilisateur non connecté' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return { data: null, error };
    }
  }

  // Supprimer le profil utilisateur
  static async deleteUserProfile(): Promise<{ error: any }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { error: 'Utilisateur non connecté' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      return { error };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return { error };
    }
  }
}