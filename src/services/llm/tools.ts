// tools/googleWebSearchTool.ts
import { google } from "googleapis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const googleSearch = google.customsearch("v1");

export function setupTools(env: CloudflareBindings) {
  googleSearch.context._options = {
    auth: env.GOOGLE_API_KEY
  };
}

export const imageSearchTool = tool(
  async (query): Promise<string> => {
    try {
      // Initialize the client for custom search
      const response = await googleSearch.cse.list({
        q: query,
        cx: "f4fe6b5f5907f43b1",
        searchType: "image"
      });

      const items = response.data.items ?? [];
      if (items.length === 0) {
        return `No images found for query: "${query}".`;
      }

      // For simplicity, just return the first result's link
      const firstImage = items[0];
      return firstImage.link ?? "No link property found in the first image result.";
    } catch (error: any) {
      console.error("GoogleWebSearchTool Error:", error);
      return `Error occurred during web search: ${error.message ?? error}`;
    }
  },
  {
    name: "google_image_search",
    description: "Perform a google image search to retrieve an image link",
    schema: z.string().describe("The search query")
  }
);