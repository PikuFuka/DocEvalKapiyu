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
                # Use Llama 3.3 70B Versatile (Reliable)
                model="llama-3.3-70b-versatile", 
                
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
    print(f"EXTRACTOR: extract_kra2a_citation_local called for {faculty_name} (via Groq).")
    return _extract_citations_llm(text, faculty_name, scope="local")

def extract_kra2a_citation_international(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra2a_citation_international called for {faculty_name} (via Groq).")
    return _extract_citations_llm(text, faculty_name, scope="international")

def _extract_citations_llm(text, faculty_name, scope="local"):
    print(f"DEBUG: Raw text for citation extraction (first 500 chars): {text[:500]}...")
    
    prompt = f"""
        Analyze the provided document text which lists citations for the faculty's research.
        Target Faculty: "{faculty_name}"
        Scope: {scope.upper()}

        Task:
        1. Identify the Main (Parent) Journal Articles: These are the primary works authored by the faculty. For exmaple. In this document, there are only 3 main articles:
        - "Pattern extraction of water quality prediction using machine learning algorithms of water reservoir"
        - "Technical Analysis of Twitter Data in Preparation of Prediction using Multilayer Perceptron Algorithm"
        - "Classification of Coffee Variety using Electronic Nose"

        2. Grouping & Counting:
        - For each Main Article, look at the rows following it under the column 'Article that cited the research of...'.
        - Count how many unique citing papers are listed for THAT specific main article. 
        - For "Pattern extraction...", it should total 15 citations.
        - For "Technical Analysis...", it should total 1 citation (item 16 in the list).
        - For "Classification of Coffee Variety...", it should total 2-3 citations (items 19-20).

        3. Data Extraction per Main Article:
        - "title": The title of the main faculty research paper.
        - "journal": The journal where the faculty paper was published.
        - "date_published": Date the faculty paper was published (e.g., 11/01/2019).
        - "citation_count": The TOTAL sum of citing papers grouped under this title.
        - "citation_index": Use "Scopus" as indicated in the faculty profile[cite: 6].
        - "citation_years": A unique list of all years found in the citing papers column for this specific article (e.g., [2021, 2022, 2023]).

        Output JSON:
        {{
            "articles": [
                {{
                    "title": "Pattern extraction of water quality prediction using machine learning algorithms of water reservoir",
                    "journal": "International Journal of Mechanical Engineering and Robotics Research",
                    "date_published": "11/01/2019",
                    "citation_count": 15,
                    "citation_index": "Scopus",
                    "citation_years": [2021, 2022, 2023]
                }},
                ...
            ]
        }}
        """

    data = query_llm_for_json(prompt, text)
    print(f"DEBUG: Groq returned data for citations: {data}")
    
    if not data or "articles" not in data:
        print(f"Groq failed for KRA 2A Citation ({scope}). Returning empty list.")
        return []

    results = []
    base_points = 5 if scope == "local" else 10

    for article in data.get("articles", []):
        citation_years = article.get("citation_years", [])
        year_range = "N/A"
        if citation_years:
            try:
                # Handle if citation_years is a string "2019-2022" instead of list
                if isinstance(citation_years, str):
                     # Try to parse range
                     years = re.findall(r'\d{4}', citation_years)
                     years = [int(y) for y in years]
                else:
                     # Filter out non-integers just in case
                     years = [int(y) for y in citation_years if str(y).isdigit()]
                
                if years:
                    if len(years) == 1:
                        year_range = str(years[0])
                    else:
                        year_range = f"{min(years)}-{max(years)}"
            except Exception as e:
                print(f"Error processing citation years: {e}")
                year_range = str(citation_years)

        count = int(article.get("citation_count", 0))
        
        results.append({
            "type": "citation",
            "scope": scope,
            "title": article.get("title", "Untitled").upper(),
            "journal": article.get("journal", "N/A"),
            "date_published": article.get("date_published", "N/A"),
            "citation_count": count,
            "citation_index": article.get("citation_index", "N/A"),
            "citation_years": year_range,
            "calculated_score": count * base_points,
            "contribution_percent": 100 # Citations are usually counted fully per occurrence
        })

    return results

def extract_kra2b_invention(text, faculty_name=None):
    print("INFO: Placeholder for KRA 2B Invention extraction.")
    return [{"type": "invention", "subtype": "patent", "stage": "grant", "contribution_percent": 100, "calculated_score": 0}]

def extract_kra2b_utility(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra2b_utility called for {faculty_name}")
    return _extract_invention_llm(text, faculty_name, default_type="Utility Model")

def extract_kra2b_industrial(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra2b_industrial called for {faculty_name}")
    return _extract_invention_llm(text, faculty_name, default_type="Industrial Design")

def _extract_invention_llm(text, faculty_name, default_type="Utility Model"):
    print(f"DEBUG: Extracting Invention ({default_type}) for {faculty_name}...")
    
    prompt = f"""
    Analyze the provided Intellectual Property (IP) document.
    Target Faculty: "{faculty_name}"
    
    Task:
    1. Identify the "Name of Invention" (Title).
    2. Determine the "Type of Patent": Is it "Utility Model" or "Industrial Design"? 
       (If not explicitly stated, infer from context or use "{default_type}").
    3. Extract "Date of Application" (Filing Date). Format: MM/DD/YYYY.
    4. Extract "Date Granted" (Issue Date/Registration Date). Format: MM/DD/YYYY.
    5. Check for Authors/Inventors:
       - Is "{faculty_name}" the SOLE inventor?
       - If NO, extract their "contribution" percentage.
       - If multiple inventors are listed but no percentage is given, divide 100 by the number of inventors.
       - If "{faculty_name}" is not found, return 0 contribution.

    Output JSON:
    {{
        "invention_title": "Title of Invention",
        "patent_type": "Utility Model", 
        "date_application": "01/15/2023",
        "date_granted": "08/20/2023",
        "is_sole": true,
        "contribution": 100
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    print(f"DEBUG: Groq returned data for invention: {data}")
    
    if not data:
        return []

    return [{
        "type": "invention",
        "subtype": "utility_model" if "utility" in data.get("patent_type", "").lower() else "industrial_design",
        "title": data.get("invention_title", "Untitled Invention").upper(),
        "patent_type": data.get("patent_type", default_type),
        "date_application": data.get("date_application", "N/A"),
        "date_granted": data.get("date_granted", "N/A"),
        "is_sole": data.get("is_sole", False),
        "contribution_percent": float(data.get("contribution", 0)),
        "calculated_score": 0 # Calculated in processor
    }]

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

# =========================================================
# KRA 3: EXTENSION SERVICES
# =========================================================

def extract_kra3_judge(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra3_judge called for {faculty_name}")
    
    prompt = f"""
    Analyze the provided document.
    Target Faculty: "{faculty_name}"
    
    Task:
    1. Identify the "Title of the Event/Activity" where the faculty served as a judge/examiner.
    2. Identify the "Organizer" (Institution or Organization).
    3. Extract the "Date" of the event (MM/DD/YYYY).
    4. Determine the "Nature" of the event:
       - "Research Award" (if related to research competitions, thesis defense, etc.)
       - "Academic Competition" (if related to quiz bees, skills competitions, etc.)
       - Default to "Academic Competition" if unclear.
    5. Identify the "Venue" (e.g., "Online", "Manila", "Zoom", or specific location).

    Output JSON:
    {{
        "title": "9th ICT Research Congress",
        "organizer": "University of Makati",
        "date": "05/26/2022",
        "nature": "Research Award",
        "venue": "Online"
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    if not data: return []
    
    return [{
        "type": "judge",
        "title": data.get("title", "Untitled Event").upper(),
        "organizer": data.get("organizer", "N/A"),
        "date": data.get("date", "N/A"),
        "nature": data.get("nature", "Academic Competition"),
        "venue": data.get("venue", "N/A"),
        "calculated_score": 0 # Calculated in processor
    }]

def extract_kra3_consultant(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra3_consultant called for {faculty_name}")
    
    prompt = f"""
    Analyze the provided document.
    Target Faculty: "{faculty_name}"
    
    Task:
    1. Identify the "Title of the Project/Consultancy".
    2. Identify the "Organization" or Client.
    3. Extract "Start Date" and "End Date" (MM/DD/YYYY). If only one date is present, use it for both.
    4. Determine the "Scope":
       - "International" (if organization is outside the country or explicitly stated).
       - "Local" (default).
    5. Identify the "Role":
       - "Technical Evaluator"
       - "Consultant"
       - "Expert"
       - "Accreditor"

    Output JSON:
    {{
        "title": "3rd National Conference",
        "organization": "Occidental Mindoro State College",
        "start_date": "10/13/2022",
        "end_date": "10/13/2022",
        "scope": "Local",
        "role": "Technical Evaluator"
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    if not data: return []
    
    return [{
        "type": "consultant",
        "title": data.get("title", "Untitled Project").upper(),
        "organization": data.get("organization", "N/A"),
        "start_date": data.get("start_date", "N/A"),
        "end_date": data.get("end_date", "N/A"),
        "scope": data.get("scope", "Local"),
        "role": data.get("role", "Consultant"),
        "calculated_score": 0
    }]

def extract_kra3_community(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra3_community called for {faculty_name}")
    
    prompt = f"""
    Analyze the provided document.
    Target Faculty: "{faculty_name}"
    
    Task:
    1. Identify the "Title of Community Extension Activity".
    2. Identify the "Community" or Beneficiary Group (e.g., "Barangay 123", "BJMP").
    3. Extract the "Number of Beneficiaries" (Integer). Look for numbers associated with "participants", "attendees", or "beneficiaries". If not found, return 0.
    4. Determine the "Role" of the faculty:
       - "Head" (if Project Leader, Coordinator, Organizer).
       - "Participant" (if Member, Speaker, Facilitator, Volunteer).
    5. Extract the "Date" of the activity (MM/DD/YYYY).

    Output JSON:
    {{
        "title": "GAD and File Management Training",
        "community": "BJMP-CALABARZON",
        "beneficiaries": 240,
        "role": "Head",
        "date": "05/04/2023"
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    if not data: return []
    
    return [{
        "type": "community",
        "title": data.get("title", "Untitled Activity").upper(),
        "community": data.get("community", "N/A"),
        "beneficiaries": int(data.get("beneficiaries", 0)),
        "role": data.get("role", "Participant"),
        "date": data.get("date", "N/A"),
        "calculated_score": 0
    }]

# =========================================================
# KRA 3: MANAGEMENT OF RESOURCES
# =========================================================

def extract_kra3_client_satisfaction(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra3_client_satisfaction called for {faculty_name}")
    
    prompt = f"""
    Analyze the provided document (Client Satisfaction Survey, Feedback Report, or Summary of Ratings).
    Target Faculty: "{faculty_name}"
    
    Task:
    1. Extract the "Semester" (e.g., "1st Semester", "2nd Semester"). If not explicitly stated, infer from the date (Jan-May = 2nd, Aug-Dec = 1st).
    2. Extract the "Academic Year" (e.g., "2019-2020", "2020-2021", "2021-2022", "2022-2023").
    3. Extract the "Faculty Score" or "Rating". Look for values near "Percentage of Clientelle"".
       - The score is typically a number (95%).
       - If multiple scores are present, prefer the "Average" or "Final" score.

    Output JSON:
    {{
        "semester": "1st Semester",
        "academic_year": "2022-2023",
        "score": 95.67
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    if not data: return []
    
    return [{
        "type": "client_satisfaction",
        "semester": data.get("semester", "1st Semester"),
        "academic_year": data.get("academic_year", "2022-2023"),
        "score": float(data.get("score", 0.0)),
        "calculated_score": 0 # Not used for this type, raw score is sent
    }]

def extract_kra3_admin_designation(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra3_admin_designation called for {faculty_name}")
    
    prompt = f"""
    Analyze the provided document (Appointment Paper, Special Order, or Designation Letter).
    Target Faculty: "{faculty_name}"
    
    Task:
    1. Extract the "Designation" or "Administrative Position".
       - Look for titles like President or OIC President, Vice-President, Chancellor, Vice-Chancellor, Campus Director / Administrator / Head, Faculty Regent, Office Director, University/College Secretary, Project Head, Institution-level Committee Chair, Institution-level Committee Member, Dean, Associate Dean, College Secretary, Department Head, Program Chair/Project Head, Department-level Committee Chair, Department-level Committee Member.
    2. Extract the "Effectivity Period" (Start Date to End Date).
       - Format: "MM/DD/YYYY to MM/DD/YYYY".
       - If only one date is found (e.g., "Effective June 12, 2020")".
       - If a duration is given (e.g., "for School Year 2020-2021"), convert to dates if possible (e.g., "08/01/2020 to 07/31/2021").

    Output JSON:
    {{
        "designation": "Program Chair",
        "start_date": "06/12/2020",
        "end_date": "06/12/2023"
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    print(f"DEBUG: Groq returned data for admin designation: {data}")
    if not data: return []
    
    start = data.get("start_date", "N/A")
    end = data.get("end_date", "N/A")
    period = f"{start} to {end}"

    return [{
        "type": "admin_designation",
        "designation": data.get("designation", "Untitled Position").upper(),
        "period": period,
        "calculated_score": 0 # Calculated in processor
    }]

def extract_kra3_training(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra3_training called for {faculty_name}")
    
    prompt = f"""
    Analyze the provided document (Certificate of Participation, Training, or Resource Speaker).
    Target Faculty: "{faculty_name}"
    
    Task:
    Extract the following details about the training/seminar:
    1. "title": Title of the Training/Seminar.
    2. "type": Type of Participation (e.g., "Resource Person", "Participant", "Facilitator", "Moderator").
    3. "organizer": Name of the Organizer/Sponsor.
    4. "start_date": Start Date (MM/DD/YYYY).
    5. "end_date": End Date (MM/DD/YYYY).
    6. "scope": Scope of the event ("Local", "Regional", "National", "International").
    7. "hours": Total Number of Hours (e.g., 48, 8, 4). If not explicitly stated, estimate based on days (8 hours/day).

    Output JSON:
    {{
        "title": "Research Mentoring",
        "type": "Resource Person",
        "organizer": "LSPU-SCC-RDO",
        "start_date": "04/03/2022",
        "end_date": "07/29/2022",
        "scope": "Local",
        "hours": 48.0
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    if not data: return []
    
    return [{
        "type": "kra3_training",
        "title": data.get("title", "Untitled Training"),
        "participation_type": data.get("type", "Participant"),
        "organizer": data.get("organizer", "Unknown"),
        "start_date": data.get("start_date", "N/A"),
        "end_date": data.get("end_date", "N/A"),
        "scope": data.get("scope", "Local"),
        "hours": float(data.get("hours", 0))
    }]

def extract_kra4_participation(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra4_participation called for {faculty_name} (via Groq).")
    
    prompt = f"""
    Analyze the Certificate of Participation/Attendance.
    Target Faculty: "{faculty_name}"
    
    Extract:
    1. "name_of_conference": The name of the conference, training, or seminar.
    2. "scope": "Local", "National", or "International".
    3. "organizer": The name of the organizer or institution.
    4. "date_of_activity": The date or date range (e.g., "03/16/2022-03/17/2022").
    
    Output JSON:
    {{
        "name_of_conference": "Project MAPPABLE Training",
        "scope": "Local",
        "organizer": "DOST/UPLB",
        "date_of_activity": "03/16/2022-03/17/2022"
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    
    if not data:
        return []

    scope = data.get("scope", "Local")
    
    from .scoring_rules import SCORING_RULES
    base_points_dict = SCORING_RULES.get("kra4_participation", {})
    score = base_points_dict.get(scope, 1.0)

    return [{
        "name_of_conference": data.get("name_of_conference", "Unknown Training"),
        "scope": scope,
        "organizer": data.get("organizer", "Unknown Organizer"),
        "date_of_activity": data.get("date_of_activity", "N/A"),
        "score": score
    }]

def extract_kra4_paper_presentation(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra4_paper_presentation called for {faculty_name} (via Groq).")
    
    prompt = f"""
    Analyze the Certificate of Paper Presentation.
    Target Faculty: "{faculty_name}"
    
    Extract:
    1. "title_of_paper": The title of the research paper presented.
    2. "scope": "Local", "National", or "International".
    3. "title_of_conference": The name of the conference where it was presented.
    4. "conference_organizer": The organizer of the conference.
    5. "date_presented": The date of presentation (e.g., "09/29/2021").
    
    Output JSON:
    {{
        "title_of_paper": "Serbigo: Development and User Evaluation...",
        "scope": "International",
        "title_of_conference": "1st International Research Conference...",
        "conference_organizer": "Northern Negros State College...",
        "date_presented": "09/29/2021"
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    
    if not data:
        return []

    scope = data.get("scope", "International")
    
    from .scoring_rules import SCORING_RULES
    base_points_dict = SCORING_RULES.get("kra4_paper_presentation", {})
    score = base_points_dict.get(scope, 5.0)

    return [{
        "title_of_paper": data.get("title_of_paper", "Unknown Paper"),
        "scope": scope,
        "title_of_conference": data.get("title_of_conference", "Unknown Conference"),
        "conference_organizer": data.get("conference_organizer", "Unknown Organizer"),
        "date_presented": data.get("date_presented", "N/A"),
        "score": score
    }]

def extract_kra4_award(text, faculty_name=None):
    print(f"EXTRACTOR: extract_kra4_award called for {faculty_name} (via Groq).")
    
    prompt = f"""
    Analyze the Certificate of Award or Recognition.
    Target Faculty: "{faculty_name}"
    
    Extract:
    1. "name_of_award": The proper name of the award (e.g., "Distinguished Faculty of the Year").
    2. "scope": "Institutional", "Local", "Regional", "National"".
    3. "check_award": The organization or body giving the award.
    4. "date_given": The date awarded (e.g., "11/22/2022").
    5. "venue": The place/venue of the award ceremony.
    
    Output JSON:
    {{
        "name_of_award": "Distinguished Faculty of the Year",
        "scope": "Institutional",
        "awarding_body": "LSPU-SCC",
        "date_given": "11/22/2022",
        "venue": "LSPU SCC"
    }}
    """
    
    data = query_llm_for_json(prompt, text)
    
    if not data:
        return []

    scope = data.get("scope", "Institutional")
    # Clean scope to match keys (Title Case)
    scope = scope.title()
    if scope not in ["Institutional", "Local", "Regional", "National", "International"]:
        scope = "Institutional" # Default fallback
    
    from .scoring_rules import SCORING_RULES
    base_points_dict = SCORING_RULES.get("kra4_award", {})
    score = base_points_dict.get(scope, 2.0)

    return [{
        "name_of_award": data.get("name_of_award", "Unknown Award"),
        "scope": scope,
        "awarding_body": data.get("awarding_body", "Unknown Body"),
        "date_given": data.get("date_given", "N/A"),
        "venue": data.get("venue", "N/A"),
        "score": score
    }]


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
    "kra3_judge": extract_kra3_judge,
    "kra3_consultant": extract_kra3_consultant,
    "kra3_training": extract_kra3_training,
    "kra3_community": extract_kra3_community,
    "kra3_admin_designation": extract_kra3_admin_designation,
    "kra3_client_satisfaction": extract_kra3_client_satisfaction,
    "kra4_participation": extract_kra4_participation,
    "kra4_paper_presentation": extract_kra4_paper_presentation,
    "kra4_award": extract_kra4_award,
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
