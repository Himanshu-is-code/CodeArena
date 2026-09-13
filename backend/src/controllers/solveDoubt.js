const { GoogleGenAI } = require("@google/genai");

const solveDoubt = async (req, res) => {
  try {
    const { messages, title, description, testCases, startCode } = req.body;
    const apiKey = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "Gemini API key is not configured" });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format messages for Gemini API
    let formattedContents = (Array.isArray(messages) ? messages : [])
      .filter(m => m.parts && m.parts[0]?.text)
      .map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.parts[0].text }]
      }));

    // Ensure conversation starts with a 'user' turn
    while (formattedContents.length > 0 && formattedContents[0].role === 'model') {
      formattedContents.shift();
    }

    if (formattedContents.length === 0) {
      formattedContents = [{ role: 'user', parts: [{ text: 'Hello, please introduce yourself as a DSA tutor for this problem.' }] }];
    }

    const testCasesStr = typeof testCases === 'object' ? JSON.stringify(testCases, null, 2) : (testCases || '');
    const startCodeStr = typeof startCode === 'object' ? JSON.stringify(startCode, null, 2) : (startCode || '');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: `
You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.

## CURRENT PROBLEM CONTEXT:
[PROBLEM_TITLE]: ${title || 'N/A'}
[PROBLEM_DESCRIPTION]: ${description || 'N/A'}
[EXAMPLES]: ${testCasesStr}
[START_CODE]: ${startCodeStr}

## YOUR CAPABILITIES:
1. **Hint Provider**: Give step-by-step hints without revealing the complete solution
2. **Code Reviewer**: Debug and fix code submissions with explanations
3. **Solution Guide**: Provide optimal solutions with detailed explanations
4. **Complexity Analyzer**: Explain time and space complexity trade-offs
5. **Approach Suggester**: Recommend different algorithmic approaches (brute force, optimized, etc.)
6. **Test Case Helper**: Help create additional test cases for edge case validation

## INTERACTION GUIDELINES:
- When user asks for HINTS: break down the problem into smaller sub-problems and provide intuition without giving away the full code.
- When user submits CODE for review: point out bugs and explain how to fix them.
- Format code with markdown syntax highlighting.
- Keep explanations clear and focused on the current problem.
`
      }
    });

    return res.status(200).json({
      message: response.text
    });

  } catch (err) {
    console.error("Error in solveDoubt:", err);
    return res.status(500).json({
      message: err.message || "Failed to generate AI response"
    });
  }
};

module.exports = solveDoubt;

