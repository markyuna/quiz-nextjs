import Link from "next/link";
import { redirect } from "next/navigation";
import { LucideLayoutDashboard } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import ResultsCard from "@/components/statistics/ResultsCard";
import AccuracyCard from "@/components/statistics/AccuracyCard";
import TimeTakenCard from "@/components/statistics/TimeTakenCard";
import QuestionsList from "@/components/statistics/QuestionsList";

type StatisticsPageProps = {
  params: {
    gameId: string;
  };
};

export const metadata = {
  title: "Statistics | Quizmify",
  description: "Review your quiz results and answers.",
};

export default async function StatisticsPage({
  params: { gameId },
}: StatisticsPageProps) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/");
  }

  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      userId: session.user.id,
    },
    include: {
      questions: true,
    },
  });

  if (!game) {
    redirect("/quiz");
  }

  let accuracy = 0;

  if (game.questions.length > 0) {
    if (game.gameType === "mcq") {
      const totalCorrect = game.questions.reduce((acc, question) => {
        return acc + (question.isCorrect ? 1 : 0);
      }, 0);

      accuracy = (totalCorrect / game.questions.length) * 100;
    }

    if (game.gameType === "open_ended") {
      const totalPercentage = game.questions.reduce((acc, question) => {
        return acc + (question.percentageCorrect ?? 0);
      }, 0);

      accuracy = totalPercentage / game.questions.length;
    }
  }

  accuracy = Math.round(accuracy * 100) / 100;

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>

        <Link href="/dashboard" className={buttonVariants()}>
          <LucideLayoutDashboard className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-7">
        <ResultsCard accuracy={accuracy} />
        <AccuracyCard accuracy={accuracy} />
        <TimeTakenCard
          timeEnded={game.timeEnded ?? new Date()}
          timeStarted={game.timeStarted}
        />
      </section>

      <QuestionsList questions={game.questions} />
    </main>
  );
}