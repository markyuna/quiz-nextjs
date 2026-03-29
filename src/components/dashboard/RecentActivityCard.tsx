import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

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
    <Card className="col-span-4 rounded-3xl border-border/50 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          <Link href="/history">Recent Activity</Link>
        </CardTitle>
        <CardDescription>
          You have completed a total of {attemptsCount} quiz
          {attemptsCount === 1 ? "" : "zes"}.
        </CardDescription>
      </CardHeader>

      <CardContent className="max-h-[580px] overflow-y-auto">
        <HistoryComponent limit={10} userId={session.user.id} />
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;