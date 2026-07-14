export interface ParsedJobApplication {
  companyName: string;
  roles: string;
  stipend: string | null;
  location: string | null;
  duration: string | null;
  eligibility: string | null;
  deadline: string | null;
  applicationLink: string | null;
}

export function parseWhatsAppMessage(text: string): ParsedJobApplication {
  const lines = text.split("\n").map(l => l.trim());
  
  let companyName = "";
  let rolesList: string[] = [];
  let stipend = "";
  let location = "";
  let duration = "";
  let eligibilityList: string[] = [];
  let deadline = "";
  let applicationLinks: string[] = [];
  
  let currentSection: "roles" | "eligibility" | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line) continue;
    
    // Check company
    const companyMatch = line.match(/^(?:\*|_)*Company(?:\*|_)*\s*:\s*(.*)$/i);
    if (companyMatch) {
      currentSection = null;
      let rawName = companyMatch[1]!.trim();
      // Clean up bracketed URLs, e.g. Idfy [https://idfy.com] -> Idfy
      rawName = rawName.replace(/\[https?:\/\/[^\]]+\]/gi, "").replace(/\(https?:\/\/[^)]+\)/gi, "").trim();
      // Clean up leading/trailing * or _
      companyName = rawName.replace(/^[*_]+|[*_]+$/g, "").trim();
      continue;
    }
    
    // Check roles trigger
    const rolesMatch = line.match(/^(?:\*|_)*Roles?(?:\*|_)*\s*:\s*(.*)$/i);
    if (rolesMatch) {
      currentSection = "roles";
      const rest = rolesMatch[1]!.trim();
      if (rest) {
        rolesList.push(rest.replace(/^[-*•\s]+/, "").replace(/^[*_]+|[*_]+$/g, "").trim());
      }
      continue;
    }
    
    // Check stipend / CTC / Package
    const stipendMatch = line.match(/^(?:\*|_)*(?:Stipend|Package|CTC|Salary)(?:\*|_)*\s*:\s*(.*)$/i);
    if (stipendMatch) {
      currentSection = null;
      stipend = stipendMatch[1]!.replace(/^[*_]+|[*_]+$/g, "").trim();
      continue;
    }
    
    // Check location
    const locationMatch = line.match(/^(?:\*|_)*Location(?:\*|_)*\s*:\s*(.*)$/i);
    if (locationMatch) {
      currentSection = null;
      location = locationMatch[1]!.replace(/^[*_]+|[*_]+$/g, "").trim();
      continue;
    }
    
    // Check duration
    const durationMatch = line.match(/^(?:\*|_)*Duration(?:\*|_)*\s*:\s*(.*)$/i);
    if (durationMatch) {
      currentSection = null;
      duration = durationMatch[1]!.replace(/^[*_]+|[*_]+$/g, "").trim();
      continue;
    }
    
    // Check eligibility trigger
    const eligMatch = line.match(/^(?:\*|_)*(?:Eligibility(?:\s+Criteria)?|Eligible)(?:\*|_)*\s*:\s*(.*)$/i);
    if (eligMatch) {
      currentSection = "eligibility";
      const rest = eligMatch[1]!.trim();
      if (rest) {
        eligibilityList.push(rest.replace(/^[-*•\s]+/, "").replace(/^[*_]+|[*_]+$/g, "").trim());
      }
      continue;
    }
    
    // Check deadline
    const deadlineMatch = line.match(/^(?:\*|_)*Deadline(?:\*|_)*\s*:\s*(.*)$/i);
    if (deadlineMatch) {
      currentSection = null;
      deadline = deadlineMatch[1]!.replace(/^[*_]+|[*_]+$/g, "").trim();
      continue;
    }
    
    // Check application link labels
    const appLinkMatch = line.match(/(?:Application|Form|Google Form|SAP portal|Link|Brochure)\s*:\s*(https?:\/\/[^\s]+)/i);
    if (appLinkMatch) {
      applicationLinks.push(appLinkMatch[1]!);
      continue;
    }
    
    // Generic URL detection if line contains a link
    const genericUrlMatch = line.match(/(https?:\/\/[^\s]+)/);
    if (genericUrlMatch && (line.toLowerCase().includes("apply") || line.toLowerCase().includes("application") || line.toLowerCase().includes("form") || line.toLowerCase().includes("sap"))) {
      applicationLinks.push(genericUrlMatch[1]!);
      continue;
    }
    
    // If we are in a section, parse bullet points or list items
    const isHeader = /^(?:\*|_)*(?:Company|Roles?|Stipend|Package|CTC|Salary|Location|Duration|Eligibility|Eligible|Deadline|JD|Brochure|Link|Application|Form|Google Form|SAP portal)(?:\*|_)*\s*:/i.test(line);

    if (currentSection === "roles") {
      // If it looks like a new header category, terminate section
      if (isHeader || (line.includes(":") && !line.match(/https?:\/\//))) {
        currentSection = null;
        i--; // re-evaluate
        continue;
      }
      const roleItem = line.replace(/^[-*•\s]+/, "").replace(/^[*_]+|[*_]+$/g, "").trim();
      if (roleItem) {
        rolesList.push(roleItem);
      }
    } else if (currentSection === "eligibility") {
      if (isHeader || (line.includes(":") && !line.match(/https?:\/\//))) {
        currentSection = null;
        i--; // re-evaluate
        continue;
      }
      const eligItem = line.replace(/^[-*•\s]+/, "").replace(/^[*_]+|[*_]+$/g, "").trim();
      if (eligItem) {
        eligibilityList.push(eligItem);
      }
    }
  }

  // Fallbacks & cleanups
  if (!companyName) {
    for (const line of lines) {
      if (line.toLowerCase().includes("company:")) {
        companyName = line.split(":")[1]?.trim() || "";
        break;
      }
    }
  }

  if (!companyName) {
    companyName = "Unknown Company";
  }

  const roles = rolesList.length > 0 ? rolesList.join(", ") : "Not Specified";
  const eligibility = eligibilityList.length > 0 ? eligibilityList.join("; ") : null;
  const applicationLink = applicationLinks.length > 0 ? applicationLinks[0]! : null;

  return {
    companyName,
    roles,
    stipend: stipend || null,
    location: location || null,
    duration: duration || null,
    eligibility,
    deadline: deadline || null,
    applicationLink
  };
}
