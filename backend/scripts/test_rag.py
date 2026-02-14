import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.services.ai import groq_service

async def test_rag():
    print("Testing RAG Chat...")
    
    context = "BuildBidz recently won the 'Best Construction Tech 2026' award in Bangalore. The admin is BuildBidz Admin."
    query = "Who is the admin of BuildBidz and what award did they win?"
    
    try:
        response = await groq_service.rag_chat(
            query=query,
            context=context,
            temperature=0.0 # Low temperature for consistency
        )
        
        content = response.choices[0].message.content
        print(f"\nQuery: {query}")
        print(f"Context: {context}")
        print(f"\nResponse:\n{content}")
        
        # Simple validation
        if "BuildBidz Admin" in content and "Best Construction Tech 2026" in content:
            print("\nSUCCESS: AI used the provided context.")
        else:
            print("\nFAILURE: AI might not have used the provided context effectively.")
            
        print("\nTesting 'Out of Context' query...")
        query_off = "What is the capital of France?"
        response_off = await groq_service.rag_chat(
            query=query_off,
            context=context,
            temperature=0.0
        )
        content_off = response_off.choices[0].message.content
        print(f"\nQuery: {query_off}")
        print(f"Response:\n{content_off}")
        
    except Exception as e:
        print(f"Error during testing: {e}")

if __name__ == "__main__":
    asyncio.run(test_rag())
