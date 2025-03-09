import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { PromptTemplate } from 'langchain/prompts';
import { HeadmasterPersona } from '../types';
import { VectorStoreRetrieverMemory } from 'langchain/memory';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class HeadmasterConversationChain {
  private chain: ConversationChain;
  private persona: HeadmasterPersona;
  private vectorStoreMemory: VectorStoreRetrieverMemory;

  constructor(persona: HeadmasterPersona) {
    this.persona = persona;
    this.vectorStoreMemory = this.setupVectorStoreMemory();
    this.chain = this.setupChain();
  }

  private setupVectorStoreMemory() {
    const embeddings = new OpenAIEmbeddings();
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    return new VectorStoreRetrieverMemory({
      vectorStoreRetriever: vectorStore.asRetriever(),
      memoryKey: 'historical_context',
      inputKey: 'input',
    });
  }

  private setupChain() {
    const template = `You are ${this.persona.name} (${this.persona.tenure}), a historical headmaster of Sydney Grammar School.

Characteristics:
${this.persona.personality.join(', ')}

Speaking style:
${this.persona.speakingStyle.join(', ')}

You MUST ALWAYS STAY IN CHARACTER and respond as if you are speaking directly to the user.
Use language and knowledge appropriate to your time period (${this.persona.tenure}).

Historical context from the archives:
{historical_context}

Current conversation:
{history}
Human: {input}
Assistant:`;

    const prompt = PromptTemplate.fromTemplate(template);

    const chatModel = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 300,
    });

    return new ConversationChain({
      llm: chatModel,
      memory: new BufferMemory({
        returnMessages: true,
        memoryKey: 'history',
        inputKey: 'input',
        outputKey: 'response',
      }),
      prompt,
      verbose: true,
    });
  }

  async call(input: string) {
    // First, get relevant historical context
    const historicalContext = await this.vectorStoreMemory.loadMemoryVariables({
      input,
    });

    // Then, generate response using the conversation chain
    const response = await this.chain.call({
      input,
      historical_context: historicalContext.historical_context || '',
    });

    return response.response;
  }
}
