import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';

export function GetOpenAIChat(model = "gpt-4o-mini", temperature = 0): ChatOpenAI<ChatOpenAICallOptions> {
  return new ChatOpenAI({
    model,
    temperature,
    apiKey: c.env.OPENAI_API_KEY
  });
} 
