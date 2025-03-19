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

export const getTemplatesAction: Action = {
    name: "CANVAS_GET_TEMPLATES",
    similes: [
        "LIST_TEMPLATES",
        "FETCH_TEMPLATES",
        "SHOW_TEMPLATES",
        "GET_COIN_TEMPLATES",
        "RETRIEVE_TEMPLATES",
        "LOAD_TEMPLATES",
        "AVAILABLE_TEMPLATES",
        "TEMPLATE_OPTIONS",
        "DISPLAY_TEMPLATES",
        "TEMPLATE_LIST",
    ],
    description: "Get Canvas templates.",
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

            let format: string = "";
            if (match) {
                const category = match[0].toLowerCase();

                if (/hoodie|hoody|sweatshirt|jumper|pullover/.test(category)) {
                    format = "hoodie";
                } else if (
                    /t-shirt|tshirt|tee|shirt|blouse|top/.test(category)
                ) {
                    format = "shirt";
                } else if (/sticker|decal|label|adhesive/.test(category)) {
                    format = "sticker";
                } else if (
                    /poster|print|artwork|canvas|wallpaper/.test(category)
                ) {
                    format = "poster";
                }
            } else {
                elizaLogger.success("No valid item found.");
                return false;
            }

            if (format == "") {
                elizaLogger.success("No valid item found.");
                return false;
            }

            const allTemplates = await canvasService.getTemplates(format);

            elizaLogger.success(`Successfully fetched Templates`);
            if (callback) {
                callback({
                    text: `Now select from the ${format} templates.`,
                    attachments: allTemplates.map((item) => ({
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
            elizaLogger.error("Error in Templates plugin handler:", error);
            callback({
                text: `Error fetching templates: ${error.message}`,
                content: { error: error.message },
            });
            return false;
        }
    },
    examples: canvasExamples as ActionExample[][],
} as Action;
