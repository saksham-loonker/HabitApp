# Workspace Platform Design

## Goal

Transform HabitFlow from a local task and habit tracker into a local-first workspace platform that combines:

- structured documents
- reusable page blocks
- typed databases with multiple views
- comments and collaboration surfaces
- forms, publishing, and capture workflows
- AI assistance over workspace context
- existing personal productivity tools

The target is not a pixel clone of Notion. The target is a stronger product direction for this repo: a personal-and-team operating system that keeps the life-management features already present while adding a real knowledge and workflow layer.

## Current State

The current app is a Vite + React SPA with a small `localStorage` persistence layer and a narrow entity set:

- tasks
- habits
- projects
- mood history
- user preferences

There is no general workspace model, no page graph, no block editor, no generic database engine, no comment system, no form system, no publishing layer, and no real document persistence. The journal page is local component state only.

## Product Direction

HabitFlow becomes a three-layer product:

1. Workspace Core
   - pages, blocks, databases, forms, comments, templates, automation actions, publishing metadata
2. Execution Layer
   - projects, tasks, roadmaps, meeting notes, feedback, clips, dashboards
3. Personal OS Layer
   - habits, focus, mood, journal, assistant, calendar, and task workflows already present in the app

The existing personal tools remain available, but they stop being the entire product.

## Experience Principles

- Local-first by default
- Fast page switching and resilient autosave
- Typed data, not hard-coded screens
- One source of truth powering many views
- Low-friction capture from anywhere in the app
- Strong visual hierarchy without becoming generic enterprise UI
- AI used as an accelerator, not a trapdoor for hidden actions

## Phase 1 Scope

Phase 1 is the first platform migration and includes:

- workspace home surface
- page tree and nested navigation
- page editor with multiple block types
- reusable synced block support
- typed databases and records
- table, board, calendar, gallery, timeline, and chart views
- relation, rollup, and formula properties
- templates and button-like quick actions
- page comments and discussions
- forms backed by databases
- local publishing preview for public pages
- capture/web-clip style URL saving
- workspace search and recents
- exportable local workspace state

Phase 1 explicitly does not attempt:

- multi-user realtime sync
- remote auth or permissions backed by a server
- true external email/calendar integration
- enterprise SSO/admin tooling

Those are later phases and would require backend infrastructure beyond this repo.

## Information Architecture

### Top-level surfaces

- Workspace: default home, search, favorites, recents, templates, automation actions
- Pages: freeform documents and nested subpages
- Databases: typed collections rendered through multiple views
- Forms: public capture endpoints for database submission
- Publish: public page render mode
- Personal Hub: existing dashboard, tasks, habits, mood, focus, journal, calendar, kanban, assistant

### Core entities

- `workspace`: versioned root metadata
- `space`: logical grouping for page trees
- `page`: navigable node with metadata, blocks, and optional linked database
- `block`: typed content unit inside a page
- `database`: schema + records + views
- `record`: typed row for a database, backed by a page
- `view`: database projection and visualization settings
- `comment`: page or block discussion thread entry
- `template`: reusable page or record blueprint
- `form`: database-backed submission surface
- `site`: publication metadata for a page
- `automation`: button/action configuration
- `clip`: captured URL entry
- `activity`: event log for recent changes

## Storage Strategy

Phase 1 uses a versioned client-side store. The app keeps the existing `localStore` for legacy personal tools and adds a new workspace store for the platform layer.

Reasons:

- avoids destabilizing the current task/habit flow while new foundations land
- keeps migrations explicit
- allows richer schema evolution
- keeps the code organized around product domains rather than forcing generic behavior into the old store

The workspace store owns:

- schema versioning
- seeded content
- deterministic computed values
- activity logging
- exportable snapshots

## Block System

Supported initial block types:

- paragraph
- heading
- subheading
- to-do
- bullet
- quote
- callout
- code
- divider
- bookmark
- synced reference

Each block is editable inline. Blocks can be inserted, reordered, duplicated, or deleted. Synced blocks are modeled through a shared sync group id instead of copying raw text.

## Database System

### Property types

- title
- text
- number
- status
- select
- multi-select
- checkbox
- date
- person
- url
- relation
- rollup
- formula

### View types

- table
- board
- calendar
- gallery
- timeline
- chart

Each record is also a page, so structured data and freeform notes coexist.

### Computed properties

- relation: links records across databases
- rollup: aggregates related records
- formula: evaluates derived values from record properties

The formula engine is intentionally limited to local expressions and helper functions. It is not a full scripting runtime.

## Comments and Collaboration

Phase 1 adds asynchronous collaboration surfaces even in a single-user local app:

- page discussions
- block-anchored comments
- mentions rendered as text conventions
- activity feed

This gives the future collaboration model a clear UI shape without pretending there is already server-backed multi-user state.

## Forms and Publishing

Forms are database-backed projections of editable properties. A form submission creates a new record and record page.

Publishing creates a local public render route for a page. This supports:

- public style rendering
- hidden editor controls
- embeddable/previewable page output inside the SPA

This is a product scaffold, not true internet hosting.

## AI Layer

The existing Cerebras integration remains optional. Workspace AI features in Phase 1 include:

- page-aware prompt context
- database summary prompts
- record drafting prompts
- workspace quick actions

If the API key is missing, the UI still works and clearly degrades.

## Migration Strategy

### Preserve

- existing personal productivity pages
- existing styling foundation
- current UI primitives
- current assistant and life-management concepts

### Add

- new workspace routes
- new data store and engine
- new workspace navigation patterns
- new platform components

### Do not do yet

- destructive replacement of the old personal flows

## Risks

- UI complexity can sprawl if the new workspace and old personal surfaces are not clearly separated
- formula/rollup recursion can produce unstable behavior if not carefully bounded
- `localStorage` size limits constrain long-term scale
- route and layout complexity can regress mobile navigation if not tested carefully

## Mitigations

- keep the engine pure and test it first
- isolate workspace state from legacy state
- build view renderers as focused components
- keep mobile layout intentional, not desktop-first
- ship export support early so data is portable

## Success Criteria

Phase 1 succeeds if the app can do all of the following locally:

- open a workspace home with a real page tree
- create and edit rich pages with typed blocks
- create databases with multiple views over the same records
- compute relations, rollups, and formulas
- add comments to pages
- submit a form into a database
- preview a published page
- search across pages, blocks, and records
- keep old personal productivity flows working
