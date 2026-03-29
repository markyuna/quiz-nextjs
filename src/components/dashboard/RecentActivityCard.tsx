import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import HistoryComponent from "../HistoryComponent";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";

const RecentActivityCard = async () => {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return redirect("/");
  }

  const attemptsCount = await prisma.attempt.count({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <Card className="relative overflow-hidden border-white/10 bg-white/60 shadow-xl shadow-black/5 dark:bg-white/5">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

      <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xl dark:bg-white/5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            Activity feed
          </div>

          <div>
            <CardTitle className="text-2xl font-bold">
              <Link
                href="/history"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                Recent Activity
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardTitle>

            <CardDescription className="mt-1 max-w-xl text-sm leading-6">
              You have completed a total of {attemptsCount}{" "}
              {attemptsCount === 1 ? "quiz" : "quizzes"}.
            </CardDescription>
          </div>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/60 shadow-sm backdrop-blur-xl dark:bg-white/5">
          <Activity className="h-5 w-5 text-cyan-400" />
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/40 p-2 backdrop-blur-xl dark:bg-white/5">
          <div className="max-h-[580px] overflow-y-auto rounded-[1.4rem] pr-1">
            <HistoryComponent limit={10} userId={session.user.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;