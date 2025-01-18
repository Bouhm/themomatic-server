import { imageSearchTool } from './tools'
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";
import { outputSchema } from './schemas';
import { ChatService } from '../ChatService';

export async function generateThemeConfig(chatService: ChatService, query: string) {
  const llm = chatService.GetOpenAIChat();

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
      "You are a front-end CSS expert. Provide 6 color codes: site background color, container background color, heading text color, other text color, primary action button color, secondary action button color. Also provide css style for the site background (optional background image), css style for the container, css style for buttons, and css style for input fields. Be creative with stylizing elements appropriate for the theme. Also provide a font appropriate for the theme. Make sure any text colors have enough contrast against their resspective backgrounds."
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

  const res = await agentExecutor.invoke({ input: query });
  console.log(res.output)

  // Use smaller llm to handle formatting output
  const formatterLlm = chatService.GetOpenAIChat("gpt-3.5-turbo");
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

  const llmWithStructuredOutput = formatterLlm.withStructuredOutput!(outputSchema);
  return llmWithStructuredOutput.invoke(messages)
}