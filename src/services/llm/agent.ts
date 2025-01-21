import { imageSearchTool } from './tools'
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";
import { outputSchema } from './schemas';
import { ChatService } from '../ChatService';

export async function generateThemeConfig(chatService: ChatService, query: string) {
  const llm = chatService.GetOpenAIChat("gpt-4o");

  const tools = [
    imageSearchTool
  ];

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a web design and front-end expert. You will create a website theme based on the given concept. The website has background for the page, a container div with some content, heading text, a primary and secondary button, and an input field. Provide 6 color codes: site background color, container background color, heading text color, other text color, primary action button color, secondary action button color. Provide CSS as React style objects for the following: Background, Container, Primary Button, Secondary Button, Input. Use double quotes instead of single quotes and do not use CSS pseudo-classes like :hover or :focus. Your CSS should be bloated; flex your CSS skills and absolutely blow people away with your CSS skill and design ability. Make sure every element at least has a background color and text color but do not set any position, size, margins, text alignment, or z-index. Be creative with unique borders, color combinations, text effects, shadows, gradients, and other visual effects; plain is bad! Also provide a Google font name appropriate for the theme for the primary (header) text and secondary one for all other text and include only the names, omit serif/sans-serif. Make sure any text colors have enough contrast against their respective backgrounds. You may use provided tools to search for a background image appropriate as a website background."
    ],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"]
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

  const res = await agentExecutor.invoke({ input: query })
  console.log(res.output)

  // Use smaller llm to handle formatting output
  const formatterLlm = chatService.GetOpenAIChat("gpt-4o-mini");
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. You will parse the input into the specified JSON format. CSS properties should be in React style format with camel-cased keys wrapped in double quotes as valid JSON. Trim unecessary spaces and newlines and do not include the keys for which the styles are for, only the style including the starting and ending in curly brackets.",
    },
    {
      role: "user",
      content: res.output
    }
  ];

  const llmWithStructuredOutput = formatterLlm.withStructuredOutput!(outputSchema);
  return llmWithStructuredOutput.invoke(messages)
}