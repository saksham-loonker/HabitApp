export function createPageUrl(page) {
  const routeMap = {
    Workspace: '/',
    Dashboard: '/personal',
    Personal: '/personal',
    Settings: '/settings',
    Tasks: '/tasks',
    Habits: '/habits',
    Assistant: '/assistant',
    Mood: '/mood',
    Focus: '/focus',
    Journal: '/journal',
    Calendar: '/calendar',
    Kanban: '/kanban',
  };

  return routeMap[page] || `/${page.toLowerCase()}`;
}

export function createWorkspacePageUrl(pageId) {
  return `/pages/${pageId}`;
}

export function createFormUrl(formId) {
  return `/forms/${formId}`;
}

export function createSiteUrl(pageId) {
  return `/site/${pageId}`;
}
