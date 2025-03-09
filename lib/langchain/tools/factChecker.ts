import { Tool } from 'langchain/tools';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class HistoricalFactChecker extends Tool {
  name = 'historical_fact_checker';
  description = 'Checks historical facts against the SGS archives';
  vectorStore: SupabaseVectorStore;

  constructor() {
    super();
    const embeddings = new OpenAIEmbeddings();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    this.vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    });
  }

  async _call(input: string): Promise<string> {
    try {
      const results = await this.vectorStore.similaritySearch(input, 3);
      
      if (results.length === 0) {
        return 'No historical records found to verify this fact.';
      }

      const relevantFacts = results.map(doc => doc.pageContent).join('\n');
      return `Based on historical records:\n${relevantFacts}`;
    } catch (error) {
      return `Error checking historical facts: ${error.message}`;
    }
  }
}
