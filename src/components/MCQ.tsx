"use client";

import * as React from "react";
import Link from "next/link";
import axios from "axios";
import { z } from "zod";
import { differenceInSeconds } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { BarChart, ChevronRight, Loader2, Timer } from "lucide-react";
import { Game, Question } from "@prisma/client";

import MCQCounter from "./MCQCounter";
import { Button, buttonVariants } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
      onSuccess: ({ isCorrect }) => {
        if (isCorrect) {
          toast({
            title: "Correct!",
            description: "Nice job.",
            variant: "success",
          });
          setCorrectAnswers((prev) => prev + 1);
        } else {
          toast({
            title: "Incorrect",
            description: "Try the next one.",
            variant: "destructive",
          });
          setWrongAnswers((prev) => prev + 1);
        }

        const isLastQuestion = questionIndex === game.questions.length - 1;

        if (isLastQuestion) {
          setHasEnded(true);
          return;
        }

        setQuestionIndex((prev) => prev + 1);
        setSelectedChoice(null);
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
  }, [checkAnswer, game.questions.length, isChecking, questionIndex, selectedChoice, toast]);

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
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col items-center justify-center px-4 py-10">
        <div className="rounded-md bg-green-500 px-4 py-2 font-semibold text-white">
          You completed the quiz in{" "}
          {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
        </div>

        <Link
          href={`/statistics/${game.id}`}
          className={cn(buttonVariants(), "mt-4")}
        >
          View Statistics
          <BarChart className="ml-2 h-4 w-4" />
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-[90vw] max-w-4xl px-4 py-8 md:w-[80vw]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col">
          <p>
            <span className="text-slate-400">Topic</span>{" "}
            <span className="rounded-lg bg-slate-800 px-2 py-1 text-white">
              {game.topic}
            </span>
          </p>

          <div className="mt-3 flex self-start text-slate-400">
            <Timer className="mr-2" />
            {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
          </div>
        </div>

        <MCQCounter
          correctAnswers={correctAnswers}
          wrongAnswers={wrongAnswers}
        />
      </div>

      <Card className="mt-4 w-full">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">{game.questions.length}</div>
          </CardTitle>

          <CardDescription className="flex-grow text-lg">
            {currentQuestion?.question}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-4 flex w-full flex-col items-center justify-center">
        {options.map((option, index) => (
          <Button
            key={`${option}-${index}`}
            className="mb-4 w-full justify-start py-8"
            variant={selectedChoice === index ? "default" : "secondary"}
            onClick={() => setSelectedChoice(index)}
          >
            <div className="flex items-center justify-start">
              <div className="mr-5 rounded-md border px-3 py-2">{index + 1}</div>
              <div className="text-start">{option}</div>
            </div>
          </Button>
        ))}

        <Button
          className="mt-2"
          variant="default"
          size="lg"
          disabled={isChecking}
          onClick={handleNext}
        >
          {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}