import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/nextauth";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { quizCreationSchema } from "@/schemas/form/quiz";

type SupabaseMCQQuestion = {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
};

type OpenEndedQuestion = {
  question: string;
  answer: string;
};

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { topic, type, amount } = quizCreationSchema.parse(body);

    const game = await prisma.game.create({
      data: {
        gameType: type,
        timeStarted: new Date(),
        userId: session.user.id,
        topic,
      },
    });

    await prisma.topicCount.upsert({
      where: { topic },
      create: {
        topic,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });

    if (type === "mcq") {
      const { data: supabaseQuestions, error } = await supabaseAdmin
        .from("quiz_questions")
        .select("*")
        .eq("is_active", true)
        .eq("topic", topic)
        .limit(amount);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!supabaseQuestions || supabaseQuestions.length === 0) {
        return NextResponse.json(
          { error: `No saved questions found for topic "${topic}".` },
          { status: 404 }
        );
      }

      const shuffledQuestions = shuffleArray(
        supabaseQuestions as SupabaseMCQQuestion[]
      ).slice(0, amount);

      const manyData = shuffledQuestions.map((question) => {
        const normalizedOptions = Array.isArray(question.options)
          ? question.options
          : [];

        const options = shuffleArray(normalizedOptions);

        return {
          question: question.question,
          answer: question.correct_answer,
          options: JSON.stringify(options),
          gameId: game.id,
          questionType: "mcq" as const,
        };
      });

      await prisma.question.createMany({
        data: manyData,
      });

      for (const question of shuffledQuestions) {
        await supabaseAdmin
          .from("quiz_questions")
          .update({
            usage_count: 1 + 0,
          })
          .eq("id", question.id);
      }
    }

    if (type === "open_ended") {
      const fallbackQuestions: OpenEndedQuestion[] = [
        {
          question: `Explain in your own words: ${topic}`,
          answer: topic,
        },
      ];

      const manyData = fallbackQuestions.map((question) => ({
        question: question.question,
        answer: question.answer,
        gameId: game.id,
        questionType: "open_ended" as const,
      }));

      await prisma.question.createMany({
        data: manyData,
      });
    }

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("game POST error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view a game." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");

    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game id." },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { questions: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    console.error("game GET error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}