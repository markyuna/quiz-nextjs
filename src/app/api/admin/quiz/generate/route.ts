import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { QuizQuestionsSchema } from "@/lib/quiz-schema";

const BodySchema = z.object({
  topic: z.string().min(2).max(100),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  count: z.number().int().min(1).max(20).default(10),
});

export async function POST(req: NextRequest) {
  try {
    const adminSecret = req.headers.get("x-admin-secret");

    if (!adminSecret || adminSecret !== process.env.QUIZ_ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json();
    const { topic, difficulty, count } = BodySchema.parse(rawBody);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "quiz_questions_batch",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              questions: {
                type: "array",
                minItems: 1,
                maxItems: 20,
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
                    difficulty: {
                      type: "string",
                      enum: ["easy", "medium", "hard"],
                    },
                  },
                  required: [
                    "question",
                    "options",
                    "correct_answer",
                    "explanation",
                    "difficulty",
                  ],
                },
              },
            },
            required: ["questions"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You generate clean multiple-choice quiz questions. Return only valid structured data.",
        },
        {
          role: "user",
          content: `
Generate ${count} multiple-choice quiz questions about "${topic}".
Difficulty: ${difficulty}.

Rules:
- 4 answer options per question
- exactly 1 correct answer
- no duplicate questions
- the correct_answer must match one option exactly
- short and clear explanations
          `,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No content returned by OpenAI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    const questions = QuizQuestionsSchema.parse(parsed.questions);

    const rows = questions.map((q) => {
      const options = [...new Set(q.options.map((x) => x.trim()))];
      const correct = q.correct_answer.trim();

      if (options.length !== 4) {
        throw new Error(`Duplicate options in question: ${q.question}`);
      }

      if (!options.includes(correct)) {
        throw new Error(`Correct answer not found in options: ${q.question}`);
      }

      return {
        topic: topic.trim(),
        difficulty: q.difficulty,
        question: q.question.trim(),
        options,
        correct_answer: correct,
        explanation: q.explanation.trim(),
        source_model: "gpt-4o-mini",
      };
    });

    const { data, error } = await supabaseAdmin
      .from("quiz_questions")
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inserted: data.length,
      questions: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}