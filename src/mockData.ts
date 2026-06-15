import { Client, WeeklyReport, MonthlyReport } from './types';

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'maria-34',
    name: 'Мария Семенова',
    age: 34,
    focus: 'нутрициология',
    startDate: '2026-05-15',
    habits: ['Вода 2л', 'Овощи в каждый прием', 'Без сладкого после 18:00', 'Контроль порций']
  },
  {
    id: 'alex-41',
    name: 'Алексей Петров',
    age: 41,
    focus: 'нейрокоучинг',
    startDate: '2026-05-10',
    habits: ['Медитация 10 мин', 'Без гаджетов за час до сна', 'Дыхательная пауза 4-7-8', 'Прогулка 30 мин']
  },
  {
    id: 'elena-28',
    name: 'Елена Кузнецова',
    age: 28,
    focus: 'комплексный',
    startDate: '2026-05-20',
    habits: ['Шаги 10 000', 'Дневник благодарности', 'Прием нутрицевтиков', 'Сон до 23:00']
  }
];

export const MOCK_WEEKLY_REPORTS: WeeklyReport[] = [
  // --- МАРИЯ (Неделя 1-4) ---
  {
    id: 'w-maria-1',
    clientId: 'maria-34',
    date: '2026-05-22',
    sleepQuality: 6,
    energyMorning: 5,
    energyEvening: 3,
    stressLevel: 6,
    nutritionQuality: 5,
    waterIntake: 1.2,
    habitsCompleted: { 'Вода 2л': false, 'Овощи в каждый прием': true, 'Без сладкого после 18:00': false, 'Контроль порций': false },
    wins: 'Начала отслеживать питание и добавила зелень в рацион.',
    obstacles: 'Сложно пить норму воды, вечером тянет на сладкое из-за усталости после работы.',
    focusNextWeek: 'Постараться выпивать стакан воды сразу после пробуждения и держать фокус на порциях.'
  },
  {
    id: 'w-maria-2',
    clientId: 'maria-34',
    date: '2026-05-29',
    sleepQuality: 7,
    energyMorning: 6,
    energyEvening: 4,
    stressLevel: 5,
    nutritionQuality: 7,
    waterIntake: 1.7,
    habitsCompleted: { 'Вода 2л': true, 'Овощи в каждый прием': true, 'Без сладкого после 18:00': true, 'Контроль порций': true },
    wins: 'Почти всю неделю контролировала порции. Сладкое вечером заменила на травяной чай с мятой.',
    obstacles: 'В среду на дне рождения коллеги съела кусок торта, ругала себя.',
    focusNextWeek: 'Убрать самокритику, сфокусироваться на осознанном жевании.'
  },
  {
    id: 'w-maria-3',
    clientId: 'maria-34',
    date: '2026-06-05',
    sleepQuality: 7,
    energyMorning: 7,
    energyEvening: 5,
    stressLevel: 4,
    nutritionQuality: 8,
    waterIntake: 1.9,
    habitsCompleted: { 'Вода 2л': true, 'Овощи в каждый прием': true, 'Без сладкого после 18:00': true, 'Контроль порций': true },
    wins: 'Стабильно пью воду. Пропала тяжесть в животе. Вечером засыпаю легче.',
    obstacles: 'В выходные ездила на дачу, было сложно придерживаться режима без заготовок еды.',
    focusNextWeek: 'Готовить рацион заранее на выходные.'
  },
  {
    id: 'w-maria-4',
    clientId: 'maria-34',
    date: '2026-06-12',
    sleepQuality: 8,
    energyMorning: 8,
    energyEvening: 6,
    stressLevel: 3,
    nutritionQuality: 9,
    waterIntake: 2.0,
    habitsCompleted: { 'Вода 2л': true, 'Овощи в каждый прием': true, 'Без сладкого после 18:00': true, 'Контроль порций': true },
    wins: 'Вес уходит плавно, объемы тают. Спокойно смотрю на сладкое. Уровень энергии выровнялся.',
    obstacles: 'Стресс на работе из-за отчетов, но не стала "заедать" его шоколадом.',
    focusNextWeek: 'Закрепить результат, добавить легкую вечернюю растяжку.'
  },

  // --- АЛЕКСЕЙ (Неделя 1-4) ---
  {
    id: 'w-alex-1',
    clientId: 'alex-41',
    date: '2026-05-17',
    sleepQuality: 4,
    energyMorning: 3,
    energyEvening: 2,
    stressLevel: 8,
    nutritionQuality: 6,
    waterIntake: 1.0,
    habitsCompleted: { 'Медитация 10 мин': false, 'Без гаджетов за час до сна': false, 'Дыхательная пауза 4-7-8': true, 'Прогулка 30 мин': false },
    wins: 'Начал делать дыхательную практику в моменты пикового стресса на работе. Помогает прийти в себя.',
    obstacles: 'Высокая когнитивная нагрузка. Ложусь спать с телефоном, долго не могу уснуть, прокручиваю задачи.',
    focusNextWeek: 'Внедрить жесткое правило: убирать телефон в другую комнату после 22:00.'
  },
  {
    id: 'w-alex-2',
    clientId: 'alex-41',
    date: '2026-05-24',
    sleepQuality: 5,
    energyMorning: 4,
    energyEvening: 3,
    stressLevel: 7,
    nutritionQuality: 5,
    waterIntake: 1.3,
    habitsCompleted: { 'Медитация 10 мин': true, 'Без гаджетов за час до сна': true, 'Дыхательная пауза 4-7-8': true, 'Прогулка 30 мин': false },
    wins: 'Три раза медитировал по утрам. Заметил, что стал менее раздражителен с коллегами.',
    obstacles: 'Из-за завалов по работе не успеваю гулять. К вечеру голова буквально "кипит".',
    focusNextWeek: 'Делать 10-минутную прогулку в обеденный перерыв вокруг офиса.'
  },
  {
    id: 'w-alex-3',
    clientId: 'alex-41',
    date: '2026-05-31',
    sleepQuality: 7,
    energyMorning: 6,
    energyEvening: 5,
    stressLevel: 5,
    nutritionQuality: 7,
    waterIntake: 1.5,
    habitsCompleted: { 'Медитация 10 мин': true, 'Без гаджетов за час до сна': true, 'Дыхательная пауза 4-7-8': true, 'Прогулка 30 мин': true },
    wins: 'Сон значительно улучшился! Засыпаю за 15-20 минут без чтения новостей. Стал гулять в обед.',
    obstacles: 'Сложно концентрироваться во второй половине дня, хочется выпить 3-ю чашку кофе.',
    focusNextWeek: 'Заменить послеобеденный кофе на зеленый чай или дыхательную сессию.'
  },
  {
    id: 'w-alex-4',
    clientId: 'alex-41',
    date: '2026-06-07',
    sleepQuality: 8,
    energyMorning: 8,
    energyEvening: 6,
    stressLevel: 4,
    nutritionQuality: 7,
    waterIntake: 1.6,
    habitsCompleted: { 'Медитация 10 мин': true, 'Без гаджетов за час до сна': true, 'Дыхательная пауза 4-7-8': true, 'Прогулка 30 мин': true },
    wins: 'Чувствую ясность ума. Научился разделять рабочие задачи и отдых. Медитирую каждый день.',
    obstacles: 'Иногда срываюсь на быстрые углеводы при дедлайнах.',
    focusNextWeek: 'Продолжать коучинговую работу со страхом "не успеть все вовремя".'
  },

  // --- ЕЛЕНА (Неделя 1-4) ---
  {
    id: 'w-elena-1',
    clientId: 'elena-28',
    date: '2026-05-27',
    sleepQuality: 6,
    energyMorning: 5,
    energyEvening: 4,
    stressLevel: 6,
    nutritionQuality: 7,
    waterIntake: 1.5,
    habitsCompleted: { 'Шаги 10 000': false, 'Дневник благодарности': true, 'Прием нутрицевтиков': true, 'Сон до 23:00': false },
    wins: 'Начала вести дневник благодарности по вечерам, это снижает тревожность.',
    obstacles: 'Засиживаюсь за сериалами допоздна, тяжело вставать в 7 утра.',
    focusNextWeek: 'Ставить будильник на подготовку ко сну в 22:30.'
  },
  {
    id: 'w-elena-2',
    clientId: 'elena-28',
    date: '2026-06-03',
    sleepQuality: 7,
    energyMorning: 7,
    energyEvening: 5,
    stressLevel: 5,
    nutritionQuality: 8,
    waterIntake: 1.8,
    habitsCompleted: { 'Шаги 10 000': true, 'Дневник благодарности': true, 'Прием нутрицевтиков': true, 'Сон до 23:00': true },
    wins: 'Ложилась спать до 23:00 четыре раза за неделю! Просыпаться стало заметно легче.',
    obstacles: 'Сидячая работа, к вечеру болит спина, сложно добирать шаги.',
    focusNextWeek: 'Парковать машину дальше от работы, делать легкую разминку каждые 2 часа.'
  },
  {
    id: 'w-elena-3',
    clientId: 'elena-28',
    date: '2026-06-10',
    sleepQuality: 8,
    energyMorning: 8,
    energyEvening: 6,
    stressLevel: 4,
    nutritionQuality: 8,
    waterIntake: 1.9,
    habitsCompleted: { 'Шаги 10 000': true, 'Дневник благодарности': true, 'Прием нутрицевтиков': true, 'Сон до 23:00': true },
    wins: 'Выполняю норму по шагам. Заметила улучшение состояния кожи (уменьшились высыпания).',
    obstacles: 'Забываю выпить дневную порцию витаминов, если не держу их на столе.',
    focusNextWeek: 'Разложить витамины по таблетницам и положить на видное место.'
  },
  {
    id: 'w-elena-4',
    clientId: 'elena-28',
    date: '2026-06-17',
    sleepQuality: 9,
    energyMorning: 9,
    energyEvening: 7,
    stressLevel: 3,
    nutritionQuality: 9,
    waterIntake: 2.1,
    habitsCompleted: { 'Шаги 10 000': true, 'Дневник благодарности': true, 'Прием нутрицевтиков': true, 'Сон до 23:00': true },
    wins: 'Потрясающее самочувствие. Полный контроль над привычками. Кожа чистая, энергии вагон.',
    obstacles: 'Не было значительных трудностей на этой неделе.',
    focusNextWeek: 'Продолжать поддерживать текущую рутину сна и активности.'
  }
];

export const MOCK_MONTHLY_REPORTS: MonthlyReport[] = [
  {
    id: 'm-maria-1',
    clientId: 'maria-34',
    date: '2026-06-12',
    weight: 69.5, // старт 72.0
    waist: 74, // старт 78
    hips: 101, // старт 104
    chest: 93, // старт 95
    skinHairCondition: 'Кожа стала заметно чище, уменьшилась отечность лица по утрам. Волосы стали меньше выпадать благодаря восполнению дефицитов.',
    cognitiveShifts: 'Перестала воспринимать еду как единственный источник удовольствия и утешения после стресса. Появилось осознание голода и сытости.',
    coachingInsights: 'Поняла, что вечернее переедание было связано с тем, что я не доедала в обед. Полноценный сытный обед решает проблему вечернего голода.'
  },
  {
    id: 'm-alex-1',
    clientId: 'alex-41',
    date: '2026-06-07',
    weight: 83.2, // старт 84.0
    waist: 92, // старт 94
    hips: 104, // старт 105
    chest: 108, // старт 108
    skinHairCondition: 'Без видимых изменений, но общее ощущение свежести лица из-за нормализации сна.',
    cognitiveShifts: 'Улучшилась концентрация внимания. Раньше переключался между вкладками каждые 5 минут, сейчас могу держать фокус на одной задаче до 45 минут.',
    coachingInsights: 'Медитация — это не эзотерика, а тренировка внимания и тормозных систем мозга. Она дает реальный физиологический контроль над стрессом.'
  },
  {
    id: 'm-elena-1',
    clientId: 'elena-28',
    date: '2026-06-17',
    weight: 57.2, // старт 58.5
    waist: 65, // старт 68
    hips: 94, // старт 96
    chest: 88, // старт 89
    skinHairCondition: 'Кожа сияет, полностью прошли мелкие воспаления на щеках. Волосы выглядят более блестящими.',
    cognitiveShifts: 'Отказ от ночных посиделок у экрана дал колоссальный прирост продуктивности днем. Меньше прокрастинирую.',
    coachingInsights: 'Забота о себе — это не спа-салоны раз в месяц, а ежедневное вовремя убранное в сторону мобильное устройство перед сном.'
  }
];
