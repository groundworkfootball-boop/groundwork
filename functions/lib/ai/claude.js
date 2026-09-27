import { runCachedJSON } from './provider.js';
/** Generic JSON-calling provider over fetch (works on Node 18+). */
export class HttpAIProvider {
    name;
    models;
    opts;
    constructor(opts) {
        this.opts = opts;
        this.name = opts.name;
        this.models = opts.models;
    }
    async completeJSON(req) {
        const model = this.opts.models[req.purpose] ?? this.opts.defaultModel;
        return runCachedJSON(this, req, async () => {
            const res = await fetch(`${this.opts.baseUrl}`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': this.opts.apiKey,
                    authorization: `Bearer ${this.opts.apiKey}`,
                    ...this.opts.extraHeaders,
                },
                body: JSON.stringify(this.opts.buildBody(model, req)),
            });
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                throw new Error(`${this.name} API error ${res.status}: ${body.slice(0, 500)}`);
            }
            const json = (await res.json());
            const parsed = this.opts.parseResponse(json);
            const usage = {
                provider: this.name,
                model,
                promptTokens: parsed.promptTokens,
                completionTokens: parsed.completionTokens,
                costUsd: (parsed.promptTokens / 1000) * this.opts.pricing.input +
                    (parsed.completionTokens / 1000) * this.opts.pricing.output,
            };
            return { text: parsed.text, usage };
        });
    }
}
/** Anthropic Claude provider (Messages API). */
export function createClaudeProvider(apiKey) {
    return new HttpAIProvider({
        name: 'claude',
        apiKey,
        baseUrl: 'https://api.anthropic.com/v1/messages',
        models: { default: 'claude-sonnet-4-5' },
        defaultModel: 'claude-sonnet-4-5',
        extraHeaders: { 'anthropic-version': '2023-06-01' },
        pricing: { input: 0.003, output: 0.015 },
        buildBody: (model, req) => ({
            model,
            max_tokens: req.maxTokens ?? 2048,
            temperature: req.temperature ?? 0.2,
            system: `${req.systemPrompt}\n[system-prompt-version: ${req.systemPromptVersion}]`,
            messages: [{ role: 'user', content: req.userPrompt }],
            ...(req.jsonSchema
                ? {
                    tools: [
                        {
                            name: 'emit_json',
                            description: 'Emit the structured JSON result.',
                            input_schema: req.jsonSchema,
                        },
                    ],
                    tool_choice: { type: 'tool', name: 'emit_json' },
                }
                : {}),
        }),
        parseResponse: (json) => {
            const data = json;
            const toolBlock = data.content?.find((c) => c.type === 'tool_use');
            const textBlock = data.content?.find((c) => c.type === 'text');
            const text = toolBlock?.input != null ? JSON.stringify(toolBlock.input) : (textBlock?.text ?? '');
            return {
                text,
                promptTokens: data.usage?.input_tokens ?? 0,
                completionTokens: data.usage?.output_tokens ?? 0,
            };
        },
    });
}
/** OpenRouter provider (OpenAI-compatible chat completions). */
export function createOpenRouterProvider(apiKey) {
    return new HttpAIProvider({
        name: 'openrouter',
        apiKey,
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        models: { default: 'anthropic/claude-sonnet-4.5' },
        defaultModel: 'anthropic/claude-sonnet-4.5',
        pricing: { input: 0.003, output: 0.015 },
        buildBody: (model, req) => ({
            model,
            max_tokens: req.maxTokens ?? 2048,
            temperature: req.temperature ?? 0.2,
            messages: [
                {
                    role: 'system',
                    content: `${req.systemPrompt}\n[system-prompt-version: ${req.systemPromptVersion}]`,
                },
                { role: 'user', content: req.userPrompt },
            ],
            ...(req.jsonSchema ? { response_format: { type: 'json_object' } } : {}),
        }),
        parseResponse: (json) => {
            const data = json;
            return {
                text: data.choices?.[0]?.message?.content ?? '',
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
            };
        },
    });
}
/**
 * Resolve the active provider from environment configuration.
 * Falls back to a deterministic no-network stub when no key is configured so
 * dev/emulator environments keep working.
 */
export function getAIProvider() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY ?? '';
    const openRouterKey = process.env.OPENROUTER_API_KEY ?? '';
    if (process.env.AI_PROVIDER === 'openrouter' && openRouterKey) {
        return createOpenRouterProvider(openRouterKey);
    }
    if (anthropicKey)
        return createClaudeProvider(anthropicKey);
    if (openRouterKey)
        return createOpenRouterProvider(openRouterKey);
    return createStubProvider();
}
/** Deterministic offline provider used in dev/tests (no external calls). */
export function createStubProvider() {
    return {
        name: 'stub',
        models: { default: 'stub-1' },
        async completeJSON(req) {
            // Echo a minimal valid structure derived from the request so callers can
            // exercise the pipeline without network access.
            const payload = { stub: true, purpose: req.purpose };
            return {
                data: payload,
                usage: {
                    provider: 'stub',
                    model: 'stub-1',
                    promptTokens: 0,
                    completionTokens: 0,
                    costUsd: 0,
                    cached: false,
                },
            };
        },
    };
}
