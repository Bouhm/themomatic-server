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
      "You are a web design expert and front-end expert. You will create a website theme based on the given concept. The website has background for the page, a container div with some content, heading text, a primary and secondary button, and an input field. Provide 6 color codes: site background color, container background color, heading text color, other text color, primary action button color, secondary action button color. You can retrieve an image for the website background that fits the given concept using the provided tools. Provide CSS for the following: Background, Container, Primary Button, Secondary Button, Input. Use camel-case keys like React style objects instead of hyphens, use double quotes instead of single quotes to ensure they are valid JSON of the style only (no keys for which the styles are for, only the style including the starting and ending in curly brackets), and do not use CSS pseudo-classes like :hover or :focus. Your CSS should be bloated; flex your CSS skills and blow people away with your CSS skill and design ability while still keeping tasteful and not random. Make sure every element at least has a background color and text color but do not set any position, size, padding, margin, text alignment, or z-index. Be creative with unique borders, color combinations, text effects, shadows, gradients, and other visual effects! Also provide a Google font name appropriate for the theme for the primary (header) text and secondary one for all other text (only the font names, not the full font family notation). Make sure any text colors have enough contrast against their respective backgrounds."
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

  // Use smaller llm to handle formatting output
  const formatterLlm = chatService.GetOpenAIChat("gpt-3.5-turbo");
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. You will parse the input into the specified JSON format. Styles should be valid stringified JSON. Trim unecessary spaces and newlines.",
    },
    {
      role: "user",
      content: res.output
    }
  ];

  const llmWithStructuredOutput = formatterLlm.withStructuredOutput!(outputSchema);
  return llmWithStructuredOutput.invoke(messages)
}