"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { BriefField } from "./BriefField";
import { ExampleBriefButton } from "./ExampleBriefButton";
import {
  EXAMPLE_BRIEF,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  briefInputSchema,
  type BriefFormValues,
} from "@/lib/validation/brief";
import { saveBrief } from "@/lib/session";

type Errors = Partial<Record<keyof BriefFormValues, string>>;

export function BriefForm() {
  const router = useRouter();
  const [values, setValues] = useState<BriefFormValues>(EXAMPLE_BRIEF);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof BriefFormValues>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = briefInputSchema.safeParse(values);
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
        body: JSON.stringify(values),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !body.id) throw new Error(body.error ?? `Request failed (${res.status})`);
      saveBrief(body.id, parsed.data);
      router.push(`/brief/${body.id}/research`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const err = (k: keyof BriefFormValues) => errors[k];
  const aria = (k: keyof BriefFormValues) => ({
    "aria-invalid": err(k) ? true : undefined,
    "aria-describedby": err(k) ? `${k}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-14">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <p className="font-mono text-xs text-muted-foreground">Example · Stranger Things S5</p>
        <ExampleBriefButton
          onClick={() => {
            setValues(EXAMPLE_BRIEF);
            setErrors({});
          }}
        />
      </div>

      <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2">
        <BriefField id="projectName" label="Project name" hint="The show, film or brand" error={err("projectName")}>
          <Input id="projectName" value={values.projectName} onChange={set("projectName")} {...aria("projectName")} />
        </BriefField>
        <BriefField id="projectType" label="Project type" error={err("projectType")}>
          <Select id="projectType" value={values.projectType} onChange={set("projectType")} {...aria("projectType")}>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROJECT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </BriefField>
      </div>

      <BriefField id="sceneDescription" label="Scene description" error={err("sceneDescription")}>
        <Textarea
          id="sceneDescription"
          rows={3}
          value={values.sceneDescription}
          onChange={set("sceneDescription")}
          {...aria("sceneDescription")}
        />
      </BriefField>

      <BriefField id="targetAudience" label="Target audience" error={err("targetAudience")}>
        <Textarea id="targetAudience" rows={2} value={values.targetAudience} onChange={set("targetAudience")} {...aria("targetAudience")} />
      </BriefField>

      {/* Two single-line fields per row so the hairlines line up. */}
      <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2">
        <BriefField id="geographicMarket" label="Geographic market" error={err("geographicMarket")}>
          <Input id="geographicMarket" value={values.geographicMarket} onChange={set("geographicMarket")} {...aria("geographicMarket")} />
        </BriefField>
        <BriefField id="mood" label="Mood / emotion" error={err("mood")}>
          <Input id="mood" value={values.mood} onChange={set("mood")} {...aria("mood")} />
        </BriefField>
      </div>

      <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2">
        <BriefField id="genrePreferences" label="Genre preferences" hint="Comma separated. Optional." error={err("genrePreferences")}>
          <Input id="genrePreferences" value={values.genrePreferences} onChange={set("genrePreferences")} {...aria("genrePreferences")} />
        </BriefField>
        <BriefField id="culturalReferences" label="Cultural references" hint="Films, artists, shows. Comma separated. Optional." error={err("culturalReferences")}>
          <Input id="culturalReferences" value={values.culturalReferences} onChange={set("culturalReferences")} {...aria("culturalReferences")} />
        </BriefField>
      </div>

      <BriefField id="exclusions" label="Exclusions" hint="Artists, themes or sounds to avoid. Optional." error={err("exclusions")}>
        <Textarea id="exclusions" rows={2} value={values.exclusions} onChange={set("exclusions")} {...aria("exclusions")} />
      </BriefField>

      {submitError && (
        <p role="alert" className="border-l-2 border-destructive pl-4 text-sm text-destructive">
          {submitError}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" variant="solid" disabled={submitting}>
          {submitting ? "Starting…" : <>Run research <ArrowRight className="size-4" aria-hidden /></>}
        </Button>
      </div>
    </form>
  );
}
