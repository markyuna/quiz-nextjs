import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
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
  is_active: boolean;
  usage_count: number;
  created_at: string;
};

function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

function normalizeTopic(topic: string): string {
  return topic.trim();
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

    if (type === "open_ended") {
      return NextResponse.json(
        {
          error:
            "Open ended mode is not connected to Supabase yet. Use mcq for now.",
        },
        { status: 400 }
      );
    }

    const normalizedTopic = normalizeTopic(topic);

    const { data: supabaseQuestions, error: supabaseError } =
      await supabaseAdmin
        .from("quiz_questions")
        .select("*")
        .eq("is_active", true)
        .eq("topic", normalizedTopic);

    if (supabaseError) {
      throw new Error(`Supabase error: ${supabaseError.message}`);
    }

    if (!supabaseQuestions || supabaseQuestions.length === 0) {
      return NextResponse.json(
        {
          error: `No saved MCQ questions found for topic "${normalizedTopic}".`,
        },
        { status: 404 }
      );
    }

    const selectedQuestions = shuffleArray(
      supabaseQuestions as SupabaseMCQQuestion[]
    ).slice(0, amount);

    if (selectedQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions available to create the quiz." },
        { status: 404 }
      );
    }

    const game = await prisma.game.create({
      data: {
        gameType: type,
        timeStarted: new Date(),
        userId: session.user.id,
        topic: normalizedTopic,
      },
    });

    await prisma.topicCount.upsert({
      where: { topic: normalizedTopic },
      create: {
        topic: normalizedTopic,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });

    const manyData = selectedQuestions.map((question) => {
      const options = Array.isArray(question.options)
        ? shuffleArray(question.options)
        : [];

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

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Game not found." },
        { status: 404 }
      );
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