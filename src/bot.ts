import { Telegraf } from 'telegraf';
import { config } from 'dotenv';

import { aboutHandler, startHandler, textHandler } from './bot/handler.ts'

// Загрузка конфигурации
config();

// Проверка токена
if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN must be provided in .env file');
}

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('start', (ctx) => {
    const data = startHandler(ctx);
    ctx.reply(data.message, data?.reply_markup || {})
})

bot.command('about', (ctx) => {
    const data = aboutHandler(ctx);
    ctx.reply(data.message)
})

// Обработка команды /hello
bot.command('hello', (ctx) => {
    const name = ctx.from?.first_name || 'друг';
    ctx.reply(`Привет, ${name}! 👋`);
    console.log(`Пользователь ${ctx.from?.id} использовал /hello`);
});

bot.on('text', async (ctx) => {
    if ('text' in ctx) {
        const data = await textHandler(ctx)

        await ctx.replyWithMarkdown(data.message, data?.reply_markup || {})
    }
})

// Обработка ошибок
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('Упс! Что-то пошло не так 😵');
});

// Запуск бота
bot.launch()
    .then(() => console.log('🤖 Бот запущен!'))
    .catch(err => console.error('Ошибка запуска:', err));

// Грациозное завершение
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
