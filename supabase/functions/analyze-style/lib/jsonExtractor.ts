
export function extractJsonFromResponse(text: string): any {
  // First try to parse the entire response as JSON
  try {
    return JSON.parse(text);
  } catch (firstError) {
    console.log('Not valid JSON, attempting to extract JSON portion');
    
    try {
      // Look for JSON object in the text (between curly braces)
      const jsonRegex = /{[\s\S]*}/;
      const match = text.match(jsonRegex);
      
      if (match && match[0]) {
        return JSON.parse(match[0]);
      }
      
      throw new Error('Could not extract valid JSON');
    } catch (error) {
      console.error('Error parsing response:', error);
      throw error;
    }
  }
}
