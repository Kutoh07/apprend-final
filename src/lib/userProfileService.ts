// src/lib/userProfileService.ts

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
  static async saveUserProfile(userData: UserData): Promise<{ data?: UserProfile; error?: any }> {
    try {
      console.log('💾 Sauvegarde profil utilisateur:', userData);
      
      // Récupérer l'utilisateur connecté
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Utilisateur non connecté');
      }

      const userId = session.user.id;
      
      // Vérifier si un profil existe déjà
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Préparer les données pour la base
      const profileData = {
        user_id: userId,
        name: userData.name,
        birth_year: userData.birthYear, // Sauvegarder l'année de naissance
        profession: getProfessionLabelFromValue(userData.profession),
        gender: userData.gender || null,
        phone: userData.phone || null,
        country: userData.country ? getCountryLabelFromValue(userData.country) : null,
        updated_at: new Date().toISOString()
      };

      let data, error;

      if (existingProfile) {
        // Mettre à jour le profil existant
        const result = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', userId)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Créer un nouveau profil
        const result = await supabase
          .from('user_profiles')
          .insert([profileData])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Profil sauvegardé avec succès:', data);
      return { data };
      
    } catch (error) {
      console.error('💥 Erreur lors de la sauvegarde:', error);
      return { error };
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

      // Adapter la structure pour correspondre à UserProfile
      if (data) {
        const userProfile: UserProfile = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          birthYear: data.birth_year, // Mapper birth_year vers birthYear
          profession: data.profession,
          gender: data.gender,
          phone: data.phone,
          country: data.country,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        return { data: userProfile, error: null };
      }

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