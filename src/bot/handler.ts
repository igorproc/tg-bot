import { Context } from 'telegraf';
// @ts-ignore
import { processMessage } from '../nlp-manager.js';

type BotCommandHandler = (ctx: Context) => {
    message: string,
    reply_markup?: unknown
};

// /start

export const startHandler: BotCommandHandler = (ctx) => {
    return {
        message: '🤖 Привет! Я ИИ-бот. Задайте мне вопрос!\n' +
            '👉 /about - информация о разработчике',
        reply_markup: {
            keyboard: [[{ text: 'О разработчике' }]],
            resize_keyboard: true
        }
    }
};

// /about
export const aboutHandler: BotCommandHandler = (ctx) => {
    return {
        message: `
          🧑‍💻 Просвирнин Игорь: 
          Студент группы ИС-3-23
          Курс: 2
          Дата создания: 13.02.2025
          Технологии: Telegraf, NLP, TypeScript
        `
    };
};

// text

export const textHandler = async (ctx: Context & { message: { text: string } }): Promise<ReturnType<BotCommandHandler>> => {
    const messageText = ctx.message.text.toLowerCase();

    if (messageText.includes('разработчик') || messageText.includes('создатель')) {
        return aboutHandler(ctx);
    }

    try {
        const response = await processMessage(ctx.message.text);

        return { message: response || 'Извините, я не понял вопрос 🤔' };
    } catch (error) {
        console.error('Ошибка обработки сообщения:', error);
        return { message: 'Произошла ошибка при обработке запроса' }
    }
};
