import asyncio
import os
import json
from src.schemas.agent_builder import BuilderState
from src.agents.builder import builder_agent

async def main():
    print("Initializing Builder Agent Evaluation...")
    
    # Sample real-world prompt
    initial_state = {
        "farm_id": "eval-farm-123",
        "farm_name": "Oak Creek Heritage Farm",
        "farm_story": "We are a fourth-generation family farm located in the Ozarks. We believe in sustainable agriculture and raising animals the way nature intended. We don't use pesticides, and our livestock are strictly pasture-raised.",
        "inventory_data": "1. Pasture-raised Heritage Pork (Bacon, Chops, Sausage)\n2. Free-range Chicken Eggs\n3. Seasonal Heirloom Tomatoes & Squash\n4. Raw Wildflower Honey",
        "brand_persona": None,
        "suggested_domains": [],
        "website_layouts": []
    }
    
    print("\n[Input Data]")
    print(f"Farm Name: {initial_state['farm_name']}")
    print(f"Story: {initial_state['farm_story']}")
    print(f"Inventory: {initial_state['inventory_data']}")
    print("\n--- Running LangGraph Pipeline (This may take 10-20 seconds) ---\n")
    
    try:
        # Run agent
        result = await builder_agent.ainvoke(initial_state)
        
        # 1. Evaluate Brand Persona
        persona = result.get("brand_persona")
        print("\n=== EVALUATION: Brand Persona ===")
        if persona:
            print(json.dumps(persona.model_dump(), indent=2))
        else:
            print("FAILED: No persona generated.")
            
        # 2. Evaluate Domain Suggestions
        domains = result.get("suggested_domains", [])
        print("\n=== EVALUATION: Suggested Domains ===")
        if domains:
            for d in domains:
                print(f" - {d}")
        else:
            print("FAILED: No domains suggested.")
            
        # 3. Evaluate Website Layout
        layouts = result.get("website_layouts", [])
        print("\n=== EVALUATION: Website Layout ===")
        if layouts and len(layouts) > 0:
            layout_code = layouts[0]
            print(f"SUCCESS: Generated React Component ({len(layout_code)} characters).")
            
            # Save the layout to a file for the user to inspect
            output_file = "generated_farm_website.tsx"
            with open(output_file, "w") as f:
                f.write(layout_code)
            print(f"\n[!] The generated React SPA has been saved to: backend/{output_file}")
            print("You can open this file to review the Tailwind CSS and React code produced by the LLM.")
            
        else:
            print("FAILED: No website layout generated.")
            
    except Exception as e:
        print(f"\n[ERROR] Pipeline failed during execution: {e}")

if __name__ == "__main__":
    asyncio.run(main())
