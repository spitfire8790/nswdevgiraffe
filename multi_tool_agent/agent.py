import os
from google.adk.agents import Agent
from google.cloud import discoveryengine_v1alpha as discoveryengine

def search_planning_docs(query: str) -> dict:
    """Searches the planning regulations document store for relevant information.

    Args:
        query (str): The question or topic to search for in the planning documents.

    Returns:
        dict: status and result (summary of findings) or error message.
    """
    # --- Configuration ---
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable not set.")

    # Ensure this location matches your data store (e.g., "global", "us", "eu")
    location = "global"
    data_store_id = "nsw-planning-docs-connector_1744561035005_gcs_store"
    # This is typically "default_config" unless you've created a custom one
    serving_config_id = "default_config"
    # ---------------------

    client = discoveryengine.SearchServiceClient()

    serving_config = client.serving_config_path(
        project=project_id,
        location=location,
        data_store=data_store_id,
        serving_config=serving_config_id,
    )

    # Configure search request (ask for summary)
    request = discoveryengine.SearchRequest(
        serving_config=serving_config,
        query=query,
        page_size=3, # Limit results
        content_search_spec=discoveryengine.SearchRequest.ContentSearchSpec(
            summary_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec(
                summary_result_count=3, # Number of results to summarize
                include_citations=False, # Citations might add noise for direct answers
                ignore_adversarial_query=True,
                ignore_non_summary_seeking_query=True,
            )
        ),
        query_expansion_spec=discoveryengine.SearchRequest.QueryExpansionSpec(
            condition=discoveryengine.SearchRequest.QueryExpansionSpec.Condition.AUTO,
        ),
        spell_correction_spec=discoveryengine.SearchRequest.SpellCorrectionSpec(
            mode=discoveryengine.SearchRequest.SpellCorrectionSpec.Mode.AUTO,
        ),
    )

    try:
        response = client.search(request=request)
        summary = response.summary.summary_text if response.summary else "No summary could be generated for this query."

        # Basic check if summary seems valid
        if not summary.strip() or "unable to" in summary.lower():
             summary = "Could not find a direct answer in the documents. Please try rephrasing your query."


        return {
            "status": "success",
            "report": summary
        }
    except Exception as e:
        print(f"Error during Vertex AI Search: {e}") # Log error for debugging
        return {
            "status": "error",
            "error_message": f"Sorry, I encountered an error searching the planning documents.",
        }


root_agent = Agent(
    name="planning_docs_agent",
    model="gemini-2.0-flash",
    description=(
        "Agent that answers questions about planning regulations by searching uploaded documents."
    ),
    instruction=(
        "You are an assistant specialized in NSW planning regulations. "
        "Use the 'search_planning_docs' tool to answer user questions about regulations, policies, or requirements found in the provided documents. "
        "Politely decline requests outside of this scope."
    ),
    tools=[search_planning_docs],
)