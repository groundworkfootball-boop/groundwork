import type { AIProvider, AIRequest, AIResult } from './provider.js';
interface HttpProviderOptions {
    name: string;
    apiKey: string;
    baseUrl: string;
    /** Model key → provider model id. */
    models: Record<string, string>;
    defaultModel: string;
    /** Extra headers (Anthropic requires version header). */
    extraHeaders?: Record<string, string>;
    /** Build the request body for the provider's API. */
    buildBody: (model: string, req: AIRequest) => Record<string, unknown>;
    /** Extract text + token usage from the provider response. */
    parseResponse: (json: unknown) => {
        text: string;
        promptTokens: number;
        completionTokens: number;
    };
    /** Cost per 1K tokens (input, output). */
    pricing: {
        input: number;
        output: number;
    };
}
/** Generic JSON-calling provider over fetch (works on Node 18+). */
export declare class HttpAIProvider implements AIProvider {
    readonly name: string;
    readonly models: Record<string, string>;
    private readonly opts;
    constructor(opts: HttpProviderOptions);
    completeJSON<T>(req: AIRequest): Promise<AIResult<T>>;
}
/** Anthropic Claude provider (Messages API). */
export declare function createClaudeProvider(apiKey: string): AIProvider;
/** OpenRouter provider (OpenAI-compatible chat completions). */
export declare function createOpenRouterProvider(apiKey: string): AIProvider;
/**
 * Resolve the active provider from environment configuration.
 * Falls back to a deterministic no-network stub when no key is configured so
 * dev/emulator environments keep working.
 */
export declare function getAIProvider(): AIProvider;
/** Deterministic offline provider used in dev/tests (no external calls). */
export declare function createStubProvider(): AIProvider;
export {};
