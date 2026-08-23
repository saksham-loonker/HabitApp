import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import WorkspaceOverview from "@/components/workspace/WorkspaceOverview";
import { workspaceStore } from "@/api/workspaceStore";
import { createWorkspacePageUrl } from "@/utils";

const invalidateWorkspace = (queryClient) =>
  queryClient.invalidateQueries({
    predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === "workspace",
  });

export default function Workspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: model, isLoading } = useQuery({
    queryKey: ["workspace", "overview"],
    queryFn: () => workspaceStore.workspace.overview(),
  });

  const createPageMutation = useMutation({
    mutationFn: () => workspaceStore.pages.create({ title: "Untitled page", parentId: "home", spaceId: "workspace" }),
    onSuccess: async (page) => {
      await invalidateWorkspace(queryClient);
      navigate(createWorkspacePageUrl(page.id));
    },
  });

  const templateMutation = useMutation({
    mutationFn: (templateId) => workspaceStore.pages.instantiateTemplate(templateId, {}),
    onSuccess: async (page) => {
      await invalidateWorkspace(queryClient);
      if (page) {
        navigate(createWorkspacePageUrl(page.id));
      }
    },
  });

  const automationMutation = useMutation({
    mutationFn: (automationId) => workspaceStore.automations.run(automationId),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
    },
  });

  const clipMutation = useMutation({
    mutationFn: (payload) => workspaceStore.clips.capture(payload),
    onSuccess: async () => {
      await invalidateWorkspace(queryClient);
    },
  });

  const exportWorkspace = async () => {
    const data = await workspaceStore.workspace.export();
    const blob = new Blob([data], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "habitflow-workspace.json";
    anchor.click();
    URL.revokeObjectURL(href);
  };

  if (isLoading || !model) {
    return <div className="rounded-[32px] border border-white/70 bg-white/80 p-10 text-sm text-slate-500">Loading workspace...</div>;
  }

  return (
    <WorkspaceOverview
      model={model}
      onCreatePage={() => createPageMutation.mutate()}
      onOpenTemplate={(templateId) => templateMutation.mutate(templateId)}
      onRunAutomation={(automationId) => automationMutation.mutate(automationId)}
      onCaptureClip={(payload) => clipMutation.mutateAsync(payload)}
      onExport={exportWorkspace}
    />
  );
}
