import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createWorkspacePageUrl } from "@/utils";

const selectEditableTypes = new Set(["status", "select"]);
const checkboxEditableTypes = new Set(["checkbox"]);

const renderValue = (value, property) => {
  if (property?.type === "url" && value) {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="text-sky-600 underline-offset-4 hover:underline">
        {value}
      </a>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-400">-</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item) => (
          <Badge key={item} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
            {item}
          </Badge>
        ))}
      </div>
    );
  }

  if (property?.type === "checkbox") {
    return (
      <Badge variant={value ? "success" : "outline"} className={cn(!value && "border-slate-200 bg-slate-50 text-slate-500")}>
        {value ? "Checked" : "Open"}
      </Badge>
    );
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  return <span>{String(value)}</span>;
};

function InlineCell({ property, row, readonly, onUpdate }) {
  if (!property) {
    return null;
  }

  const value = row.values[property.id];
  if (!readonly && selectEditableTypes.has(property.type)) {
    return (
      <Select value={String(value ?? property.defaultValue ?? "")} onValueChange={(next) => onUpdate(row.id, { [property.id]: next })}>
        <SelectTrigger className="h-9 min-w-[124px] rounded-2xl border-slate-200 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {(property.options || []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (!readonly && checkboxEditableTypes.has(property.type)) {
    return (
      <button
        type="button"
        onClick={() => onUpdate(row.id, { [property.id]: !Boolean(value) })}
        className="rounded-full"
      >
        {renderValue(Boolean(value), property)}
      </button>
    );
  }

  return renderValue(value, property);
}

function TableView({ model, readonly, onUpdate }) {
  const visiblePropertyIds = model.view.visiblePropertyIds || model.database.propertyOrder;
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full border-separate border-spacing-y-2">
        <thead>
          <tr>
            {visiblePropertyIds.map((propertyId) => (
              <th key={propertyId} className="px-3 pb-2 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {model.database.properties[propertyId].name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.id} className="rounded-2xl bg-slate-50/90">
              {visiblePropertyIds.map((propertyId, index) => (
                <td key={propertyId} className={cn("px-3 py-3 text-sm text-slate-700", index === 0 && "font-medium text-slate-950")}>
                  {propertyId === "title" ? (
                    <Link to={createWorkspacePageUrl(row.pageId)} className="hover:underline">
                      {row.title}
                    </Link>
                  ) : (
                    <InlineCell
                      property={model.database.properties[propertyId]}
                      row={row}
                      readonly={readonly}
                      onUpdate={onUpdate}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BoardView({ model }) {
  const groups = model.groups.length > 0 ? model.groups : [{ id: "all", label: "All", items: model.rows }];
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {groups.map((group) => (
        <div key={group.id} className="rounded-[28px] border border-slate-200/80 bg-slate-50/90 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">{group.label}</p>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-500">
              {group.items.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {group.items.map((row) => (
              <Link
                key={row.id}
                to={createWorkspacePageUrl(row.pageId)}
                className="block rounded-2xl border border-white bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1"
              >
                <p className="text-sm font-semibold text-slate-950">{row.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(model.view.visiblePropertyIds || [])
                    .filter((propertyId) => propertyId !== "title")
                    .map((propertyId) => (
                      <Badge key={propertyId} variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">
                        {model.database.properties[propertyId].name}:{" "}
                        {Array.isArray(row.values[propertyId])
                          ? row.values[propertyId].join(", ")
                          : String(row.values[propertyId] ?? "-")}
                      </Badge>
                    ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({ model }) {
  const [currentMonth] = useState(() => {
    const firstRow = model.rows.find((row) => row.values[model.view.datePropertyId]);
    return firstRow ? startOfMonth(parseISO(rowDateValue(firstRow, model.view.datePropertyId))) : startOfMonth(new Date());
  });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const buckets = days.map((day) => ({
    day,
    items: model.rows.filter((row) => {
      const value = rowDateValue(row, model.view.datePropertyId);
      return value ? isSameDay(day, parseISO(value)) : false;
    }),
  }));

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {buckets.map(({ day, items }) => (
        <div key={day.toISOString()} className="min-h-[140px] rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{format(day, "EEE")}</p>
            <p className="text-sm font-semibold text-slate-700">{format(day, "d")}</p>
          </div>
          <div className="space-y-2">
            {items.map((row) => (
              <Link
                key={row.id}
                to={createWorkspacePageUrl(row.pageId)}
                className="block rounded-2xl border border-white bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
              >
                {row.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function rowDateValue(row, propertyId) {
  return row.values[propertyId] ? String(row.values[propertyId]) : null;
}

function GalleryView({ model }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {model.rows.map((row) => (
        <Link
          key={row.id}
          to={createWorkspacePageUrl(row.pageId)}
          className="rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1"
        >
          <p className="text-base font-semibold text-slate-950">{row.title}</p>
          <div className="mt-4 space-y-2">
            {(model.view.visiblePropertyIds || [])
              .filter((propertyId) => propertyId !== "title")
              .map((propertyId) => (
                <div key={propertyId} className="rounded-2xl bg-white/90 px-3 py-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-950">{model.database.properties[propertyId].name}: </span>
                  {Array.isArray(row.values[propertyId])
                    ? row.values[propertyId].join(", ")
                    : String(row.values[propertyId] ?? "-")}
                </div>
              ))}
          </div>
        </Link>
      ))}
    </div>
  );
}

function TimelineView({ model }) {
  const rowsWithDates = model.rows.filter(
    (row) => row.values[model.view.startPropertyId] && row.values[model.view.endPropertyId],
  );

  const starts = rowsWithDates.map((row) => parseISO(String(row.values[model.view.startPropertyId])).getTime());
  const ends = rowsWithDates.map((row) => parseISO(String(row.values[model.view.endPropertyId])).getTime());
  const minDate = Math.min(...starts);
  const maxDate = Math.max(...ends);
  const totalRange = Math.max(maxDate - minDate, 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-3">
      {rowsWithDates.map((row) => {
        const start = parseISO(String(row.values[model.view.startPropertyId])).getTime();
        const end = parseISO(String(row.values[model.view.endPropertyId])).getTime();
        const left = ((start - minDate) / totalRange) * 100;
        const width = ((end - start) / totalRange) * 100;

        return (
          <Link
            key={row.id}
            to={createWorkspacePageUrl(row.pageId)}
            className="block rounded-[28px] border border-slate-200/80 bg-slate-50/90 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">{row.title}</p>
              <p className="text-xs text-slate-500">
                {row.values[model.view.startPropertyId]} to {row.values[model.view.endPropertyId]}
              </p>
            </div>
            <div className="relative h-3 rounded-full bg-white">
              <div
                className="absolute top-0 h-3 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                style={{ left: `${left}%`, width: `${Math.max(width, 12)}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ChartView({ model }) {
  return (
    <div className="h-[320px] rounded-[28px] border border-slate-200/80 bg-slate-50/90 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={model.chartData}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#0f172a" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DatabaseViewRenderer({ model, currentViewId, onChangeView, onUpdateRecord, readonly = false }) {
  if (!model) {
    return null;
  }

  const labelForView = (viewId) => {
    const match = String(viewId).match(/(table|board|calendar|gallery|timeline|chart)$/i);
    if (!match) {
      return viewId;
    }
    const value = match[1].toLowerCase();
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const renderers = {
    table: <TableView model={model} readonly={readonly} onUpdate={onUpdateRecord} />,
    board: <BoardView model={model} />,
    calendar: <CalendarView model={model} />,
    gallery: <GalleryView model={model} />,
    timeline: <TimelineView model={model} />,
    chart: <ChartView model={model} />,
  };

  return (
    <section className="space-y-5 rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Database</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{model.database.name}</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {model.database.viewIds.map((viewId) => (
            <Button
              key={viewId}
              variant={viewId === currentViewId ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => onChangeView(viewId)}
            >
              {labelForView(viewId)}
            </Button>
          ))}
        </div>
      </div>

      {renderers[model.view.type]}
    </section>
  );
}
