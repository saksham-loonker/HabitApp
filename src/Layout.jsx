import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  FilePlus2,
  Heart,
  KanbanSquare,
  LayoutGrid,
  Menu,
  MessageSquare,
  PenTool,
  Search,
  Settings,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { workspaceStore } from "@/api/workspaceStore";
import WorkspaceSidebarTree from "@/components/workspace/WorkspaceSidebarTree";
import WorkspaceCommandPalette from "@/components/workspace/WorkspaceCommandPalette";
import { createPageUrl, createWorkspacePageUrl } from "@/utils";

const legacyNav = [
  { label: "Personal", href: "/personal", icon: LayoutGrid },
  { label: "Tasks", href: "/tasks", icon: CheckCircle2 },
  { label: "Habits", href: "/habits", icon: Heart },
  { label: "Assistant", href: "/assistant", icon: MessageSquare },
  { label: "Mood", href: "/mood", icon: Sparkles },
  { label: "Focus", href: "/focus", icon: Target },
  { label: "Journal", href: "/journal", icon: PenTool },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Board", href: "/kanban", icon: KanbanSquare },
];

const invalidateWorkspace = (queryClient) =>
  queryClient.invalidateQueries({
    predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === "workspace",
  });

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activePageId = location.pathname.startsWith("/pages/")
    ? location.pathname.split("/")[2]
    : location.pathname === "/"
      ? "home"
      : null;

  const { data: sidebar } = useQuery({
    queryKey: ["workspace", "sidebar"],
    queryFn: () => workspaceStore.workspace.sidebar(),
  });

  const createPageMutation = useMutation({
    mutationFn: () =>
      workspaceStore.pages.create({
        title: "Untitled page",
        parentId: activePageId && activePageId !== "home" ? activePageId : "home",
        spaceId: "workspace",
      }),
    onSuccess: async (page) => {
      await invalidateWorkspace(queryClient);
      setMobileOpen(false);
      navigate(createWorkspacePageUrl(page.id));
    },
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const renderSidebarContent = () => (
    <>
      <div className="rounded-[32px] bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_36%),linear-gradient(160deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-xl shadow-slate-200/70">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-slate-950 text-white shadow-lg shadow-slate-950/20">
            <span className="text-base font-semibold">HF</span>
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-950">HabitFlow</p>
            <p className="text-sm text-slate-500">Workspace OS</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" className="justify-start rounded-2xl border-slate-200 bg-white" onClick={() => setSearchOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button className="justify-start rounded-2xl" onClick={() => createPageMutation.mutate()}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            New page
          </Button>
        </div>
      </div>

      <WorkspaceSidebarTree tree={sidebar?.tree || []} activePageId={activePageId} onCreatePage={() => createPageMutation.mutate()} />

      {(sidebar?.recents?.length || 0) > 0 && (
        <div className="space-y-3">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent</p>
          </div>
          <div className="rounded-[28px] bg-slate-100/80 p-2">
            {sidebar.recents.map((page) => (
              <Link
                key={page.id}
                to={createWorkspacePageUrl(page.id)}
                className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-white hover:text-slate-950"
              >
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span className="truncate">{page.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Personal tools</p>
          <p className="text-xs text-slate-400">The original life management surfaces</p>
        </div>
        <div className="rounded-[28px] bg-slate-100/80 p-2">
          {legacyNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white hover:text-slate-950",
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <Link
        to={createPageUrl("Settings")}
        className={cn(
          "mt-auto flex items-center gap-3 rounded-[24px] border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-950",
          location.pathname === "/settings" && "border-slate-300 text-slate-950",
        )}
        onClick={() => setMobileOpen(false)}
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_25%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <WorkspaceCommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[320px] overflow-hidden border-r border-white/60 bg-white/75 px-4 py-4 backdrop-blur-2xl md:block">
        <div className="flex h-full flex-col gap-4 overflow-y-auto custom-scrollbar">{renderSidebarContent()}</div>
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/60 bg-white/80 px-4 py-4 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-slate-200/60"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium text-slate-500 shadow-lg shadow-slate-200/60"
        >
          <Search className="h-4 w-4" />
          Search the workspace
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -340 }}
              animate={{ x: 0 }}
              exit={{ x: -340 }}
              className="fixed inset-y-0 left-0 z-[60] w-[320px] bg-white px-4 py-4 md:hidden"
            >
              <div className="mb-4 flex justify-end">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex h-[calc(100%-3.5rem)] flex-col gap-4 overflow-y-auto custom-scrollbar">{renderSidebarContent()}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-h-screen md:pl-[320px]">
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
