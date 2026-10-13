import type { TailoredResume } from "@/lib/api";

/** Highlights "[X]%"-style placeholders the candidate still needs to fill in. */
function WithPlaceholders({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]{1,12}\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[[^\]]{1,12}\]$/.test(part) ? (
          <mark
            key={i}
            title="Placeholder: replace with your real number"
            className="rounded bg-amber-100 px-0.5 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="border-b border-indigo-900/20 pb-1 text-xs font-bold uppercase tracking-[0.12em] text-indigo-900 dark:border-indigo-300/30 dark:text-indigo-300">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-5">
      {items.map((b, i) => (
        <li key={i}>
          <WithPlaceholders text={b} />
        </li>
      ))}
    </ul>
  );
}

export function ResumePreview({ resume }: { resume: TailoredResume }) {
  const contact = [resume.contact.email, resume.contact.phone, resume.contact.location, ...resume.contact.links].filter(Boolean);

  return (
    <article className="mx-auto max-w-[800px] rounded-lg border border-zinc-200 bg-white px-6 py-8 text-[13px] leading-relaxed text-zinc-800 shadow-sm sm:px-10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
      <header className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{resume.name}</h2>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{resume.headline}</p>
        <p className="mt-1 break-words text-xs text-zinc-500">{contact.join("  |  ")}</p>
      </header>

      <Section title="Summary">
        <p>
          <WithPlaceholders text={resume.summary} />
        </p>
      </Section>

      {resume.skills.length > 0 && (
        <Section title="Skills">
          <dl className="space-y-0.5">
            {resume.skills.map((g) => (
              <div key={g.category}>
                <dt className="inline font-semibold">{g.category}: </dt>
                <dd className="inline">{g.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {resume.experience.length > 0 && (
        <Section title="Experience">
          <div className="space-y-3">
            {resume.experience.map((e, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p>
                    <span className="font-semibold">{e.title}</span> — {e.company}
                    {e.location ? `, ${e.location}` : ""}
                  </p>
                  <p className="text-xs italic text-zinc-500">
                    {e.start} – {e.end}
                  </p>
                </div>
                <Bullets items={e.bullets} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.projects.length > 0 && (
        <Section title="Projects">
          <div className="space-y-3">
            {resume.projects.map((p, i) => (
              <div key={i}>
                <p>
                  <span className="font-semibold">{p.name}</span>
                  {p.tech.length > 0 && <span className="text-zinc-500"> ({p.tech.join(", ")})</span>}
                  {p.link && <span className="break-all text-xs text-indigo-700 dark:text-indigo-400"> — {p.link}</span>}
                </p>
                <Bullets items={p.bullets} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.education.length > 0 && (
        <Section title="Education">
          {resume.education.map((ed, i) => (
            <p key={i}>
              <span className="font-semibold">{ed.degree}</span>, {ed.institution}
              {ed.year ? `, ${ed.year}` : ""}
              {ed.details ? ` — ${ed.details}` : ""}
            </p>
          ))}
        </Section>
      )}

      {resume.certifications.length > 0 && (
        <Section title="Certifications">
          <Bullets items={resume.certifications} />
        </Section>
      )}
    </article>
  );
}
