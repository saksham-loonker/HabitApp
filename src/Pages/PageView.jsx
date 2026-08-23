import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ExternalLink, FormInput, Layers3, Plus } from "lucide-react";
import { workspaceStore } from "@/api/workspaceStore";
import PageCommentsPanel from "@/components/workspace/PageCommentsPanel";
import PageEditor from "@/components/workspace/PageEditor";
import DatabaseViewRenderer from "@/components/workspace/DatabaseViewRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createFormUrl, createSiteUrl, createWorkspacePageUrl } from "@/utils";

const invalidateWorkspace = (queryClient) =>
  queryClient.invalidateQueries({
    predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === "workspace",
  });

export default function PageView() {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const queryClient = useQueryClient();
  const [activeViewId, setActiveViewId] = useState(null);

  const { data: model, isLoading } = useQuery({
    queryKey: ["workspace", "page", pageId],
    queryFn: () => workspaceStore.pages.get(pageId),
  });

  const pageDatabase = model?.page?.linkedDatabaseId ? model.linkedDatabase : null;

  useEffect(() => {
    if (pageDatabase?.viewIds?.length) {
      setActiveViewId(pageDatabase.viewIds[0]);
    } else {
      setActiveViewId(null);
    }
  }, [pageDatabase?.id, model?.page?.id]);

  const { data: viewModel } = useQuery({
    enabled: Boolean(pageDatabase && activeViewId),
    queryKey: ["workspace", "database", pageDatabase?.id, activeViewId],
    queryFn: () => workspaceStore.databases.getViewModel(pageDatabase.id, activeViewId),
  });

  const pageMutation = useMutation({
    mutationFn: ({ id, updates }) => workspaceStore.pages.update(id, updates),
    onSuccess: async () => invalidateWorkspace(queryClient),
  });
  const addBlockMutation = useMutation({
    mutationFn: ({ id, input }) => workspaceStore.pages.addBlock(id, input),
    onSuccess: async () => invalidateWorkspace(queryClient),
  });
  const updateBlockMutation = useMutation({
    mutationFn: ({ blockId, updates }) => workspaceStore.pages.updateBlock(blockId, updates),
    onSuccess: async () => invalidateWorkspace(queryClient),
  });
  const duplicateBlockMutation = useMutation({
    mutationFn: (blockId) => workspaceStore.pages.duplicateBlock(blockId),
    onSuccess: async () => invalidateWorkspace(queryClient),
  });
  const deleteBlockMutation = useMutation({
    mutationFn: (blockId) => workspaceStore.pages.deleteBlock(blockId),
    onSuccess: async () => invalidateWorkspace(queryClient),
  });
  const commentMutation = useMutation({
    mutationFn: (content) => workspaceStore.pages.addComment(pageId, { content }),
    onSuccess: async () => invalidateWorkspace(queryClient),
  });
  const publishMutation = useMutation({
    mutationFn: () => workspaceStore.pages.publish(pageId, {}),
    onSuccess: async () => invalidateWorkspace(queryClient),
  });
  const recordMutation = useMutation({
    mutationFn: ({ recordId, updates }) => workspaceStore.databases.updateRecord(pageDatabase.id, recordId, updates),
    onSuccess: async () => invalidateWorkspace(queryClient),
  });
  const createSubpageMutation = useMutation({
    mutationFn: () => workspaceStore.pages.create({ title: "New subpage", parentId: pageId, spaceId: model.page.spaceId }),
    onSuccess: async (page) => {
      await invalidateWorkspace(queryClient);
      navigate(createWorkspacePageUrl(page.id));
    },
  });

  const recordSummary = useMemo(() => {
    if (!model?.record || !model?.page?.databaseId) {
      return [];
    }

    const database = model.linkedDatabase;
    if (!database) {
      return [];
    }

    return database.propertyOrder
      .filter((propertyId) => propertyId !== "title")
      .map((propertyId) => ({
        id: propertyId,
        label: database.properties[propertyId].name,
        value: model.record.values[propertyId],
      }))
      .filter((item) => item.value !== undefined && item.value !== null && item.value !== "");
  }, [model]);

  if (isLoading || !model) {
    return <div className="rounded-[32px] border border-white/70 bg-white/80 p-10 text-sm text-slate-500">Loading page...</div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {model.breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              {index > 0 && <ArrowRight className="h-3.5 w-3.5" />}
              <Link to={crumb.href} className="font-medium hover:text-slate-950">
                {crumb.title}
              </Link>
            </React.Fragment>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {model.page.kind}
              </Badge>
              {pageDatabase && (
                <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                  Database page
                </Badge>
              )}
              {model.site && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Published
                </Badge>
              )}
            </div>
            <p className="text-sm leading-6 text-slate-500">{model.page.summary}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => createSubpageMutation.mutate()}>
              <Plus className="mr-2 h-4 w-4" />
              New subpage
            </Button>
            {pageDatabase?.formIds?.[0] && (
              <Link to={createFormUrl(pageDatabase.formIds[0])}>
                <Button variant="outline" className="rounded-full">
                  <FormInput className="mr-2 h-4 w-4" />
                  Open form
                </Button>
              </Link>
            )}
            {model.site ? (
              <Link to={createSiteUrl(model.page.id)}>
                <Button className="rounded-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View site
                </Button>
              </Link>
            ) : (
              <Button className="rounded-full" onClick={() => publishMutation.mutate()}>
                <Layers3 className="mr-2 h-4 w-4" />
                Publish page
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,0.9fr)]">
        <div className="space-y-6">
          <PageEditor
            page={model.page}
            blocks={model.blocks}
            record={model.record}
            database={model.linkedDatabase}
            onUpdatePage={(id, updates) => pageMutation.mutate({ id, updates })}
            onAddBlock={(id, input) => addBlockMutation.mutate({ id, input })}
            onUpdateBlock={(blockId, updates) => updateBlockMutation.mutate({ blockId, updates })}
            onDuplicateBlock={(blockId) => duplicateBlockMutation.mutate(blockId)}
            onDeleteBlock={(blockId) => deleteBlockMutation.mutate(blockId)}
          />

          {pageDatabase && viewModel && (
            <DatabaseViewRenderer
              model={viewModel}
              currentViewId={activeViewId}
              onChangeView={setActiveViewId}
              onUpdateRecord={(recordId, updates) => recordMutation.mutate({ recordId, updates })}
            />
          )}
        </div>

        <div className="space-y-6">
          {recordSummary.length > 0 && (
            <section className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Record metadata</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {recordSummary.map((item) => (
                  <Badge key={item.id} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                    {item.label}: {Array.isArray(item.value) ? item.value.join(", ") : String(item.value)}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {model.childPages.length > 0 && (
            <section className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Subpages</p>
              <div className="mt-4 space-y-2">
                {model.childPages.map((child) => (
                  <Link
                    key={child.id}
                    to={createWorkspacePageUrl(child.id)}
                    className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 transition-colors duration-200 hover:bg-white"
                  >
                    <span>{child.title}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <PageCommentsPanel comments={model.comments} onSubmit={(content) => commentMutation.mutateAsync(content)} />
        </div>
      </div>
    </div>
  );
}
