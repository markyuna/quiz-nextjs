import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { checkAnswerSchema } from "@/schemas/form/quiz";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const parsedBody = checkAnswerSchema.parse({
      questionId: body.questionId,
      userAnswer: body.userAnswer,
    });

    const question = await prisma.question.findUnique({
      where: {
        id: parsedBody.questionId,
      },
      select: {
        id: true,
        answer: true,
        gameId: true,
        game: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    if (question.game.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const normalizedCorrectAnswer = question.answer.trim().toLowerCase();
    const normalizedUserAnswer = parsedBody.userAnswer.trim().toLowerCase();

    const correct = normalizedCorrectAnswer === normalizedUserAnswer;

    await prisma.question.update({
      where: {
        id: parsedBody.questionId,
      },
      data: {
        userAnswer: parsedBody.userAnswer.trim(),
        isCorrect: correct,
      },
    });

    const correctAnswersCount = await prisma.question.count({
      where: {
        gameId: question.gameId,
        isCorrect: true,
      },
    });

    await prisma.game.update({
      where: {
        id: question.gameId,
      },
      data: {
        score: correctAnswersCount,
      },
    });

    return NextResponse.json(
      {
        correct,
        correctAnswer: question.answer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/checkAnswer error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}