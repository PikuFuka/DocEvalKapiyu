# api/services/extraction_strategies.py
import time
from datetime import time as datetime
import re
import random
import uuid
from .opti import _generate_name_variants, _find_section_blocks, _find_name_near_role, _extract_academic_year, _extract_project_level
import json
import logging
from groq import Groq
from django.conf import settings

logger = logging.getLogger(__name__)

def extract_kra1a_evaluation(raw_text, debug_dump=False, faculty_name=None):
    print(f"EXTRACTOR: extract_kra1a_evaluation called (via Groq).")
    
    prompt = """
    Analyze the provided Faculty Evaluation document.
    Extract the following fields:
    1. "equivalent_percentage": The final equivalent percentage score (e.g., "95.5%", "98%"). Look for "Equivalent Percentage", "Total Score", or the main percentage rating.
    2. "semester_ay": The semester and academic year (e.g., "1st Semester A.Y. 2023-2024", "2nd Semester 2022-2023").
    3. "evaluation_type": Determine if it is "Student's Evaluation" or "Supervisor's Evaluation" based on the title or context.

    Output JSON:
    {
        "equivalent_percentage": "95.5%",
        "semester_ay": "1st Semester A.Y. 2023-2024",
        "evaluation_type": "Student's Evaluation"
    }
    """
    
    data = query_llm_for_json(prompt, raw_text)
    
    if not data:
        print("Groq failed for KRA 1A. Returning empty list.")
        return []

    equivalent_percentage = data.get("equivalent_percentage")
    semester_ay = data.get("semester_ay")
    evaluation_type = data.get("evaluation_type")
    
    total_score = None
    if equivalent_percentage:
        try:
            clean_pct = equivalent_percentage.replace("%", "").strip()
            total_score = float(clean_pct)
        except Exception:
            total_score = None

    return [{
        "evidence_type": "kra1a_evaluation",
        "equivalent_percentage": equivalent_percentage,
        "semester_ay": semester_ay,
        "evaluation_type": evaluation_type,
        "percentages": [equivalent_percentage] if equivalent_percentage else [],
        "raw_text_preview": raw_text[:500] + "..." if len(raw_text) > 500 else raw_text,
        "total_score": total_score,
    }]

def extract_kra1c_adviser(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra1c_adviser called for faculty: {faculty_name} (via Groq)")
    
    prompt = f"""
    Analyze the document to determine if "{faculty_name}" served as an ADVISER (Thesis Adviser, Capstone Adviser, etc.).
    
    Extract:
    1. "is_adviser": boolean (True if the faculty is listed as an adviser).
    2. "academic_year": The academic year (e.g., "2023-2024").
    3. "level": Determine the level of the project based on the degree/program mentioned.
       STRICT RULES:
       - If "Bachelor of Science in Information Technology" (BSIT) -> Return "SP" (Special/Capstone Project).
       - If "Bachelor of Science in Computer Science" (BSCS) -> Return "UT" (Undergraduate Thesis).
       - If "Master" or "MA" or "MS" -> Return "MT" (Master's Thesis).
       - If "Doctor" or "PhD" -> Return "DD" (Doctoral Dissertation).
       - Otherwise, default to "UT".

    Output JSON:
    {{
        "is_adviser": true,
        "academic_year": "2023-2024",
        "level": "UT"
    }}
    """

    data = query_llm_for_json(prompt, text)
    
    if not data or not data.get("is_adviser"):
        print(f"Groq did not find adviser role for {faculty_name}.")
        return []

    academic_year = data.get("academic_year", "N/A")
    level = data.get("level", "UT") # Default to UT if missing
    
    # Validate level code
    valid_levels = ["SP", "CP", "UT", "MT", "DD"]
    if level not in valid_levels:
        level = "UT" # Fallback

    from .scoring_rules import SCORING_RULES
    base_points_dict = SCORING_RULES.get("kra1c_adviser", {})
    base_value = base_points_dict.get(level, 0)
    item_count = 1
    total_score = base_value * item_count

    return [{
        "type": "adviser",
        "academic_year": academic_year,
        "level": level,
        "count": item_count,
        "total_score": total_score,
        "title": f"Adviser Service ({level}) {academic_year}",
        "contribution_percent": 100,
        "matched_name": faculty_name,
        "context_found_in": "Extracted via LLM"
    }]


def extract_kra1c_panel(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra1c_panel called for faculty: {faculty_name} (via Groq)")
    
    prompt = f"""
    Analyze the document to determine if "{faculty_name}" served as a PANEL MEMBER, EXAMINER, or COMMITTEE MEMBER.
    
    Extract:
    1. "is_panel": boolean (True if the faculty is listed as a panel member/examiner).
    2. "academic_year": The academic year (e.g., "2023-2024").
    3. "level": Determine the level of the project based on the degree/program mentioned.
       STRICT RULES:
       - If "Bachelor of Science in Information Technology" (BSIT) -> Return "SP" (Special/Capstone Project).
       - If "Bachelor of Science in Computer Science" (BSCS) -> Return "UT" (Undergraduate Thesis).
       - If "Master" or "MA" or "MS" -> Return "MT" (Master's Thesis).
       - If "Doctor" or "PhD" -> Return "DD" (Doctoral Dissertation).
       - Otherwise, default to "UT".

    Output JSON:
    {{
        "is_panel": true,
        "academic_year": "2023-2024",
        "level": "UT"
    }}
    """

    data = query_llm_for_json(prompt, text)
    
    if not data or not data.get("is_panel"):
        print(f"Groq did not find panel role for {faculty_name}.")
        return []

    academic_year = data.get("academic_year", "N/A")
    level = data.get("level", "UT")
    
    valid_levels = ["SP", "CP", "UT", "MT", "DD"]
    if level not in valid_levels:
        level = "UT"

    from .scoring_rules import SCORING_RULES
    base_points_dict = SCORING_RULES.get("kra1c_panel", {})
    base_value = base_points_dict.get(level, 0)
    item_count = 1
    total_score = base_value * item_count

    return [{
        "type": "panel",
        "academic_year": academic_year,
        "level": level, 
        "count": item_count,
        "total_score": total_score,
        "title": f"Panel Member Service ({level}) {academic_year}",
        "contribution_percent": 100,
        "matched_name": faculty_name,
        "context_found_in": "Extracted via LLM"
    }]

def extract_kra1b_sole(text, faculty_name=None):
    print("INFO: Placeholder for KRA 1B Sole extraction.")
    return [{"type": "textbook", "title": "Placeholder Title", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra1b_co(text, faculty_name=None):
    print("INFO: Placeholder for KRA 1B Co extraction.")
    return [{"type": "textbook", "title": "Placeholder Title", "contribution_percent": 50, "calculated_score": 0}]

def extract_kra1b_program_leadAndContri(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra1b_program_leadAndContri called for {faculty_name} (via Groq).")
    
    prompt = f"""
    Analyze the Board Resolution or Program Proposal.
    Target Faculty: "{faculty_name}"
    
    Extract:
    1. "program_name": The name of the program (e.g., "BS Computer Science").
    2. "program_type": "New Program" or "Revised Program".
    3. "board_resolution": The Board Resolution number (e.g., "Resolution No. 123 s. 2023").
    4. "academic_year": The academic year (e.g., "2023-2024").
    5. "role": Determine the role of "{faculty_name}". Return "Lead" if they are the Head, Chair, Lead Proponent, or Principal Author. Return "Contributor" if they are a member or contributor.

    Output JSON:
    {{
        "program_name": "BS Computer Science",
        "program_type": "Revised Program",
        "board_resolution": "Resolution No. 123 s. 2023",
        "academic_year": "2023-2024",
        "role": "Lead"
    }}
    """

    data = query_llm_for_json(prompt, text)
    
    if not data:
        print("Groq failed for KRA 1B Program. Returning empty list.")
        return []

    # Normalize Academic Year to YYYY-YYYY format
    raw_ay = data.get("academic_year", "2019-2020")
    academic_year = "2019-2020" # Default
    
    try:
        # Find all 4-digit years
        years = re.findall(r'\d{4}', str(raw_ay))
        if len(years) >= 2:
            # Take the first two found years (e.g., 2023 and 2024 from "2023-2024")
            academic_year = f"{years[0]}-{years[1]}"
        elif len(years) == 1:
            # If only one year found (e.g., "2023"), assume next year is +1
            y1 = int(years[0])
            academic_year = f"{y1}-{y1+1}"
    except Exception as e:
        print(f"Error normalizing AY: {e}")
        academic_year = "2019-2020"

    return [{
        "program_name": data.get("program_name", "Unknown Program").upper(),
        "program_type": data.get("program_type", "Revised Program"),
        "board_resolution": data.get("board_resolution", "Pending"),
        "academic_year": academic_year,
        "role": data.get("role", "Contributor") 
    }]

# =========================================================
# KRA 2A: RESEARCH OUTPUTS (Sole & Co-Author)
# =========================================================

def query_llm_for_json(prompt, text):
    """
    Sends text to Groq (Llama 3) with built-in Rate Limit protection.
    """
    if not hasattr(settings, 'GROQ_API_KEY') or not settings.GROQ_API_KEY:
        logger.error("GROQ_API_KEY is missing.")
        return None

    time.sleep(3) 

    client = Groq(api_key=settings.GROQ_API_KEY)
    
    safe_text = text[:20000] 
    
    system_prompt = """
    You are a strict data extraction API. 
    Output ONLY valid JSON. 
    Do not add Markdown formatting (like ```json).
    """

    # 2. RETRY LOOP
    max_retries = 3
    for attempt in range(max_retries):
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{prompt}\n\nDOCUMENT TEXT:\n{safe_text}"}
                ],
                # Use Llama 3.1 8B Instant (Fastest, Lowest Cost)
                model="meta-llama/llama-4-scout-17b-16e-instruct", 
                
                # CRITICAL: JSON Mode
                response_format={"type": "json_object"}, 
                temperature=0.1, 
            )

            response_content = chat_completion.choices[0].message.content
            return json.loads(response_content)

        except Exception as e:
            error_str = str(e).lower()
            
            # If Rate Limit (429), wait and retry
            if "429" in error_str or "rate limit" in error_str:
                wait_time = (attempt + 1) * 10 + random.uniform(1, 3) # Wait 10s, 20s, 30s
                print(f"WARNING: Groq Rate Limit Hit. Cooling down for {wait_time:.1f}s...")
                time.sleep(wait_time)
            elif "401" in error_str or "invalid api key" in error_str:
                print(f"CRITICAL ERROR: Invalid Groq API Key. Please check your .env file.")
                return None
            else:
                logger.error(f"Groq Error: {e}")
                return None # Fatal error, stop trying

    return None

def extract_kra2a_sole(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra2a_sole called (via Groq).")
    return _extract_research_llm(text, faculty_name, expected_mode="sole")

def extract_kra2a_co(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra2a_co called (via Groq).")
    return _extract_research_llm(text, faculty_name, expected_mode="co")

def _extract_research_llm(text, faculty_name, expected_mode="sole"):
    """
    Unified extraction prompt.
    """
    
    prompt = f"""
    Analyze the provided academic document.
    Target Faculty Member: "{faculty_name}"

    Step 1: Locate the list of authors.
    Step 2: Check if "{faculty_name}" is the SOLE author or a CO-AUTHOR.
    Step 3: Extract the specific contribution percentage if available.

    Rules for 'contribution':
    - If "{faculty_name}" is the ONLY author: Set contribution = 100.
    - If multiple authors: Look for "{faculty_name} ... 40%" or "Contribution: 30%".
    - If multiple authors but NO percentage: Set 0.
    - extract date in MM/DD/YYYY format if possible.
    - if 2 authors and no percentage, set 50.
    - Do not hallucinate data. If unsure, use ' '.

    Extract into JSON:
    {{
        "title": "Full title",
        "journal": "Journal Name (or ' ')",
        "reviewer": "Name of Reviewer (ONLY if type is 'Other Peer-Reviewed Output', else ' ')",
        "date_published": "Date in MM/DD/YYYY format",
        "indexing": "Scopus, etc. (or ' ')",
        "contribution": Integer (0-100)
    }}
    """

    data = query_llm_for_json(prompt, text)
    print(f"DEBUG: Groq returned data: {data}")
    
    # Fallback if Groq fails
    if not data:
        print("Groq failed (Max Retries). Returning defaults.")
        return [{
            "title": "Extraction Failed", 
            "journal": "N/A", 
            "reviewer": "N/A",
            "date_published": "N/A", 
            "contribution": 0
        }]

    return [{
        "title": data.get("title", "Untitled").upper(),
        "journal": data.get("journal", "N/A"),
        "reviewer": data.get("reviewer", "N/A"),
        "indexing": data.get("indexing", "N/A"),
        "date_published": data.get("date_published", "N/A"),
        "contribution": int(data.get("contribution", 0))
    }]

def extract_kra2a_research_to_project_lead(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2A Research-to-Project Lead extraction.")
    return [{"type": "research_to_project", "role": "lead", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2a_research_to_project_contributor(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2A Research-to-Project Contributor extraction.")
    return [{"type": "research_to_project", "role": "contributor", "contribution_percent": 50, "calculated_score": 0}]

def extract_kra2a_citation_local(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2A Local Citation extraction.")
    return [{"type": "citation", "scope": "local", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2a_citation_international(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2A International Citation extraction.")
    return [{"type": "citation", "scope": "international", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_invention(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B Invention extraction.")
    return [{"type": "invention", "subtype": "patent", "stage": "grant", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_utility(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B Utility Model extraction.")
    return [{"type": "invention", "subtype": "utility_model", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_industrial(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B Industrial Design extraction.")
    return [{"type": "invention", "subtype": "industrial_design", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_commercialized(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B Commercialized extraction.")
    return [{"type": "commercialized", "scope": "local", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_new_software(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B New Software extraction.")
    return [{"type": "software", "subtype": "new", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_updated_software(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B Updated Software extraction.")
    return [{"type": "software", "subtype": "updated", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_biological_sole(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B Biological Sole extraction.")
    return [{"type": "biological", "role": "sole", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_biological_co(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B Biological Co extraction.")
    return [{"type": "biological", "role": "co", "contribution_percent": 50, "calculated_score": 0}]

def extract_kra2c_performing_art(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2C Performing Art extraction.")
    return [{"type": "performing_art", "subtype": "own", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2c_exhibition(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2C Exhibition extraction.")
    return [{"type": "exhibition", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2c_juried_design(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2C Juried Design extraction.")
    return [{"type": "juried_design", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2c_literary(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2C Literary extraction.")
    return [{"type": "literary", "subtype": "novel", "contribution_percent": 100, "calculated_score": 0}]


EXTRACTORS = {
    "kra1a_evaluation": extract_kra1a_evaluation,
    "kra1b_sole": extract_kra1b_sole,
    "kra1b_co": extract_kra1b_co,
    "kra1b_program_leadAndContri": extract_kra1b_program_leadAndContri,
    "kra1c_adviser": extract_kra1c_adviser,
    "kra1c_panel": extract_kra1c_panel,
    "kra2a_sole": extract_kra2a_sole,
    "kra2a_research": extract_kra2a_co,
    "kra2a_research_to_project_lead": extract_kra2a_research_to_project_lead,
    "kra2a_research_to_project_contributor": extract_kra2a_research_to_project_contributor,
    "kra2a_citation_local": extract_kra2a_citation_local,
    "kra2a_citation_international": extract_kra2a_citation_international,
    "kra2b_invention": extract_kra2b_invention,
    "kra2b_utility": extract_kra2b_utility,
    "kra2b_industrial": extract_kra2b_industrial,
    "kra2b_commercialized": extract_kra2b_commercialized,
    "kra2b_new_software": extract_kra2b_new_software,
    "kra2b_updated_software": extract_kra2b_updated_software,
    "kra2b_biological_sole": extract_kra2b_biological_sole,
    "kra2b_biological_co": extract_kra2b_biological_co,
    "kra2c_performing_art": extract_kra2c_performing_art,
    "kra2c_exhibition": extract_kra2c_exhibition,
    "kra2c_juried_design": extract_kra2c_juried_design,
    "kra2c_literary": extract_kra2c_literary,
}

def route_extraction(evidence_type, raw_text, faculty_name=None):
    func = EXTRACTORS.get(evidence_type)
    if not func:
        print(f"Warning: No extractor found for evidence_type '{evidence_type}'. Returning empty list.")
        return []
    try:
        result = func(raw_text, faculty_name=faculty_name)
        if isinstance(result, list):
            return result
        else:
            print(f"Warning: Extractor for '{evidence_type}' did not return a list. Returning empty list.")
            return []
    except Exception as e:
        print(f"Error in extractor '{evidence_type}': {e}")
        return []
