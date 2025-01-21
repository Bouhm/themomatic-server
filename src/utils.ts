export function fixJsonString(jsonStr: string): string {
  console.log("JSON STR", jsonStr)

  // Find the first opening curly brace
  const firstCurlyBracketIndex = jsonStr.indexOf('{');

  // Extract substring from the first curly bracket onwards
  const correctedJson = jsonStr.substring(firstCurlyBracketIndex);

  // Try to parse the resulting string to ensure it's valid JSON
  try {
    JSON.parse(correctedJson);
    return correctedJson;
  } catch (error) {
    throw new Error("Invalid JSON output.");
  }
}