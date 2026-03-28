import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import SignInButton from "@/components/SignInButton";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getAuthSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.18),transparent_30%)]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10">
        <div className="space-y-4 text-center">
          <div className="mx-auto inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1 text-sm text-muted-foreground backdrop-blur dark:bg-white/5">
            AI-powered quiz experience
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
            <span className="gradient-text">Quizmify</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Create beautiful AI-powered quizzes, challenge yourself on any topic,
            and track your progress with a premium learning experience.
          </p>
        </div>

        <Card className="glass-card w-full max-w-md rounded-3xl border-white/10 shadow-2xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto">
              <Image
                src="/logo.png"
                alt="Quizmify logo"
                width={200}
                height={80}
                priority
                className="drop-shadow-[0_12px_32px_rgba(139,92,246,0.35)]"
              />
            </div>

            <CardTitle className="text-2xl font-bold">
              Start your next quiz
            </CardTitle>

            <CardDescription className="text-base">
              Sign in with Google to generate quizzes, track results, and build your learning streak.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <SignInButton text="Sign in with Google" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}