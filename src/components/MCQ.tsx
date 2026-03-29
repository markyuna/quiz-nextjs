"use client";

import * as React from "react";
import Link from "next/link";
import axios from "axios";
import { differenceInSeconds } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Timer,
  XCircle,
} from "lucide-react";
import { Game, Question } from "@prisma/client";

import MCQCounter from "./MCQCounter";
import { Button, buttonVariants } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { cn, formatTimeDelta } from "@/lib/utils";

type QuestionWithOptions = Pick<
  Question,
  "id" | "question" | "answer" | "options"
>;

type MCQProps = {
  game: Game & {
    questions: QuestionWithOptions[];
  };
};

type CheckAnswerResponse = {
  correct: boolean;
  correctAnswer: string;
};

const MCQ = ({ game }: MCQProps) => {
  const { toast } = useToast();

  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [now, setNow] = React.useState(new Date());

  const currentQuestion = game.questions[questionIndex];
  const isLastQuestion = questionIndex === game.questions.length - 1;

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { mutate: checkAnswer, isPending } = useMutation({
    mutationFn: async ({
      questionId,
      userAnswer,
    }: {
      questionId: string;
      userAnswer: string;
    }) => {
      const response = await axios.post<CheckAnswerResponse>(
        "/api/checkAnswer",
        {
          questionId,
          userAnswer,
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      if (data.correct) {
        setScore((prev) => prev + 1);
        toast({
          title: "Bonne réponse ✅",
          description: "Tu as choisi la bonne réponse.",
        });
      } else {
        toast({
          title: "Mauvaise réponse ❌",
          description: `La bonne réponse était : ${data.correctAnswer}`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier la réponse.",
        variant: "destructive",
      });
    },
  });

  const handleSelect = (option: string) => {
    if (hasAnswered || isPending) return;

    setSelectedAnswer(option);
    setHasAnswered(true);

    checkAnswer({
      questionId: currentQuestion.id,
      userAnswer: option,
    });
  };

  const handleNext = () => {
    if (!hasAnswered) return;

    if (!isLastQuestion) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
      return;
    }

    window.location.href = `/statistics/${game.id}`;
  };

  const elapsedSeconds = differenceInSeconds(now, new Date(game.timeStarted));

  const getOptionStyle = (option: string) => {
    const isCorrect = option === currentQuestion.answer;
    const isSelected = option === selectedAnswer;

    if (!hasAnswered) {
      return "border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/40";
    }

    if (isCorrect) {
      return "border-emerald-400/50 bg-emerald-500/20 text-white";
    }

    if (isSelected && !isCorrect) {
      return "border-rose-400/50 bg-rose-500/20 text-white";
    }

    return "border-white/10 bg-white/5 opacity-70";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                Quiz Challenge
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
                {game.topic}
              </h1>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-cyan-100">
              <Timer className="h-5 w-5" />
              <span className="font-medium">
                {formatTimeDelta(elapsedSeconds)}
              </span>
            </div>
          </div>

          <MCQCounter
            currentQuestionIndex={questionIndex}
            questionsLength={game.questions.length}
          />
        </div>

        <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold leading-snug text-white">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = option === currentQuestion.answer;
                const isSelected = option === selectedAnswer;

                return (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() => handleSelect(option)}
                    disabled={hasAnswered || isPending}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-base font-medium text-slate-100 transition-all duration-200 shadow-lg shadow-black/10",
                      getOptionStyle(option)
                    )}
                  >
                    <span>{option}</span>

                    {hasAnswered && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    )}

                    {hasAnswered && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-rose-300" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                Score: <span className="font-bold text-white">{score}</span> /{" "}
                {game.questions.length}
              </div>

              {hasAnswered ? (
                <Button
                  onClick={handleNext}
                  className="h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 text-white shadow-lg shadow-cyan-900/30 hover:opacity-95"
                >
                  {isLastQuestion ? "Voir les résultats" : "Question suivante"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    "Choisis une réponse"
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "mx-auto text-slate-300 hover:bg-white/5 hover:text-white"
          )}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default MCQ;