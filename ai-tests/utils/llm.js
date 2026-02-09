/**
 * LLM Interaction Utilities
 * 
 * Uses DeepSeek-R1 8B for reasoning/debugging tasks
 * Uses Llama 3.1 8B for simple text generation
 */

const { Ollama } = require('ollama');
const config = require('../config/ollama.config');

class LLMClient {
  constructor() {
    this.client = new Ollama({ host: config.host });
    this.primaryModel = config.models.primary;   // DeepSeek-R1
    this.fallbackModel = config.models.fallback;  // Llama 3.1
  }

  /**
   * Select the best model for a task type
   */
  getModelForTask(taskType) {
    return config.modelForTask[taskType] || this.primaryModel;
  }

  /**
   * Get options for a specific model
   */
  getOptionsForModel(model) {
    if (model.includes('deepseek')) {
      return config.deepseekOptions;
    }
    return config.llamaOptions;
  }

  /**
   * Generate a response using the appropriate model
   */
  async generate(prompt, options = {}) {
    const model = options.model || this.primaryModel;
    const modelOptions = { ...this.getOptionsForModel(model), ...options };
    
    for (let attempt = 1; attempt <= config.retry.attempts; attempt++) {
      try {
        console.log(`  🤖 Using ${model}...`);
        
        const response = await this.client.generate({
          model,
          prompt,
          options: modelOptions,
        });
        
        // DeepSeek-R1 may include <think> tags, extract the actual response
        let result = response.response;
        if (result.includes('</think>')) {
          const parts = result.split('</think>');
          result = parts[parts.length - 1].trim();
        }
        
        return result;
      } catch (error) {
        console.error(`  Attempt ${attempt} failed:`, error.message);
        
        // Try fallback model on last attempt
        if (attempt === config.retry.attempts && model !== this.fallbackModel) {
          console.log(`  Falling back to ${this.fallbackModel}...`);
          return this.generate(prompt, { ...options, model: this.fallbackModel });
        }
        
        if (attempt < config.retry.attempts) {
          await this.sleep(config.retry.delay);
        }
      }
    }
    throw new Error('All generation attempts failed');
  }

  /**
   * Chat with the model (conversational)
   */
  async chat(messages, options = {}) {
    const model = options.model || this.primaryModel;
    const modelOptions = { ...this.getOptionsForModel(model), ...options };
    
    const response = await this.client.chat({
      model,
      messages,
      options: modelOptions,
    });
    
    return response.message.content;
  }

  /**
   * Debug code/error using DeepSeek-R1 (reasoning model)
   */
  async debugCode(code, error, context = '') {
    const prompt = `${config.prompts.debugCode}

Context: ${context}

Code:
\`\`\`
${code}
\`\`\`

Error:
${error}

Provide a detailed analysis:`;

    return await this.generate(prompt, { 
      model: this.getModelForTask('debugging') 
    });
  }

  /**
   * Analyze test failure using DeepSeek-R1
   */
  async analyzeTestFailure(testName, expected, actual, context = '') {
    const prompt = `${config.prompts.analyzeFailure}

Test: ${testName}
${context ? `Context: ${context}` : ''}

Expected:
${JSON.stringify(expected, null, 2)}

Actual:
${JSON.stringify(actual, null, 2)}

Analysis:`;

    return await this.generate(prompt, { 
      model: this.getModelForTask('rootCauseAnalysis') 
    });
  }

  /**
   * Generate test data using Llama 3.1 (fast, simple generation)
   */
  async generateTestData(context, schema) {
    const prompt = `${config.prompts.generateTestData}

Context: ${context}

Required JSON schema:
${JSON.stringify(schema, null, 2)}

Generate valid JSON data:`;

    const response = await this.generate(prompt, { 
      model: this.getModelForTask('generateTestData') 
    });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/) || response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('  Failed to parse generated JSON:', error.message);
      return null;
    }
  }

  /**
   * Analyze UI screenshot using DeepSeek-R1
   */
  async analyzeUI(screenshotBase64, context = '') {
    const prompt = `${config.prompts.analyzeUI}

Page context: ${context}

Analyze the UI and provide detailed reasoning for each issue found:`;

    return await this.generate(prompt, { 
      model: this.getModelForTask('codeAnalysis') 
    });
  }

  /**
   * Validate API response using DeepSeek-R1
   */
  async validateResponse(endpoint, expectedBehavior, actualResponse) {
    const prompt = `${config.prompts.validateResponse}

Endpoint: ${endpoint}
Expected behavior: ${expectedBehavior}

Actual response:
${JSON.stringify(actualResponse, null, 2)}

Validation result (JSON):
{
  "isValid": boolean,
  "issues": ["list of issues with reasoning"],
  "suggestions": ["list of suggestions"],
  "rootCause": "if invalid, explain why"
}`;

    const response = await this.generate(prompt, { 
      model: this.getModelForTask('testValidation') 
    });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { isValid: true, issues: [], suggestions: [] };
    } catch {
      return { isValid: true, issues: [], suggestions: [] };
    }
  }

  /**
   * Simulate user interview response using Llama 3.1
   */
  async simulateInterviewee(question, context) {
    const prompt = `${config.prompts.simulateUser}

Interview context:
- Role: ${context.role || 'Software Engineer'}
- Experience: ${context.experience || 'Mid-level'}
- Interview type: ${context.type || 'Technical'}

Interviewer asks: "${question}"

Provide a realistic response (1-3 paragraphs):`;

    return await this.generate(prompt, { 
      model: this.getModelForTask('simpleText') 
    });
  }

  /**
   * Security analysis using DeepSeek-R1
   */
  async analyzeSecurityVulnerability(vulnerability, context) {
    const prompt = `${config.prompts.securityAudit}

Vulnerability detected: ${vulnerability}
Context: ${context}

Provide detailed security analysis:`;

    return await this.generate(prompt, { 
      model: this.getModelForTask('securityAnalysis') 
    });
  }

  /**
   * Get next exploratory test action using DeepSeek-R1
   */
  async getExploratoryAction(currentState, previousActions = []) {
    const prompt = `${config.prompts.exploratoryTest}

Current page state:
${JSON.stringify(currentState, null, 2)}

Previous actions taken:
${previousActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Suggest the next test action (JSON):
{
  "action": "click|type|navigate|scroll|wait",
  "target": "selector or URL",
  "value": "optional value for type action",
  "reason": "detailed reasoning for why this action might find bugs"
}`;

    const response = await this.generate(prompt, { 
      model: this.getModelForTask('exploratoryTesting') 
    });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { LLMClient };
