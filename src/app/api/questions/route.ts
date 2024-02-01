import { quizCreationSchema } from "@/schemas/form/quiz";
import { ZodError } from "zod";
import { strict_output } from "@/lib/gpt";
import { getAuthSession } from "@/lib/nextauth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = async (req: Request, res: Response) => {
  try {
    const body = await req.json();
    const { amount, topic, type } = quizCreationSchema.parse(body);

    let questions: any;

    if (type === "open_ended" || type === "mcq") {
      const questionPrompt =
        type === "open_ended"
          ? `You are to generate a random hard open-ended question about ${topic}`
          : `You are to generate a random hard mcq question about ${topic}`;

      const options =
        type === "mcq"
          ? {
              option1: "1st with max length of 15 words",
              option2: "2nd with max length of 15 words",
              option3: "3rd with max length of 15 words",
              option4: "4th with max length of 15 words",
            }
          : undefined;

      questions = await strict_output(
        "You are a helpful AI that is able to generate a pair of questions and answers, the length of the answer should not exceed 15 words, store all the pairs of answers and questions in a JSON array",
        new Array(amount).fill(questionPrompt),
        {
          question: "question",
          answer: "answer with max length of 15 words",
          ...options,
        }
      );
    }

    return NextResponse.json(
    { 
      questions 
    }, 
    { 
      status: 200 
    });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    } else {
      console.error("Error:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        { status: 500 }
      );
    }
  }
};
