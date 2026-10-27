import { HYGIENE_CHECKLIST } from './model';
export const checklistDone = (c: { checklist: Record<string, boolean> }) => HYGIENE_CHECKLIST.every((h) => c.checklist[h.key]);
export const AVATAR_COLORS = ['#C8152A', '#1A4D2E', '#8A6D1F', '#5B3A29', '#2E4A6B', '#6B2E5B'];
