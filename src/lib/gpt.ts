import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type OutputFormat = Record<string, string | string[] | OutputFormat>;

function buildFormatPrompt(outputFormat: OutputFormat, isListInput: boolean) {
  const hasDynamicElements = /<.*?>/.test(JSON.stringify(outputFormat));
  const hasListOutput = /\[.*?\]/.test(JSON.stringify(outputFormat));

  let prompt = `You must return valid JSON matching this format: ${JSON.stringify(outputFormat)}.`;
  prompt += ` Do not include markdown fences. Return raw JSON only.`;

  if (hasListOutput) {
    prompt += ` If a field is a list of choices, choose the best matching value.`;
  }

  if (hasDynamicElements) {
    prompt += ` Any text inside < > means you must generate that content dynamically.`;
  }

  if (isListInput) {
    prompt += ` Return an array of JSON objects, one for each input item.`;
  }

  return prompt;
}

export async function strict_output(
  systemPrompt: string,
  userPrompt: string | string[],
  outputFormat: OutputFormat,
  defaultCategory = "",
  outputValueOnly = false,
  model = "gpt-4.1-mini",
  temperature = 0.7,
  numTries = 3,
  verbose = false
) {
  const isListInput = Array.isArray(userPrompt);
  let lastError = "";

  for (let attempt = 0; attempt < numTries; attempt++) {
    try {
      const formatPrompt = buildFormatPrompt(outputFormat, isListInput);

      const response = await openai.chat.completions.create({
        model,
        temperature,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n${formatPrompt}\n${lastError}`,
          },
          {
            role: "user",
            content: isListInput ? userPrompt.join("\n") : userPrompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content returned by OpenAI.");
      }

      if (verbose) {
        console.log("OpenAI response:", content);
      }

      let parsed = JSON.parse(content);

      if (!isListInput) {
        parsed = [parsed];
      }

      if (!Array.isArray(parsed)) {
        throw new Error("Expected an array output.");
      }

      for (const item of parsed) {
        for (const key in outputFormat) {
          if (/<.*?>/.test(key)) continue;

          if (!(key in item)) {
            throw new Error(`Missing key: ${key}`);
          }

          if (Array.isArray(outputFormat[key])) {
            const choices = outputFormat[key] as string[];

            if (Array.isArray(item[key])) {
              item[key] = item[key][0];
            }

            if (typeof item[key] === "string" && item[key].includes(":")) {
              item[key] = item[key].split(":")[0];
            }

            if (!choices.includes(item[key]) && defaultCategory) {
              item[key] = defaultCategory;
            }
          }
        }
      }

      if (outputValueOnly) {
        const simplified = parsed.map((item) => {
          const values = Object.values(item);
          return values.length === 1 ? values[0] : values;
        });

        return isListInput ? simplified : simplified[0];
      }

      return isListInput ? parsed : parsed[0];
    } catch (error) {
      lastError = `Previous error: ${
        error instanceof Error ? error.message : "Unknown error"
      }. Please correct the output format.`;

      if (attempt === numTries - 1) {
        console.error("strict_output failed:", error);
        return [];
      }
    }
  }

  return [];
}