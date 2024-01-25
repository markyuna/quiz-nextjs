"use client";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import React from "react";
import D3WordCloud from "react-d3-cloud";

type Props = {
  formattedTopics: { text: string; value: number }[];
};
const fontSizeMapper = (word: { value: number }) => {
    return Math.log2(word.value) * 5 + 16;

}

const data = [
    { text: "hello", value: 10},
    { text: "world", value: 15 },
    { text: "Computer", value: 5 },
    { text: "something", value: 8 },
    { text: "NextJS", value: 1000 },
    { text: "React", value: 1000 },
    { text: "TypeScript", value: 100 },
    { text: "Proyect", value: 100 },
    
]

const CustomWordCloud = ({formattedTopics}: Props) => {
  const theme = useTheme();
  const router = useRouter();
  return ( 
    <D3WordCloud
      height={550}
      data={formattedTopics}
      font="Times"
      fontSize={fontSizeMapper}
      rotate={0}
      padding={10}
      fill={theme.theme == "dark" ? "white" : "black"}
      onWordClick={(e, d) => {
        router.push("/quiz?topic=" + d.text);
      }}
    />
);
};

export default CustomWordCloud;
