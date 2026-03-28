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
      userAnswer: body.userAnswer ?? body.answer,
    });

    const question = await prisma.question.findUnique({
      where: {
        id: parsedBody.questionId,
      },
      select: {
        id: true,
        answer: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    const normalizedCorrectAnswer = question.answer.trim().toLowerCase();
    const normalizedUserAnswer = parsedBody.userAnswer.trim().toLowerCase();

    const correct = normalizedCorrectAnswer === normalizedUserAnswer;

    return NextResponse.json(
      {
        correct,
        correctAnswer: question.answer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/check-answer error:", error);

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