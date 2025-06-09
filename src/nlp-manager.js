import * as nlp from 'node-nlp';
import { v4 as uuidV4 } from 'uuid'
import { createRequestInstance } from './integrations/ai.js';

const trainingData = [
    {
        intent: 'developer.info',
        utterances: [
            'кто тебя создал',
            'расскажи о разработчике',
            'кто твой создатель',
            'информация о разработчике'
        ],
        answers: [
            'Меня разработал студент группы ИС-3-23',
            'Разработчик: студент 2 курса группы ИС-3-23',
            'Создатель: ИС-3-23, проект от 13.02.2025'
        ]
    },
    {
        intent: 'greeting',
        utterances: [
            'привет',
            'здравствуй',
            'добрый день',
            'хай'
        ],
        answers: [
            'Привет! Чем могу помочь?',
            'Здравствуйте! Задайте ваш вопрос',
            'Приветствую! Я готов отвечать на вопросы'
        ]
    },
    {
        intent: 'bot.capabilities',
        utterances: [
            'что ты умеешь',
            'твои возможности',
            'какие функции',
            'твой функционал'
        ],
        answers: [
            'Я могу отвечать на вопросы и помогать с информацией',
            'Мои функции: обработка запросов, ответы на вопросы, предоставление информации',
            'Основные возможности: NLP-обработка запросов, генерация ответов'
        ]
    },
    {
        intent: 'bot.question',
        utterances: [],
        answers: [],
    }
];

const manager = new nlp.NlpManager({
    languages: ['ru'],
    forceNER: true,
    nlu: { log: true }
});

let modelLoaded = false;

// Добавление данных для обучения
export function addTrainingData() {
    trainingData.forEach(data => {
        data.utterances.forEach(utterance => {
            manager.addDocument('ru', utterance, data.intent);
        });

        data.answers.forEach(answer => {
            manager.addAnswer('ru', data.intent, answer);
        });
    });
}

export async function createAiRequest(text) {
    const axiosInstance = createRequestInstance({ apiUrl: 'https://openrouter.ai/api/v1', secure: { header: 'Authorization' } })

    const data = await axiosInstance(
        'POST',
        'chat/completions',
        `Bearer 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`,
        {
            model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
            messages: [{ role: 'user', content: text }]
        },
    )

    if (!data?.choices?.length) {
        console.log(data)
        return ''
    }

    return data?.choices[0]?.message?.content || ''
}

export async function addIntentToModel(intentData) {

    // Добавляем новые примеры фраз
    for (const utterance of intentData.utterances) {
        manager.addDocument('ru', utterance, intentData.intent);
    }

    // Добавляем новые ответы
    for (const answer of intentData.answers) {
        manager.addAnswer('ru', intentData.intent, answer);
    }

    // Дообучаем модель только на новых данных
    await manager.train();

    // Сохраняем обновленную модель
    await manager.save('./model.nlp');

    console.log(`✅ Интент "${intentData.intent}" успешно добавлен!`);
}

async function addNewField(utterance = '', answer = '', intent = 'bot.question') {
    const uuid = uuidV4();
    const intentHash = `${intent}-${uuid}`;

    await addIntentToModel({ intent: intentHash, utterances: [utterance], answers: [answer] })
    return answer;
}

// Обучение и сохранение модели
export async function trainModel() {
    console.log('🔄 Обучение модели...');
    addTrainingData();
    await manager.train();
    await manager.save('./model.nlp');
    console.log('✅ Модель обучена и сохранена');
}

// Загрузка модели
export async function loadNlpModel() {
    if (modelLoaded) {
        return;
    }

    try {
        await manager.load('./model.nlp');
        console.log('🔧 Модель NLP загружена');
        modelLoaded = true;
    } catch (e) {
        console.log('⚠️ Модель не найдена, начинаю обучение...');
        await trainModel();
    }
}

// Обработка сообщения
export async function processMessage(text) {
    if (!modelLoaded) {
        await loadNlpModel();
    }

    const response = await manager.process('ru', text);
    if (!response.answer) {
        const generatedData = await createAiRequest(text)

        return await addNewField(text, generatedData)
    }

    return response.answer || '';
}

// Точка входа для обучения
if (process.argv.includes('train')) {
    (async () => {
        try {
            console.log('🚀 Начало обучения модели...');
            await trainModel();
            console.log('🎉 Обучение завершено успешно!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Ошибка при обучении модели:', error);
            process.exit(1);
        }
    })();
}
