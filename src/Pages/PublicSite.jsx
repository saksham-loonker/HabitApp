import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Globe } from "lucide-react";
import { workspaceStore } from "@/api/workspaceStore";
import DatabaseViewRenderer from "@/components/workspace/DatabaseViewRenderer";
import { createWorkspacePageUrl } from "@/utils";

function ReadOnlyBlock({ block }) {
  switch (block.type) {
    case "heading":
      return <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{block.text}</h2>;
    case "subheading":
      return <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{block.text}</h3>;
    case "quote":
      return <blockquote className="border-l-4 border-slate-300 pl-4 text-lg italic text-slate-600">{block.text}</blockquote>;
    case "callout":
      return <div className="rounded-[28px] bg-amber-50 px-5 py-4 text-slate-700">{block.text}</div>;
    case "todo":
      return (
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
          <input type="checkbox" checked={Boolean(block.checked)} readOnly />
          <span>{block.text}</span>
        </label>
      );
    case "code":
      return <pre className="overflow-x-auto rounded-[28px] bg-slate-950 p-5 text-xs text-slate-100">{block.text}</pre>;
    case "bookmark":
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-sky-700"
        >
          {block.text || block.url}
        </a>
      );
    case "divider":
      return <div className="h-px bg-slate-300" />;
    default:
      return <p className="text-base leading-8 text-slate-700">{block.text}</p>;
  }
}

export default function PublicSite() {
  const { pageId } = useParams();

  const { data: model, isLoading } = useQuery({
    queryKey: ["workspace", "site-page", pageId],
    queryFn: () => workspaceStore.pages.get(pageId),
  });

  const { data: viewModel } = useQuery({
    enabled: Boolean(model?.linkedDatabase?.id),
    queryKey: ["workspace", "site-database", model?.linkedDatabase?.id],
    queryFn: () => workspaceStore.databases.getViewModel(model.linkedDatabase.id, model.linkedDatabase.viewIds[0]),
  });

  if (isLoading || !model) {
    return <div className="min-h-screen bg-slate-100 p-10 text-sm text-slate-500">Loading published page...</div>;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Link to={createWorkspacePageUrl(model.page.id)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Back to editor
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
            <Globe className="h-4 w-4" />
            Published preview
          </div>
        </div>

        <article className="rounded-[36px] border border-white/70 bg-white/95 p-8 shadow-2xl shadow-slate-200/70">
          <h1 className="text-5xl font-semibold tracking-tight text-slate-950">{model.page.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{model.page.summary}</p>

          <div className="mt-10 space-y-6">
            {model.blocks.map((block) => (
              <ReadOnlyBlock key={block.id} block={block} />
            ))}
          </div>
        </article>

        {viewModel && <DatabaseViewRenderer model={viewModel} currentViewId={viewModel.view.id} readonly onChangeView={() => {}} onUpdateRecord={() => {}} />}
      </div>
    </div>
  );
}
