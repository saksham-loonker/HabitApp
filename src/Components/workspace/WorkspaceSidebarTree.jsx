import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Dot, FilePlus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createWorkspacePageUrl } from "@/utils";
import { resolveWorkspaceIcon } from "@/workspace/iconMap";

function TreeNode({ node, activePageId, depth }) {
  const Icon = resolveWorkspaceIcon(node.icon);
  const isActive = activePageId === node.id;

  return (
    <div className="space-y-1">
      <Link
        to={createWorkspacePageUrl(node.id)}
        className={cn(
          "group flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-all duration-200",
          isActive
            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/15"
            : "text-slate-600 hover:bg-white hover:text-slate-950",
        )}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        {node.children.length > 0 ? (
          <ChevronRight className={cn("h-4 w-4 opacity-50", isActive && "opacity-80")} />
        ) : (
          <Dot className={cn("h-4 w-4 opacity-50", isActive && "opacity-80")} />
        )}
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate font-medium">{node.title}</span>
      </Link>

      {node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} activePageId={activePageId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceSidebarTree({ tree = [], activePageId, onCreatePage }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Workspace</p>
          <p className="text-xs text-slate-400">Pages, databases, and published surfaces</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onCreatePage}>
          <FilePlus className="h-4 w-4" />
        </Button>
      </div>

      <motion.div layout className="space-y-1 rounded-[28px] bg-slate-100/80 p-2">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} activePageId={activePageId} depth={0} />
        ))}
      </motion.div>
    </div>
  );
}
