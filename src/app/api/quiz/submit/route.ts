import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { submitQuizSchema } from "@/schemas/form/quiz";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsedBody = submitQuizSchema.parse(body);

    const game = await prisma.game.findFirst({
      where: {
        id: parsedBody.gameId,
        userId: session.user.id,
      },
      include: {
        questions: {
          select: {
            id: true,
            answer: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Quiz no encontrado" },
        { status: 404 }
      );
    }

    if (!game.questions.length) {
      return NextResponse.json(
        { error: "Este quiz no tiene preguntas" },
        { status: 400 }
      );
    }

    const questionMap = new Map(
      game.questions.map((question) => [question.id, question])
    );

    let correctAnswers = 0;

    const answersToCreate = parsedBody.answers
      .map((answer) => {
        const question = questionMap.get(answer.questionId);

        if (!question) {
          return null;
        }

        const isCorrect =
          question.answer.trim().toLowerCase() ===
          answer.selectedAnswer.trim().toLowerCase();

        if (isCorrect) {
          correctAnswers += 1;
        }

        return {
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer.trim(),
          isCorrect,
        };
      })
      .filter(
        (
          answer
        ): answer is {
          questionId: string;
          selectedAnswer: string;
          isCorrect: boolean;
        } => answer !== null
      );

    const totalQuestions = game.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    const attempt = await prisma.attempt.create({
      data: {
        userId: session.user.id,
        gameId: game.id,
        score,
        totalQuestions,
        correctAnswers,
        timeSpent: parsedBody.timeSpent,
        answers: {
          create: answersToCreate,
        },
      },
    });

    await prisma.game.update({
      where: {
        id: game.id,
      },
      data: {
        score,
        timeEnded: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        attemptId: attempt.id,
        score,
        correctAnswers,
        totalQuestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/quiz/submit error:", error);

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