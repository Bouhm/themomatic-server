import { ChatOpenAI, OpenAIChatCallOptions } from "@langchain/openai";
import { generateThemeConfig } from "./llm/agent"
import { setupTools } from "./llm/tools";

export class ChatService {
  public ChatGpt: ChatOpenAI<OpenAIChatCallOptions>;

  constructor(env: CloudflareBindings) {
    this.ChatGpt = new ChatOpenAI({ apiKey: env.OPENAI_API_KEY, model: "gpt-4o-mini" });
    setupTools(env);
  }

  public GetOpenAIChat(model = "gpt-4o-mini", temperature = 0.2): ChatOpenAI<OpenAIChatCallOptions> {
    this.ChatGpt.model = model;
    this.ChatGpt.temperature = temperature;

    return this.ChatGpt;
  }

  public async CallChatGpt(query: string) {
    return await generateThemeConfig(this, query);
  }
}