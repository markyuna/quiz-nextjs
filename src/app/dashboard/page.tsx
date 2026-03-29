import { redirect } from "next/navigation";
import { Brain, Clock3, Target, Trophy } from "lucide-react";

import DetailsDialog from "@/components/DetailsDialog";
import HistoryCard from "@/components/dashboard/HistoryCard";
import HotTopicsCard from "@/components/dashboard/HotTopicsCard";
import QuizMeCard from "@/components/dashboard/QuizMeCard";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";

export const metadata = {
  title: "Dashboard | Quizmify",
  description: "Track your activity and start new quizzes.",
};

function formatSeconds(seconds: number) {
  if (!seconds || seconds <= 0) return "0s";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    attempts,
    attemptsCount,
    gamesCount,
    totalCorrectAggregate,
    totalAnsweredAggregate,
    totalTimeAggregate,
    recentAttempts,
  ] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId },
      select: {
        id: true,
        score: true,
        correctAnswers: true,
        totalQuestions: true,
        timeSpent: true,
        createdAt: true,
        game: {
          select: {
            id: true,
            topic: true,
            gameType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.attempt.count({
      where: { userId },
    }),
    prisma.game.count({
      where: { userId },
    }),
    prisma.attempt.aggregate({
      where: { userId },
      _sum: {
        correctAnswers: true,
      },
    }),
    prisma.attempt.aggregate({
      where: { userId },
      _sum: {
        totalQuestions: true,
      },
    }),
    prisma.attempt.aggregate({
      where: { userId },
      _sum: {
        timeSpent: true,
      },
    }),
    prisma.attempt.findMany({
      where: { userId },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        score: true,
        createdAt: true,
        correctAnswers: true,
        totalQuestions: true,
        game: {
          select: {
            id: true,
            topic: true,
          },
        },
      },
    }),
  ]);

  const totalCorrect = totalCorrectAggregate._sum.correctAnswers ?? 0;
  const totalAnswered = totalAnsweredAggregate._sum.totalQuestions ?? 0;
  const totalTimeSpent = totalTimeAggregate._sum.timeSpent ?? 0;

  const accuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((acc, attempt) => acc + attempt.score, 0) / attempts.length
        )
      : 0;

  const averageTimePerQuiz =
    attemptsCount > 0 ? Math.round(totalTimeSpent / attemptsCount) : 0;

  const bestAttempt =
    attempts.length > 0
      ? attempts.reduce((best, current) =>
          current.score > best.score ? current : best
        )
      : null;

  return (
    <main className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <DetailsDialog />
      </div>

      <p className="mt-2 text-muted-foreground">
        Track your performance, review recent quizzes, and keep improving.
      </p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-3xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Quizzes Completed
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{attemptsCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {gamesCount} quizzes created overall
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{accuracy}%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalCorrect} correct answers out of {totalAnswered}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageScore}%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Best run: {bestAttempt ? `${bestAttempt.score}%` : "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Time / Quiz
            </CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatSeconds(averageTimePerQuiz)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total study time: {formatSeconds(totalTimeSpent)}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <QuizMeCard />
        <HistoryCard />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <HotTopicsCard />
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full rounded-3xl border-border/50">
            <CardHeader>
              <CardTitle>Recent Quiz Results</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No quiz attempts yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-2xl border border-border/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {attempt.game.topic || "Untitled quiz"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(attempt.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-full border px-3 py-1 text-sm font-semibold">
                          {attempt.score}%
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {attempt.correctAnswers}/{attempt.totalQuestions} correct
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-4">
        <RecentActivityCard />
      </section>
    </main>
  );
}