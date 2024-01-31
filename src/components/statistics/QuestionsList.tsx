import React from "react";

import {
  Table,
  TableBody,
  TableCaption,
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

const QuestionsList = ({ questions }: Props) => {
  if (!questions || questions.length === 0) {
    return <p>No questions available.</p>;
  }

  const gameType = questions[0]?.questionType;

  return (
    <Table className="mt-4">
      <TableCaption>End of list.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[10px]">No.</TableHead>
          <TableHead>Question & Correct Answer</TableHead>
          <TableHead>Your Answer</TableHead>

          {questions[0].questionType === "open_ended" && (
            <TableHead className="w-[10px] text-right">Accuracy</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        <>
        {questions.map(({ id, answer, question, userAnswer, percentageCorrect, isCorrect }) => (
          <TableRow key={id}>
            <TableCell className="font-medium">{id}</TableCell>
            <TableCell>
              {question} <br />
              <br />
              <span className="font-semibold">{answer}</span>
            </TableCell>
            {questions[0].questionType === "open_ended" ? (
              <TableCell className={`font-semibold`}>
                {userAnswer}
              </TableCell>
            ) : (
              <TableCell className={`${isCorrect ? "text-green-600" : "text-red-600"} font-semibold`}>
                {userAnswer}
              </TableCell>
            )}

            {percentageCorrect && (
              <TableCell className="text-right">
                {percentageCorrect}
              </TableCell>
            )}
          </TableRow>
        ))}
        </>
      </TableBody>
    </Table>
  );
};

export default QuestionsList;
