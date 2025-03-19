import {
    elizaLogger,
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { validateCanvasConfig } from "../environment";
import { canvasExamples } from "../examples";
import { createCanvasService } from "../services";

export const mintAction: Action = {
    name: "CANVAS_MINT",
    similes: [
        "MINT_TOKEN",
        "CREATE_NFT",
        "GENERATE_ASSET",
        "MINT_ASSET",
        "TOKENIZE",
        "ISSUE_NFT",
        "DEPLOY_NFT",
        "MINT_COIN",
        "MINT_COLLECTIBLE",
        "NFT_CREATION",
    ],
    description: "Mint to Canvas.",
    validate: async (runtime: IAgentRuntime) => {
        await validateCanvasConfig(runtime);
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback: HandlerCallback
    ) => {
        const config = await validateCanvasConfig(runtime);
        const canvasService = createCanvasService(config.THE_GRAPH_KEY);

        try {
            const modelShots = await canvasService.createModelShots();
            elizaLogger.success(`Successfully fetched presets`);
            if (callback) {
                callback({
                    text: `Minted! Congrats, it's minted and ready to sell on canvas. Check out it out here: `,
                    url: `https://canvas.themanufactory.xyz/`,
                });
                return true;
            }
        } catch (error: any) {
            elizaLogger.error("Error in mint plugin handler:", error);
            callback({
                text: `Error minting: ${error.message}`,
                content: { error: error.message },
            });
            return false;
        }
    },
    examples: canvasExamples as ActionExample[][],
} as Action;
