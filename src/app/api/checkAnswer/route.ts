import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { stringSimilarity } from "string-similarity-js";

import { prisma } from "@/lib/db";
import { checkAnswerSchema } from "@/schemas/form/quiz";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questionId, userAnswer } = checkAnswerSchema.parse(body);

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { userAnswer },
    });

    if (question.questionType === "mcq") {
      const isCorrect =
        question.answer.trim().toLowerCase() ===
        userAnswer.trim().toLowerCase();

      await prisma.question.update({
        where: { id: questionId },
        data: { isCorrect },
      });

      return NextResponse.json({ isCorrect }, { status: 200 });
    }

    if (question.questionType === "open_ended") {
      const percentageSimilar = Math.round(
        stringSimilarity(
          userAnswer.trim().toLowerCase(),
          question.answer.trim().toLowerCase()
        ) * 100
      );

      await prisma.question.update({
        where: { id: questionId },
        data: { percentageCorrect: percentageSimilar },
      });

      return NextResponse.json({ percentageSimilar }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Unsupported question type" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues },
        { status: 400 }
      );
    }

    console.error("checkAnswer error:", error);

    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}