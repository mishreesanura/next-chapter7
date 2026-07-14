import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { JobApplicationForm } from "@/components/job-application-form";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.backendToken) {
    redirect("/login");
  }

  return (
    <div className="workspace">
      <AppHeader
        email={session.user.email}
        userName={session.user.name}
        organizationName={session.user.organizationName}
      />
      <main>
        <JobApplicationForm token={session.backendToken} />
      </main>
    </div>
  );
}
