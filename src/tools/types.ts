/**
 * Tool Type Definition
 */
export interface Tool {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, { type: string; description: string }>;
        required: string[];
    };
}

export interface ToolHandler {
    (args: Record<string, any>): string | Promise<string>;
}

export interface ToolModule {
    tools: Tool[];
    handlers: Record<string, ToolHandler>;
}
