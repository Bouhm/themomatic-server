import { OpenAI, OpenAIChatCallOptions } from "@langchain/openai";
import { generateThemeConfig } from "./llm/agent"
import { setupTools } from "./llm/tools";

export class ChatService {
  public ChatGpt: OpenAI<OpenAIChatCallOptions>;

  constructor(env: CloudflareBindings) {
    this.ChatGpt = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    setupTools(env);
  }

  public GetOpenAIChat(model = "gpt-4o-mini", temperature = 0): OpenAI<OpenAIChatCallOptions> {
    this.ChatGpt.model = model;
    this.ChatGpt.temperature = temperature;

    return this.ChatGpt;
  }

  public async CallChatGpt(query: string) {
    return await generateThemeConfig(this, query);
  }
}