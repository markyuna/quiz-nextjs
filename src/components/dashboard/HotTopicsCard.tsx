import dynamic from "next/dynamic";

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
    <div className="flex h-[550px] items-center justify-center text-sm text-muted-foreground">
      Loading topics...
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
    <Card className="col-span-4 rounded-3xl border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Hot Topics</CardTitle>
        <CardDescription>
          Click on a topic to start a new quiz.
        </CardDescription>
      </CardHeader>

      <CardContent className="pl-2">
        {formattedTopics.length > 0 ? (
          <CustomWordCloud formattedTopics={formattedTopics} />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No topics yet. Complete a few quizzes to see trends here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}