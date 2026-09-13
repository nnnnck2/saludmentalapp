import { supabase } from '../lib/supabase';
import { MoodEntry, MoodLevel } from '../types';

export const moodTrackerService = {
  async getEntries(userId: string, limit = 30): Promise<MoodEntry[]> {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async createEntry(entry: {
    user_id: string;
    mood: MoodLevel;
    note?: string;
    activities?: string[];
  }) {
    const { data, error } = await supabase
      .from('mood_entries')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getWeekSummary(userId: string): Promise<MoodEntry[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getMonthSummary(userId: string): Promise<MoodEntry[]> {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', monthAgo.toISOString())
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  getAverageMood(entries: MoodEntry[]): number {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + e.mood, 0);
    return Math.round((sum / entries.length) * 10) / 10;
  },

  getMoodDistribution(entries: MoodEntry[]): Record<number, number> {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    entries.forEach((e) => {
      distribution[e.mood] = (distribution[e.mood] || 0) + 1;
    });
    return distribution;
  },
};
