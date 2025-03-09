import { NextApiRequest, NextApiResponse } from 'next';
import { HeadmasterConversationChain } from '../../lib/langchain/chains/headmasterChain';
import { HistoricalFactChecker } from '../../lib/langchain/tools/factChecker';
import { PeriodContextValidator } from '../../lib/langchain/tools/periodValidator';
import { SourceCitationGenerator } from '../../lib/langchain/tools/citationGenerator';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, headmasterId, conversationHistory = [] } = req.body;

    if (!message || !headmasterId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get headmaster info
    const { data: headmaster, error: headmasterError } = await supabase
      .from('headmaster_personas')
      .select('*')
      .eq('id', headmasterId)
      .single();

    if (headmasterError) {
      throw new Error(`Error fetching headmaster: ${headmasterError.message}`);
    }

    // Initialize LangChain components
    const conversationChain = new HeadmasterConversationChain(headmaster);
    const factChecker = new HistoricalFactChecker();
    const periodValidator = new PeriodContextValidator(headmaster.tenure);
    const citationGenerator = new SourceCitationGenerator();

    // Generate response
    const response = await conversationChain.call(message);

    // Validate response
    const [factCheck, periodValidation, citation] = await Promise.all([
      factChecker.call(response),
      periodValidator.call(response),
      citationGenerator.call(response)
    ]);

    // Log the interaction
    await supabase.from('interaction_history').insert({
      headmaster_id: headmasterId,
      user_query: message,
      assistant_response: response,
      fact_check: factCheck,
      period_validation: periodValidation,
      citation: citation,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ reply: response });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ error: error.message });
  }
}
