/**
 * Ollama LLM Configuration
 * 
 * Primary: DeepSeek-R1 8B - Best for reasoning, explaining bugs, debugging
 * Fallback: Llama 3.1 8B - Fast, general text generation
 */

module.exports = {
  // Ollama server settings
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
  
  // Model configuration
  models: {
    // Primary model - DeepSeek-R1 for reasoning tasks
    primary: 'deepseek-r1:8b',
    // Fallback model - Llama for simple text generation
    fallback: 'llama3.1:8b',
  },
  
  // Use DeepSeek-R1 as default
  model: 'deepseek-r1:8b',
  
  // Model selection by task type
  modelForTask: {
    // Reasoning tasks - use DeepSeek-R1 (explains WHY code breaks)
    debugging: 'deepseek-r1:8b',
    codeAnalysis: 'deepseek-r1:8b',
    problemSolving: 'deepseek-r1:8b',
    rootCauseAnalysis: 'deepseek-r1:8b',
    testValidation: 'deepseek-r1:8b',
    exploratoryTesting: 'deepseek-r1:8b',
    securityAnalysis: 'deepseek-r1:8b',
    accessibilityAnalysis: 'deepseek-r1:8b',
    
    // Simple text generation - use Llama 3.1 (faster)
    generateTestData: 'llama3.1:8b',
    simpleText: 'llama3.1:8b',
    summarization: 'llama3.1:8b',
    dataGeneration: 'llama3.1:8b',
  },
  
  // Generation parameters for DeepSeek-R1 (reasoning focused)
  deepseekOptions: {
    temperature: 0.6,   // Lower for more focused reasoning
    top_p: 0.9,
    top_k: 40,
    num_predict: 4096,  // More tokens for detailed explanations
    stop: ['</response>', '---END---', '</think>'],
  },
  
  // Generation parameters for Llama 3.1 (quick generation)
  llamaOptions: {
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    num_predict: 2048,
    stop: ['</response>', '---END---'],
  },
  
  // Default options (uses DeepSeek settings)
  options: {
    temperature: 0.6,
    top_p: 0.9,
    top_k: 40,
    num_predict: 4096,
    stop: ['</response>', '---END---', '</think>'],
  },
  
  // Task-specific prompts
  prompts: {
    // DeepSeek-R1 prompts (reasoning focused)
    debugCode: `You are an expert debugger. Analyze the following code/error and explain:
1. WHAT is happening (the symptom)
2. WHY it's happening (the root cause)
3. HOW to fix it (the solution)
Be thorough in your reasoning.`,

    analyzeFailure: `You are a senior QA engineer analyzing a test failure.
Provide a detailed explanation of:
1. What the test was checking
2. Why it failed
3. Potential root causes (ranked by likelihood)
4. Suggested fixes
Think step by step.`,

    validateResponse: `You are a QA engineer validating API responses.
Check if the response matches expected behavior and identify any issues.
Explain your reasoning for each validation point.
Consider edge cases and error handling.`,
    
    analyzeUI: `You are a UI/UX analyst reviewing a web application.
Identify issues and provide detailed reasoning for each:
1. Visual consistency issues
2. Accessibility problems
3. UX improvements
4. Potential bugs
Explain WHY each issue matters.`,

    securityAudit: `You are a security expert performing an audit.
For each potential vulnerability found, explain:
1. What the vulnerability is
2. How it could be exploited
3. The potential impact
4. How to remediate it`,
    
    exploratoryTest: `You are performing intelligent exploratory testing.
Based on the current state, suggest the next action to test.
Explain your reasoning for why this action might reveal bugs.
Focus on edge cases and unexpected user behavior.`,

    // Llama 3.1 prompts (simple generation)
    generateTestData: `You are a test data generator.
Generate realistic, diverse test data for the given context.
Output in JSON format only, no explanations.`,
    
    simulateUser: `You are simulating a real user.
Provide realistic, contextual responses.
Vary your response quality to test different scenarios.`,
    
    summarize: `Provide a brief summary of the following.
Be concise and focus on key points.`,
  },
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,
  },
  
  // Timeout settings (ms)
  timeout: {
    generate: 120000,  // 2 minutes for DeepSeek (reasoning takes time)
    connect: 5000,
  },
};
