import { z } from "zod";

const paletteSchema = z.object({
  "primaryColor": z.string().describe("The color hexcode for the website background"),
  "secondaryColor": z.string().describe("The color hexcode for a container element background"),
  "primaryTextColor": z.string().describe("The color hexcode for heading text"),
  "secondaryTextColor": z.string().describe("The color hexcode for text"),
  "primaryActionColor": z.string().describe("The baccolor hexcode for the main action button background"),
  "secondaryActionColor": z.string().describe("The color hexcode for secondary action button background"),
})

const customStylesSchema = z.object({
  "font": z.string().describe("The font family to use for the theme"),
  "backgroundStyle": z.record(z.string(), z.string()).describe("The css style to apply to the website background including any images"),
  "containerStyle": z.record(z.string(), z.string()).describe("The css style to apply to the container element"),
  "buttonStyle": z.record(z.string(), z.string()).describe("The css style to apply to the buttons"),
  "inputStyle": z.record(z.string(), z.string()).describe("The css style to apply to the input fields")
})

export const outputSchema = z.object({
  "title": z.string().describe("The title for the theme"),
  "description": z.string().describe("A short description for the theme and design choices made for the theme"),
  "palette": paletteSchema,
  "customStyles": customStylesSchema
});