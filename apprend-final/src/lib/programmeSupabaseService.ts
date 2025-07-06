import { supabase } from './supabase';
import { ProgrammeData, SubPart, SUBPARTS_CONFIG, SubPartField } from './types/programme';

class ProgrammeSupabaseService {
  async getProgramme(userId: string): Promise<ProgrammeData | null> {
    const { data: programmeRow } = await supabase
      .from('user_programmes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!programmeRow) return null;

    const { data: entries } = await supabase
      .from('programme_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    const subParts: SubPart[] = SUBPARTS_CONFIG.map(config => ({
      ...config,
      fields: [],
      completed: false,
      progress: 0
    }));

    entries?.forEach(entry => {
      const part = subParts.find(p => p.id === entry.subpart_id);
      if (part) {
        const field: SubPartField = {
          id: entry.id,
          value: entry.value,
          createdAt: new Date(entry.created_at)
        };
        part.fields.push(field);
      }
    });

    const programme: ProgrammeData = {
      userId,
      subParts,
      currentSubPart: programmeRow.current_subpart,
      overallProgress: programmeRow.overall_progress,
      lastUpdated: new Date(programmeRow.last_updated),
      completedAt: programmeRow.completed_at ? new Date(programmeRow.completed_at) : undefined
    };

    subParts.forEach(part => {
      const min = part.minFields || 1;
      part.progress = Math.min(100, Math.round((part.fields.length / min) * 100));
      part.completed = part.progress >= 100;
    });
    const total = subParts.reduce((acc, p) => acc + p.progress, 0);
    programme.overallProgress = Math.round(total / subParts.length);

    return programme;
  }

  async saveProgramme(programme: ProgrammeData): Promise<void> {
    await supabase
      .from('user_programmes')
      .upsert({
        user_id: programme.userId,
        overall_progress: programme.overallProgress,
        current_subpart: programme.currentSubPart,
        last_updated: new Date().toISOString(),
        completed_at: programme.completedAt ? programme.completedAt.toISOString() : null
      });
  }

  async addField(userId: string, subPartId: number, value: string): Promise<void> {
    await supabase
      .from('programme_entries')
      .insert({ user_id: userId, subpart_id: subPartId, value });
  }

  async removeField(fieldId: string): Promise<void> {
    await supabase
      .from('programme_entries')
      .delete()
      .eq('id', fieldId);
  }
}

export const programmeSupabaseService = new ProgrammeSupabaseService();
