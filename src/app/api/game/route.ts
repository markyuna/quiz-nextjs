import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextauth";
import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { quizCreationSchema } from "@/schemas/form/quiz";

type Difficulty = "easy" | "medium" | "hard";

type SupabaseMCQQuestion = {
  id: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
};

type GeneratedQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

const generatedQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(4).max(4),
        correct_answer: z.string().min(1),
        explanation: z.string().min(1),
      })
    )
    .min(1),
});

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    details ? { error: message, details } : { error: message },
    { status }
  );
}

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result;
}

function normalizeTopic(topic: string): string {
  return topic.trim();
}

function normalizeDifficulty(difficulty: Difficulty): Difficulty {
  return difficulty.toLowerCase() as Difficulty;
}

function ensureValidOptions(options: string[], correctAnswer: string): string[] {
  const normalizedCorrectAnswer = correctAnswer.trim();

  const sanitizedOptions = options
    .map((option) => option.trim())
    .filter((option) => option.length > 0);

  const uniqueOptions = new Set(sanitizedOptions);

  if (!uniqueOptions.has(normalizedCorrectAnswer)) {
    uniqueOptions.add(normalizedCorrectAnswer);
  }

  const finalOptions = Array.from(uniqueOptions).slice(0, 4);

  if (!finalOptions.includes(normalizedCorrectAnswer)) {
    finalOptions[0] = normalizedCorrectAnswer;
  }

  while (finalOptions.length < 4) {
    finalOptions.push(`Option ${finalOptions.length + 1}`);
  }

  return shuffleArray(finalOptions);
}

function dedupeQuestions<T extends { question: string }>(questions: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const q of questions) {
    const key = q.question.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(q);
    }
  }

  return result;
}

async function fetchExistingMCQQuestions(params: {
  topic: string;
  difficulty: Difficulty;
  amount: number;
}) {
  const { topic, difficulty, amount } = params;

  const { data, error } = await supabaseAdmin
    .from("mcq_questions")
    .select("*")
    .ilike("topic", topic)
    .eq("difficulty", difficulty)
    .eq("is_active", true)
    .limit(amount);

  if (error) {
    throw new Error(`Supabase fetch error: ${error.message}`);
  }

  return (data ?? []) as SupabaseMCQQuestion[];
}

async function generateQuestionsWithAI(params: {
  topic: string;
  difficulty: Difficulty;
  amount: number;
}) {
  const { topic, difficulty, amount } = params;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      {
        role: "developer",
        content:
          "Generate high-quality multiple-choice quiz questions. Return only valid structured JSON matching the requested schema. Each question must have exactly 4 options and exactly 1 correct answer. Avoid duplicates.",
      },
      {
        role: "user",
        content: `Generate ${amount} multiple-choice questions about "${topic}" with difficulty "${difficulty}". 
Return:
- question
- options (exactly 4)
- correct_answer
- explanation

Rules:
- exactly 4 options per question
- only 1 correct answer
- the correct answer must appear inside options
- concise, clear English
- no markdown
- no extra text`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "quiz_questions",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            questions: {
              type: "array",
              minItems: amount,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    minItems: 4,
                    maxItems: 4,
                    items: { type: "string" },
                  },
                  correct_answer: { type: "string" },
                  explanation: { type: "string" },
                },
                required: [
                  "question",
                  "options",
                  "correct_answer",
                  "explanation",
                ],
              },
            },
          },
          required: ["questions"],
        },
      },
    },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  const parsedJson = JSON.parse(content);
  const parsed = generatedQuestionsSchema.parse(parsedJson);

  return parsed.questions.map((q) => ({
    question: q.question.trim(),
    options: ensureValidOptions(q.options, q.correct_answer),
    correct_answer: q.correct_answer.trim(),
    explanation: q.explanation.trim(),
  }));
}

async function saveGeneratedQuestionsToSupabase(params: {
  topic: string;
  difficulty: Difficulty;
  questions: GeneratedQuestion[];
}) {
  const { topic, difficulty, questions } = params;

  if (questions.length === 0) return;

  const rows = questions.map((q) => ({
    topic,
    difficulty,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    is_active: true,
    usage_count: 0,
  }));

  const { error } = await supabaseAdmin.from("mcq_questions").insert(rows);

  if (error) {
    throw new Error(`Supabase insert error: ${error.message}`);
  }
}

async function incrementUsageCount(questions: SupabaseMCQQuestion[]) {
  await Promise.all(
    questions.map((question) =>
      supabaseAdmin
        .from("mcq_questions")
        .update({ usage_count: question.usage_count + 1 })
        .eq("id", question.id)
    )
  );
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return jsonError("No autorizado", 401);
    }

    const body = await req.json();
    const parsedBody = quizCreationSchema.parse(body);

    const topic = normalizeTopic(parsedBody.topic);
    const amount = parsedBody.amount;
    const difficulty = normalizeDifficulty(parsedBody.difficulty);
    const type = parsedBody.type;

    if (type !== "mcq") {
      return jsonError(
        "Solo se admiten preguntas tipo MCQ en esta versión.",
        400
      );
    }

    let questions = await fetchExistingMCQQuestions({
      topic,
      difficulty,
      amount,
    });

    if (questions.length < amount) {
      const missingAmount = amount - questions.length;

      const aiQuestions = await generateQuestionsWithAI({
        topic,
        difficulty,
        amount: missingAmount,
      });

      const dedupedAIQuestions = dedupeQuestions(aiQuestions).slice(
        0,
        missingAmount
      );

      await saveGeneratedQuestionsToSupabase({
        topic,
        difficulty,
        questions: dedupedAIQuestions,
      });

      const refreshedQuestions = await fetchExistingMCQQuestions({
        topic,
        difficulty,
        amount,
      });

      questions = refreshedQuestions;
    }

    if (questions.length === 0) {
      return jsonError("No se pudieron obtener ni generar preguntas.", 500);
    }

    const finalQuestions = dedupeQuestions(questions).slice(0, amount);

    const game = await prisma.game.create({
      data: {
        gameType: "mcq",
        timeStarted: new Date(),
        userId: session.user.id,
        topic,
      },
    });

    await prisma.question.createMany({
      data: finalQuestions.map((question) => ({
        question: question.question,
        answer: question.correct_answer,
        options: ensureValidOptions(
          question.options,
          question.correct_answer
        ),
        gameId: game.id,
        questionType: "mcq",
      })),
    });

    await incrementUsageCount(
      finalQuestions.filter((q): q is SupabaseMCQQuestion => "id" in q)
    );

    return NextResponse.json(
      {
        success: true,
        gameId: game.id,
        source:
          questions.length >= amount ? "supabase_or_ai_cached" : "partial_ai",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/game error:", error);

    if (error instanceof z.ZodError) {
      return jsonError("Datos inválidos", 400, error.flatten());
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Supabase fetch error:")
    ) {
      return jsonError("Error obteniendo preguntas desde Supabase.", 500);
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Supabase insert error:")
    ) {
      return jsonError("Error guardando preguntas generadas en Supabase.", 500);
    }

    if (error instanceof Error && error.message.includes("OpenAI")) {
      return jsonError("Error generando preguntas con IA.", 500);
    }

    return jsonError("Error interno del servidor", 500);
  }
}