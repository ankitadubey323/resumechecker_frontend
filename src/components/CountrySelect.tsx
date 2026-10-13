"use client";

import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { forwardRef, useMemo, type SelectHTMLAttributes } from "react";

export const CountrySelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function CountrySelect(props, ref) {
    const options = useMemo(() => {
      const names = new Intl.DisplayNames(["en"], { type: "region" });
      return getCountries()
        .map((code: CountryCode) => ({ code, name: names.of(code) ?? code, dial: getCountryCallingCode(code) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    return (
      <select
        ref={ref}
        aria-label="Country code"
        className="w-28 shrink-0 rounded-lg border border-zinc-300 bg-white px-2 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-950"
        {...props}
      >
        {options.map((o) => (
          <option key={o.code} value={o.code} suppressHydrationWarning>
            {o.code} +{o.dial} — {o.name}
          </option>
        ))}
      </select>
    );
  },
);
