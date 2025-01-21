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
      "You are a web design and front-end expert. You will create a website theme based on the given concept. The website has background for the page, a container div with some content, heading text, a primary and secondary button, and an input field. Provide 6 color codes: site background color, container background color, heading text color, other text color, primary action button color, secondary action button color. Provide CSS as React style objects for the following: Background, Container, Primary Button, Secondary Button, Input. Use double quotes instead of single quotes and do not use CSS pseudo-classes like :hover. Do not be reserved, your CSS should be bloated to flex your CSS skills and absolutely blow people away with your skill and creativity. Make sure every element at least has a background color and text color but do not set any position, size, or alignment. Be creative with unique borders, color combinations, visual effects. Also provide a Google font appropriate for the theme for the header text and a secondary Google font used for all other text. Make sure any text colors have enough contrast against their respective backgrounds. You may use provided tools to search for a background image appropriate as a website background."
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
  const formatterLlm = chatService.GetOpenAIChat("gpt-3.5-turbo");
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. You will parse the input into the specified JSON format. CSS should be React style objects as valid JSON with camel-cased keys wrapped in double quotes. Trim any spaces and newlines. Only include the CSS style object, omit keys to the element the style is for. The style objects should be able to be directly parsed into React style objects.",
    },
    {
      role: "user",
      content: res.output
    }
  ];

  const llmWithStructuredOutput = formatterLlm.withStructuredOutput!(outputSchema);
  return llmWithStructuredOutput.invoke(messages)
}