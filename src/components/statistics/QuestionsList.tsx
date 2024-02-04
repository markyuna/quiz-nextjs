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

  let gameType = questions[0]?.questionType;

  return (
    <Table className="mt-4">
      <TableCaption>End of list.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[10px]">No.</TableHead>
          <TableHead>Question & Correct Answer</TableHead>
          <TableHead>Your Answer</TableHead>

          {gameType === "open_ended" && (
            <TableHead className="w-[10px] text-right">Accuracy</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        <>
        {questions.map((question, index) => {
          return (
          <TableRow key={question.id}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>
              {question.question} 
              <br />
              <br />
              <span className="font-semibold text-green-600">{question.answer}</span>
            </TableCell>
            {gameType === "mcq" && (
            
              <TableCell 
                className={cn({
                  "font-semibold text-green-600" : question.isCorrect,
                  "font-semibold text-red-600" : !question.isCorrect,
                })}
              >
                {question.userAnswer}
              </TableCell>
            )}

            {gameType === "open_ended" && (
              <TableCell>{question.userAnswer}</TableCell>
            )}
            {gameType === "open_ended" && (
              <TableCell className="text-right">
                {question.percentageCorrect}
              </TableCell>
            )}
          </TableRow>
          );
        })}
        </>
      </TableBody>
    </Table>
  );
};

export default QuestionsList;
