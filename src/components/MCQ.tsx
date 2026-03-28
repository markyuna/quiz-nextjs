"use client";

import * as React from "react";
import Link from "next/link";
import axios from "axios";
import { z } from "zod";
import { differenceInSeconds } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import {
  BarChart,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Timer,
} from "lucide-react";
import { Game, Question } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";

import MCQCounter from "./MCQCounter";
import QuizProgress from "./QuizProgress";
import { Button, buttonVariants } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { checkAnswerSchema } from "@/schemas/form/quiz";
import { cn, formatTimeDelta } from "@/lib/utils";

type MCQProps = {
  game: Game & {
    questions: Pick<Question, "id" | "options" | "question">[];
  };
};

export default function MCQ({ game }: MCQProps) {
  const { toast } = useToast();

  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [selectedChoice, setSelectedChoice] = React.useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = React.useState(0);
  const [wrongAnswers, setWrongAnswers] = React.useState(0);
  const [hasEnded, setHasEnded] = React.useState(false);
  const [now, setNow] = React.useState(new Date());
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  const currentQuestion = React.useMemo(() => {
    return game.questions[questionIndex];
  }, [game.questions, questionIndex]);

  const options = React.useMemo(() => {
    if (!currentQuestion?.options) return [];
    return JSON.parse(currentQuestion.options as string) as string[];
  }, [currentQuestion]);

  React.useEffect(() => {
    if (hasEnded) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [hasEnded]);

  const { mutate: checkAnswer, isPending: isChecking } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof checkAnswerSchema> = {
        questionId: currentQuestion.id,
        userAnswer: selectedChoice !== null ? options[selectedChoice] : "",
      };

      const response = await axios.post("/api/checkAnswer", payload);
      return response.data;
    },
  });

  const handleNext = React.useCallback(() => {
    if (isChecking) return;

    if (selectedChoice === null) {
      toast({
        title: "Select an answer",
        description: "Please choose an option before continuing.",
        variant: "destructive",
      });
      return;
    }

    checkAnswer(undefined, {
      onSuccess: async ({ isCorrect }) => {
        if (isCorrect) {
          setFeedback({
            type: "success",
            message: "Correct answer. Nice job.",
          });
          setCorrectAnswers((prev) => prev + 1);
        } else {
          setFeedback({
            type: "error",
            message: "Incorrect answer. Try the next one.",
          });
          setWrongAnswers((prev) => prev + 1);
        }

        const isLastQuestion = questionIndex === game.questions.length - 1;

        await new Promise((resolve) => setTimeout(resolve, 700));

        if (isLastQuestion) {
          setHasEnded(true);
          return;
        }

        setQuestionIndex((prev) => prev + 1);
        setSelectedChoice(null);
        setFeedback({ type: null, message: "" });
      },
      onError: (error) => {
        console.error(error);
        toast({
          title: "Something went wrong",
          description: "We could not check your answer.",
          variant: "destructive",
        });
      },
    });
  }, [checkAnswer, game.questions.length, isChecking, questionIndex, selectedChoice, toast, currentQuestion, options]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "1") {
        setSelectedChoice(0);
      } else if (event.key === "2") {
        setSelectedChoice(1);
      } else if (event.key === "3") {
        setSelectedChoice(2);
      } else if (event.key === "4") {
        setSelectedChoice(3);
      } else if (event.key === "Enter") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNext]);

  if (hasEnded) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-4 py-10">
        <Card className="glass-card w-full rounded-3xl border-white/10 text-center shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Quiz completed</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              You completed this quiz in{" "}
              <span className="font-semibold text-foreground">
                {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
              </span>
            </p>

            <div className="flex justify-center">
              <MCQCounter
                correctAnswers={correctAnswers}
                wrongAnswers={wrongAnswers}
              />
            </div>

            <Link
              href={`/statistics/${game.id}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              View Statistics
              <BarChart className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="space-y-6">
          <Card className="glass-card border-white/10 shadow-2xl">
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                    {game.topic}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Timer className="mr-2 h-4 w-4" />
                    {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
                  </div>
                </div>

                <div className="sm:min-w-[220px]">
                  <QuizProgress
                    current={questionIndex + 1}
                    total={game.questions.length}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5">
                <div className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Multiple choice question
                </div>

                <AnimatePresence mode="wait">
                  <motion.h2
                    key={currentQuestion?.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl font-semibold leading-snug"
                  >
                    {currentQuestion?.question}
                  </motion.h2>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {options.map((option, index) => {
              const isSelected = selectedChoice === index;

              return (
                <motion.button
                  key={`${option}-${index}`}
                  type="button"
                  onClick={() => setSelectedChoice(index)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full rounded-2xl border bg-card p-5 text-left shadow-sm transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/20 bg-muted"
                      )}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1 pt-1 text-base leading-relaxed">
                      {option}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {feedback.type && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-medium",
                  feedback.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                )}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                className="min-w-[180px] rounded-xl"
                size="lg"
                disabled={isChecking}
                onClick={handleNext}
              >
                {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </section>

        <aside className="space-y-4">
          <Card className="glass-card shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <MCQCounter
                correctAnswers={correctAnswers}
                wrongAnswers={wrongAnswers}
              />
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Press 1–4 to select an answer</p>
              <p>Press Enter to continue</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}