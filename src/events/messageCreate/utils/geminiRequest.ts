import { Config } from "@core/Config";
import { GoogleGenAI } from "@google/genai";
import { EventUtil } from "@structures/core/EventUtil";
import { heading, HeadingLevel, Message } from "discord.js";

const ai = new GoogleGenAI({});

export const run: EventUtil["run"] = async (_, message: Message) => {
    if (
        !message.content.startsWith("Mahiru, ") ||
        !Config.botOwners.includes(message.author.id) ||
        !message.channel.isSendable()
    ) {
        return;
    }

    const content = message.content.substring(8).trim();

    if (!content) {
        return;
    }

    void message.channel.sendTyping();

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: content,
        config: {
            systemInstruction:
                // lol system instruction but let's see for now
                "You are a personalized AI assistant contained within a Discord bot. Respond to the user's request in a helpful and informative manner, and with less than 1850 characters.",
        },
    });

    let text = response.text;

    if (text) {
        text += `\n\n-${heading("This is an AI generated response. Please verify its accuracy.", HeadingLevel.One)}`;
    } else {
        text = "The model did not return a response.";
    }

    await message.reply({
        content: text,
        allowedMentions: { repliedUser: false },
    });
};

export const config: EventUtil["config"] = {
    description: "Responsible for handling Gemini requests.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
