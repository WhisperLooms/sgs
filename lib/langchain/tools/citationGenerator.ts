import { Tool } from 'langchain/tools';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export class SourceCitationGenerator extends Tool {
  name = 'source_citation_generator';
  description = 'Generates citations for historical information';
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
      const results = await this.vectorStore.similaritySearch(input, 1);
      
      if (results.length === 0) {
        return 'No source found for citation.';
      }

      const source = results[0];
      return `Source: ${source.metadata.title || 'Historical Archives'}, ${source.metadata.date || 'Date unknown'}`;
    } catch (error) {
      return `Error generating citation: ${error.message}`;
    }
  }
}
