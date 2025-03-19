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

export const synthPresetAction: Action = {
    name: "CANVAS_SYNTH_PRESET",
    similes: [
        "GET_SYNTH_PRESET",
        "FETCH_SYNTH_PRESET",
        "LOAD_SYNTH_PRESET",
        "SHOW_SYNTH_PRESET",
        "SYNTHESIZER_PRESET",
        "SYNTH_PRESET_OPTIONS",
        "AVAILABLE_SYNTH_PRESETS",
        "LIST_SYNTH_PRESETS",
        "RETRIEVE_SYNTH_PRESET",
        "SYNTH_CONFIG",
    ],
    description: "Synth Canvas preset.",
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
            let preset: string = "";
            if (match) {
                preset = match[0].toLowerCase();
            } else {
                elizaLogger.success("No valid item found.");
                return false;
            }

            if (preset == "") {
                elizaLogger.success("No valid item found.");
                return false;
            }

            const combinedPreset = await canvasService.synthesize(preset);
            elizaLogger.success(`Successfully fetched presets`);
            if (callback) {
                callback({
                    text: `Great, what do you think about this?`,
                    attachments: [
                        {
                            url: `${config.IPFS_GATEWAY}${combinedPreset}`,
                            title: "preset-synthed",
                            description: "preset-synthed",
                            id: uuidv4(),
                            source: combinedPreset,
                            text: "preset-synthed",
                        },
                    ],
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
