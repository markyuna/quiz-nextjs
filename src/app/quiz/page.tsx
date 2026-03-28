import { redirect } from "next/navigation";
import QuizCreation from "@/components/QuizCreation";
import { getAuthSession } from "@/lib/nextauth";

export const metadata = {
  title: "Create Quiz | Quizmify",
};

interface QuizPageProps {
  searchParams: {
    topic?: string;
  };
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/");
  }

  return <QuizCreation topicParam={searchParams.topic ?? ""} />;
}