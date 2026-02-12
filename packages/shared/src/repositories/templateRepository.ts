import { getSupabase, isAuthenticated, getCurrentUser } from '../lib/supabase';
import {
  getTemplates as getLocalTemplates,
  saveTemplates as saveLocalTemplates,
} from '../storage/chromeStorage';
import type { Template } from '../types/template';
import { dbTemplateToTemplate, templateToDbInsert } from '../types/database';
import { trackEventAsync } from './eventRepository';

export async function getTemplates(): Promise<Template[]> {
  if (!(await isAuthenticated())) {
    return getLocalTemplates();
  }

  const user = await getCurrentUser();
  if (!user) return getLocalTemplates();

  const { data, error } = await getSupabase()
    .from('templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get templates: ${error.message}`);
  }

  return (data ?? []).map(dbTemplateToTemplate);
}

export async function addTemplate(template: Template): Promise<void> {
  if (!(await isAuthenticated())) {
    const templates = await getLocalTemplates();
    templates.push(template);
    return saveLocalTemplates(templates);
  }

  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await getSupabase()
    .from('templates')
    .insert(templateToDbInsert(template, user.id));

  if (error) {
    throw new Error(`Failed to add template: ${error.message}`);
  }

  trackEventAsync('template.create', { templateId: template.id });
}

export async function updateTemplate(template: Template): Promise<void> {
  if (!(await isAuthenticated())) {
    const templates = await getLocalTemplates();
    const index = templates.findIndex((t) => t.id === template.id);
    if (index !== -1) {
      templates[index] = { ...template, updatedAt: new Date().toISOString() };
      return saveLocalTemplates(templates);
    }
    return;
  }

  const { error } = await getSupabase()
    .from('templates')
    .update({
      type: template.type,
      title: template.title,
      content_200: template.content200 ?? null,
      content_400: template.content400 ?? null,
      content_600: template.content600 ?? null,
    })
    .eq('id', template.id);

  if (error) {
    throw new Error(`Failed to update template: ${error.message}`);
  }

  trackEventAsync('template.update', { templateId: template.id });
}

export async function deleteTemplate(id: string): Promise<void> {
  if (!(await isAuthenticated())) {
    const templates = await getLocalTemplates();
    return saveLocalTemplates(templates.filter((t) => t.id !== id));
  }

  const { error } = await getSupabase()
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }

  trackEventAsync('template.delete', { templateId: id });
}
