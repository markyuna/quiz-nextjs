import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";

const MAX_QUESTIONS = 10;

export async function POST() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const progressEntries = await prisma.userQuestionProgress.findMany({
      where: {
        userId,
        needsReview: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        question: {
          select: {
            id: true,
            question: true,
            answer: true,
            options: true,
            questionType: true,
            explanation: true,
          },
        },
      },
      take: MAX_QUESTIONS,
    });

    const questionsToPractice = progressEntries
      .map((entry) => entry.question)
      .filter((question) => question && question.options.length > 0);

    if (questionsToPractice.length === 0) {
      return NextResponse.json(
        { error: "No incorrect answers found to practice yet." },
        { status: 404 }
      );
    }

    const game = await prisma.game.create({
      data: {
        userId,
        topic: "Practice Mistakes",
        gameType: "mcq",
        timeStarted: new Date(),
        questions: {
          create: questionsToPractice.map((question) => ({
            question: question.question,
            answer: question.answer,
            options: question.options,
            questionType: question.questionType || "mcq",
            explanation: question.explanation ?? null,
            sourceQuestionId: question.id,
          })),
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    console.error("POST /api/game/mistakes error:", error);

    return NextResponse.json(
      { error: "Failed to create mistakes practice quiz." },
      { status: 500 }
    );
  }
}