"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { POPULAR_PROJECTS, type PopularProject } from "@/lib/popular-projects";
import { cn } from "@/lib/utils";
import { FIELD_BOX } from "./fieldStyles";

type Row = { kind: "item"; project: PopularProject } | { kind: "free"; text: string };

/**
 * Project field: type anything, or pick a popular title from a grouped list. Typing filters the list; text that
 * matches nothing is kept as typed (offered as 'Use "..." as project name'), so the field's value is always the
 * project name. Picking a title also reports it, so the form can set the project type. ARIA combobox pattern:
 * arrow keys move, Enter picks, Escape closes, and Enter with nothing highlighted still submits the form.
 */
export function ProjectCombobox({
  id,
  value,
  onChange,
  onPick,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  /** The user typed, cleared, or chose "Use ... as project name". */
  onChange: (name: string) => void;
  /** The user picked a popular title from the list. */
  onPick: (project: PopularProject) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  // Filter only once the user has typed; opening on a chosen title should still show the whole list.
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);

  const rows = useMemo(() => {
    const q = typed ? value.trim().toLowerCase() : "";
    const out: Row[] = [];
    let exact = false;
    for (const g of POPULAR_PROJECTS) {
      for (const p of g.items) {
        if (q && !p.label.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q)) continue;
        if (p.label.toLowerCase() === q || p.name.toLowerCase() === q) exact = true;
        out.push({ kind: "item", project: p });
      }
    }
    if (q && !exact) out.push({ kind: "free", text: value.trim() });
    return out;
  }, [typed, value]);

  // Group headings go before the first row of each group.
  const groupOf = (p: PopularProject) => POPULAR_PROJECTS.find((g) => g.items.includes(p))!.category;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  const choose = (row: Row) => {
    if (row.kind === "item") onPick(row.project);
    else onChange(row.text);
    setTyped(false);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && open && active >= 0 && rows[active]) {
      e.preventDefault(); // pick the highlighted row instead of submitting
      choose(rows[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  let lastGroup = "";
  return (
    <div ref={box} className="relative">
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        value={value}
        placeholder="Search or type a project name..."
        onChange={(e) => {
          onChange(e.target.value);
          setTyped(true);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={cn(FIELD_BOX, "h-12 pr-[5.25rem]")}
      />
      <div className="absolute inset-y-0 right-1.5 flex items-center">
        {value && (
          <button
            type="button"
            aria-label="Clear project"
            onClick={() => {
              onChange("");
              setTyped(false);
              input.current?.focus();
            }}
            className="inline-flex size-10 items-center justify-center rounded-full text-black/40 transition-colors hover:text-black"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close project list" : "Show popular projects"}
          onClick={() => {
            if (open) setOpen(false);
            else {
              setTyped(false);
              setOpen(true);
              input.current?.focus();
            }
          }}
          className="inline-flex size-10 items-center justify-center rounded-full text-black/40 transition-colors hover:text-black"
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>

      {open && rows.length > 0 && (
        <div
          id={listId}
          role="listbox"
          aria-label="Popular projects"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl border border-black/10 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          {rows.map((row, i) => {
            const group = row.kind === "item" ? groupOf(row.project) : "";
            const heading = group && group !== lastGroup ? group : null;
            if (group) lastGroup = group;
            const selected = row.kind === "item" && row.project.name === value;
            return (
              <div key={row.kind === "item" ? row.project.name : "free"}>
                {heading && (
                  <div role="presentation" className="px-3 pb-1 pt-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-black/40">
                    {heading}
                  </div>
                )}
                {row.kind === "free" && rows.length > 1 && <div role="presentation" className="mx-2 my-1 border-t border-black/[0.08]" />}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                  onClick={() => choose(row)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 text-sm",
                    active === i ? "bg-black/[0.06]" : "",
                  )}
                >
                  <span className="min-w-0 truncate">
                    {row.kind === "item" ? row.project.label : (
                      <>
                        Use <span className="font-medium">&ldquo;{row.text}&rdquo;</span> as project name
                      </>
                    )}
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-black/60" aria-hidden />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
