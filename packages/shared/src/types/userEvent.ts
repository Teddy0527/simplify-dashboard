export type EventType =
  // company
  | 'company.create'
  | 'company.update'
  | 'company.delete'
  | 'company.status_change'
  // entry_sheet
  | 'entry_sheet.create'
  | 'entry_sheet.update'
  | 'entry_sheet.delete'
  | 'entry_sheet.copy'
  // es_question
  | 'es_question.create'
  | 'es_question.update'
  | 'es_question.delete'
  | 'es_question.reorder'
  // template
  | 'template.create'
  | 'template.update'
  | 'template.delete'
  // profile
  | 'profile.update'
  // page_view
  | 'page_view.tracker'
  | 'page_view.es'
  | 'page_view.profile'
  | 'page_view.deadlines'
  // auth
  | 'auth.login'
  | 'auth.logout'
  // interaction
  | 'interaction.kanban_drag'
  | 'interaction.drawer_open'
  | 'interaction.drawer_save'
  | 'interaction.view_mode_change'
  | 'interaction.filter_use'
  | 'interaction.add_modal_open'
  | 'interaction.add_modal_cancel'
  // deadline
  | 'deadline.add_to_tracker'
  | 'deadline.gcal_add'
  | 'deadline.reminder_set'
  | 'deadline.bulk_gcal_add'
  | 'deadline.search'
  // session
  | 'session.start'
  | 'session.heartbeat'
  // milestone
  | 'milestone.first_company'
  | 'milestone.third_company'
  | 'milestone.first_status_change'
  | 'milestone.first_profile_update'
  | 'milestone.profile_complete'
  | 'milestone.first_deadline_add'
  // onboarding
  | 'onboarding.started'
  | 'onboarding.step_view'
  | 'onboarding.completed'
  | 'onboarding.skipped'
  | 'onboarding.cta_click'
  | 'onboarding.reshown'
  | 'onboarding_wizard.completed'
  // feedback
  | 'feedback.prompt_shown'
  | 'feedback.submitted'
  | 'feedback.skipped_text'
  | 'feedback.snoozed'
  | 'feedback.opted_out'
  | 'feedback.manual_open'
  // autofill
  | 'autofill.success'
  | 'autofill.error';

export type EventCategory =
  | 'company'
  | 'entry_sheet'
  | 'es_question'
  | 'template'
  | 'profile'
  | 'page_view'
  | 'auth'
  | 'interaction'
  | 'deadline'
  | 'session'
  | 'milestone'
  | 'onboarding'
  | 'onboarding_wizard'
  | 'feedback'
  | 'autofill';

/** DB row (snake_case) */
export interface UserEventRow {
  id: string;
  user_id: string;
  event_type: string;
  event_category: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** App type (camelCase) */
export interface UserEvent {
  id: string;
  userId: string;
  eventType: EventType;
  eventCategory: EventCategory;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export function toUserEvent(row: UserEventRow): UserEvent {
  return {
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type as EventType,
    eventCategory: row.event_category as EventCategory,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}
