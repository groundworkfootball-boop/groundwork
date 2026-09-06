# AI Provider Architecture & Guardrails

## 1. Architectural Guardrails
GROUNDWORK adheres to strict ethical and operational boundaries for Artificial Intelligence:
1. **NO MATCH SCORE INFLUENCE:** AI is strictly forbidden from computing, weighting, or modifying player-club match scores or recruitment rankings.
2. **Server-Side Only:** AI provider API keys (`ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`) NEVER exist in frontend client bundles.
3. **Structured Input & Output:** Every AI call operates through typed schemas with explicit JSON output validation.
4. **Youth Consent Requirement:** Under-18 data is NEVER sent to AI providers unless `consentStatus === 'granted'`.

## 2. AI Capabilities

### 1. Squad Gap Analysis (`/club/squad/analysis`)
- **Input:** Aggregated squad position counts, selected formation (e.g. 4-3-3), target competition tier.
- **Output:** Categorized squad gaps (`Critical`, `Moderate`, `Minor`) and strategic rationale.
- **Action:** Clicking any gap automatically routes the club scout directly into the **deterministic player search engine** to view qualified candidates.

### 2. Video Observation Tagging (`/player/videos/:id`)
- **Input:** Sampled video frame descriptions, declared position, clip duration.
- **Output:** Objective, observable tags (e.g. "Left Foot Action", "Attacking Third Transition", "Passing Sequence").
- **Strict Prohibition:** AI may not infer talent potential, future ceiling, comparative player ratings, or physiological attributes.
- **User Control:** Every AI suggestion is marked "AI-assisted suggestion". The player can Accept, Edit, or Reject any tag before it is saved to their profile.

### 3. Player Improvement Recommendations (`/player/recommendations`)
- **Input:** Player's own profile completion telemetry and field gaps.
- **Output:** High-impact suggestions (e.g. upload video clip, complete availability slots, specify secondary position) to improve discovery rate.
