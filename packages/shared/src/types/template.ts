export interface Template {
  id: string;
  type: TemplateType;
  title: string;
  content200?: string;
  content400?: string;
  content600?: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplateType = 
  | 'selfPR'      // 自己PR
  | 'gakuchika'   // 学生時代に力を入れたこと
  | 'strength'    // 長所
  | 'weakness'    // 短所
  | 'futureGoal'  // 将来の目標
  | 'other';      // その他

export function createTemplate(type: TemplateType, title: string): Template {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type,
    title,
    createdAt: now,
    updatedAt: now,
  };
}
