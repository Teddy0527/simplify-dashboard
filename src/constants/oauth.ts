export const GOOGLE_OAUTH_SCOPES =
  'https://www.googleapis.com/auth/calendar.events';

export function buildGoogleOAuthOptions(redirectTo: string, forceConsent = false) {
  return {
    redirectTo,
    scopes: GOOGLE_OAUTH_SCOPES,
    queryParams: {
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: forceConsent ? 'consent select_account' : 'select_account',
    },
  };
}
