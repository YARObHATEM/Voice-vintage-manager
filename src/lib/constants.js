export const HOOK_STATUSES = ['Idea', 'Scripted', 'Filmed', 'Posted'];
export const CRM_STATUSES = ['To Contact', 'Contacted', 'Sent Build', 'Live'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Next Sprint'];
export const BACKLOG_TYPES = ['User Request', 'Device Idea', 'Audio Filter', 'Bug', 'Polish'];
export const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Reddit', 'Other'];
export const NICHES = ['Lo-Fi', 'CCD / Retro', 'Journaling', 'Film Photo', 'Study / Focus', 'Other'];

/* Which colour a status lights up in. Progress runs cool, then amber, then
   green: the last step of every workflow is the green LED. */
export const hookTone = s => (s === 'Posted' ? 'led' : s === 'Idea' ? 'cool' : 'amber');
export const crmTone = s => (s === 'Live' ? 'led' : s === 'To Contact' ? 'cool' : 'amber');
export const priorityTone = p => (p === 'Next Sprint' ? 'alert' : p === 'High' ? 'amber' : 'cool');

export const money = n =>
  '$' + (Math.round(Number(n || 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
