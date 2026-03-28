import { CheckCircle2, XCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

type MCQCounterProps = {
  correctAnswers: number;
  wrongAnswers: number;
};

export default function MCQCounter({
  correctAnswers,
  wrongAnswers,
}: MCQCounterProps) {
  return (
    <Card className="flex flex-row items-center justify-center gap-3 p-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-7 w-7 text-green-600" />
        <span className="text-2xl font-semibold text-green-600">
          {correctAnswers}
        </span>
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold text-red-600">
          {wrongAnswers}
        </span>
        <XCircle className="h-7 w-7 text-red-600" />
      </div>
    </Card>
  );
}