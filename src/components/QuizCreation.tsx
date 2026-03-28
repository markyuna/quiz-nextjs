"use client";

import * as React from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, CopyCheck } from "lucide-react";

import { quizCreationSchema } from "@/schemas/form/quiz";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import LoadingQuestions from "./LoadingQuestions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

type QuizCreationProps = {
  topicParam: string;
};

type QuizCreationInput = z.infer<typeof quizCreationSchema>;

export default function QuizCreation({ topicParam }: QuizCreationProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [showLoader, setShowLoader] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  const form = useForm<QuizCreationInput>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      amount: 3,
      topic: topicParam,
      type: "open_ended",
    },
  });

  const { mutate: createGame, isPending } = useMutation({
    mutationFn: async ({ amount, topic, type }: QuizCreationInput) => {
      const response = await axios.post("/api/game", { amount, topic, type });
      return response.data;
    },
    onSuccess: ({ gameId }) => {
      setFinished(true);

      setTimeout(() => {
        const gameType = form.getValues("type");
        router.push(
          gameType === "open_ended"
            ? `/play/open-ended/${gameId}`
            : `/play/mcq/${gameId}`
        );
      }, 1000);
    },
    onError: (error) => {
      setShowLoader(false);

      if (error instanceof AxiosError && error.response?.status === 500) {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: "Unable to create the quiz.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: QuizCreationInput) {
    setShowLoader(true);
    createGame(values);
  }

  if (showLoader) {
    return <LoadingQuestions finished={finished} />;
  }

  const selectedType = form.watch("type");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create a Quiz</CardTitle>
          <CardDescription>Choose a topic and quiz format.</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a topic..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose any topic you want to practice.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between overflow-hidden rounded-lg border">
                <Button
                  type="button"
                  className="w-1/2 rounded-none"
                  variant={selectedType === "mcq" ? "default" : "secondary"}
                  onClick={() => form.setValue("type", "mcq")}
                >
                  <CopyCheck className="mr-2 h-4 w-4" />
                  Multiple Choice
                </Button>

                <Separator orientation="vertical" />

                <Button
                  type="button"
                  className="w-1/2 rounded-none"
                  variant={selectedType === "open_ended" ? "default" : "secondary"}
                  onClick={() => form.setValue("type", "open_ended")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Open Ended
                </Button>
              </div>

              <Button disabled={isPending} type="submit">
                Create Quiz
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}