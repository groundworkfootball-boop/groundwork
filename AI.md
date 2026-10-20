# AI

AI is **advisory only**. It never touches the deterministic matching engine.

## Provider abstraction

```ts
interface AIProvider {
  readonly name: string;
  readonly models: Record<string, string>;
  completeJSON<T>(req: AIRequest): Promise<AIResult<T>>;
}
```

Implementations: `createClaudeProvider`, `createOpenRouterProvider`, and a
deterministic `createStubProvider` for local development (no network calls).

Selection is environment-driven:

```
AI_PROVIDER=claude      # or openrouter
ANTHROPIC_API_KEY=...
OPENROUTER_API_KEY=...
```

The rest of the application never knows which provider is active.

## Shared pipeline

Every call goes through `runCachedJSON`:

1. Build a SHA-256 cache key from prompt version + system prompt + user prompt + schema.
2. Return the cached result if present and unexpired (30 days).
3. Otherwise call the provider with a timeout and retry policy.
4. Extract balanced JSON from the response (handles markdown fences).
5. Write the cache entry and record usage in `aiUsage`.

## Features

| Feature | Callable | Input | Output |
| --- | --- | --- | --- |
| Video tagging | `tagVideoContent` | sampled frames, declared position, duration | `{ tags: string[], summary: string }` |
| Squad gap analysis | `analyzeSquadGaps` | structured squad counts, formation, target level | `[{ position, gapSeverity, rationale }]` |
| Player recommendations | `getPlayerRecommendations` | the caller's own profile signals | `[{ action, reason, priority }]` |

### Video tagging guardrails

Allowed output: observable descriptions only — dominant foot visible, camera
framing, third of the pitch, action type, movement, passing sequence.

Forbidden: skill ratings, rankings, talent prediction, potential, comparative
judgement, age inference, sensitive attribute inference.

Output is stored as `aiSuggestion`. The player can accept, edit, reject or
delete it. AI output never becomes a permanent fact automatically.

### Squad gap analysis

The club supplies structured data only — no free-text prompt. Output severity is
constrained to `Critical | Moderate | Minor`. Selecting a gap redirects to the
deterministic player search; AI identifies the need, the engine finds the
players. Results are cached on a hash of the squad JSON, so unchanged squad data
never triggers another call.

### Player recommendations

Reads only the caller's own profile. Never reads another player's data, never
surfaces to clubs. Youth profiles are blocked unless consent is granted. Results
are cached on a hash of the signal set.

## Cost and safety controls

- Content hashing + caching (no duplicate spend)
- Per-user rate limiting
- Token limits and structured output schemas
- Timeouts and bounded retries
- Usage recorded in `aiUsage` (provider, model, tokens, estimated cost)
- Admin dashboard surfaces AI usage

## Hard boundary

`functions/src/ai/` has no write access to `matchResults` or `playerScores`.
Firestore rules enforce this independently of the code:

```
match /matchResults/{id} { allow write: if false; }
match /playerScores/{id} { allow write: if false; }
```
