const DEFAULT_TIMESTAMP = "2026-04-25T09:00:00.000Z";

const deepClone = (value) => structuredClone(value);

const createIdFactory = (start = 1000) => {
  let current = start;
  return (prefix) => `${prefix}_${current++}`;
};

const makeBlock = (id, pageId, type, text, extra = {}) => ({
  id,
  pageId,
  type,
  text,
  createdAt: DEFAULT_TIMESTAMP,
  updatedAt: DEFAULT_TIMESTAMP,
  ...extra,
});

const makePage = ({
  id,
  title,
  icon,
  spaceId,
  parentId = null,
  childPageIds = [],
  blockIds = [],
  linkedDatabaseId = null,
  kind = "page",
  favorite = false,
  published = false,
  cover = null,
  summary = "",
  recordId = null,
  databaseId = null,
}) => ({
  id,
  title,
  icon,
  spaceId,
  parentId,
  childPageIds,
  blockIds,
  linkedDatabaseId,
  kind,
  favorite,
  published,
  cover,
  summary,
  recordId,
  databaseId,
  createdAt: DEFAULT_TIMESTAMP,
  updatedAt: DEFAULT_TIMESTAMP,
});

const makeRecordPageBlocks = (pageId, title, summary = "Add notes, decisions, and follow-up items here.") => {
  const summaryId = `${pageId}_summary`;
  const notesId = `${pageId}_notes`;

  return {
    ids: [summaryId, notesId],
    blocks: {
      [summaryId]: makeBlock(summaryId, pageId, "callout", summary, { tone: "info" }),
      [notesId]: makeBlock(notesId, pageId, "paragraph", `${title} workspace notes.`),
    },
  };
};

const createRecordPage = (pageId, spaceId, parentId, title, recordId, databaseId, summary) => {
  const blockBundle = makeRecordPageBlocks(pageId, title, summary);

  return {
    page: makePage({
      id: pageId,
      title,
      icon: "FileText",
      spaceId,
      parentId,
      blockIds: blockBundle.ids,
      kind: "record",
      summary,
      recordId,
      databaseId,
    }),
    blocks: blockBundle.blocks,
  };
};

const clampActivity = (activity) => activity.slice(0, 80);

const appendActivity = (state, entry) => {
  state.activity = clampActivity([
    {
      id: `activity_${state.workspace.sequence++}`,
      at: DEFAULT_TIMESTAMP,
      ...entry,
    },
    ...state.activity,
  ]);
};

const makeTemplate = (id, kind, name, config) => ({
  id,
  kind,
  name,
  ...config,
});

const makeProperty = (id, name, type, extra = {}) => ({
  id,
  name,
  type,
  ...extra,
});

const buildSearchText = (parts) =>
  parts
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const formatValueForSearch = (value) => {
  if (Array.isArray(value)) {
    return value.map(formatValueForSearch).join(" ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return Object.values(value).map(formatValueForSearch).join(" ");
  }

  return String(value);
};

const comparePrimitive = (left, right, direction = "asc") => {
  if (left === right) {
    return 0;
  }

  if (left === undefined || left === null) {
    return 1;
  }

  if (right === undefined || right === null) {
    return -1;
  }

  if (typeof left === "number" && typeof right === "number") {
    return direction === "asc" ? left - right : right - left;
  }

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);

  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return direction === "asc" ? leftDate - rightDate : rightDate - leftDate;
  }

  const leftText = String(left).toLowerCase();
  const rightText = String(right).toLowerCase();

  return direction === "asc"
    ? leftText.localeCompare(rightText)
    : rightText.localeCompare(leftText);
};

const normalizeMaybeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
};

const getPropertyIdByReference = (database, reference) => {
  if (!reference) {
    return null;
  }

  if (database.properties[reference]) {
    return reference;
  }

  const normalized = reference.toLowerCase();
  return (
    Object.keys(database.properties).find(
      (propertyId) => database.properties[propertyId].name.toLowerCase() === normalized,
    ) || null
  );
};

const toIsoDate = (value) => {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return String(value);
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString().slice(0, 10);
};

const evaluateFilter = (value, filter) => {
  const operator = filter.operator || "equals";

  switch (operator) {
    case "equals":
      return value === filter.value;
    case "not_equals":
      return value !== filter.value;
    case "contains":
      return String(value ?? "").toLowerCase().includes(String(filter.value ?? "").toLowerCase());
    case "includes":
      return normalizeMaybeArray(value).includes(filter.value);
    case "before":
      return (toIsoDate(value) || "") < (toIsoDate(filter.value) || "");
    case "after":
      return (toIsoDate(value) || "") > (toIsoDate(filter.value) || "");
    case "not_empty":
      return normalizeMaybeArray(value).length > 0 && value !== "";
    default:
      return true;
  }
};

const getRelatedRecordIds = (state, database, record, property) => {
  const rawValue = normalizeMaybeArray(record.values[property.id]);
  if (rawValue.length > 0) {
    return rawValue;
  }

  if (!property.mirrorPropertyId) {
    return [];
  }

  const targetDatabase = state.databases[property.databaseId];
  if (!targetDatabase) {
    return [];
  }

  return targetDatabase.recordIds.filter((targetRecordId) => {
    const targetRecord = state.records[targetRecordId];
    const targetValues = normalizeMaybeArray(targetRecord?.values[property.mirrorPropertyId]);
    return targetValues.includes(record.id);
  });
};

const evaluateRollup = (state, database, record, property, context) => {
  const relationProperty = database.properties[property.rollup.relationPropertyId];
  if (!relationProperty) {
    return null;
  }

  const relatedIds = getPropertyValue(state, database, record, relationProperty.id, context);
  const relatedRecords = normalizeMaybeArray(relatedIds)
    .map((relatedId) => state.records[relatedId])
    .filter(Boolean);

  const targetDatabase =
    relationProperty.databaseId === database.id ? database : state.databases[relationProperty.databaseId];

  const targetValues = relatedRecords.map((relatedRecord) =>
    getPropertyValue(state, targetDatabase, relatedRecord, property.rollup.targetPropertyId, context),
  );

  switch (property.rollup.calculate) {
    case "count":
      return targetValues.length;
    case "sum":
      return targetValues.reduce((total, value) => total + Number(value || 0), 0);
    case "countChecked":
      return targetValues.filter(Boolean).length;
    case "countNotEquals":
      return targetValues.filter((value) => value !== property.rollup.compareValue).length;
    case "showOriginal":
      return targetValues;
    case "percentEquals": {
      if (targetValues.length === 0) {
        return 0;
      }
      const matches = targetValues.filter((value) => value === property.rollup.compareValue).length;
      return Math.round((matches / targetValues.length) * 100);
    }
    default:
      return targetValues.length;
  }
};

const formulaHelpers = {
  today: () => DEFAULT_TIMESTAMP.slice(0, 10),
  daysUntil: (value) => {
    const isoDate = toIsoDate(value);
    if (!isoDate) {
      return null;
    }

    const current = new Date(`${DEFAULT_TIMESTAMP.slice(0, 10)}T00:00:00.000Z`).getTime();
    const target = new Date(`${isoDate}T00:00:00.000Z`).getTime();
    return Math.round((target - current) / (1000 * 60 * 60 * 24));
  },
  isPast: (value) => {
    const isoDate = toIsoDate(value);
    if (!isoDate) {
      return false;
    }
    return isoDate < DEFAULT_TIMESTAMP.slice(0, 10);
  },
  exists: (value) => normalizeMaybeArray(value).length > 0 || Boolean(value),
  join: (value, delimiter = ", ") => normalizeMaybeArray(value).join(delimiter),
  length: (value) => normalizeMaybeArray(value).length,
  includes: (value, needle) => normalizeMaybeArray(value).includes(needle),
};

const evaluateFormula = (state, database, record, property, context) => {
  try {
    const evaluator = new Function(
      "prop",
      "helpers",
      `const { today, daysUntil, isPast, exists, join, length, includes } = helpers; return (${property.formula.expression});`,
    );

    const prop = (reference) => {
      const propertyId = getPropertyIdByReference(database, reference);
      if (!propertyId) {
        return null;
      }
      return getPropertyValue(state, database, record, propertyId, context);
    };

    return evaluator(prop, formulaHelpers);
  } catch (error) {
    return property.formula.fallback ?? "Formula error";
  }
};

const getPropertyValue = (state, database, record, propertyId, context = {}) => {
  const key = `${record.id}:${propertyId}`;
  if (context.visited?.has(key)) {
    return null;
  }

  const property = database.properties[propertyId];
  if (!property) {
    return record.values[propertyId] ?? null;
  }

  const nextContext = {
    ...context,
    visited: new Set([...(context.visited || new Set()), key]),
  };

  switch (property.type) {
    case "relation":
      return getRelatedRecordIds(state, database, record, property);
    case "rollup":
      return evaluateRollup(state, database, record, property, nextContext);
    case "formula":
      return evaluateFormula(state, database, record, property, nextContext);
    default:
      if (property.type === "title") {
        return record.title;
      }
      return record.values[propertyId] ?? null;
  }
};

const materializeRecord = (state, database, record) => {
  const values = {};
  database.propertyOrder.forEach((propertyId) => {
    values[propertyId] = getPropertyValue(state, database, record, propertyId, { visited: new Set() });
  });

  return {
    id: record.id,
    pageId: record.pageId,
    title: record.title,
    values,
    searchText: buildSearchText([record.title, Object.values(values).map(formatValueForSearch)]),
  };
};

const applyView = (rows, view) => {
  let nextRows = [...rows];

  if (Array.isArray(view.filters) && view.filters.length > 0) {
    nextRows = nextRows.filter((row) =>
      view.filters.every((filter) => evaluateFilter(row.values[filter.propertyId], filter)),
    );
  }

  if (Array.isArray(view.sorts) && view.sorts.length > 0) {
    nextRows.sort((left, right) => {
      for (const sort of view.sorts) {
        const comparison = comparePrimitive(
          left.values[sort.propertyId],
          right.values[sort.propertyId],
          sort.direction,
        );
        if (comparison !== 0) {
          return comparison;
        }
      }
      return comparePrimitive(left.title, right.title);
    });
  }

  return nextRows;
};

const buildGroups = (rows, propertyId) => {
  if (!propertyId) {
    return [];
  }

  const groups = new Map();
  rows.forEach((row) => {
    const groupKey = formatValueForSearch(row.values[propertyId]) || "Unassigned";
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(row);
  });

  return Array.from(groups.entries()).map(([id, items]) => ({ id, label: id, items }));
};

const buildChartData = (rows, view) => {
  const labelPropertyId = view.chart?.xPropertyId || "title";
  const valuePropertyId = view.chart?.yPropertyId;

  return rows.map((row) => ({
    id: row.id,
    label: labelPropertyId === "title" ? row.title : row.values[labelPropertyId],
    value: Number(valuePropertyId ? row.values[valuePropertyId] : 0),
  }));
};

const getDatabaseViewModel = (state, databaseId, viewId) => {
  const database = state.databases[databaseId];
  if (!database) {
    throw new Error(`Unknown database: ${databaseId}`);
  }

  const selectedView = state.views[viewId] || state.views[database.viewIds[0]];
  const rawRows = database.recordIds.map((recordId) =>
    materializeRecord(state, database, state.records[recordId]),
  );
  const rows = applyView(rawRows, selectedView);

  return {
    database,
    view: selectedView,
    rows,
    groups: buildGroups(rows, selectedView.groupByPropertyId),
    chartData: selectedView.type === "chart" ? buildChartData(rows, selectedView) : [],
  };
};

const createSidebarNode = (state, pageId) => {
  const page = state.pages[pageId];
  if (!page) {
    return null;
  }

  return {
    id: page.id,
    title: page.title,
    icon: page.icon,
    kind: page.kind,
    linkedDatabaseId: page.linkedDatabaseId,
    children: page.childPageIds.map((childId) => createSidebarNode(state, childId)).filter(Boolean),
  };
};

const getPageTree = (state, spaceId = null) => {
  const spaceIds = spaceId ? [spaceId] : state.workspace.spaceOrder;
  return spaceIds
    .flatMap((id) => state.spaces[id]?.rootPageIds || [])
    .map((pageId) => createSidebarNode(state, pageId))
    .filter(Boolean);
};

const searchWorkspace = (state, query) => {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const results = [];

  Object.values(state.pages).forEach((page) => {
    const searchText = buildSearchText([page.title, page.summary]);
    if (searchText.includes(needle)) {
      results.push({
        kind: "page",
        id: page.id,
        title: page.title,
        subtitle: page.summary,
        href: `/pages/${page.id}`,
        score: page.title.toLowerCase().includes(needle) ? 3 : 2,
      });
    }
  });

  Object.values(state.blocks).forEach((block) => {
    const searchText = buildSearchText([block.text, block.url]);
    if (searchText.includes(needle)) {
      const page = state.pages[block.pageId];
      results.push({
        kind: "block",
        id: block.id,
        pageId: block.pageId,
        title: block.text || block.url || block.type,
        subtitle: page?.title || "Block",
        href: `/pages/${block.pageId}`,
        score: 1,
      });
    }
  });

  Object.values(state.records).forEach((record) => {
    const searchText = buildSearchText([record.title, Object.values(record.values).map(formatValueForSearch)]);
    if (searchText.includes(needle)) {
      results.push({
        kind: "record",
        id: record.id,
        databaseId: record.databaseId,
        title: record.title,
        subtitle: state.databases[record.databaseId]?.name || "Record",
        href: `/pages/${record.pageId}`,
        score: record.title.toLowerCase().includes(needle) ? 3 : 1,
      });
    }
  });

  return results.sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
};

const getBreadcrumbs = (state, pageId) => {
  const breadcrumbs = [];
  let current = state.pages[pageId];

  while (current) {
    breadcrumbs.unshift({
      id: current.id,
      title: current.title,
      href: `/pages/${current.id}`,
    });
    current = current.parentId ? state.pages[current.parentId] : null;
  }

  return breadcrumbs;
};

const getPageModel = (state, pageId) => {
  const page = state.pages[pageId];
  if (!page) {
    throw new Error(`Unknown page: ${pageId}`);
  }

  const linkedDatabase = page.linkedDatabaseId
    ? state.databases[page.linkedDatabaseId]
    : page.databaseId
      ? state.databases[page.databaseId]
      : null;
  const record = page.recordId ? state.records[page.recordId] : null;
  const comments = Object.values(state.comments)
    .filter((comment) => comment.pageId === pageId)
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

  return {
    page,
    blocks: page.blockIds.map((blockId) => state.blocks[blockId]).filter(Boolean),
    breadcrumbs: getBreadcrumbs(state, pageId),
    childPages: page.childPageIds.map((childId) => state.pages[childId]).filter(Boolean),
    linkedDatabase,
    record,
    comments,
    site: Object.values(state.sites).find((site) => site.pageId === pageId) || null,
  };
};

const getWorkspaceOverview = (state) => ({
  pages: getPageTree(state),
  favorites: state.workspace.favoritePageIds.map((id) => state.pages[id]).filter(Boolean),
  recents: state.workspace.recentPageIds.map((id) => state.pages[id]).filter(Boolean),
  templates: Object.values(state.templates),
  forms: Object.values(state.forms),
  automations: Object.values(state.automations),
  publishedPages: Object.values(state.sites),
  activity: state.activity,
  databases: Object.values(state.databases),
});

const touchRecentPage = (state, pageId) => {
  state.workspace.recentPageIds = [pageId, ...state.workspace.recentPageIds.filter((id) => id !== pageId)].slice(
    0,
    8,
  );
};

const addPageToParent = (state, page) => {
  if (page.parentId) {
    const parent = state.pages[page.parentId];
    if (parent && !parent.childPageIds.includes(page.id)) {
      parent.childPageIds = [page.id, ...parent.childPageIds];
      parent.updatedAt = DEFAULT_TIMESTAMP;
    }
    return;
  }

  const space = state.spaces[page.spaceId];
  if (space && !space.rootPageIds.includes(page.id)) {
    space.rootPageIds = [page.id, ...space.rootPageIds];
  }
};

const cloneTemplateBlocks = (state, pageId, templateBlocks) => {
  const ids = [];
  templateBlocks.forEach((templateBlock) => {
    const id = `block_${state.workspace.sequence++}`;
    state.blocks[id] = makeBlock(id, pageId, templateBlock.type, templateBlock.text, {
      tone: templateBlock.tone || null,
      url: templateBlock.url || null,
      checked: templateBlock.checked || false,
      syncGroupId: templateBlock.syncGroupId || null,
    });
    ids.push(id);
  });
  return ids;
};

const instantiateTemplate = (stateInput, templateId, options = {}) => {
  const state = deepClone(stateInput);
  const template = state.templates[templateId];
  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  if (template.kind === "page") {
    const pageId = `page_${state.workspace.sequence++}`;
    const page = makePage({
      id: pageId,
      title: options.title || template.title,
      icon: template.icon || "FilePlus",
      spaceId: options.spaceId || template.spaceId || state.workspace.defaultSpaceId,
      parentId: options.parentId || template.parentId || null,
      summary: template.summary || "",
      favorite: false,
    });

    page.blockIds = cloneTemplateBlocks(state, pageId, template.blocks);
    state.pages[pageId] = page;
    addPageToParent(state, page);
    touchRecentPage(state, pageId);
    appendActivity(state, {
      type: "page_created",
      pageId,
      label: `Created page ${page.title} from template`,
    });
    return {
      state,
      page,
    };
  }

  if (template.kind === "record") {
    return {
      state,
      recordTemplate: template,
    };
  }

  return {
    state,
  };
};

const createPage = (stateInput, input) => {
  const state = deepClone(stateInput);
  const pageId = `page_${state.workspace.sequence++}`;
  const page = makePage({
    id: pageId,
    title: input.title,
    icon: input.icon || "FileText",
    spaceId: input.spaceId || state.workspace.defaultSpaceId,
    parentId: input.parentId || null,
    summary: input.summary || "",
    linkedDatabaseId: input.linkedDatabaseId || null,
    favorite: Boolean(input.favorite),
  });

  if (input.templateId) {
    const template = state.templates[input.templateId];
    page.blockIds = template ? cloneTemplateBlocks(state, pageId, template.blocks) : [];
  } else {
    const introId = `block_${state.workspace.sequence++}`;
    state.blocks[introId] = makeBlock(
      introId,
      pageId,
      "paragraph",
      input.initialText || "Start typing, capture ideas, or drop a database into this page.",
    );
    page.blockIds = [introId];
  }

  state.pages[pageId] = page;
  addPageToParent(state, page);
  touchRecentPage(state, pageId);

  if (page.favorite && !state.workspace.favoritePageIds.includes(pageId)) {
    state.workspace.favoritePageIds.unshift(pageId);
  }

  appendActivity(state, {
    type: "page_created",
    pageId,
    label: `Created page ${page.title}`,
  });

  return {
    state,
    page,
  };
};

const updatePage = (stateInput, pageId, updates) => {
  const state = deepClone(stateInput);
  const page = state.pages[pageId];
  if (!page) {
    throw new Error(`Unknown page: ${pageId}`);
  }

  Object.assign(page, updates, { updatedAt: DEFAULT_TIMESTAMP });

  if (updates.favorite !== undefined) {
    state.workspace.favoritePageIds = updates.favorite
      ? [pageId, ...state.workspace.favoritePageIds.filter((id) => id !== pageId)]
      : state.workspace.favoritePageIds.filter((id) => id !== pageId);
  }

  touchRecentPage(state, pageId);

  appendActivity(state, {
    type: "page_updated",
    pageId,
    label: `Updated page ${page.title}`,
  });

  return {
    state,
    page,
  };
};

const addBlock = (stateInput, pageId, blockInput) => {
  const state = deepClone(stateInput);
  const page = state.pages[pageId];
  if (!page) {
    throw new Error(`Unknown page: ${pageId}`);
  }

  const blockId = `block_${state.workspace.sequence++}`;
  state.blocks[blockId] = makeBlock(blockId, pageId, blockInput.type || "paragraph", blockInput.text || "", {
    tone: blockInput.tone || null,
    url: blockInput.url || null,
    checked: Boolean(blockInput.checked),
    syncGroupId: blockInput.syncGroupId || null,
  });

  const index = blockInput.index ?? page.blockIds.length;
  page.blockIds = [...page.blockIds.slice(0, index), blockId, ...page.blockIds.slice(index)];
  page.updatedAt = DEFAULT_TIMESTAMP;
  touchRecentPage(state, pageId);

  appendActivity(state, {
    type: "block_added",
    pageId,
    label: `Added a block to ${page.title}`,
  });

  return {
    state,
    block: state.blocks[blockId],
  };
};

const updateBlock = (stateInput, blockId, updates) => {
  const state = deepClone(stateInput);
  const block = state.blocks[blockId];
  if (!block) {
    throw new Error(`Unknown block: ${blockId}`);
  }

  const page = state.pages[block.pageId];
  if (!page) {
    throw new Error(`Unknown page for block: ${blockId}`);
  }

  const syncGroupId = block.syncGroupId;
  const targetBlocks = syncGroupId
    ? Object.values(state.blocks).filter((candidate) => candidate.syncGroupId === syncGroupId)
    : [block];

  targetBlocks.forEach((candidate) => {
    Object.assign(candidate, updates, { updatedAt: DEFAULT_TIMESTAMP });
  });

  page.updatedAt = DEFAULT_TIMESTAMP;
  touchRecentPage(state, page.id);

  return {
    state,
  };
};

const duplicateBlock = (stateInput, blockId) => {
  const state = deepClone(stateInput);
  const block = state.blocks[blockId];
  if (!block) {
    throw new Error(`Unknown block: ${blockId}`);
  }

  const page = state.pages[block.pageId];
  const newBlockId = `block_${state.workspace.sequence++}`;
  const clone = {
    ...deepClone(block),
    id: newBlockId,
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };
  state.blocks[newBlockId] = clone;
  const index = page.blockIds.indexOf(blockId);
  page.blockIds = [...page.blockIds.slice(0, index + 1), newBlockId, ...page.blockIds.slice(index + 1)];
  page.updatedAt = DEFAULT_TIMESTAMP;

  return {
    state,
    block: clone,
  };
};

const deleteBlock = (stateInput, blockId) => {
  const state = deepClone(stateInput);
  const block = state.blocks[blockId];
  if (!block) {
    return {
      state,
    };
  }

  const page = state.pages[block.pageId];
  if (page) {
    page.blockIds = page.blockIds.filter((id) => id !== blockId);
    page.updatedAt = DEFAULT_TIMESTAMP;
  }

  delete state.blocks[blockId];

  return {
    state,
  };
};

const addComment = (stateInput, pageId, input) => {
  const state = deepClone(stateInput);
  const commentId = `comment_${state.workspace.sequence++}`;

  state.comments[commentId] = {
    id: commentId,
    pageId,
    blockId: input.blockId || null,
    author: input.author || state.workspace.user.name,
    content: input.content,
    createdAt: DEFAULT_TIMESTAMP,
  };

  touchRecentPage(state, pageId);
  appendActivity(state, {
    type: "comment_added",
    pageId,
    label: `Commented on ${state.pages[pageId]?.title || "a page"}`,
  });

  return {
    state,
    comment: state.comments[commentId],
  };
};

const createRecord = (stateInput, databaseId, input, options = {}) => {
  const state = deepClone(stateInput);
  const database = state.databases[databaseId];
  if (!database) {
    throw new Error(`Unknown database: ${databaseId}`);
  }

  const recordId = options.recordId || `${databaseId}_record_${state.workspace.sequence++}`;
  const pageId = options.pageId || `page_${state.workspace.sequence++}`;
  const pageBundle = createRecordPage(
    pageId,
    options.spaceId || database.spaceId || state.workspace.defaultSpaceId,
    options.parentPageId || database.pageId,
    input.title,
    recordId,
    databaseId,
    input.summary || `Created from ${database.name}`,
  );

  const values = {};
  database.propertyOrder.forEach((propertyId) => {
    const property = database.properties[propertyId];
    if (property.type === "title") {
      return;
    }

    if (input[propertyId] !== undefined) {
      values[propertyId] = input[propertyId];
      return;
    }

    if (input[property.name] !== undefined) {
      values[propertyId] = input[property.name];
      return;
    }

    if (property.defaultValue !== undefined) {
      values[propertyId] = deepClone(property.defaultValue);
    }
  });

  state.records[recordId] = {
    id: recordId,
    databaseId,
    pageId,
    title: input.title,
    values,
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };

  state.pages[pageId] = pageBundle.page;
  Object.assign(state.blocks, pageBundle.blocks);
  addPageToParent(state, pageBundle.page);
  database.recordIds = [...database.recordIds, recordId];

  appendActivity(state, {
    type: "record_created",
    pageId,
    databaseId,
    label: `Created ${input.title} in ${database.name}`,
  });

  return {
    state,
    record: state.records[recordId],
  };
};

const updateRecord = (stateInput, databaseId, recordId, updates) => {
  const state = deepClone(stateInput);
  const database = state.databases[databaseId];
  const record = state.records[recordId];
  if (!database || !record) {
    throw new Error(`Unknown record: ${recordId}`);
  }

  if (updates.title !== undefined) {
    record.title = updates.title;
    const page = state.pages[record.pageId];
    if (page) {
      page.title = updates.title;
      page.updatedAt = DEFAULT_TIMESTAMP;
    }
  }

  database.propertyOrder.forEach((propertyId) => {
    const property = database.properties[propertyId];
    if (property.type === "title") {
      return;
    }

    if (updates[propertyId] !== undefined) {
      record.values[propertyId] = updates[propertyId];
    } else if (updates[property.name] !== undefined) {
      record.values[propertyId] = updates[property.name];
    }
  });

  record.updatedAt = DEFAULT_TIMESTAMP;

  appendActivity(state, {
    type: "record_updated",
    pageId: record.pageId,
    databaseId,
    label: `Updated ${record.title}`,
  });

  return {
    state,
    record,
  };
};

const submitFormResponse = (stateInput, formId, payload) => {
  const formState = deepClone(stateInput);
  const form = formState.forms[formId];
  if (!form) {
    throw new Error(`Unknown form: ${formId}`);
  }

  const { state, record } = createRecord(formState, form.databaseId, payload, {
    parentPageId: form.parentPageId,
    spaceId: form.spaceId || formState.workspace.defaultSpaceId,
  });

  appendActivity(state, {
    type: "form_submitted",
    pageId: record.pageId,
    databaseId: form.databaseId,
    label: `Submitted ${form.title}`,
  });

  return state;
};

const publishPage = (stateInput, pageId, options = {}) => {
  const state = deepClone(stateInput);
  const page = state.pages[pageId];
  if (!page) {
    throw new Error(`Unknown page: ${pageId}`);
  }

  const siteId = `site_${pageId}`;
  state.sites[siteId] = {
    id: siteId,
    pageId,
    slug: options.slug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    theme: options.theme || "paper",
    publishedAt: DEFAULT_TIMESTAMP,
  };
  page.published = true;
  page.updatedAt = DEFAULT_TIMESTAMP;

  appendActivity(state, {
    type: "page_published",
    pageId,
    label: `Published ${page.title}`,
  });

  return {
    state,
    site: state.sites[siteId],
  };
};

const createClip = (stateInput, input) => {
  const summary = input.summary || "Saved from the web clipper surface inside HabitFlow.";
  const state = submitFormResponse(stateInput, "clipCaptureForm", {
    title: input.title || input.url,
    url: input.url,
    summary,
    tags: input.tags || ["captured"],
  });

  return state;
};

const runAutomation = (stateInput, automationId) => {
  const state = deepClone(stateInput);
  const automation = state.automations[automationId];
  if (!automation) {
    throw new Error(`Unknown automation: ${automationId}`);
  }

  switch (automation.action.type) {
    case "createPageFromTemplate":
      return instantiateTemplate(state, automation.action.templateId, {
        title: automation.action.title,
        parentId: automation.action.parentId,
        spaceId: automation.action.spaceId,
      }).state;
    case "createRecord":
      return createRecord(state, automation.action.databaseId, automation.action.values, {
        parentPageId: automation.action.parentPageId,
        spaceId: automation.action.spaceId,
      }).state;
    default:
      return state;
  }
};

const exportWorkspaceState = (state) => JSON.stringify(state, null, 2);

const createWorkspaceSeed = () => {
  const nextId = createIdFactory(2000);

  const blocks = {};
  const pages = {};
  const records = {};
  const comments = {};
  const sites = {};

  const addPage = (page, pageBlocks = []) => {
    pages[page.id] = page;
    pageBlocks.forEach((block) => {
      blocks[block.id] = block;
    });
  };

  const homeBlocks = [
    makeBlock("home_intro", "home", "heading", "HabitFlow Workspace"),
    makeBlock(
      "home_pitch",
      "home",
      "paragraph",
      "Pages, databases, forms, and publishing now live next to your personal productivity system.",
    ),
    makeBlock(
      "home_sync",
      "home",
      "callout",
      "Use synced blocks to keep launch context aligned across planning, docs, and meeting notes.",
      { tone: "success", syncGroupId: "sync_launch_context" },
    ),
  ];

  addPage(
    makePage({
      id: "home",
      title: "Workspace Home",
      icon: "Layers3",
      spaceId: "workspace",
      childPageIds: ["planningHub", "teamWiki", "projectsDbPage", "tasksDbPage", "feedbackDbPage", "clipsDbPage"],
      blockIds: homeBlocks.map((block) => block.id),
      favorite: true,
      summary: "Central hub for docs, databases, forms, and publishing.",
    }),
    homeBlocks,
  );

  const planningBlocks = [
    makeBlock("planning_title", "planningHub", "heading", "Q2 Launch Hub"),
    makeBlock(
      "planning_summary",
      "planningHub",
      "paragraph",
      "Coordinate launch decisions, milestones, docs, and delivery risk from one page.",
    ),
    makeBlock(
      "planning_synced",
      "planningHub",
      "callout",
      "Launch brief synced across planning surfaces. Keep this block aligned with the meeting notes template.",
      { tone: "warning", syncGroupId: "sync_launch_context" },
    ),
    makeBlock("planning_todo", "planningHub", "todo", "Finalize the forms and publishing flow.", {
      checked: false,
    }),
    makeBlock("planning_quote", "planningHub", "quote", "Capture decisions where the work happens."),
  ];

  addPage(
    makePage({
      id: "planningHub",
      title: "Q2 Launch Hub",
      icon: "Rocket",
      spaceId: "workspace",
      parentId: "home",
      childPageIds: ["meetingNotesPage"],
      blockIds: planningBlocks.map((block) => block.id),
      favorite: true,
      published: true,
      summary: "Roadmap, launch risk, and coordination center.",
    }),
    planningBlocks,
  );

  const meetingNoteBlocks = [
    makeBlock("meeting_heading", "meetingNotesPage", "heading", "Launch Meeting Notes"),
    makeBlock(
      "meeting_synced",
      "meetingNotesPage",
      "callout",
      "Launch brief synced across planning surfaces. Keep this block aligned with the meeting notes template.",
      { tone: "info", syncGroupId: "sync_launch_context" },
    ),
    makeBlock("meeting_notes", "meetingNotesPage", "paragraph", "Action items and AI summaries live here."),
  ];

  addPage(
    makePage({
      id: "meetingNotesPage",
      title: "Launch Meeting Notes",
      icon: "Mic",
      spaceId: "workspace",
      parentId: "planningHub",
      blockIds: meetingNoteBlocks.map((block) => block.id),
      summary: "Template-backed meeting notes with synced context.",
    }),
    meetingNoteBlocks,
  );

  const wikiBlocks = [
    makeBlock("wiki_heading", "teamWiki", "heading", "Team Wiki"),
    makeBlock("wiki_para", "teamWiki", "paragraph", "Operating principles, rituals, and product language."),
    makeBlock("wiki_bookmark", "teamWiki", "bookmark", "https://www.notion.com/product/notion", {
      url: "https://www.notion.com/product/notion",
    }),
  ];

  addPage(
    makePage({
      id: "teamWiki",
      title: "Team Wiki",
      icon: "BookCopy",
      spaceId: "workspace",
      parentId: "home",
      blockIds: wikiBlocks.map((block) => block.id),
      summary: "Shared knowledge and operating docs.",
    }),
    wikiBlocks,
  );

  addPage(
    makePage({
      id: "projectsDbPage",
      title: "Projects Database",
      icon: "FolderKanban",
      spaceId: "workspace",
      parentId: "home",
      linkedDatabaseId: "projects",
      summary: "Projects rendered as table, board, timeline, and charts.",
    }),
  );

  addPage(
    makePage({
      id: "tasksDbPage",
      title: "Tasks Database",
      icon: "ListTodo",
      spaceId: "workspace",
      parentId: "home",
      linkedDatabaseId: "tasks",
      summary: "Connected tasks with board, calendar, and gallery views.",
    }),
  );

  addPage(
    makePage({
      id: "feedbackDbPage",
      title: "Feedback Inbox",
      icon: "MessagesSquare",
      spaceId: "workspace",
      parentId: "home",
      linkedDatabaseId: "feedback",
      summary: "Requests arrive from a form and land here for triage.",
    }),
  );

  addPage(
    makePage({
      id: "clipsDbPage",
      title: "Web Clips",
      icon: "Globe",
      spaceId: "workspace",
      parentId: "home",
      linkedDatabaseId: "clips",
      summary: "Save URLs, summaries, and research context.",
    }),
  );

  const personalBlocks = [
    makeBlock("personal_heading", "personalHub", "heading", "Personal Command Center"),
    makeBlock(
      "personal_text",
      "personalHub",
      "paragraph",
      "Your habits, focus sessions, mood history, journal, and assistant stay available in the Personal section.",
    ),
  ];

  addPage(
    makePage({
      id: "personalHub",
      title: "Personal Command Center",
      icon: "HeartPulse",
      spaceId: "personal",
      blockIds: personalBlocks.map((block) => block.id),
      favorite: true,
      summary: "Bridge between the new workspace layer and the legacy personal tools.",
    }),
    personalBlocks,
  );

  const databases = {
    projects: {
      id: "projects",
      name: "Projects",
      icon: "FolderKanban",
      pageId: "projectsDbPage",
      spaceId: "workspace",
      primaryPropertyId: "title",
      propertyOrder: [
        "title",
        "status",
        "lead",
        "startDate",
        "launchDate",
        "projectTasks",
        "openTaskCount",
        "deliveryHealth",
      ],
      properties: {
        title: makeProperty("title", "Project", "title"),
        status: makeProperty("status", "Status", "status", { options: ["Planned", "Active", "Done"] }),
        lead: makeProperty("lead", "Lead", "person"),
        startDate: makeProperty("startDate", "Start", "date"),
        launchDate: makeProperty("launchDate", "Launch", "date"),
        projectTasks: makeProperty("projectTasks", "Tasks", "relation", {
          databaseId: "tasks",
          mirrorPropertyId: "project",
        }),
        openTaskCount: makeProperty("openTaskCount", "Open Tasks", "rollup", {
          rollup: {
            relationPropertyId: "projectTasks",
            targetPropertyId: "status",
            calculate: "countNotEquals",
            compareValue: "Done",
          },
        }),
        deliveryHealth: makeProperty("deliveryHealth", "Delivery Health", "formula", {
          formula: {
            expression:
              "prop('status') === 'Done' ? 'Complete' : (prop('openTaskCount') > 1 ? 'At risk' : 'On track')",
          },
        }),
      },
      recordIds: ["projLaunch", "projOps"],
      viewIds: ["projectsTable", "projectsBoard", "projectsTimeline", "projectsChart"],
      formIds: [],
    },
    tasks: {
      id: "tasks",
      name: "Tasks",
      icon: "ListTodo",
      pageId: "tasksDbPage",
      spaceId: "workspace",
      primaryPropertyId: "title",
      propertyOrder: ["title", "status", "priority", "dueDate", "project", "estimate", "completed"],
      properties: {
        title: makeProperty("title", "Task", "title"),
        status: makeProperty("status", "Status", "status", {
          options: ["Not started", "In progress", "Blocked", "Done"],
        }),
        priority: makeProperty("priority", "Priority", "select", {
          options: ["Low", "Medium", "High"],
        }),
        dueDate: makeProperty("dueDate", "Due", "date"),
        project: makeProperty("project", "Project", "relation", {
          databaseId: "projects",
          mirrorPropertyId: "projectTasks",
        }),
        estimate: makeProperty("estimate", "Estimate", "number"),
        completed: makeProperty("completed", "Completed", "checkbox", { defaultValue: false }),
      },
      recordIds: ["taskEditor", "taskForms", "taskTemplate"],
      viewIds: ["tasksTable", "tasksBoard", "tasksCalendar", "tasksGallery"],
      formIds: [],
    },
    feedback: {
      id: "feedback",
      name: "Feedback",
      icon: "MessagesSquare",
      pageId: "feedbackDbPage",
      spaceId: "workspace",
      primaryPropertyId: "title",
      propertyOrder: ["title", "requester", "priority", "status", "details"],
      properties: {
        title: makeProperty("title", "Request", "title"),
        requester: makeProperty("requester", "Requester", "text"),
        priority: makeProperty("priority", "Priority", "select", {
          options: ["Low", "Medium", "High"],
          defaultValue: "Medium",
        }),
        status: makeProperty("status", "Status", "status", {
          options: ["New", "Triaged", "Shipped"],
          defaultValue: "New",
        }),
        details: makeProperty("details", "Details", "text"),
      },
      recordIds: ["feedbackSeed"],
      viewIds: ["feedbackTable", "feedbackGallery", "feedbackChart"],
      formIds: ["feedbackForm"],
    },
    clips: {
      id: "clips",
      name: "Clips",
      icon: "Globe",
      pageId: "clipsDbPage",
      spaceId: "workspace",
      primaryPropertyId: "title",
      propertyOrder: ["title", "url", "summary", "tags"],
      properties: {
        title: makeProperty("title", "Title", "title"),
        url: makeProperty("url", "URL", "url"),
        summary: makeProperty("summary", "Summary", "text"),
        tags: makeProperty("tags", "Tags", "multi-select", { defaultValue: ["captured"] }),
      },
      recordIds: ["clipSeed"],
      viewIds: ["clipsTable", "clipsGallery"],
      formIds: ["clipCaptureForm"],
    },
  };

  const views = {
    projectsTable: {
      id: "projectsTable",
      databaseId: "projects",
      name: "Table",
      type: "table",
      visiblePropertyIds: ["title", "status", "lead", "launchDate", "openTaskCount", "deliveryHealth"],
      filters: [],
      sorts: [{ propertyId: "launchDate", direction: "asc" }],
    },
    projectsBoard: {
      id: "projectsBoard",
      databaseId: "projects",
      name: "Board",
      type: "board",
      visiblePropertyIds: ["lead", "launchDate", "openTaskCount", "deliveryHealth"],
      groupByPropertyId: "status",
      filters: [],
      sorts: [{ propertyId: "launchDate", direction: "asc" }],
    },
    projectsTimeline: {
      id: "projectsTimeline",
      databaseId: "projects",
      name: "Timeline",
      type: "timeline",
      visiblePropertyIds: ["status", "lead", "deliveryHealth"],
      startPropertyId: "startDate",
      endPropertyId: "launchDate",
      filters: [],
      sorts: [{ propertyId: "startDate", direction: "asc" }],
    },
    projectsChart: {
      id: "projectsChart",
      databaseId: "projects",
      name: "Chart",
      type: "chart",
      chart: {
        chartType: "bar",
        xPropertyId: "title",
        yPropertyId: "openTaskCount",
      },
      filters: [],
      sorts: [],
    },
    tasksTable: {
      id: "tasksTable",
      databaseId: "tasks",
      name: "Table",
      type: "table",
      visiblePropertyIds: ["title", "status", "priority", "dueDate", "project", "estimate"],
      filters: [],
      sorts: [{ propertyId: "dueDate", direction: "asc" }],
    },
    tasksBoard: {
      id: "tasksBoard",
      databaseId: "tasks",
      name: "Board",
      type: "board",
      visiblePropertyIds: ["priority", "dueDate", "project"],
      groupByPropertyId: "status",
      filters: [],
      sorts: [{ propertyId: "priority", direction: "desc" }],
    },
    tasksCalendar: {
      id: "tasksCalendar",
      databaseId: "tasks",
      name: "Calendar",
      type: "calendar",
      visiblePropertyIds: ["priority", "status"],
      datePropertyId: "dueDate",
      filters: [],
      sorts: [{ propertyId: "dueDate", direction: "asc" }],
    },
    tasksGallery: {
      id: "tasksGallery",
      databaseId: "tasks",
      name: "Gallery",
      type: "gallery",
      visiblePropertyIds: ["status", "priority", "dueDate"],
      filters: [],
      sorts: [{ propertyId: "priority", direction: "desc" }],
    },
    feedbackTable: {
      id: "feedbackTable",
      databaseId: "feedback",
      name: "Table",
      type: "table",
      visiblePropertyIds: ["title", "requester", "priority", "status", "details"],
      filters: [],
      sorts: [{ propertyId: "priority", direction: "desc" }],
    },
    feedbackGallery: {
      id: "feedbackGallery",
      databaseId: "feedback",
      name: "Gallery",
      type: "gallery",
      visiblePropertyIds: ["requester", "priority", "status"],
      filters: [],
      sorts: [{ propertyId: "priority", direction: "desc" }],
    },
    feedbackChart: {
      id: "feedbackChart",
      databaseId: "feedback",
      name: "Chart",
      type: "chart",
      chart: {
        chartType: "bar",
        xPropertyId: "priority",
        yPropertyId: "title",
      },
      filters: [],
      sorts: [],
    },
    clipsTable: {
      id: "clipsTable",
      databaseId: "clips",
      name: "Table",
      type: "table",
      visiblePropertyIds: ["title", "url", "summary", "tags"],
      filters: [],
      sorts: [{ propertyId: "title", direction: "asc" }],
    },
    clipsGallery: {
      id: "clipsGallery",
      databaseId: "clips",
      name: "Gallery",
      type: "gallery",
      visiblePropertyIds: ["summary", "tags"],
      filters: [],
      sorts: [{ propertyId: "title", direction: "asc" }],
    },
  };

  const projectPageLaunch = createRecordPage(
    "page_projLaunch",
    "workspace",
    "projectsDbPage",
    "Launch HabitFlow Workspace",
    "projLaunch",
    "projects",
    "Ship the workspace core with pages, databases, forms, and publishing.",
  );
  const projectPageOps = createRecordPage(
    "page_projOps",
    "workspace",
    "projectsDbPage",
    "Operational Rollout",
    "projOps",
    "projects",
    "Prepare templates, wiki pages, and launch communication.",
  );

  pages[projectPageLaunch.page.id] = projectPageLaunch.page;
  pages[projectPageOps.page.id] = projectPageOps.page;
  Object.assign(blocks, projectPageLaunch.blocks, projectPageOps.blocks);
  addPageToParent({ pages, spaces: { workspace: { rootPageIds: [] } } }, projectPageLaunch.page);
  addPageToParent({ pages, spaces: { workspace: { rootPageIds: [] } } }, projectPageOps.page);

  records.projLaunch = {
    id: "projLaunch",
    databaseId: "projects",
    pageId: "page_projLaunch",
    title: "Launch HabitFlow Workspace",
    values: {
      status: "Active",
      lead: "Product",
      startDate: "2026-04-20",
      launchDate: "2026-05-15",
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };
  records.projOps = {
    id: "projOps",
    databaseId: "projects",
    pageId: "page_projOps",
    title: "Operational Rollout",
    values: {
      status: "Planned",
      lead: "Ops",
      startDate: "2026-05-01",
      launchDate: "2026-05-25",
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };

  const taskPageEditor = createRecordPage(
    "page_taskEditor",
    "workspace",
    "tasksDbPage",
    "Ship block editor",
    "taskEditor",
    "tasks",
    "Paragraphs, headings, callouts, code, synced references, and checklists.",
  );
  const taskPageForms = createRecordPage(
    "page_taskForms",
    "workspace",
    "tasksDbPage",
    "Build forms and publishing",
    "taskForms",
    "tasks",
    "Create feedback intake forms and public page rendering.",
  );
  const taskPageTemplate = createRecordPage(
    "page_taskTemplate",
    "workspace",
    "tasksDbPage",
    "Create workspace templates",
    "taskTemplate",
    "tasks",
    "Seed page templates, quick actions, and automations.",
  );

  pages[taskPageEditor.page.id] = taskPageEditor.page;
  pages[taskPageForms.page.id] = taskPageForms.page;
  pages[taskPageTemplate.page.id] = taskPageTemplate.page;
  Object.assign(blocks, taskPageEditor.blocks, taskPageForms.blocks, taskPageTemplate.blocks);
  addPageToParent({ pages, spaces: { workspace: { rootPageIds: [] } } }, taskPageEditor.page);
  addPageToParent({ pages, spaces: { workspace: { rootPageIds: [] } } }, taskPageForms.page);
  addPageToParent({ pages, spaces: { workspace: { rootPageIds: [] } } }, taskPageTemplate.page);

  records.taskEditor = {
    id: "taskEditor",
    databaseId: "tasks",
    pageId: "page_taskEditor",
    title: "Ship block editor",
    values: {
      status: "In progress",
      priority: "High",
      dueDate: "2026-05-03",
      project: ["projLaunch"],
      estimate: 5,
      completed: false,
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };
  records.taskForms = {
    id: "taskForms",
    databaseId: "tasks",
    pageId: "page_taskForms",
    title: "Build forms and publishing",
    values: {
      status: "Not started",
      priority: "High",
      dueDate: "2026-05-07",
      project: ["projLaunch"],
      estimate: 3,
      completed: false,
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };
  records.taskTemplate = {
    id: "taskTemplate",
    databaseId: "tasks",
    pageId: "page_taskTemplate",
    title: "Create workspace templates",
    values: {
      status: "Done",
      priority: "Medium",
      dueDate: "2026-04-28",
      project: ["projOps"],
      estimate: 2,
      completed: true,
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };

  const feedbackSeedPage = createRecordPage(
    "page_feedbackSeed",
    "workspace",
    "feedbackDbPage",
    "Need better command palette",
    "feedbackSeed",
    "feedback",
    "Users want faster search, better keyboard navigation, and grouped results.",
  );
  pages[feedbackSeedPage.page.id] = feedbackSeedPage.page;
  Object.assign(blocks, feedbackSeedPage.blocks);
  addPageToParent({ pages, spaces: { workspace: { rootPageIds: [] } } }, feedbackSeedPage.page);
  records.feedbackSeed = {
    id: "feedbackSeed",
    databaseId: "feedback",
    pageId: "page_feedbackSeed",
    title: "Need better command palette",
    values: {
      requester: "Design",
      priority: "High",
      status: "New",
      details: "Keyboard-first search should surface pages, records, and clips together.",
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };

  const clipSeedPage = createRecordPage(
    "page_clipSeed",
    "workspace",
    "clipsDbPage",
    "Notion workspace reference",
    "clipSeed",
    "clips",
    "Reference for workspace product expectations and category language.",
  );
  pages[clipSeedPage.page.id] = clipSeedPage.page;
  Object.assign(blocks, clipSeedPage.blocks);
  addPageToParent({ pages, spaces: { workspace: { rootPageIds: [] } } }, clipSeedPage.page);
  records.clipSeed = {
    id: "clipSeed",
    databaseId: "clips",
    pageId: "page_clipSeed",
    title: "Notion workspace reference",
    values: {
      url: "https://www.notion.com/product/notion",
      summary: "Reference for docs, wiki, projects, AI, and connected workspace positioning.",
      tags: ["research", "launch"],
    },
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };

  comments.comment_launch_1 = {
    id: "comment_launch_1",
    pageId: "planningHub",
    blockId: null,
    author: "Studio",
    content: "Keep launch scope focused on the workspace core. Personal tools stay available but secondary.",
    createdAt: DEFAULT_TIMESTAMP,
  };
  comments.comment_launch_2 = {
    id: "comment_launch_2",
    pageId: "planningHub",
    blockId: "planning_todo",
    author: "Ops",
    content: "Forms should land straight into the feedback database with a triage status.",
    createdAt: DEFAULT_TIMESTAMP,
  };

  sites.site_planningHub = {
    id: "site_planningHub",
    pageId: "planningHub",
    slug: "launch-hub",
    theme: "paper",
    publishedAt: DEFAULT_TIMESTAMP,
  };

  const templates = {
    meetingTemplate: makeTemplate("meetingTemplate", "page", "Meeting notes", {
      title: "New Meeting Notes",
      icon: "Mic",
      parentId: "planningHub",
      spaceId: "workspace",
      summary: "Capture agenda, notes, decisions, and follow-up actions.",
      blocks: [
        { type: "heading", text: "Meeting notes" },
        {
          type: "callout",
          text: "Launch brief synced across planning surfaces. Keep this block aligned with the meeting notes template.",
          tone: "info",
          syncGroupId: "sync_launch_context",
        },
        { type: "paragraph", text: "Agenda" },
        { type: "todo", text: "Action items", checked: false },
      ],
    }),
    wikiTemplate: makeTemplate("wikiTemplate", "page", "Wiki entry", {
      title: "New Wiki Page",
      icon: "BookOpenText",
      parentId: "teamWiki",
      spaceId: "workspace",
      summary: "Document the process, glossary, or ritual.",
      blocks: [
        { type: "heading", text: "Topic" },
        { type: "paragraph", text: "Context and decision." },
        { type: "bullet", text: "Key points" },
      ],
    }),
    taskTemplate: makeTemplate("taskTemplate", "record", "Task template", {
      databaseId: "tasks",
      values: {
        status: "Not started",
        priority: "Medium",
        estimate: 1,
        completed: false,
      },
    }),
  };

  const forms = {
    feedbackForm: {
      id: "feedbackForm",
      databaseId: "feedback",
      title: "Product Feedback Form",
      description: "Collect bugs, requests, and rough ideas in one place.",
      fieldOrder: ["title", "requester", "priority", "details"],
      submitLabel: "Send feedback",
      publicSlug: "feedback",
      parentPageId: "feedbackDbPage",
      spaceId: "workspace",
    },
    clipCaptureForm: {
      id: "clipCaptureForm",
      databaseId: "clips",
      title: "Capture a link",
      description: "Save a URL and a short summary to your research database.",
      fieldOrder: ["title", "url", "summary", "tags"],
      submitLabel: "Save clip",
      publicSlug: "capture",
      parentPageId: "clipsDbPage",
      spaceId: "workspace",
    },
  };

  const automations = {
    automation_meeting: {
      id: "automation_meeting",
      title: "Create launch meeting note",
      description: "Spin up a new meeting note page from the synced launch template.",
      action: {
        type: "createPageFromTemplate",
        templateId: "meetingTemplate",
        title: "Launch Sync",
        parentId: "planningHub",
        spaceId: "workspace",
      },
    },
    automation_bugtriage: {
      id: "automation_bugtriage",
      title: "Create bug triage task",
      description: "Create a follow-up task in the tasks database.",
      action: {
        type: "createRecord",
        databaseId: "tasks",
        parentPageId: "tasksDbPage",
        spaceId: "workspace",
        values: {
          title: "Review new feedback",
          status: "Not started",
          priority: "High",
          dueDate: "2026-05-01",
          project: ["projLaunch"],
          estimate: 1,
          completed: false,
        },
      },
    },
  };

  return {
    workspace: {
      version: 1,
      name: "HabitFlow Workspace",
      defaultSpaceId: "workspace",
      spaceOrder: ["workspace", "personal"],
      favoritePageIds: ["home", "planningHub", "personalHub"],
      recentPageIds: ["planningHub", "projectsDbPage", "personalHub"],
      user: {
        id: "local-user",
        name: "Local User",
        email: "user@local.app",
      },
      sequence: 5000,
    },
    spaces: {
      workspace: {
        id: "workspace",
        name: "Workspace",
        icon: "Layers3",
        rootPageIds: ["home"],
      },
      personal: {
        id: "personal",
        name: "Personal",
        icon: "HeartPulse",
        rootPageIds: ["personalHub"],
      },
    },
    pages,
    blocks,
    databases,
    views,
    records,
    comments,
    templates,
    forms,
    automations,
    sites,
    activity: [
      {
        id: nextId("activity"),
        at: DEFAULT_TIMESTAMP,
        type: "page_published",
        pageId: "planningHub",
        label: "Published Q2 Launch Hub",
      },
      {
        id: nextId("activity"),
        at: DEFAULT_TIMESTAMP,
        type: "record_created",
        pageId: "page_feedbackSeed",
        databaseId: "feedback",
        label: "Added feedback item Need better command palette",
      },
    ],
  };
};

export {
  addBlock,
  addComment,
  createClip,
  createPage,
  createRecord,
  createWorkspaceSeed,
  deleteBlock,
  duplicateBlock,
  exportWorkspaceState,
  getBreadcrumbs,
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
};
