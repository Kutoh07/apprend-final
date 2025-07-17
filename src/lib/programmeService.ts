// app/lib/programmeService.ts

import { ProgrammeData, SubPart, SubPartField, SUBPARTS_CONFIG } from './types/programme';

class ProgrammeService {
  private STORAGE_KEY = 'programme_data';

  // Initialiser les données du programme pour un utilisateur
  initializeProgramme(userId: string): ProgrammeData {
    const subParts: SubPart[] = SUBPARTS_CONFIG.map(config => ({
      ...config,
      fields: [],
      completed: false,
      progress: 0
    }));

    const programmeData: ProgrammeData = {
      userId,
      subParts,
      currentSubPart: 0,
      overallProgress: 0,
      lastUpdated: new Date()
    };

    this.saveProgramme(programmeData);
    return programmeData;
  }

  // Récupérer les données du programme
  getProgramme(userId: string): ProgrammeData | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    // Convertir les dates string en objets Date
    data.lastUpdated = new Date(data.lastUpdated);
    if (data.completedAt) data.completedAt = new Date(data.completedAt);
    
    data.subParts.forEach((part: SubPart) => {
      part.fields.forEach((field: SubPartField) => {
        field.createdAt = new Date(field.createdAt);
      });
    });
    
    return data;
  }

  // Sauvegarder les données du programme
  saveProgramme(data: ProgrammeData): void {
    if (typeof window === 'undefined') return;
    
    data.lastUpdated = new Date();
    localStorage.setItem(`${this.STORAGE_KEY}_${data.userId}`, JSON.stringify(data));
  }

  // Ajouter un champ à une sous-partie
  addField(userId: string, subPartId: number, value: string): ProgrammeData | null {
    const programme = this.getProgramme(userId);
    if (!programme) return null;

    const subPart = programme.subParts.find(part => part.id === subPartId);
    if (!subPart) return null;

    // Vérifier la limite max
    if (subPart.maxFields && subPart.fields.length >= subPart.maxFields) {
      throw new Error(`Maximum ${subPart.maxFields} entrées autorisées`);
    }

    const newField: SubPartField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      value,
      createdAt: new Date()
    };

    subPart.fields.push(newField);
    this.updateProgress(programme, subPartId);
    
    this.saveProgramme(programme);
    return programme;
  }

  // Supprimer un champ
  removeField(userId: string, subPartId: number, fieldId: string): ProgrammeData | null {
    const programme = this.getProgramme(userId);
    if (!programme) return null;

    const subPart = programme.subParts.find(part => part.id === subPartId);
    if (!subPart) return null;

    subPart.fields = subPart.fields.filter(field => field.id !== fieldId);
    this.updateProgress(programme, subPartId);
    
    this.saveProgramme(programme);
    return programme;
  }

  // Mettre à jour la progression
  private updateProgress(programme: ProgrammeData, subPartId: number): void {
    const subPart = programme.subParts.find(part => part.id === subPartId);
    if (!subPart) return;

    // Calculer la progression de la sous-partie
    const minFields = subPart.minFields || 1;
    const currentFields = subPart.fields.length;
    
    if (currentFields >= minFields) {
      subPart.progress = 100;
      subPart.completed = true;
    } else {
      subPart.progress = Math.round((currentFields / minFields) * 100);
      subPart.completed = false;
    }

    // Calculer la progression globale
    const totalProgress = programme.subParts.reduce((acc, part) => acc + part.progress, 0);
    programme.overallProgress = Math.round(totalProgress / programme.subParts.length);

    // Vérifier si tout est complété
    if (programme.overallProgress === 100 && !programme.completedAt) {
      programme.completedAt = new Date();
    }
  }

  // Vérifier si une sous-partie est accessible
  canAccessSubPart(userId: string, subPartId: number): boolean {
    const programme = this.getProgramme(userId);
    if (!programme) return false;

    // La première partie est toujours accessible
    if (subPartId === 1) return true;

    // Les autres nécessitent que la précédente soit complétée
    const previousPart = programme.subParts.find(part => part.id === subPartId - 1);
    return previousPart?.completed || false;
  }

  // Obtenir la prochaine sous-partie non complétée
  getNextIncompleteSubPart(userId: string): SubPart | null {
    const programme = this.getProgramme(userId);
    if (!programme) return null;

    return programme.subParts.find(part => !part.completed) || null;
  }

  // Réinitialiser une sous-partie
  resetSubPart(userId: string, subPartId: number): ProgrammeData | null {
    const programme = this.getProgramme(userId);
    if (!programme) return null;

    const subPart = programme.subParts.find(part => part.id === subPartId);
    if (!subPart) return null;

    subPart.fields = [];
    subPart.completed = false;
    subPart.progress = 0;

    // Réinitialiser aussi toutes les sous-parties suivantes
    programme.subParts.forEach(part => {
      if (part.id > subPartId) {
        part.fields = [];
        part.completed = false;
        part.progress = 0;
      }
    });

    // Recalculer la progression globale
    const totalProgress = programme.subParts.reduce((acc, part) => acc + part.progress, 0);
    programme.overallProgress = Math.round(totalProgress / programme.subParts.length);
    programme.completedAt = undefined;

    this.saveProgramme(programme);
    return programme;
  }
}

export const programmeService = new ProgrammeService();