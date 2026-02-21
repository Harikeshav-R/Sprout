import asyncio
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure the backend directory is in the python path
# Add '../' relative to this file to get to 'backend' root where 'src' is located
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.append(backend_root)

from src.agents.discovery import discovery_agent
from src.schemas.agent_discovery import DiscoveryState, DiscoverySearchCriteria

async def main():
    print("Starting Discovery Agent Example...")
    
    # Define search criteria (e.g., small town in CA known for agriculture)
    # Sebastopol, CA - 95472
    zip_code = "95472"
    state = "CA"
    
    print(f"Searching for farms in {zip_code}, {state}...")
    
    # Initialize state
    initial_input = {
        "search_criteria": DiscoverySearchCriteria(zip_code=zip_code, state=state)
    }
    
    try:
        # Run the agent
        # Note: The compiled graph returns a dict matching the state schema, 
        # even if the input was a Pydantic model for some fields.
        final_state = await discovery_agent.ainvoke(initial_input)
        
        # Output results
        print("\n--- Discovery Complete ---")
        
        # Handle dict output from compiled graph
        raw_leads = final_state.get("raw_leads", [])
        enriched_leads = final_state.get("enriched_leads", [])
        audited_leads = final_state.get("audited_leads", [])
        
        print(f"Raw Leads Found: {len(raw_leads)}")
        print(f"Enriched Leads: {len(enriched_leads)}")
        print(f"Audited Leads: {len(audited_leads)}")
        
        print("\n--- Audited Leads Details ---")
        for lead in audited_leads:
            # Check if lead is a dict or object (graph output is usually dicts matching schema)
            lead_data = lead.model_dump() if hasattr(lead, "model_dump") else lead
            
            name = lead_data.get("farm_name")
            score = lead_data.get("digital_health_score")
            url = lead_data.get("website_url")
            notes = lead_data.get("audit_notes")
            
            print(f"Farm: {name}")
            print(f"  URL: {url}")
            print(f"  Score: {score}")
            print(f"  Notes: {notes}")
            print("-" * 30)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
