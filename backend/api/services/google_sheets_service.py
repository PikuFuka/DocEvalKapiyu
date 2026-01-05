import requests
import logging
import json

logger = logging.getLogger(__name__)

# =============================================================================
#  CONFIG
# =============================================================================

# REPLACE THIS WITH YOUR NEW DEPLOYMENT URL
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvJJMd8j7reRaSNHbX7yZVMrntSIVW2Ne4hrHnozU3q3NOcnqWvpj53cXk3jviqFUQRQ/exec"

SEMESTER_MAPPING = {
    "first": "1st", "1st": "1st",
    "second": "2nd", "2nd": "2nd"
}   

# =============================================================================
#  HELPER FUNCTIONS
# =============================================================================

def map_evaluation_type(raw_type):
    raw_type = (raw_type or "").strip().lower()
    if "supervisor" in raw_type:
        return "supervisor"
    return "student"

def normalize_values(academic_year, semester, evaluation_type):
    academic_year = (academic_year or "").replace("–", "-").replace("—", "-").strip()
    semester = (semester or "").lower().strip()
    semester = SEMESTER_MAPPING.get(semester, "1st")
    evaluation_type = map_evaluation_type(evaluation_type)
    return academic_year, semester, evaluation_type

# =============================================================================
#  EXPORT FUNCTIONS
# =============================================================================

def send_evaluation_to_spreadsheetKRA1_Eval(spreadsheet_id, academic_year, semester, evaluation_type, total_score, drive_link):
    """
    KRA 1A: Student/Supervisor Evaluation
    """
    academic_year, semester, evaluation_type = normalize_values(
        academic_year, semester, evaluation_type
    )

    payload = {
        "action": "kra1a_evaluation",  # ROUTING TAG
        "spreadsheet_id": spreadsheet_id,
        "academic_year": academic_year,
        "semester": semester,
        "evaluation_type": evaluation_type,
        "total_score": total_score,
        "drive_link": drive_link,
    }

    return _send_payload(payload, "KRA 1A")


def send_program_contribution_to_sheet(spreadsheet_id, program_name, program_type, board_reso, academic_year, role, score, drive_link):
    """
    KRA 1B Sender.
    """
    # Double check cleaning of AY to match "2019-2020" format
    if academic_year:
        academic_year = academic_year.replace("A.Y.", "").replace("Academic Year", "").strip()
        academic_year = academic_year.replace("–", "-").replace("—", "-") # Normalize hyphens

    payload = {
        "action": "kra1b_program", 
        "spreadsheet_id": spreadsheet_id,
        "program_name": program_name,
        "program_type": program_type,
        "board_reso": board_reso,
        "academic_year": academic_year, # Now strictly "2020-2021"
        "role": role,                   # Sent as "Contributor" or "Lead"
        "score": score,
        "drive_link": drive_link        # Passed from document_processing_service
    }

    return _send_payload(payload, "KRA 1B")


def send_research_to_sheet(spreadsheet_id, title, research_type, journal, reviewer, indexing, date_published, score, drive_link, author_mode, contribution=0):
    """
    Sends KRA 2A Research Data.
    author_mode: 'sole' (Row 12) or 'co' (Row 37)
    """
    payload = {
        "action": "kra2a_research", 
        "spreadsheet_id": spreadsheet_id,
        "author_mode": author_mode, # "sole" or "co"
        "title": title,
        "research_type": research_type,
        "journal": journal,
        "reviewer": reviewer,
        "indexing": indexing,
        "date_published": date_published,
        "contribution": contribution, # Sent even if 0/Sole (Script ignores it for Sole)
        "score": score,
        "drive_link": drive_link
    }

    return _send_payload(payload, f"KRA 2A ({author_mode})")

def send_adviser_to_sheet(spreadsheet_id, academic_year, level, count, score, drive_link):
    """
    Sends KRA 1C Adviser Data.
    """
    payload = {
        "action": "kra1c_adviser",
        "spreadsheet_id": spreadsheet_id,
        "academic_year": academic_year,
        "level": level,
        "count": count,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 1C Adviser")

def send_panel_to_sheet(spreadsheet_id, academic_year, level, count, score, drive_link):
    """
    Sends KRA 1C Panel Data.
    """
    payload = {
        "action": "kra1c_panel",
        "spreadsheet_id": spreadsheet_id,
        "academic_year": academic_year,
        "level": level,
        "count": count,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 1C Panel")

def send_citation_to_sheet(spreadsheet_id, scope, title, date_published, journal, citation_count, citation_index, citation_years, score, drive_link):
    """
    Sends KRA 2A Citation Data (Local/International).
    scope: 'local' (Row 91) or 'international' (Row 110)
    """
    payload = {
        "action": "kra2a_citation",
        "spreadsheet_id": spreadsheet_id,
        "scope": scope, # "local" or "international"
        "title": title,
        "date_published": date_published,
        "journal": journal,
        "citation_count": citation_count,
        "citation_index": citation_index,
        "citation_years": citation_years,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, f"KRA 2A Citation ({scope})")

def send_invention_to_sheet(spreadsheet_id, invention_title, patent_type, date_application, date_granted, is_sole, contribution, score, drive_link):
    """
    Sends KRA 2B Invention (Utility/Industrial) Data.
    """
    payload = {
        "action": "kra2b_invention",
        "spreadsheet_id": spreadsheet_id,
        "invention_title": invention_title,
        "patent_type": patent_type,
        "date_application": date_application,
        "date_granted": date_granted,
        "is_sole": is_sole,
        "contribution": contribution,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 2B Invention")

def send_kra3_judge_to_sheet(spreadsheet_id, title, organizer, date, nature, venue, score, drive_link):
    """Sends KRA 3 Judge/Examiner Data."""
    payload = {
        "action": "kra3_judge",
        "spreadsheet_id": spreadsheet_id,
        "title": title,
        "organizer": organizer,
        "date": date,
        "nature": nature,
        "venue": venue,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 3 Judge")

def send_kra3_consultant_to_sheet(spreadsheet_id, title, organization, start_date, end_date, scope, role, score, drive_link):
    """Sends KRA 3 Consultant Data."""
    payload = {
        "action": "kra3_consultant",
        "spreadsheet_id": spreadsheet_id,
        "title": title,
        "organization": organization,
        "start_date": start_date,
        "end_date": end_date,
        "scope": scope,
        "role": role,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 3 Consultant")

def send_kra3_community_to_sheet(spreadsheet_id, title, community, beneficiaries, role, date, score, drive_link):
    """Sends KRA 3 Community Extension Data."""
    payload = {
        "action": "kra3_community",
        "spreadsheet_id": spreadsheet_id,
        "title": title,
        "community": community,
        "beneficiaries": beneficiaries,
        "role": role,
        "date": date,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 3 Community")

def send_client_satisfaction_to_sheet(spreadsheet_id, semester, academic_year, score, drive_link):
    """Sends KRA 3 Client Satisfaction Data."""
    payload = {
        "action": "kra3_client_satisfaction",
        "spreadsheet_id": spreadsheet_id,
        "semester": semester,
        "academic_year": academic_year,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 4 Client Satisfaction")

def send_admin_designation_to_sheet(spreadsheet_id, designation, period, score, drive_link):
    """Sends KRA 3 Administrative Designation Data."""
    payload = {
        "action": "kra3_admin_designation",
        "spreadsheet_id": spreadsheet_id,
        "designation": designation,
        "period": period,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 3 Admin Designation")

def send_kra3_training_to_sheet(spreadsheet_id, title, participation_type, organizer, start_date, end_date, scope, hours, score, drive_link):
    """Sends KRA 3 Training/Resource Person Data."""
    payload = {
        "action": "kra3_training",
        "spreadsheet_id": spreadsheet_id,
        "title": title,
        "participation_type": participation_type,
        "organizer": organizer,
        "start_date": start_date,
        "end_date": end_date,
        "scope": scope,
        "hours": hours,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 3 Training")

def _send_payload(payload, context_name):
    """Internal helper to send POST request."""
    try:
        response = requests.post(APPS_SCRIPT_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "success":
                    logger.info(f"{context_name} Spreadsheet updated successfully.")
                    return True
                else:
                    logger.warning(f"{context_name} Spreadsheet update failed: {data}")
            except ValueError:
                logger.error("Invalid JSON response from Apps Script")
        else:
            logger.error(f"Failed to update spreadsheet, status code: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error sending {context_name} data to spreadsheet: {e}")
        
    return False

    return _send_payload(payload, "KRA 3 Training")

def send_kra4_participation_to_sheet(spreadsheet_id, name_of_conference, scope, organizer, date_of_activity, score, drive_link):
    payload = {
        "action": "kra4_participation",
        "spreadsheet_id": spreadsheet_id,
        "name_of_conference": name_of_conference,
        "scope": scope,
        "organizer": organizer,
        "date_of_activity": date_of_activity,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 4 Participation")

def send_kra4_paper_presentation_to_sheet(spreadsheet_id, title_of_paper, scope, title_of_conference, conference_organizer, date_presented, score, drive_link):
    payload = {
        "action": "kra4_paper_presentation",
        "spreadsheet_id": spreadsheet_id,
        "title_of_paper": title_of_paper,
        "scope": scope,
        "title_of_conference": title_of_conference,
        "conference_organizer": conference_organizer,
        "date_presented": date_presented,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 4 Paper Presentation")

def send_kra4_award_to_sheet(spreadsheet_id, name_of_award, scope, awarding_body, date_given, venue, score, drive_link):
    payload = {
        "action": "kra4_award",
        "spreadsheet_id": spreadsheet_id,
        "name_of_award": name_of_award,
        "scope": scope,
        "awarding_body": awarding_body,
        "date_given": date_given,
        "venue": venue,
        "score": score,
        "drive_link": drive_link
    }
    return _send_payload(payload, "KRA 4 Award")

# Function for user creation (kept from your original code)
def create_user_google_sheet(user_data):
    # This uses a DIFFERENT script URL for creation, keep as is or update if needed
    creation_script_url = "https://script.google.com/macros/s/AKfycbwJSozWyHrd6JaepnU7u0A-4diwFTgI3oJkhdNJAds-_QFgR1RKkn8-9sDj-TTdBjgUvw/exec"
    
    data = {
        'first_name': user_data.get('first_name', ''),
        'middle_name': user_data.get('middle_name', ''),
        'last_name': user_data.get('last_name', ''),
        'degree_name': user_data.get('degree_name', ''),
        'hei_name': user_data.get('hei_name', ''),
        'year_graduated': user_data.get('year_graduated', ''),
        'faculty_rank': user_data.get('faculty_rank', ''),
        'mode_of_appointment': user_data.get('mode_of_appointment', 'NBC 461'),
        'date_of_appointment': str(user_data.get('date_of_appointment', '')),
        'suc_name': user_data.get('suc_name', ''),
        'campus': user_data.get('campus', ''),
        'address': user_data.get('address', ''),
        'email': user_data.get('email', ''),
    }
    
    try:
        response = requests.post(creation_script_url, json=data, timeout=30)
        if response.status_code == 200:
            try:
                response_data = response.json()
                if response_data.get('status') == 'success':
                    return response_data.get('url', '')
            except ValueError:
                pass
    except Exception as e:
        logger.error(f"Error creating user Google Sheet: {e}")
    
    return f"https://docs.google.com/spreadsheets/d/mock_user_{user_data.get('email', 'unknown')}/edit"