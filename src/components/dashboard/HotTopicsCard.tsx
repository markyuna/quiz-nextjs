import dynamic from "next/dynamic";
import { Flame, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";

const CustomWordCloud = dynamic(() => import("../CustomWordCloud"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/50 shadow-sm backdrop-blur-xl dark:bg-white/5">
          <Sparkles className="h-5 w-5 text-violet-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Loading topic trends</p>
          <p className="text-sm text-muted-foreground">
            Preparing your hottest quiz topics...
          </p>
        </div>
      </div>
    </div>
  ),
});

export default async function HotTopicsCard() {
  const topics = await prisma.game.groupBy({
    by: ["topic"],
    _count: {
      topic: true,
    },
    orderBy: {
      _count: {
        topic: "desc",
      },
    },
  });

  const formattedTopics = topics
    .filter((topic) => topic.topic && topic.topic.trim() !== "")
    .map((topic) => ({
      text: topic.topic,
      value: topic._count.topic,
    }));

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10" />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

      <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xl dark:bg-white/5">
            <Flame className="h-3.5 w-3.5 text-fuchsia-400" />
            Trending now
          </div>

          <div>
            <CardTitle className="text-2xl font-bold">Hot Topics</CardTitle>
            <CardDescription className="mt-1 max-w-md text-sm leading-6">
              Explore the most popular quiz topics based on recent activity.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {formattedTopics.length > 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-white/40 p-2 backdrop-blur-xl dark:bg-white/5">
            <div className="h-[420px] overflow-hidden rounded-[1.4rem]">
              <CustomWordCloud formattedTopics={formattedTopics} />
            </div>
          </div>
        ) : (
          <div className="flex h-[260px] items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/40 p-6 text-center backdrop-blur-xl dark:bg-white/5">
            <div className="max-w-sm space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/60 shadow-sm dark:bg-white/5">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">No topics yet</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Complete a few quizzes and your topic trends will appear here.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}