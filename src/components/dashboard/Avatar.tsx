/* eslint-disable @next/next/no-img-element -- the photo is a private, auth-protected API response */

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, photoVersion, size }: { name: string; photoVersion: number | null; size: number }) {
  if (photoVersion) {
    return (
      <img
        src={`/api/profile/photo?v=${photoVersion}`}
        alt={`${name}'s profile photo`}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      aria-label={`${name}'s initials`}
      className="grid place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
