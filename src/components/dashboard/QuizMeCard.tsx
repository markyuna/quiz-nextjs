"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const QuizMeCard = () => {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer rounded-3xl border-border/50 transition-all hover:opacity-90 hover:shadow-md"
      onClick={() => {
        router.push("/quiz");
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Quiz me!</CardTitle>
        <BrainCircuit size={28} strokeWidth={2.5} />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Create a new quiz and keep training with AI-powered questions.
        </p>
      </CardContent>
    </Card>
  );
};

export default QuizMeCard;