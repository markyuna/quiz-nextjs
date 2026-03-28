import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { strict_output } from "@/lib/gpt";
import { getQuestionsSchema } from "@/schemas/form/quiz";

export const runtime = "nodejs";
export const maxDuration = 10;

type OpenEndedQuestion = {
  question: string;
  answer: string;
};

type MCQQuestion = OpenEndedQuestion & {
  option1: string;
  option2: string;
  option3: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, topic, type } = getQuestionsSchema.parse(body);

    const prompt =
      type === "open_ended"
        ? `Generate a hard open-ended question about ${topic}.`
        : `Generate a hard multiple-choice question about ${topic}.`;

    const outputFormat =
      type === "mcq"
        ? {
            question: "question",
            answer: "correct answer with max length of 15 words",
            option1: "incorrect option with max length of 15 words",
            option2: "incorrect option with max length of 15 words",
            option3: "incorrect option with max length of 15 words",
          }
        : {
            question: "question",
            answer: "answer with max length of 15 words",
          };

    const questions = await strict_output(
      "You are a helpful AI that generates quiz questions and answers. Return valid JSON only.",
      new Array(amount).fill(prompt),
      outputFormat
    );

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues },
        { status: 400 }
      );
    }

    console.error("questions route error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}