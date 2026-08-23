import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { workspaceStore } from "@/api/workspaceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FormView() {
  const { formId } = useParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draft, setDraft] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["workspace", "form", formId],
    queryFn: () => workspaceStore.forms.get(formId),
  });

  const mutation = useMutation({
    mutationFn: (payload) => workspaceStore.forms.submit(formId, payload),
    onSuccess: () => setIsSubmitted(true),
  });

  const fields = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.form.fieldOrder.map((propertyId) => data.database.properties[propertyId]).filter(Boolean);
  }, [data]);

  if (isLoading || !data) {
    return <div className="min-h-screen bg-slate-100 p-10 text-sm text-slate-500">Loading form...</div>;
  }

  const submit = async () => {
    const payload = fields.reduce(
      (accumulator, field) => ({
        ...accumulator,
        [field.id]:
          field.type === "multi-select"
            ? String(draft[field.id] || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : draft[field.id] ?? field.defaultValue ?? "",
      }),
      {},
    );
    await mutation.mutateAsync(payload);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_28%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-[36px] border border-white/70 bg-white/95 p-8 shadow-2xl shadow-slate-200/70">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Back to workspace
        </Link>

        <div className="mt-6 space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{data.form.title}</h1>
          <p className="text-base leading-7 text-slate-600">{data.form.description}</p>
        </div>

        {isSubmitted ? (
          <div className="mt-8 rounded-[28px] border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-600 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">Submission captured</h2>
            <p className="mt-2 text-sm text-slate-600">
              The response now lives in the connected database and can be triaged inside the workspace.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">{field.name}</p>
                {field.type === "text" ? (
                  <Input
                    value={draft[field.id] || ""}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.id]: event.target.value }))}
                    className="rounded-2xl border-slate-200 bg-slate-50"
                  />
                ) : field.type === "select" || field.type === "status" ? (
                  <Select
                    value={draft[field.id] || field.defaultValue || field.options?.[0] || ""}
                    onValueChange={(value) => setDraft((current) => ({ ...current, [field.id]: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {(field.options || []).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "multi-select" ? (
                  <Input
                    value={draft[field.id] || ""}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.id]: event.target.value }))}
                    placeholder="tag-one, tag-two"
                    className="rounded-2xl border-slate-200 bg-slate-50"
                  />
                ) : field.type === "url" ? (
                  <Input
                    value={draft[field.id] || ""}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.id]: event.target.value }))}
                    placeholder="https://example.com"
                    className="rounded-2xl border-slate-200 bg-slate-50"
                  />
                ) : (
                  <Textarea
                    value={draft[field.id] || ""}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.id]: event.target.value }))}
                    className="min-h-[120px] rounded-3xl border-slate-200 bg-slate-50"
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end">
              <Button className="rounded-full" onClick={submit}>
                {data.form.submitLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
