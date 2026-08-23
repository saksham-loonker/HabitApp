import assert from "node:assert/strict";

import {
  createWorkspaceSeed,
  getPageTree,
  searchWorkspace,
  getDatabaseViewModel,
  submitFormResponse,
} from "../src/workspace/engine.js";

const run = (name, fn) => {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
};

run("creates a seeded workspace with nested pages and databases", () => {
  const state = createWorkspaceSeed();
  const tree = getPageTree(state);

  assert.ok(state.pages.home);
  assert.ok(state.databases.projects);
  assert.ok(state.databases.tasks);
  assert.ok(tree.length >= 2);
  assert.equal(tree[0].children.some((child) => child.id === "planningHub"), true);
});

run("searches pages, blocks, and records from one query", () => {
  const state = createWorkspaceSeed();
  const results = searchWorkspace(state, "launch");

  assert.ok(results.some((entry) => entry.kind === "page" && entry.id === "planningHub"));
  assert.ok(results.some((entry) => entry.kind === "record" && entry.databaseId === "projects"));
  assert.ok(results.some((entry) => entry.kind === "block"));
});

run("computes relation, rollup, and formula values in database views", () => {
  const state = createWorkspaceSeed();
  const viewModel = getDatabaseViewModel(state, "projects", "projectsTable");
  const launchProject = viewModel.rows.find((row) => row.id === "projLaunch");

  assert.equal(launchProject.values["projectTasks"].length >= 2, true);
  assert.equal(launchProject.values["openTaskCount"], 2);
  assert.equal(launchProject.values["deliveryHealth"], "At risk");
});

run("submitting a form creates a record and a record page", () => {
  const state = createWorkspaceSeed();
  const nextState = submitFormResponse(state, "feedbackForm", {
    title: "Add recurring automations",
    requester: "Ops Team",
    priority: "High",
    details: "Need weekly digest automation and follow-up reminders.",
  });

  const feedbackDb = nextState.databases.feedback;
  const newRecordId = feedbackDb.recordIds[feedbackDb.recordIds.length - 1];
  const newRecord = nextState.records[newRecordId];

  assert.equal(newRecord.values.requester, "Ops Team");
  assert.equal(newRecord.values.priority, "High");
  assert.ok(nextState.pages[newRecord.pageId]);
});
