import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Question } from "@prisma/client";
import { cn } from "@/lib/utils";

type Props = {
  questions: Question[];
};

export default function QuestionsList({ questions }: Props) {
  if (!questions?.length) {
    return <p className="mt-4 text-center">No questions available.</p>;
  }

  const gameType = questions[0]?.questionType;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Question</TableHead>
            <TableHead>Your Answer</TableHead>
            {gameType === "open_ended" && (
              <TableHead className="text-right">Score</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {questions.map((q, i) => (
            <TableRow key={q.id}>
              <TableCell>{i + 1}</TableCell>

              <TableCell>
                <div className="space-y-1">
                  <p>{q.question}</p>
                  <p className="text-sm font-semibold text-green-600">
                    ✔ {q.answer}
                  </p>
                </div>
              </TableCell>

              <TableCell
                className={cn({
                  "text-green-600 font-semibold": q.isCorrect,
                  "text-red-600 font-semibold": q.isCorrect === false,
                })}
              >
                {q.userAnswer ?? "-"}
              </TableCell>

              {gameType === "open_ended" && (
                <TableCell className="text-right">
                  {q.percentageCorrect ?? 0}%
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}