import { z } from "zod";

const paletteSchema = z.object({
  "primary": z.string().describe("The color hexcode for the website background"),
  "secondary": z.string().describe("The color hexcode for a container element background"),
  "primaryText": z.string().describe("The color hexcode for heading text"),
  "secondaryText": z.string().describe("The color hexcode for text"),
  "primaryAction": z.string().describe("The baccolor hexcode for the main action button background"),
  "secondaryAction": z.string().describe("The color hexcode for secondary action button background"),
})

const customStylesSchema = z.object({
  "primaryFont": z.string().describe("The font family to use for the theme"),
  "secondaryFont": z.string().describe("The secondary font family to use for the theme"),
  "background": z.string().describe("The css style to apply to the website background including any images"),
  "container": z.string().describe("The css style to apply to the container element"),
  "primaryButton": z.string().describe("The css style to apply to the button"),
  "secondaryButton": z.string().describe("The css style to apply to the button"),
  "input": z.string().describe("The css style to apply to the input fields")
})

export const outputSchema = z.object({
  "title": z.string().describe("The title for the theme"),
  "description": z.string().describe("A short description for the theme and design choices made for the theme"),
  "palette": paletteSchema,
  "customStyles": customStylesSchema
});