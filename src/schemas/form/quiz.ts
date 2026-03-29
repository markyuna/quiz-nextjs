import { z } from "zod";

export const quizCreationSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  amount: z.coerce.number().min(1, "Minimum is 1").max(20, "Maximum is 20"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.literal("mcq"),
});

export const getQuestionsSchema = z.object({
  topic: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  amount: z.number().int().positive().min(1).max(10),
  type: z.enum(["mcq", "open_ended"]),
});

export const checkAnswerSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  userAnswer: z.string().min(1, "Answer is required"),
}); 

export const endGameSchema = z.object({
  gameId: z.string(),
});

export const joinGameSchema = z.object({
  gameId: z.string(),
  userId: z.string(),
});