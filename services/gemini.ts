const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || "";

export interface AIClassificationResult {
  category: 'Pothole' | 'Water Logging' | 'Garbage' | 'Electricity' | 'Safety' | 'Others';
  priority: 'critical' | 'high' | 'medium' | 'low';
  department: string;
  smartRecommendation?: string;
}

// Local fallback heuristics (regex based classifier)
export function runLocalHeuristicClassifier(text: string): AIClassificationResult {
  const t = text.toLowerCase();
  
  let category: AIClassificationResult['category'] = 'Others';
  let priority: AIClassificationResult['priority'] = 'medium';
  let department = 'Municipality';
  let smartRecommendation = 'Assigned to general municipal queue.';

  if (t.includes('pothole') || t.includes('road') || t.includes('crack') || t.includes('asphalt')) {
    category = 'Pothole';
    priority = t.includes('accident') || t.includes('deep') ? 'high' : 'medium';
    department = 'Road Department';
    smartRecommendation = 'Road repairs suggested. Avoid speed riding on this stretch.';
  } else if (t.includes('water') || t.includes('drain') || t.includes('flood') || t.includes('logging') || t.includes('sewage')) {
    category = 'Water Logging';
    priority = t.includes('overflow') || t.includes('submerged') ? 'critical' : 'high';
    department = 'Drainage & Water Team';
    smartRecommendation = 'Blocked drain cleanup requested. Impending monsoon might worsen logging.';
  } else if (t.includes('garbage') || t.includes('waste') || t.includes('trash') || t.includes('dump') || t.includes('smell')) {
    category = 'Garbage';
    priority = t.includes('stink') || t.includes('toxic') ? 'medium' : 'low';
    department = 'Sanitation & Waste Dept';
    smartRecommendation = 'Sanitation pickup clearance scheduled.';
  } else if (t.includes('wire') || t.includes('electricity') || t.includes('light') || t.includes('spark') || t.includes('power')) {
    category = 'Electricity';
    priority = t.includes('sparking') || t.includes('hanging') ? 'critical' : 'high';
    department = 'Electricity Board';
    smartRecommendation = 'Hanging electrical hazard. Emergency dispatch advised.';
  } else if (t.includes('dark') || t.includes('safety') || t.includes('harass') || t.includes('crime') || t.includes('theft')) {
    category = 'Safety';
    priority = t.includes('harassment') || t.includes('assault') ? 'critical' : 'high';
    department = 'Public Safety & Police';
    smartRecommendation = 'Police patrolling recommended in this zone.';
  }

  return { category, priority, department, smartRecommendation };
}

// Call Gemini API (with OpenRouter fallback)
export async function runAIClassification(title: string, description: string): Promise<AIClassificationResult> {
  const prompt = `Analyze this civic issue report:
Title: "${title}"
Description: "${description}"

Classify it into one of these:
Category: Pothole, Water Logging, Garbage, Electricity, Safety, Others
Priority: critical, high, medium, low
Department: Road Department, Drainage & Water Team, Electricity Board, Sanitation & Waste Dept, Public Safety & Police, Municipality

Format your response strictly as JSON with keys: "category", "priority", "department", "smartRecommendation"`;

  try {
    // 1. Try Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(text);
    }
    
    // 2. Fallback to OpenRouter
    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (orResponse.ok) {
      const orData = await orResponse.json();
      const text = orData.choices[0].message.content;
      return JSON.parse(text);
    }
  } catch (err) {
    console.warn('[AI Service] API calls failed or rate-limited. Falling back to local heuristic rules.', err);
  }

  // Graceful local fallback execution
  return runLocalHeuristicClassifier(`${title} ${description}`);
}

// Check for duplicates comparing text similarity (returns matching IDs)
export function runDuplicateDetection(title: string, existingIssues: any[]): string[] {
  const t = title.toLowerCase();
  const duplicateIds: string[] = [];

  existingIssues.forEach((issue) => {
    const issueTitle = issue.title.toLowerCase();
    
    // Simple intersection similarity
    const words1 = new Set(t.split(' '));
    const words2 = new Set(issueTitle.split(' '));
    
    let intersection = 0;
    words1.forEach(word => {
      if (word.length > 3 && words2.has(word)) intersection++;
    });

    // If more than 2 key matching words overlap, flag as potential duplicate
    if (intersection >= 2) {
      duplicateIds.push(issue.id);
    }
  });

  return duplicateIds;
}
