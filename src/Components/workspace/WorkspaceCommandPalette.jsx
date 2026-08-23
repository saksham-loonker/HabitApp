import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FileSearch, Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { workspaceStore } from "@/api/workspaceStore";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function WorkspaceCommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const { data: results = [] } = useQuery({
    enabled: open && deferredQuery.trim().length > 0,
    queryKey: ["workspace", "search", deferredQuery],
    queryFn: () => workspaceStore.workspace.search(deferredQuery),
  });

  const grouped = useMemo(() => {
    const groups = {
      page: [],
      record: [],
      block: [],
    };

    results.forEach((result) => {
      if (!groups[result.kind]) {
        groups[result.kind] = [];
      }
      groups[result.kind].push(result);
    });

    return groups;
  }, [results]);

  const sections = [
    { id: "page", label: "Pages" },
    { id: "record", label: "Database records" },
    { id: "block", label: "Block matches" },
  ];

  const handleSelect = (href) => {
    navigate(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="fixed left-1/2 top-20 z-[80] w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-[32px] border border-white/60 bg-white/95 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl"
          >
            <div className="border-b border-slate-200/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => setQuery(nextValue));
                  }}
                  placeholder="Search pages, records, comments, and captured links"
                  className="h-12 border-none bg-slate-100 text-base shadow-none hover:border-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-4 py-4 custom-scrollbar">
              {deferredQuery.trim().length === 0 ? (
                <div className="rounded-[28px] bg-slate-100/80 p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-950 shadow-lg shadow-slate-300/60">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-950">Jump anywhere</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Search page titles, database records, and matching blocks across the workspace.
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-[28px] bg-slate-100/80 p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-950 shadow-lg shadow-slate-300/60">
                    <FileSearch className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-950">No matches</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try another keyword like launch, feedback, clip, or workspace.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sections.map((section) => {
                    const items = grouped[section.id] || [];
                    if (items.length === 0) {
                      return null;
                    }

                    return (
                      <div key={section.id} className="space-y-2">
                        <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                          {section.label}
                        </p>
                        <div className="space-y-1 rounded-[28px] bg-slate-100/80 p-2">
                          {items.map((item) => (
                            <button
                              key={`${item.kind}-${item.id}`}
                              type="button"
                              onClick={() => handleSelect(item.href)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors duration-200",
                                "hover:bg-white",
                              )}
                            >
                              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-slate-400" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
                                <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
