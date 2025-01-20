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
      "You are a web design and front-end expert. You will create a website theme based on the given concept. Provide 6 color codes: site background color, container background color, heading text color, other text color, primary action button color, secondary action button color. Also provide inline React CSS styles for the site background (optional background image), the container, buttons, and input fields. Each of the CSS will be applied to the respective React components in the style prop directly as JSON. Also provide a CSS font appropriate for the theme. Be creative with stylizing elements appropriate for the theme. Make sure any text colors have enough contrast against their respective backgrounds. You may use provided tools to search for a background image url if you think it'll benefit the website to include one."
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

  const res = await agentExecutor.invoke({ input: query });
  console.log(res.output)

  // Use smaller llm to handle formatting output
  const formatterLlm = chatService.GetOpenAIChat("gpt-3.5-turbo");
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful assistant. You will parse the input into the specified JSON format. You will also convert any CSS strings into React style objects, ex. background-color: --> backgroundColor:",
    },
    {
      role: "user",
      content: res.output
    }
  ];

  const llmWithStructuredOutput = formatterLlm.withStructuredOutput!(outputSchema);
  return llmWithStructuredOutput.invoke(messages)
}