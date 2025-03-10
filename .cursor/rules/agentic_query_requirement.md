# Agentic Query Priority System

## Overview
The HeadmasterChat implementation uses a multi-tiered priority system for handling queries, ensuring historically accurate and contextually appropriate responses.

## Priority Levels

### 1. Headmaster Personas (Highest Priority)
```python
def _query_headmaster_data(self, query: str):
    """Query headmaster data with tenure as highest priority."""
    # Priority 1a: Tenure Information
    if any(word in query.lower() for word in ['year', 'serve', 'tenure', 'long']):
        if any(word in query.lower() for word in ['you', 'your']):
            return f"I served exactly {self.headmaster_data['tenure_years']} years..."
    
    # Priority 1b: Other Persona Information
    return {
        'name': self.headmaster_data['name'],
        'school': self.headmaster_data['school'],
        'philosophy': self.headmaster_data['educational_philosophy'],
        'achievements': self.headmaster_data['notable_achievements']
    }
```

### 2. Historical Context Vectors (Second Priority)
```python
def _query_historical_context(self, query: str) -> List[str]:
    """Query historical context using vector similarity search."""
    try:
        embedding = self.embedding_model.embed_query(query)
        result = self.supabase.rpc(
            'match_historical_context',
            {
                'query_embedding': embedding,
                'match_threshold': 0.8,
                'match_count': 5,
                'headmaster_id': self.headmaster_data['id'],
                'time_end': self.headmaster_data['tenure_end']
            }
        ).execute()
        return [item['content'] for item in result.data] if result.data else []
    except Exception as e:
        logger.error(f"Error querying historical context: {str(e)}")
        return []
```

### 3. General Embeddings (Third Priority)
```python
def _query_all_embeddings(self, query: str) -> List[str]:
    """Query general embeddings for additional context."""
    try:
        embedding = self.embedding_model.embed_query(query)
        result = self.supabase.rpc(
            'match_all_embeddings',
            {
                'query_embedding': embedding,
                'match_threshold': 0.8,
                'match_count': 3,
                'time_end': self.headmaster_data['tenure_end']
            }
        ).execute()
        return [item['content'] for item in result.data] if result.data else []
    except Exception as e:
        logger.error(f"Error querying all embeddings: {str(e)}")
        return []
```

### 4. LLM-Generated Responses (Base Priority)
```python
def generate_response(self, query: str, context: List[str]):
    messages = [
        self.system_message,
        SystemMessage(content=f"Historical Context:\n{' '.join(context)}"),
    ] + self.memory
    return self.llm.invoke(messages)
```

[Rest of the content...]