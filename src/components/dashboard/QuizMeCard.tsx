"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Sparkles, ArrowRight } from "lucide-react";

import { Card, CardContent } from "../ui/card";

const QuizMeCard = () => {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push("/quiz")}
      className="group relative cursor-pointer overflow-hidden border-white/10 bg-white/60 shadow-xl shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-white/5"
    >
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-500/15 opacity-80 transition-opacity group-hover:opacity-100" />

      {/* Glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

      <CardContent className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
        {/* Top */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xl dark:bg-white/5">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              AI powered
            </div>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Quiz me
            </h2>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/60 shadow-sm backdrop-blur-xl dark:bg-white/5">
            <BrainCircuit className="h-6 w-6 text-violet-500 dark:text-violet-300" />
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 flex items-end justify-between">
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            Generate a new quiz instantly and keep improving with AI-powered
            questions tailored to your learning.
          </p>

          <div className="flex items-center gap-2 text-sm font-medium text-foreground/80 transition-all group-hover:translate-x-1">
            Start
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizMeCard;