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

[Rest of the content...]