import { z } from "zod";

export const quizCreationSchema = z.object({
  topic: z
    .string()
    .min(4, { message: "Topic must be at least 4 characters long" })
    .max(50, { message: "Topic must be at most 50 characters long" }),
  type: z.enum(["mcq", "open_ended"]),
  amount: z.number().int().min(1).max(10),
});

export const getQuestionsSchema = z.object({
  topic: z.string(),
  amount: z.number().int().positive().min(1).max(10),
  type: z.enum(["mcq", "open_ended"]),
});

export const checkAnswerSchema = z.object({
  questionId: z.string(),
  userAnswer: z.string(),
});

export const endGameSchema = z.object({
  gameId: z.string(),
});

export const joinGameSchema = z.object({
  gameId: z.string(),
  userId: z.string(),
});