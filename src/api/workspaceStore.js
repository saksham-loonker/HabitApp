import {
  addBlock,
  addComment,
  createClip,
  createPage,
  createRecord,
  createWorkspaceSeed,
  deleteBlock,
  duplicateBlock,
  exportWorkspaceState,
  getDatabaseViewModel,
  getPageModel,
  getPageTree,
  getWorkspaceOverview,
  instantiateTemplate,
  publishPage,
  runAutomation,
  searchWorkspace,
  submitFormResponse,
  touchRecentPage,
  updateBlock,
  updatePage,
  updateRecord,
} from "@/workspace/engine";

const STORAGE_KEY = "habitflow_workspace_v1";

const safeWindow = typeof window !== "undefined" ? window : null;

const loadState = () => {
  if (!safeWindow) {
    return createWorkspaceSeed();
  }

  try {
    const raw = safeWindow.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createWorkspaceSeed();
      safeWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to load workspace state", error);
    const seeded = createWorkspaceSeed();
    safeWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const saveState = (state) => {
  if (!safeWindow) {
    return;
  }

  safeWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

const read = async (reader, ms = 40) => {
  await delay(ms);
  return reader(loadState());
};

const write = async (writer, ms = 40) => {
  await delay(ms);
  const current = loadState();
  const result = writer(current);
  const nextState = result.state || current;
  saveState(nextState);
  return result;
};

export const workspaceStore = {
  workspace: {
    overview: async () => read((state) => getWorkspaceOverview(state)),
    sidebar: async () =>
      read((state) => ({
        tree: getPageTree(state),
        favorites: state.workspace.favoritePageIds.map((id) => state.pages[id]).filter(Boolean),
        recents: state.workspace.recentPageIds.map((id) => state.pages[id]).filter(Boolean),
      })),
    search: async (query) => read((state) => searchWorkspace(state, query)),
    export: async () => read((state) => exportWorkspaceState(state)),
    reset: async () => {
      const seeded = createWorkspaceSeed();
      saveState(seeded);
      return seeded;
    },
  },
  pages: {
    get: async (pageId) =>
      write((state) => {
        touchRecentPage(state, pageId);
        return {
          state,
          model: getPageModel(state, pageId),
        };
      }).then((result) => result.model),
    create: async (input) => write((state) => createPage(state, input)).then((result) => result.page),
    update: async (pageId, updates) =>
      write((state) => updatePage(state, pageId, updates)).then((result) => result.page),
    instantiateTemplate: async (templateId, options) =>
      write((state) => instantiateTemplate(state, templateId, options)).then((result) => result.page),
    addBlock: async (pageId, input) =>
      write((state) => addBlock(state, pageId, input)).then((result) => result.block),
    updateBlock: async (blockId, updates) => write((state) => updateBlock(state, blockId, updates)),
    duplicateBlock: async (blockId) =>
      write((state) => duplicateBlock(state, blockId)).then((result) => result.block),
    deleteBlock: async (blockId) => write((state) => deleteBlock(state, blockId)),
    addComment: async (pageId, input) =>
      write((state) => addComment(state, pageId, input)).then((result) => result.comment),
    publish: async (pageId, options) =>
      write((state) => publishPage(state, pageId, options)).then((result) => result.site),
  },
  databases: {
    getViewModel: async (databaseId, viewId) => read((state) => getDatabaseViewModel(state, databaseId, viewId)),
    createRecord: async (databaseId, values, options) =>
      write((state) => createRecord(state, databaseId, values, options)).then((result) => result.record),
    updateRecord: async (databaseId, recordId, updates) =>
      write((state) => updateRecord(state, databaseId, recordId, updates)).then((result) => result.record),
  },
  forms: {
    get: async (formId) =>
      read((state) => {
        const form = state.forms[formId];
        if (!form) {
          throw new Error(`Unknown form: ${formId}`);
        }

        return {
          form,
          database: state.databases[form.databaseId],
        };
      }),
    submit: async (formId, payload) => write((state) => ({ state: submitFormResponse(state, formId, payload) })),
  },
  automations: {
    run: async (automationId) => write((state) => ({ state: runAutomation(state, automationId) })),
  },
  clips: {
    capture: async (payload) => write((state) => ({ state: createClip(state, payload) })),
  },
};
