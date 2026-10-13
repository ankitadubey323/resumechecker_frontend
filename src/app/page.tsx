"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card } from "@/components/dashboard/Card";
import { CustomizeStep } from "@/components/dashboard/CustomizeStep";
import { JobDescriptionStep } from "@/components/dashboard/JobDescriptionStep";
import { ProfileSidebar } from "@/components/dashboard/ProfileSidebar";
import { ProfileStep } from "@/components/dashboard/ProfileStep";
import { TopBar } from "@/components/dashboard/TopBar";
import { Alert } from "@/components/ui";
import { ApiError, api, type Dashboard } from "@/lib/api";
import { useCustomization } from "@/lib/useCustomization";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const customization = useCustomization(data, setData);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.replace("/login?next=/");
        else setError(err instanceof ApiError ? err.message : "Couldn't load your dashboard.");
      });
  }, [router]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-20">
        <Alert>{error}</Alert>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
      </main>
    );
  }

  const firstName = data.user.full_name.split(" ")[0];

  return (
    <>
      <TopBar user={data.user} photoVersion={data.photo_version} />
      <main id="home" className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <ProfileSidebar data={data} onChange={setData} />

        <div className="min-w-0 space-y-6">
          <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white dark:border-indigo-900">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Welcome, {firstName}!</h1>
            <p className="mt-1 text-sm text-indigo-100">
              Tailor your resume to any job in three steps: tell us about yourself, paste the job description, then let AI customize your resume.
            </p>
          </Card>

          <ProfileStep data={data} onChange={setData} />
          <JobDescriptionStep data={data} onChange={setData} customization={customization} />
          <CustomizeStep data={data} customization={customization} />
        </div>
      </main>
    </>
  );
}
