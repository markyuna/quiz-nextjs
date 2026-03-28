import DetailsDialog from "@/components/DetailsDialog";
import HistoryCard from "@/components/dashboard/HistoryCard";
import HotTopicsCard from "@/components/dashboard/HotTopicsCard";
import QuizMeCard from "@/components/dashboard/QuizMeCard";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard | Quizmify",
  description: "Track your activity and start new quizzes.",
};

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <DetailsDialog />
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <QuizMeCard />
        <HistoryCard />
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <HotTopicsCard />
        <RecentActivityCard />
      </section>
    </main>
  );
}