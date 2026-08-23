import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ExternalLink,
  FilePlus,
  Globe,
  Rocket,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createFormUrl, createSiteUrl, createWorkspacePageUrl } from "@/utils";
import { resolveWorkspaceIcon } from "@/workspace/iconMap";

const statCardClass =
  "rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur-xl";

export default function WorkspaceOverview({
  model,
  onCreatePage,
  onOpenTemplate,
  onRunAutomation,
  onCaptureClip,
  onExport,
}) {
  const [showClipForm, setShowClipForm] = useState(false);
  const [clipDraft, setClipDraft] = useState({
    title: "",
    url: "",
    summary: "",
    tags: "research, captured",
  });

  const metrics = useMemo(
    () => [
      { label: "Pages", value: model.pages.length + model.pages.flatMap((page) => page.children).length },
      { label: "Databases", value: model.databases.length },
      { label: "Forms", value: model.forms.length },
      { label: "Published", value: model.publishedPages.length },
    ],
    [model],
  );

  const submitClip = async () => {
    await onCaptureClip({
      title: clipDraft.title || clipDraft.url,
      url: clipDraft.url,
      summary: clipDraft.summary,
      tags: clipDraft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setClipDraft({
      title: "",
      url: "",
      summary: "",
      tags: "research, captured",
    });
    setShowClipForm(false);
  };

  return (
    <div className="space-y-8 pb-24">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[36px] border border-white/60 bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_36%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_34%),linear-gradient(145deg,#fffdf8_0%,#f8fafc_100%)] p-8 shadow-2xl shadow-amber-100/60"
      >
        <div className="absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle,#f59e0b22,transparent_60%)]" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-600">
              Workspace Platform
            </Badge>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              HabitFlow now has pages, databases, forms, publishing, and a real operating layer.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              The personal productivity tools still exist, but they now sit beside a workspace core that can hold
              launch plans, wikis, clips, tasks, and public-facing pages.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onCreatePage} className="rounded-full">
              <FilePlus className="mr-2 h-4 w-4" />
              New page
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setShowClipForm((value) => !value)}>
              <Globe className="mr-2 h-4 w-4" />
              Capture link
            </Button>
            <Button variant="outline" className="rounded-full" onClick={onExport}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>

        {showClipForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mt-6 grid gap-4 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60 md:grid-cols-2"
          >
            <Input
              value={clipDraft.title}
              onChange={(event) => setClipDraft((draft) => ({ ...draft, title: event.target.value }))}
              placeholder="Clip title"
            />
            <Input
              value={clipDraft.url}
              onChange={(event) => setClipDraft((draft) => ({ ...draft, url: event.target.value }))}
              placeholder="https://example.com"
            />
            <Textarea
              value={clipDraft.summary}
              onChange={(event) => setClipDraft((draft) => ({ ...draft, summary: event.target.value }))}
              placeholder="Why this matters"
              className="md:col-span-2"
            />
            <Input
              value={clipDraft.tags}
              onChange={(event) => setClipDraft((draft) => ({ ...draft, tags: event.target.value }))}
              placeholder="research, launch"
              className="md:col-span-2"
            />
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setShowClipForm(false)}>
                Cancel
              </Button>
              <Button className="rounded-full" onClick={submitClip} disabled={!clipDraft.url.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Save clip
              </Button>
            </div>
          </motion.div>
        )}
      </motion.section>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={statCardClass}
          >
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <div className={statCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Favorites</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Pinned workspace surfaces</h2>
              </div>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {model.favorites.map((page) => {
                const Icon = resolveWorkspaceIcon(page.icon);
                return (
                  <Link
                    key={page.id}
                    to={createWorkspacePageUrl(page.id)}
                    className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-base font-semibold text-slate-950">{page.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{page.summary}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={statCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Databases</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Multi-view operational systems</h2>
              </div>
              <Rocket className="h-5 w-5 text-sky-500" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {model.databases.map((database) => {
                const page = model.pages
                  .flatMap((node) => [node, ...node.children])
                  .find((node) => node.linkedDatabaseId === database.id);

                return (
                  <Link
                    key={database.id}
                    to={page ? createWorkspacePageUrl(page.id) : "/"}
                    className="rounded-[24px] border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950">{database.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {database.recordIds.length} records across {database.viewIds.length} views
                        </p>
                      </div>
                      <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600">
                        {database.viewIds.length} views
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={statCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Templates</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">Start from a shape</h2>
              </div>
              <Wand2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="space-y-2">
              {model.templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onOpenTemplate(template.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left transition-colors duration-200 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{template.name}</p>
                    <p className="text-xs text-slate-500">{template.kind}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          <div className={statCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Forms and sites</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">Capture and publish</h2>
              </div>
              <Globe className="h-5 w-5 text-violet-500" />
            </div>
            <div className="space-y-2">
              {model.forms.map((form) => (
                <Link
                  key={form.id}
                  to={createFormUrl(form.id)}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-950 transition-colors duration-200 hover:bg-white"
                >
                  <span>{form.title}</span>
                  <Badge variant="outline" className="border-slate-300 bg-white text-slate-600">
                    Open form
                  </Badge>
                </Link>
              ))}

              {model.publishedPages.map((site) => (
                <Link
                  key={site.id}
                  to={createSiteUrl(site.pageId)}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-950 transition-colors duration-200 hover:bg-white"
                >
                  <span>{site.slug}</span>
                  <Badge variant="outline" className="border-slate-300 bg-white text-slate-600">
                    View site
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          <div className={statCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Automation</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">Button-style actions</h2>
              </div>
              <Sparkles className="h-5 w-5 text-fuchsia-500" />
            </div>
            <div className="space-y-2">
              {model.automations.map((automation) => (
                <button
                  key={automation.id}
                  type="button"
                  onClick={() => onRunAutomation(automation.id)}
                  className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left transition-colors duration-200 hover:bg-white"
                >
                  <p className="text-sm font-semibold text-slate-950">{automation.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{automation.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={statCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent activity</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">What changed in the workspace</h2>
          </div>
        </div>

        <div className="space-y-2">
          {model.activity.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-950">{entry.label}</p>
                <p className="text-xs text-slate-500">{entry.type}</p>
              </div>
              {entry.pageId && (
                <Link to={createWorkspacePageUrl(entry.pageId)} className="text-xs font-semibold text-slate-500">
                  Open
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
