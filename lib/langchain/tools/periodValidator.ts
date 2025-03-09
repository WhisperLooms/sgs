import { Tool } from 'langchain/tools';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { PromptTemplate } from 'langchain/prompts';

export class PeriodContextValidator extends Tool {
  name = 'period_context_validator';
  description = 'Validates if content is appropriate for a specific historical period';
  private model: ChatOpenAI;
  private period: string;

  constructor(period: string) {
    super();
    this.period = period;
    this.model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.2,
    });
  }

  async _call(input: string): Promise<string> {
    const template = `As a historical accuracy validator for ${this.period}, analyze the following content:

{input}

Consider:
1. Language and vocabulary appropriate for the period
2. Historical accuracy of references
3. Cultural context and social norms
4. Technology and knowledge available at the time

Provide a validation report with any anachronisms or inconsistencies found.`;

    const prompt = PromptTemplate.fromTemplate(template);
    const formattedPrompt = await prompt.format({ input });

    try {
      const response = await this.model.predict(formattedPrompt);
      return response;
    } catch (error) {
      return `Error validating period context: ${error.message}`;
    }
  }
}
