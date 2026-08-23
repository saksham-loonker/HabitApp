import React, { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const blockTypeOptions = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "subheading", label: "Subheading" },
  { value: "todo", label: "To-do" },
  { value: "bullet", label: "Bullet" },
  { value: "quote", label: "Quote" },
  { value: "callout", label: "Callout" },
  { value: "code", label: "Code" },
  { value: "divider", label: "Divider" },
  { value: "bookmark", label: "Bookmark" },
];

function BlockRow({ block, onUpdate, onDuplicate, onDelete }) {
  const [type, setType] = useState(block.type);
  const [text, setText] = useState(block.text || "");
  const [url, setUrl] = useState(block.url || "");
  const [checked, setChecked] = useState(Boolean(block.checked));

  useEffect(() => {
    setType(block.type);
    setText(block.text || "");
    setUrl(block.url || "");
    setChecked(Boolean(block.checked));
  }, [block]);

  const commit = () => {
    onUpdate(block.id, {
      type,
      text,
      url,
      checked,
    });
  };

  if (type === "divider") {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/90 p-4">
        <div className="flex items-center gap-2">
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value);
              onUpdate(block.id, { type: value });
            }}
          >
            <SelectTrigger className="h-10 w-36 rounded-2xl border-slate-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {blockTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-px flex-1 bg-slate-300" />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => onDuplicate(block.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => onDelete(block.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/90 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value);
            onUpdate(block.id, { type: value });
          }}
        >
          <SelectTrigger className="h-10 w-40 rounded-2xl border-slate-200 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {blockTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {block.syncGroupId && (
          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
            Synced block
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => onDuplicate(block.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => onDelete(block.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {type === "bookmark" ? (
        <div className="space-y-3">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
            placeholder="Link title"
            className="rounded-2xl border-slate-200 bg-white"
          />
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onBlur={commit}
            placeholder="https://example.com"
            className="rounded-2xl border-slate-200 bg-white"
          />
        </div>
      ) : type === "todo" ? (
        <label className="flex items-start gap-3 rounded-2xl bg-white p-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              setChecked(event.target.checked);
              onUpdate(block.id, { checked: event.target.checked });
            }}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
            placeholder="Action item"
            className="min-h-[84px] border-none bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
          />
        </label>
      ) : (
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={commit}
          placeholder="Write something..."
          className={cn(
            "rounded-3xl border-slate-200 bg-white px-4 py-3 text-slate-700 focus-visible:ring-slate-400",
            type === "heading" && "min-h-[92px] text-2xl font-semibold leading-tight",
            type === "subheading" && "min-h-[88px] text-xl font-semibold leading-tight",
            type === "quote" && "min-h-[96px] italic",
            type === "code" && "min-h-[140px] font-mono text-xs",
            type === "callout" && "min-h-[96px] bg-amber-50",
          )}
        />
      )}
    </div>
  );
}

export default function PageEditor({
  page,
  blocks,
  record,
  database,
  onUpdatePage,
  onAddBlock,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
}) {
  const [title, setTitle] = useState(page.title);

  useEffect(() => {
    setTitle(page.title);
  }, [page.id, page.title]);

  const recordChips = useMemo(() => {
    if (!record || !database) {
      return [];
    }

    return database.propertyOrder
      .filter((propertyId) => database.properties[propertyId].type !== "title")
      .map((propertyId) => ({
        id: propertyId,
        label: database.properties[propertyId].name,
        value: record.values[propertyId],
      }))
      .filter((item) => item.value !== undefined && item.value !== null && item.value !== "");
  }, [database, record]);

  return (
    <section className="space-y-6 rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
      <div className="space-y-4">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            if (title.trim() && title !== page.title) {
              onUpdatePage(page.id, { title: title.trim() });
            }
          }}
          className="h-auto rounded-none border-none bg-transparent px-0 py-0 text-4xl font-semibold tracking-tight text-slate-950 shadow-none focus-visible:ring-0"
        />

        <p className="text-sm leading-6 text-slate-500">{page.summary}</p>

        {recordChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recordChips.map((chip) => (
              <Badge key={chip.id} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {chip.label}: {Array.isArray(chip.value) ? chip.value.join(", ") : String(chip.value)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {blocks.map((block) => (
          <BlockRow
            key={block.id}
            block={block}
            onUpdate={onUpdateBlock}
            onDuplicate={onDuplicateBlock}
            onDelete={onDeleteBlock}
          />
        ))}
      </div>

      <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-medium text-slate-600">Add another block</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blockTypeOptions.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              size="sm"
              className="rounded-full border-slate-200 bg-white"
              onClick={() => onAddBlock(page.id, { type: option.value, text: option.label === "To-do" ? "" : "" })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
