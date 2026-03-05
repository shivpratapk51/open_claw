import { json, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { execSync } from "node:child_process";
import Groq from "groq-sdk";
import "dotenv/config";

const key = process.env.GROQ_API_KEY;
console.log(key);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// TOOlS
function executeCommand(cmd = "") {
  const result = execSync(cmd);
  return result.toString();
}

const functionMapping = {
  executeCommand,
};

const outputSchema = z.object({
  type: z.enum(["tool_call", "text"]).describe("What kind of response this is"),
  finalOutput: z
    .boolean()
    .describe("If this is the last of chat")
    .default(false),
  text_content: z
    .string()
    .optional()
    .nullable()
    .describe("text content if type is text"),
  tool_call: z
    .object({
      tool_name: z.string().describe("name of the tool"),
      params: z.array(z.string()),
    })
    .optional()
    .nullable()
    .describe("the params to call the tool if type is tool_call"),
});

const SYSTEM_PROMPT = `
You are an expert AI Assitant that is expert in controlling the user's machine. Operating system of user is Windows.
Analyise the user's query carefully and plan the steps on what needs to be done.
Based on usery query you can create commands and then call the tool to run that command and execute on the user's machine.

Available Tools:
    - executeCommand(command: string): Output from the command.

    You can use executeCommand tool to execute any command on user's machine.
`;

const messages = [{ role: "system", content: SYSTEM_PROMPT }];

export async function run(query = "") {
  messages.push({
    role: "user",
    content: query,
  });
  while (true) {
    const response = await groq.chat.completions.create({
      model: process.env.MODEL,
      messages: messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "OpenClaw_Output_Schema",
          schema: z.toJSONSchema(outputSchema),
        },
      },
    });

    const rawResult = JSON.parse(response.choices[0].message.content || "{}");

    const result = outputSchema.parse(rawResult);
    console.log(result);

    messages.push({
      role: "assistant",
      content: JSON.stringify(result),
    });
    switch (result.type) {
      case "tool_call": {
        if (result.tool_call) {
          const { params, tool_name } = result.tool_call;
          console.log(`Tool Call: ${tool_name}:${params}`);
          if (functionMapping[tool_name]) {
            try {
              const toolOutput = functionMapping[tool_name](...params);
              console.log(`Tool Output (${tool_name}): `, toolOutput);
              messages.push({
                role: "developer",
                content: JSON.stringify({
                  tool_name,
                  params,
                  tool_output: toolOutput,
                }),
              });
            } catch (error) {
              messages.push({
                role: "developer",
                content: JSON.stringify({
                  tool_name,
                  params,
                  error: JSON.stringify(error),
                }),
              });
            }
          }
        }
        break;
      }
      case "text": {
        {
          console.log(`Text:`, result.text_content);
        }
        break;
      }
    }
    if (result && result.finalOutput) {
      return messages;
    }
  }
}

// console.log(executeCommand("dir"));
