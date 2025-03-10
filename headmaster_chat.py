from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
from typing import List, Dict, Any
from supabase import create_client

[Rest of the content...]