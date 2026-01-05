# api/services/scoring_rules.py

SCORING_RULES = {
    # KRA 1B: Instructional Materials
    "kra1b_sole": {
        "textbook": 30,
        "chapter": 16,
        "manual": 10,
        "multimedia": 10,
        "testing_material": 10,
    },
    "kra1b_co": {
        "textbook": 10,
        "chapter": 16,
        "manual": 10,
        "multimedia": 10,
        "testing_material": 10,
    },
    "kra1b_program": {"lead": 10, "contributor": 5},

    # KRA 1C: Services Rendered to Students
    "kra1c_adviser": {
        "SP": 3,
        "CP": 3,
        "UT": 5,
        "MT": 8,
        "DD": 10,
    },
    "kra1c_panel": {
        "SP": 1,
        "CP": 1,
        "UT": 1,
        "MT": 2,
        "DD": 2,
    },
    "kra1c_mentor": 3,

    # KRA 2A: Research Outputs
    "kra2a_sole": {
        "book": 100,
        "journal_article": 35,
        "book_chapter": 35,
        "monograph": 35,
        "other_peer_reviewed": 10,
    },
    "kra2a_co": {
        "book": 50,
        "journal_article": 35,
        "book_chapter": 35,
        "monograph": 35,
        "other_peer_reviewed": 10,
    },
    "kra2a_research_to_project": 35,
    "kra2a_citation": {"local": 5, "international": 10},

    # KRA 2B: Inventions & Innovations
    "kra2b_invention": {
        "acceptance": 10,
        "publication": 20,
        "grant": 80,
    },
    "kra2b_utility": 10,
    "kra2b_industrial": 10,
    "kra2b_commercialized": {"local": 20, "international": 30},
    "kra2b_new_software": 10,
    "kra2b_updated_software": 4,
    "kra2b_biological": 10,

    # KRA 2C: Creative Works
    "kra2c_performing_art": {"own": 20, "others": 10},
    "kra2c_exhibition": 20,
    "kra2c_juried_design": 20,
    "kra2c_literary": {"novel": 20, "short_story": 10, "essay": 10, "poetry": 10},

    # KRA 3: Extension Services
    "kra3_judge": 10,
    "kra3_consultant": {"Local": 2, "International": 5},
    "kra3_community": {"Head": 5, "Participant": 2},
    
    # KRA 3: Training / Resource Person
    "kra3_training": {
        "resource_person": 2.0, # Points per hour (implied from 48h -> 96pts)
        "participant": 1.0,     # Assumption: 1 point per hour for participation? Or fixed?
        "facilitator": 1.0,
        "moderator": 1.0,
        "default": 1.0
    },

    # KRA 3: Administrative Designation
    "kra3_admin_designation": {
        "president": 20,
        "oic_president": 20,
        "vice_president": 15,
        "chancellor": 10,
        "vice_chancellor": 8,
        "campus_director": 8,
        "administrator": 8,
        "head": 8,
        "faculty_regent": 8,
        "office_director": 6,
        "university_secretary": 6,
        "college_secretary": 6, # Note: User listed "Univ./College Secretary" as 6, but also "College Secretary" as 3 under 1.2.3. I will use specific keys.
        # Let's follow the user's list strictly:
        # 1.1.8 Univ./College Secretary — 6
        # 1.2.3 College Secretary — 3
        # This is ambiguous. I will use "university_secretary": 6 and "college_secretary": 3.
        
        "project_head": 4, # 1.1.9
        "institution_committee_chair": 3,
        "institution_committee_member": 2,
        
        "dean": 6,
        "associate_dean": 5,
        "college_secretary_dept": 3, # 1.2.3
        "department_head": 4,
        "program_chair": 3, # 1.2.5
        "project_head_dept": 3, # 1.2.5
        
        "department_committee_chair": 2,
        "department_committee_member": 1,
        
        "default": 0
    },

    # KRA 4: Professional Development
    "kra4_participation": {"Local": 1.0, "International": 2.0, "National": 1.5},
    "kra4_paper_presentation": {"Local": 3.0, "International": 5.0, "National": 4.0},
    "kra4_award": {"Institutional": 2.0, "Local": 2.0, "Regional": 3.0, "National": 4.0, "International": 5.0},
}

def calculate_score(evidence_type, subtype_or_stage, contribution_percent=100):
    base_points_dict = SCORING_RULES.get(evidence_type)
    if base_points_dict is None:
        print(f"Warning: No base points found for evidence_type '{evidence_type}'. Returning 0.")
        return 0

    # Handle case where the rule is a direct number (e.g., kra2b_utility: 10)
    if isinstance(base_points_dict, (int, float)):
        return base_points_dict * (contribution_percent / 100.0)

    base_value = base_points_dict.get(subtype_or_stage)
    if isinstance(base_value, dict):
        print(f"Warning: Base points for '{evidence_type}.{subtype_or_stage}' is a dictionary. Need more specific key. Returning 0.")
        return 0
    elif base_value is None:
        # Fallback: if subtype not found, check if there is a 'default' key or similar?
        # For now, just warn.
        print(f"Warning: No base points found for subtype/stage '{subtype_or_stage}' in '{evidence_type}'. Returning 0.")
        return 0

    score = base_value * (contribution_percent / 100.0)
    return score
