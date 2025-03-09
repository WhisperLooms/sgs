export interface HeadmasterPersona {
  id: string;
  name: string;
  tenure: string;
  personality: string[];
  speakingStyle: string[];
  characterInfluences: string[];
}

export interface ConversationContext {
  historicalFacts: string[];
  relevantEvents: string[];
  timeSpecificKnowledge: string[];
}

export interface ConversationMemory {
  shortTerm: string[];
  longTerm: string[];
  facts: string[];
}
