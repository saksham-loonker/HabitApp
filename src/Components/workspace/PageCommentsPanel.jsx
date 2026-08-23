import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function PageCommentsPanel({ comments = [], onSubmit }) {
  const [draft, setDraft] = useState("");

  const submit = async () => {
    const content = draft.trim();
    if (!content) {
      return;
    }
    await onSubmit(content);
    setDraft("");
  };

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Discussion</h2>
          <p className="text-sm text-slate-500">Page and block comments stay attached to the work.</p>
        </div>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">{comment.author}</p>
              <p className="text-xs text-slate-400">{comment.blockId ? "Block note" : "Page note"}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{comment.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Leave an observation, decision, or follow-up note"
          className="min-h-[112px] rounded-3xl border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus-visible:ring-slate-400"
        />
        <div className="flex justify-end">
          <Button className="rounded-full" onClick={submit}>
            Add comment
          </Button>
        </div>
      </div>
    </section>
  );
}
