
export function extractJsonFromResponse(text: string): any {
  console.log('Extracting JSON from text:', text);
  
  try {
    // First, try to parse the entire response as JSON
    return JSON.parse(text);
  } catch (firstError) {
    console.log('Full text is not valid JSON, attempting to extract JSON portion:', firstError);
    
    try {
      // Look for JSON-like structure in the text (between curly braces)
      const jsonRegex = /{[\s\S]*}/;
      const match = text.match(jsonRegex);
      
      if (match && match[0]) {
        try {
          return JSON.parse(match[0]);
        } catch (e2) {
          console.log('Extracted portion is not valid JSON:', e2);
        }
      }
      
      // If we can't find valid JSON but there are code blocks, try to extract from them
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
      const codeBlockMatch = text.match(codeBlockRegex);
      
      if (codeBlockMatch && codeBlockMatch[1]) {
        try {
          return JSON.parse(codeBlockMatch[1]);
        } catch (e3) {
          console.log('Code block is not valid JSON:', e3);
        }
      }
      
      // Look for anything that might be JSON
      const possibleJsons = text.split('\n\n');
      for (const block of possibleJsons) {
        if (block.trim().startsWith('{') && block.trim().endsWith('}')) {
          try {
            return JSON.parse(block.trim());
          } catch (e4) {
            console.log('Potential JSON block is not valid:', e4);
          }
        }
      }
      
      console.log('Could not extract valid JSON, throwing error');
      throw new Error('Response is not in JSON format');
    } catch (error) {
      console.error('Error parsing response:', error);
      throw error;
    }
  }
}
