import TelegramBot from "node-telegram-bot-api";
import { run } from "./model.js";
import "dotenv/config";

const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  console.log(text);
  const result = await run(text);
  console.log(result);
  const response = result.pop();
  if (response) {
    const jsonResponseContent = JSON.parse(response.content);
    if (jsonResponseContent.type == "text") {
      bot.sendMessage(chatId, jsonResponseContent.text_content);
    } else {
      bot.sendMessage(chatId, JSON.stringify(jsonResponseContent));
    }
  }
});
