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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Image
          src="/logo.png"
          alt="Quizmify logo"
          width={380}
          height={80}
          priority
          className="drop-shadow-[0_0_0.3rem_#ffffff70]"
        />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Welcome to Quizmify 🔥</CardTitle>
            <CardDescription>
              Create quizzes with AI and test yourself on any topic. Sign in to get started.
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