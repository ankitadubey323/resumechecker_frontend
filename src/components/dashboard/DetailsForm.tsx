"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors, type Path } from "react-hook-form";

import { TagInput } from "@/components/dashboard/TagInput";
import { Alert, Button, Field, SecondaryButton, Textarea } from "@/components/ui";
import { ApiError, api, type Dashboard } from "@/lib/api";
import {
  detailsSchema,
  detailsToForm,
  emptyEducation,
  emptyExperience,
  emptyProject,
  formToDetails,
  type DetailsForm as Form,
} from "@/lib/profile";

/** Array-level errors (e.g. "Add at least one project") land on .message or .root.message. */
function arrayError(e: FieldErrors<Form>[keyof Form] | undefined): string | undefined {
  const err = e as { message?: string; root?: { message?: string } } | undefined;
  return err?.message ?? err?.root?.message;
}

function SubCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <button type="button" onClick={onRemove} className="text-xs text-zinc-500 hover:text-red-600">
          Remove
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function SectionTitle({ title, hint, error }: { title: string; hint?: string; error?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function DetailsForm({ data, onSaved }: { data: Dashboard; onSaved: (d: Dashboard) => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(detailsSchema),
    mode: "onTouched",
    defaultValues: detailsToForm(data.details),
  });

  const experiences = useFieldArray({ control, name: "experiences" });
  const projects = useFieldArray({ control, name: "projects" });
  const education = useFieldArray({ control, name: "education" });
  const level = useWatch({ control, name: "experience_level" });
  const currentFlags = useWatch({ control, name: "experiences" })?.map((e) => e.current) ?? [];
  const experienced = level === "experienced";

  const onSubmit = async (values: Form) => {
    setFormError(null);
    setSaved(false);
    try {
      onSaved(await api.saveDetails(formToDetails(values)));
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        for (const [path, message] of Object.entries(err.fieldErrors)) {
          // "experiences.0" is a whole-entry error (date order) -> show it on the end date.
          const target = /^experiences\.\d+$/.test(path) ? `${path}.end` : path;
          setError(target as Path<Form>, { message });
        }
        setFormError("Please fix the highlighted fields.");
      } else {
        setFormError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {formError && <Alert>{formError}</Alert>}

      {/* Experience level */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Are you a fresher or experienced?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["fresher", "Fresher", "Student or recent graduate"],
              ["experienced", "Experienced", "I have work experience"],
            ] as const
          ).map(([value, title, sub]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border p-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 ${
                level === value
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700"
              }`}
            >
              <input type="radio" value={value} className="sr-only" {...register("experience_level")} />
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-zinc-500">{sub}</span>
            </label>
          ))}
        </div>
        {errors.experience_level && (
          <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {errors.experience_level.message}
          </p>
        )}
      </fieldset>

      {/* Basics */}
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field
          label="Headline"
          placeholder="e.g. Full Stack Developer"
          maxLength={120}
          error={errors.headline?.message}
          {...register("headline")}
        />
        {experienced && (
          <Field
            label="Total experience (years)"
            type="number"
            inputMode="decimal"
            min={0.5}
            max={50}
            step={0.5}
            placeholder="e.g. 2.5"
            error={errors.years_experience?.message}
            {...register("years_experience")}
          />
        )}
      </div>

      <Controller
        control={control}
        name="skills"
        render={({ field }) => (
          <TagInput
            label="Skills"
            value={field.value}
            onChange={field.onChange}
            placeholder="Type a skill and press Enter, e.g. React"
            hint="Add at least 3. Press Enter or comma after each skill."
            error={arrayError(errors.skills)}
          />
        )}
      />

      {/* Work experience */}
      <section>
        <SectionTitle
          title={experienced ? "Work experience" : "Internships / work experience (optional)"}
          hint={experienced ? "Add at least one. Most recent first." : undefined}
          error={arrayError(errors.experiences)}
        />
        <div className="space-y-3">
          {experiences.fields.map((f, i) => {
            const e = errors.experiences?.[i];
            const current = currentFlags[i];
            return (
              <SubCard key={f.id} title={`Experience ${i + 1}`} onRemove={() => experiences.remove(i)}>
                <Field label="Company" error={e?.company?.message} {...register(`experiences.${i}.company`)} />
                <Field label="Role" error={e?.role?.message} {...register(`experiences.${i}.role`)} />
                <Field label="Start" type="month" error={e?.start?.message} {...register(`experiences.${i}.start`)} />
                <div>
                  <Field
                    label="End"
                    type="month"
                    disabled={current}
                    error={current ? undefined : e?.end?.message}
                    {...register(`experiences.${i}.end`)}
                  />
                  <label className="mt-1.5 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <input type="checkbox" {...register(`experiences.${i}.current`)} /> I currently work here
                  </label>
                </div>
                <Textarea
                  label="What did you do?"
                  rows={3}
                  className="sm:col-span-2"
                  placeholder="Key responsibilities and achievements"
                  error={e?.description?.message}
                  {...register(`experiences.${i}.description`)}
                />
              </SubCard>
            );
          })}
          <SecondaryButton onClick={() => experiences.append(emptyExperience())} disabled={experiences.fields.length >= 20}>
            + Add experience
          </SecondaryButton>
        </div>
      </section>

      {/* Projects */}
      <section>
        <SectionTitle title="Projects" hint="Add at least one." error={arrayError(errors.projects)} />
        <div className="space-y-3">
          {projects.fields.map((f, i) => {
            const e = errors.projects?.[i];
            return (
              <SubCard key={f.id} title={`Project ${i + 1}`} onRemove={() => projects.remove(i)}>
                <Field label="Title" error={e?.title?.message} {...register(`projects.${i}.title`)} />
                <Field
                  label="Link (optional)"
                  type="url"
                  placeholder="https://github.com/…"
                  error={e?.link?.message}
                  {...register(`projects.${i}.link`)}
                />
                <div className="sm:col-span-2">
                  <Controller
                    control={control}
                    name={`projects.${i}.tech`}
                    render={({ field }) => (
                      <TagInput
                        label="Tech used"
                        value={field.value}
                        onChange={field.onChange}
                        max={20}
                        placeholder="e.g. Next.js, FastAPI"
                        error={e?.tech?.message}
                      />
                    )}
                  />
                </div>
                <Textarea
                  label="Description"
                  rows={3}
                  className="sm:col-span-2"
                  placeholder="What it does and what you built"
                  error={e?.description?.message}
                  {...register(`projects.${i}.description`)}
                />
              </SubCard>
            );
          })}
          <SecondaryButton onClick={() => projects.append(emptyProject())} disabled={projects.fields.length >= 20}>
            + Add project
          </SecondaryButton>
        </div>
      </section>

      {/* Education */}
      <section>
        <SectionTitle
          title={experienced ? "Education (optional)" : "Education"}
          hint={experienced ? undefined : "Add at least one."}
          error={arrayError(errors.education)}
        />
        <div className="space-y-3">
          {education.fields.map((f, i) => {
            const e = errors.education?.[i];
            return (
              <SubCard key={f.id} title={`Education ${i + 1}`} onRemove={() => education.remove(i)}>
                <Field label="Degree" placeholder="e.g. B.Tech, Computer Science" error={e?.degree?.message} {...register(`education.${i}.degree`)} />
                <Field label="Institution" error={e?.institution?.message} {...register(`education.${i}.institution`)} />
                <Field
                  label="Graduation year"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="e.g. 2024"
                  error={e?.year?.message}
                  {...register(`education.${i}.year`)}
                />
              </SubCard>
            );
          })}
          <SecondaryButton onClick={() => education.append(emptyEducation())} disabled={education.fields.length >= 10}>
            + Add education
          </SecondaryButton>
        </div>
      </section>

      {saved && <Alert tone="success">Details saved. You can now add the job description below.</Alert>}
      <Button type="submit" loading={isSubmitting} className="sm:w-auto! sm:px-6">
        {isSubmitting ? "Saving…" : data.details ? "Update details" : "Save details"}
      </Button>
    </form>
  );
}
