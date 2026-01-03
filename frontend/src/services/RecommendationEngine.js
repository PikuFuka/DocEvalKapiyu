// src/utils/recommendationEngine.js

// Keep your ADVICE_DATABASE exactly as it is...
const ADVICE_DATABASE = {
  "KRA I": {
    "A": { 
      // Teaching Effectiveness (60 pts)
      action: "Review Student & Supervisor Ratings", 
      detail: "Points are calculated from the average of all semesters. Ensure you have the 'Individual Summary Sheet' signed by your Dean." 
    },
    "B": { 
      // Curriculum & Materials (30 pts)
      action: "Peer-Review Your Materials", 
      detail: "Instructional materials (modules, manuals) must be approved for use by the department and undergo a peer-review process to earn points." 
    },
    "C": { 
      // Mentorship (10 pts)
      action: "Formalize Mentorship", 
      detail: "To claim these points, you need a copy of the appointment/invitation as adviser/panel member and proof the student completed the degree." 
    }
  },
  "KRA II": {
    "A": { 
      // Research Outputs (100 pts)
      action: "Target Indexed Journals", 
      detail: "Focus on journals listed in Scopus, Web of Science, or ASEAN Citation Index. Non-indexed peer-reviewed journals earn significantly fewer points." 
    },
    "B": { 
      // Inventions (100 pts)
      action: "Register Utility Models", 
      detail: "If a full patent is too difficult, register a 'Utility Model' or 'Industrial Design' with IPOPHL. Even without a patent grant, 'Acceptance' and 'Publication' stages earn partial points." 
    },
    "C": { 
      // Creative Works (100 pts)
      action: "Copyright Creative Works", 
      detail: "For software, literature, or art: you must submit a Copyright Certificate and evidence of peer review (e.g., juried exhibition or literary publication)." 
    }
  },
  "KRA III": {
    "A": { 
      // Service to Institution (30 pts)
      action: "Secure MOAs for Linkages", 
      detail: "Partnerships only count if formalized by a notarized Memorandum of Agreement (MOA) and accompanied by a report of the benefits derived." 
    },
    "B": { 
      // Service to Community (50 pts)
      action: "Document Outreach Roles", 
      detail: "Get certificates of participation for every outreach activity. Leading a project (Head of Extension) earns more points (5 pts) than just participating (2 pts)." 
    },
    "C": { 
      // Quality of Extension (20 pts)
      action: "Conduct Client Surveys", 
      detail: "You must provide a 'Client Satisfaction Rating' summary for your extension projects. Without this survey data, you get 0 points for Quality." 
    },
    "D": {
        // Bonus Criterion
        action: "Claim Admin Designation",
        detail: "If you held a designated position (e.g., Program Chair, Director) for at least one year, submit your appointment paper to claim up to 20 bonus points."
    }
  },
  "KRA IV": {
    "A": { 
      // Professional Org (20 pts)
      action: "Active Membership Role", 
      detail: "Membership alone is not enough. You must show proof of active contribution (e.g., Officer, Committee Chair, or Event Organizer) to maximize points" 
    },
    "B": { 
      // Continuing Dev (60 pts)
      action: "Attend CHED-Endorsed Seminars", 
      detail: "Only seminars endorsed by CHED, government agencies, or recognized professional bodies count. Half-day webinars do not earn points.]" 
    },
    "C": { 
      // Awards (20 pts)
      action: "Submit Award Evidence", 
      detail: "Submit copies of plaques/certificates for any Institutional, Regional, or National awards. National awards can grant an automatic sub-rank increase." 
    },
    "D": {
        // Bonus (New Hires)
        action: "Credit Past Experience",
        detail: "If you are a new entrant, submit service records from your previous industry or academic employment to claim 'Experience' points."
    }
  }
};

export function generateRecommendations(normalizedData) {
  if (!normalizedData || !normalizedData.subscores) return [];

  let actionableItems = [];

  // 1. Loop through all data to find gaps
  Object.keys(normalizedData.subscores).forEach(kra => {
    normalizedData.subscores[kra].forEach(sub => {
      
      // Calculate Percentage
      // Avoid division by zero if cap is 0
      if (sub.cap === 0) return;

      const score = sub.score;
      const cap = sub.cap;
      const percent = (score / cap) * 100;
      const gap = cap - score;

      // THRESHOLD LOGIC:
      // We want to list everything that is not "Good" (e.g., < 80%)
      if (percent < 80 && gap > 0.5) { 
        
        const adviceObj = ADVICE_DATABASE[kra]?.[sub.key] || { action: "Improve Score", detail: `Increase output in ${sub.name}` };
        
        // Determine Severity
        let type = "Improvement Needed";
        let color = "indigo"; // Default Blue

        if (percent < 50) {
            type = "Critical Gap";
            color = "rose"; // Red
        } else if (percent < 80) {
            type = "Warning";
            color = "amber"; // Orange/Yellow
        }

        actionableItems.push({
          kra: kra,
          name: sub.name,
          gap: gap,
          percent: percent,
          type: type,
          color: color,
          title: adviceObj.action,
          desc: adviceObj.detail,
          score: `+${gap.toFixed(2)} pts`, // Show how much they gain
          category: `${kra} (${sub.name})`
        });
      }
    });
  });

  // 2. Sort by Gap Size (Largest potential points first)
  // This ensures the 0/100 scores appear at the top, followed by the 43/60 scores.
  actionableItems.sort((a, b) => b.gap - a.gap);

  // 3. Fallback if they are perfect
  if (actionableItems.length === 0) {
    return [{ 
      type: "Success", 
      color: "emerald", 
      title: "All Objectives Met", 
      desc: "Excellent work! You are hitting above 80% in all categories.", 
      score: "100%", 
      category: "Overall" 
    }];
  }

  return actionableItems;
}