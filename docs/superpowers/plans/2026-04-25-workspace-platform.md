# Workspace Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-first workspace platform to HabitFlow with pages, blocks, database views, computed properties, comments, forms, publishing, search, and preserved legacy personal tools.

**Architecture:** Introduce a pure workspace engine and a separate workspace store, then layer React pages/components on top. Keep the existing local productivity pages intact while making the new workspace home the primary route.

**Tech Stack:** React 18, React Router 6, TanStack Query, Tailwind, Framer Motion, Recharts, Node built-in test runner

---

## File Structure

- Create: `tests/workspace-engine.test.js`
- Create: `src/workspace/engine.js`
- Create: `src/api/workspaceStore.js`
- Create: `src/Pages/Workspace.jsx`
- Create: `src/Pages/PageView.jsx`
- Create: `src/Pages/FormView.jsx`
- Create: `src/Pages/PublicSite.jsx`
- Create: `src/Components/workspace/WorkspaceSidebarTree.jsx`
- Create: `src/Components/workspace/WorkspaceCommandPalette.jsx`
- Create: `src/Components/workspace/WorkspaceOverview.jsx`
- Create: `src/Components/workspace/PageEditor.jsx`
- Create: `src/Components/workspace/PageCommentsPanel.jsx`
- Create: `src/Components/workspace/DatabaseViewRenderer.jsx`
- Modify: `src/App.jsx`
- Modify: `src/Layout.jsx`
- Modify: `src/utils.js`
- Modify: `package.json`
- Modify: `src/index.css`

## Task 1: Create the engine contract with tests

**Files:**
- Create: `tests/workspace-engine.test.js`
- Create: `src/workspace/engine.js`

- [ ] Step 1: Write failing tests for seeded workspace state, search, computed properties, and form submission.
- [ ] Step 2: Run `node --test tests/workspace-engine.test.js` and verify failure because the engine module does not exist yet.
- [ ] Step 3: Implement the pure engine with deterministic seed data and helper functions.
- [ ] Step 4: Run `node --test tests/workspace-engine.test.js` and verify it passes.

## Task 2: Add the workspace persistence layer

**Files:**
- Create: `src/api/workspaceStore.js`
- Modify: `package.json`

- [ ] Step 1: Write a failing test that exercises store bootstrap and mutation helpers through the engine adapters or add a narrow store smoke test if needed.
- [ ] Step 2: Run the targeted test and verify failure.
- [ ] Step 3: Implement versioned local storage helpers, CRUD methods, and export support.
- [ ] Step 4: Re-run the targeted tests plus `node --test tests/workspace-engine.test.js`.

## Task 3: Replace the app entry route with workspace surfaces

**Files:**
- Modify: `src/App.jsx`
- Create: `src/Pages/Workspace.jsx`
- Create: `src/Pages/PageView.jsx`
- Create: `src/Pages/FormView.jsx`
- Create: `src/Pages/PublicSite.jsx`
- Modify: `src/utils.js`

- [ ] Step 1: Add routing tests where practical through pure helpers, or define deterministic path helper expectations.
- [ ] Step 2: Implement workspace routes and dynamic page/form/site routing while preserving legacy routes.
- [ ] Step 3: Make workspace home the `/` route and move the old dashboard to a preserved personal route.
- [ ] Step 4: Run `npm run build`.

## Task 4: Upgrade the shell navigation

**Files:**
- Modify: `src/Layout.jsx`
- Create: `src/Components/workspace/WorkspaceSidebarTree.jsx`
- Create: `src/Components/workspace/WorkspaceCommandPalette.jsx`

- [ ] Step 1: Add shell support for workspace favorites, page tree, and quick search.
- [ ] Step 2: Keep legacy personal pages visible in a separate section.
- [ ] Step 3: Add mobile-safe navigation behavior and keyboard-open search.
- [ ] Step 4: Run `npm run build`.

## Task 5: Implement the workspace overview

**Files:**
- Create: `src/Components/workspace/WorkspaceOverview.jsx`
- Create: `src/Pages/Workspace.jsx`

- [ ] Step 1: Build cards for favorites, recent edits, templates, forms, comments, and automation actions.
- [ ] Step 2: Add quick capture actions for new page, new database item, and URL clip creation.
- [ ] Step 3: Add export workspace action.
- [ ] Step 4: Run `npm run build`.

## Task 6: Implement the page editor and comments panel

**Files:**
- Create: `src/Components/workspace/PageEditor.jsx`
- Create: `src/Components/workspace/PageCommentsPanel.jsx`
- Create: `src/Pages/PageView.jsx`

- [ ] Step 1: Render editable block rows with multiple block types.
- [ ] Step 2: Support add, delete, duplicate, and reorder operations.
- [ ] Step 3: Render synced block behavior and page metadata.
- [ ] Step 4: Add page discussion and comment submission flows.
- [ ] Step 5: Run `npm run build`.

## Task 7: Implement the multi-view database renderer

**Files:**
- Create: `src/Components/workspace/DatabaseViewRenderer.jsx`
- Create: `src/Pages/PageView.jsx`

- [ ] Step 1: Render table view using computed record values.
- [ ] Step 2: Render board, calendar, gallery, and timeline views over the same records.
- [ ] Step 3: Render a chart view using `recharts`.
- [ ] Step 4: Add view switching and record editing.
- [ ] Step 5: Run `npm run build`.

## Task 8: Implement forms and publishing

**Files:**
- Create: `src/Pages/FormView.jsx`
- Create: `src/Pages/PublicSite.jsx`
- Create: `src/Pages/PageView.jsx`

- [ ] Step 1: Render database-backed public form fields and submission confirmation.
- [ ] Step 2: Add publish toggles and local public page rendering.
- [ ] Step 3: Add shareable link copy UI for forms and sites.
- [ ] Step 4: Run `npm run build`.

## Task 9: Polish styles for the new product direction

**Files:**
- Modify: `src/index.css`
- Modify: `src/Layout.jsx`
- Modify: workspace components as needed

- [ ] Step 1: Introduce workspace-specific surfaces, split-pane styling, and better content rhythm.
- [ ] Step 2: Ensure desktop and mobile layouts are both usable.
- [ ] Step 3: Run `npm run build`.

## Task 10: Final verification

**Files:**
- Verify all touched files

- [ ] Step 1: Run `node --test tests/workspace-engine.test.js`
- [ ] Step 2: Run `npm run build`
- [ ] Step 3: Review the feature checklist against the design doc and report actual completion status without overclaiming.
