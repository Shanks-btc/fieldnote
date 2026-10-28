"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Minus, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { BriefField } from "./BriefField";
import { ProjectCombobox } from "./ProjectCombobox";
import { FIELD_BOX, FIELD_LABEL } from "./fieldStyles";
import {
  EXAMPLE_BRIEF,
  EXAMPLE_BRIEFS,
  FORM_PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  briefInputSchema,
  type BriefFormValues,
} from "@/lib/validation/brief";
import { saveBrief } from "@/lib/session";
import { NETWORK_ERROR } from "@/lib/startResearch";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<keyof BriefFormValues, string>>;

const DETAIL_KEYS = ["targetAudience", "geographicMarket", "mood", "genrePreferences", "culturalReferences", "exclusions"] as const;
const NO_DETAILS = Object.fromEntries(DETAIL_KEYS.map((k) => [k, ""])) as Pick<BriefFormValues, (typeof DETAIL_KEYS)[number]>;

/**
 * One-click starts. Each runs the matching example (the first three of EXAMPLE_BRIEFS, in this order) as soon
 * as it is clicked: the fastest route from landing on the page to seeing results.
 */
const QUICK_START = [
  { example: EXAMPLE_BRIEFS[0], title: "Stranger Things", subtitle: "S5 finale", type: "TV Series" },
  { example: EXAMPLE_BRIEFS[1], title: "Luxury car ad", subtitle: "Night driving", type: "Brand / Ad" },
  { example: EXAMPLE_BRIEFS[2], title: "Afrobeat workout", subtitle: "Playlist energy", type: "Genre" },
] as const;

/** Boxed text fields inside the "More detail" section, matching the main inputs. */
const DETAIL_FIELD = "h-12 rounded-xl border border-black/15 bg-white px-4 shadow-none focus-visible:border-black focus-visible:shadow-none";

/**
 * Quick-start cards, then one card of inputs: the project (a combobox: pick a popular title or type your own),
 * its type, and a collapsible scene/mood. Naming a project researches it through Qloo; leaving it empty finds
 * artists from the description alone, so the scene is then open and required.
 */
export function BriefForm() {
  const router = useRouter();
  const [values, setValues] = useState<BriefFormValues>(EXAMPLE_BRIEF);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startingCard, setStartingCard] = useState<number | null>(null);
  const [sceneOpen, setSceneOpen] = useState(false);
  // The pre-filled scene and "More detail" values describe the Stranger Things example. Once the project
  // changes they would silently shape a different brief, so they are cleared with it.
  const [fromExample, setFromExample] = useState(true);

  const set = <K extends keyof BriefFormValues>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (k === "sceneDescription" || (DETAIL_KEYS as readonly string[]).includes(k)) setFromExample(false);
      setValues((v) => ({ ...v, [k]: e.target.value }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    };

  const described = !values.projectName.trim();
  // No project means the description is the whole brief, so the scene is locked open; otherwise it is optional.
  const sceneExpanded = described || sceneOpen;
  const detailCount = DETAIL_KEYS.filter((k) => values[k].trim()).length;
  const hasSceneContent = !!values.sceneDescription.trim() || detailCount > 0;

  /** Changing the project drops the example's pre-filled scene and details; what the user types next is their own. */
  function changeProject(patch: Partial<BriefFormValues>) {
    setValues((v) => ({ ...v, ...patch, ...(fromExample ? { ...NO_DETAILS, sceneDescription: "" } : {}) }));
    setFromExample(false);
    setErrors((x) => ({ ...x, projectName: undefined }));
  }

  /** Validates and starts a run for these values. Takes them as an argument so a quick-start card can submit its own. */
  async function submit(vals: BriefFormValues) {
    const parsed = briefInputSchema.safeParse(vals);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof BriefFormValues;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      // The API validates the raw form values itself (list fields arrive as text).
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vals),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !body.id) throw new Error(body.error ?? `Request failed (${res.status})`);
      saveBrief(body.id, parsed.data);
      router.push(`/brief/${body.id}/research`);
    } catch (err) {
      // fetch() rejects with a TypeError when the server is unreachable.
      setSubmitError(err instanceof TypeError ? NETWORK_ERROR : err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
      setStartingCard(null);
    }
  }

  function quickStart(i: number) {
    const { example } = QUICK_START[i];
    setValues(example.values);
    setFromExample(example.values === EXAMPLE_BRIEF);
    setStartingCard(i);
    void submit(example.values);
  }

  const err = (k: keyof BriefFormValues) => errors[k];
  const aria = (k: keyof BriefFormValues) => ({
    "aria-invalid": err(k) ? true : undefined,
    "aria-describedby": err(k) ? `${k}-error` : undefined,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(values);
      }}
      noValidate
      className="w-full space-y-4 rounded-[24px] border border-[#E4E4E7] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.03)] sm:p-7"
    >
      {/* Quick start: one click, straight to results */}
      <div className="space-y-2">
        <p className={FIELD_LABEL}>Quick start</p>
        <div className="grid items-stretch gap-3 sm:grid-cols-3">
          {QUICK_START.map((c, i) => (
            <button
              key={c.title}
              type="button"
              disabled={submitting}
              onClick={() => quickStart(i)}
              className="group relative flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A1A1AA] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-col sm:items-stretch sm:justify-between sm:gap-3 sm:p-4"
            >
              <span className="min-w-0 sm:pr-5">
                <span className="block text-[15px] font-semibold leading-tight">{c.title}</span>
                <span className="mt-0.5 block text-xs text-black/55">{c.subtitle}</span>
              </span>
              <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-black/45 sm:ml-0 sm:border-t sm:border-[#E4E4E7] sm:pt-2.5">
                {startingCard === i ? "Starting…" : c.type}
              </span>
              {/* Says "this runs": the card starts a search the moment it is clicked. */}
              <Play
                aria-hidden
                className="size-3.5 shrink-0 fill-current text-[#D4D4D8] transition-colors group-hover:text-[#71717A] sm:absolute sm:right-4 sm:top-4"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1" role="separator">
        <span className="h-px flex-1 bg-[#E4E4E7]" />
        <span className="text-xs text-black/40">or build your own brief</span>
        <span className="h-px flex-1 bg-[#E4E4E7]" />
      </div>

      {/* 1 + 2: project and type share a row on wider screens */}
      <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="space-y-1.5">
          <label htmlFor="projectName" className={cn(FIELD_LABEL, "block")}>
            1 · Project
          </label>
          <ProjectCombobox
            id="projectName"
            value={values.projectName}
            onChange={(name) => changeProject({ projectName: name })}
            onPick={(p) => changeProject({ projectName: p.name, projectType: p.type })}
            invalid={!!err("projectName")}
            describedBy={err("projectName") ? "projectName-error" : "projectName-hint"}
          />
          {err("projectName") ? (
            <p id="projectName-error" role="alert" className="text-xs text-destructive">
              {err("projectName")}
            </p>
          ) : (
            <p id="projectName-hint" className="text-xs text-black/50">
              Leave empty to describe the sound you want below
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="projectType" className={cn(FIELD_LABEL, "block")}>
            2 · Project type
          </label>
          <div className="relative">
            <select
              id="projectType"
              value={values.projectType}
              onChange={set("projectType")}
              className={cn(FIELD_BOX, "h-12 cursor-pointer appearance-none pr-11")}
            >
              {FORM_PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROJECT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-black/40" aria-hidden />
          </div>
          <p className="text-xs text-black/50">Shapes how creative fit is scored</p>
        </div>
      </div>

      {/* 3. Scene / mood: collapsed while a project is named, locked open and required without one */}
      <div className="border-t border-black/[0.08] pt-1">
        {described ? (
          <label htmlFor="sceneDescription" className={cn(FIELD_LABEL, "flex min-h-11 items-center")}>
            3 · Scene / mood <span className="ml-2 normal-case tracking-normal text-black/45">(required)</span>
          </label>
        ) : (
          <button
            type="button"
            aria-expanded={sceneExpanded}
            aria-controls="scene-panel"
            onClick={() => setSceneOpen((o) => !o)}
            className="flex min-h-11 w-full items-center gap-2 text-left text-sm text-black/60 transition-colors hover:text-black"
          >
            {sceneExpanded ? <Minus className="size-3.5 shrink-0" aria-hidden /> : <Plus className="size-3.5 shrink-0" aria-hidden />}
            <span>{sceneExpanded ? "Scene / mood (optional)" : hasSceneContent ? "Edit scene details" : "Add scene details (optional)"}</span>
            {!sceneExpanded && hasSceneContent && <span className="text-xs text-black/40">· filled</span>}
          </button>
        )}

        {/* grid-rows 0fr -> 1fr animates the height without measuring; `inert` keeps collapsed fields out of the tab order. */}
        <div
          id="scene-panel"
          inert={!sceneExpanded}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
            sceneExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="-mx-1 overflow-hidden px-1">
            <div className="space-y-2 pb-1 pt-1">
              <Textarea
                id="sceneDescription"
                rows={3}
                value={values.sceneDescription}
                onChange={set("sceneDescription")}
                placeholder="Describe the scene, mood, or what you're looking for..."
                className={cn(FIELD_BOX, "min-h-[5.5rem] resize-y py-3 leading-relaxed")}
                {...aria("sceneDescription")}
              />
              {err("sceneDescription") ? (
                <p id="sceneDescription-error" role="alert" className="text-xs text-destructive">
                  {err("sceneDescription")}
                </p>
              ) : (
                <p className="text-xs text-black/50">
                  {described ? "Required when no project is selected. Artists are found from this description." : "Optional. Adds scene detail to creative scoring."}
                </p>
              )}

              <details className="group pt-1">
                <summary className={cn(FIELD_LABEL, "flex min-h-11 cursor-pointer list-none items-center justify-between")}>
                  <span>
                    More detail (optional)
                    {detailCount > 0 && <span className="ml-2 normal-case tracking-normal text-black/50">{detailCount} filled</span>}
                  </span>
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="space-y-5 pb-1 pt-3">
                  <BriefField id="targetAudience" label="Target audience" error={err("targetAudience")}>
                    <Textarea
                      id="targetAudience"
                      rows={2}
                      value={values.targetAudience}
                      onChange={set("targetAudience")}
                      className={cn(FIELD_BOX, "py-3 shadow-none focus-visible:shadow-none")}
                      {...aria("targetAudience")}
                    />
                  </BriefField>
                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    <BriefField id="geographicMarket" label="Geographic market" error={err("geographicMarket")}>
                      <Input id="geographicMarket" value={values.geographicMarket} onChange={set("geographicMarket")} className={DETAIL_FIELD} {...aria("geographicMarket")} />
                    </BriefField>
                    <BriefField id="mood" label="Mood / emotion" error={err("mood")}>
                      <Input id="mood" value={values.mood} onChange={set("mood")} className={DETAIL_FIELD} {...aria("mood")} />
                    </BriefField>
                    <BriefField id="genrePreferences" label="Genre preferences" hint="Comma separated." error={err("genrePreferences")}>
                      <Input id="genrePreferences" value={values.genrePreferences} onChange={set("genrePreferences")} className={DETAIL_FIELD} {...aria("genrePreferences")} />
                    </BriefField>
                    <BriefField id="culturalReferences" label="Cultural references" hint="Films, artists, shows. Comma separated." error={err("culturalReferences")}>
                      <Input id="culturalReferences" value={values.culturalReferences} onChange={set("culturalReferences")} className={DETAIL_FIELD} {...aria("culturalReferences")} />
                    </BriefField>
                  </div>
                  <BriefField id="exclusions" label="Exclusions" hint="Artists, themes or sounds to avoid." error={err("exclusions")}>
                    <Textarea
                      id="exclusions"
                      rows={2}
                      value={values.exclusions}
                      onChange={set("exclusions")}
                      className={cn(FIELD_BOX, "py-3 shadow-none focus-visible:shadow-none")}
                      {...aria("exclusions")}
                    />
                  </BriefField>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <p role="alert" className="border-l-2 border-destructive pl-4 text-sm text-destructive">
          {submitError}
        </p>
      )}

      {/* Pinned to the bottom of the screen on phones so the primary action is always reachable. */}
      <div className="sticky bottom-4 z-20 sm:static">
        <Button type="submit" size="lg" variant="solid" disabled={submitting} className="h-[52px] w-full rounded-xl bg-black text-base font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all duration-150 hover:bg-[#18181B] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] focus-visible:ring-black sm:shadow-none sm:hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          {submitting && startingCard == null ? "Starting…" : <>Find artists <ArrowRight className="size-4" aria-hidden /></>}
        </Button>
      </div>
    </form>
  );
}
