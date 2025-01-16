import { imageSearchTool } from './tools'
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";
import { outputSchema } from './schemas';

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY
});

const tools = [
  imageSearchTool
];

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a web design expert. You will get a relevant image URL for a given theme or concept to be used as the website background. Only use the tools you have been provided with."
  ],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
  [
    "system",
    "You are a front-end CSS expert. You will provide color codes, custom css styles for the website background, a container div, buttons, input fields, stylized borders, and a font for the theme. Make sure any text colors have enough contrast against their respesctive backgrounds."
  ]
]);

const agent = createToolCallingAgent({
  llm,
  tools,
  prompt
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

export async function generateThemeConfig(query: string) {
  const res = await agentExecutor.invoke({ input: query });

  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. You will parse the input into the specified JSON format.",
    },
    {
      role: "user",
      content: res.output
    }
  ];

  const llmWithStructuredOutput = llm.withStructuredOutput(outputSchema);
  return llmWithStructuredOutput.invoke(messages)
}