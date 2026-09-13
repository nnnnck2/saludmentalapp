import { supabase } from '../lib/supabase';
import { EducationalResource, ResourceType } from '../types';

export const resourceService = {
  async getResources(type?: ResourceType): Promise<EducationalResource[]> {
    let query = supabase
      .from('educational_resources')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getResourceById(id: string): Promise<EducationalResource | null> {
    const { data, error } = await supabase
      .from('educational_resources')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async getResourcesByTag(tag: string): Promise<EducationalResource[]> {
    const { data, error } = await supabase
      .from('educational_resources')
      .select('*')
      .eq('is_published', true)
      .contains('tags', [tag])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createResource(resource: Omit<EducationalResource, 'id' | 'created_at' | 'updated_at' | 'is_published'>) {
    const { data, error } = await supabase
      .from('educational_resources')
      .insert({ ...resource, is_published: false })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateResource(id: string, updates: Partial<EducationalResource>) {
    const { data, error } = await supabase
      .from('educational_resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteResource(id: string) {
    const { error } = await supabase
      .from('educational_resources')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
