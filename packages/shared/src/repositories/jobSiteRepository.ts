import { getSupabase, isAuthenticated, getCurrentUser } from '../lib/supabase';
import {
  getJobSites as getLocalJobSites,
  saveJobSites as saveLocalJobSites,
} from '../storage/chromeStorage';
import type { JobSite } from '../types/jobSite';
import { dbToJobSite, jobSiteToDbInsert } from '../types/database';
import { trackEventAsync } from './eventRepository';

export async function getJobSites(): Promise<JobSite[]> {
  if (!(await isAuthenticated())) {
    return getLocalJobSites();
  }

  const user = await getCurrentUser();
  if (!user) return getLocalJobSites();

  const { data, error } = await getSupabase()
    .from('job_sites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get job sites: ${error.message}`);
  }

  return (data ?? []).map(dbToJobSite);
}

export async function addJobSite(site: JobSite): Promise<void> {
  if (!(await isAuthenticated())) {
    const sites = await getLocalJobSites();
    sites.push(site);
    return saveLocalJobSites(sites);
  }

  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await getSupabase()
    .from('job_sites')
    .insert(jobSiteToDbInsert(site, user.id));

  if (error) {
    throw new Error(`Failed to add job site: ${error.message}`);
  }

  trackEventAsync('job_site.create', { siteId: site.id, name: site.name });
}

export async function updateJobSite(site: JobSite): Promise<void> {
  if (!(await isAuthenticated())) {
    const sites = await getLocalJobSites();
    const index = sites.findIndex((s) => s.id === site.id);
    if (index !== -1) {
      sites[index] = { ...site, updatedAt: new Date().toISOString() };
      return saveLocalJobSites(sites);
    }
    return;
  }

  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await getSupabase()
    .from('job_sites')
    .update({
      name: site.name,
      url: site.url ?? null,
      email_domains: site.emailDomains,
      memo: site.memo ?? null,
      login_id: site.loginId ?? null,
      category: site.category,
      priority: site.priority,
      last_checked_at: site.lastCheckedAt ?? null,
    })
    .eq('id', site.id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to update job site: ${error.message}`);
  }

  trackEventAsync('job_site.update', { siteId: site.id });
}

export async function deleteJobSite(id: string): Promise<void> {
  if (!(await isAuthenticated())) {
    const sites = await getLocalJobSites();
    return saveLocalJobSites(sites.filter((s) => s.id !== id));
  }

  const { error } = await getSupabase()
    .from('job_sites')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete job site: ${error.message}`);
  }

  trackEventAsync('job_site.delete', { siteId: id });
}
