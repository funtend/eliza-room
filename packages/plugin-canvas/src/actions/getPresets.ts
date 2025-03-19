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
import { v4 as uuidv4 } from "uuid";

export const getPresetsAction: Action = {
    name: "CANVAS_GET_PRESETS",
    similes: [
        "LIST_PRESETS",
        "FETCH_PRESETS",
        "SHOW_PRESETS",
        "GET_COIN_PRESETS",
        "RETRIEVE_PRESETS",
        "LOAD_PRESETS",
        "AVAILABLE_PRESETS",
        "PRESET_OPTIONS",
        "DISPLAY_PRESETS",
        "PRESET_LIST",
    ],
    description: "Get Canvas presets.",
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
            const text =
                state.recentMessagesData[state.recentMessagesData.length - 1]
                    .content.text;
            const match = text.match(
                /\b(?:hoodie|hoody|sweatshirt|jumper|pullover)|(?:t-shirt|tshirt|tee|shirt|blouse|top)|(?:sticker|decal|label|adhesive)|(?:poster|print|artwork|canvas|wallpaper)\b/i
            );
            let template: string = "";
            if (match) {
                template = match[0].toLowerCase();
            } else {
                elizaLogger.success("No valid item found.");
                return false;
            }

            if (template == "") {
                elizaLogger.success("No valid item found.");
                return false;
            }

            const allPresets = await canvasService.getPresets(template);
            elizaLogger.success(`Successfully fetched presets`);
            if (callback) {
                callback({
                    text: `Now, let's start synthing each preset. Which preset do you want to start with and what kind of design do you want to fill the preset? I'll help you workshop it.`,
                    attachments: allPresets.map((item) => ({
                        url: `${config.IPFS_GATEWAY}${item.image?.split("ipfs://")}`,
                        title: item.type,
                        description: `${item.category} -> ${item.type}`,
                        id: uuidv4(),
                        source: item.image,
                        text: `${item.category} -> ${item.type}`,
                    })),
                });
                return true;
            }
        } catch (error: any) {
            elizaLogger.error("Error in presets plugin handler:", error);
            callback({
                text: `Error fetching presets: ${error.message}`,
                content: { error: error.message },
            });
            return false;
        }
    },
    examples: canvasExamples as ActionExample[][],
} as Action;
