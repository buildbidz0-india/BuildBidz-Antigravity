import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class AgentLog(Base):
    """
    Records every interaction with the AI agents.
    """
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=True) # To group chats if needed
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    agent_name = Column(String, index=True) # e.g., "Groq-Llama3", "AwardEngine"
    role = Column(String) # "user", "assistant", "system"
    content = Column(Text)
    metadata_json = Column(JSON, nullable=True) # For tokens, model details, etc.

class AwardDecision(Base):
    """
    Records the final decisions made by the Award Engine.
    """
    __tablename__ = "award_decisions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    project_id = Column(String, index=True, nullable=True) # If we have project IDs
    winner_bid_id = Column(String)
    winner_supplier = Column(String)
    score = Column(Float)
    justification = Column(Text) # The AI's verbal reasoning
    rankings_json = Column(JSON) # Full breakdown of all bids
