import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowsClockwise,
  CalendarBlank,
  CaretRight,
  Check,
  Copy,
  DownloadSimple,
  FingerprintSimple,
  ShareNetwork,
  Sparkle,
  X,
} from "@phosphor-icons/react";

const MAX_REROLLS = 3;
const USER_SEED_KEY = "ne-segodnya:user-seed-v1";
const assetUrl = (filename) => `${import.meta.env.BASE_URL}${filename}`;

// [название, неблагоприятное состояние, благоприятное состояние]
const PLANETS = [
  ["Меркурий", "пересекает теневой сектор", "выравнивает деловые орбиты"],
  ["Луна", "остаётся без курса", "входит в фазу ясных решений"],
  ["Венера", "закрывает контур обмена", "смягчает переговорные углы"],
  ["Марс", "разворачивает импульс внутрь", "выдаёт запас рабочей энергии"],
  ["Юпитер", "увеличивает цену поспешных обещаний", "расширяет окно возможностей"],
  ["Сатурн", "ставит печать на новых обязательствах", "наводит порядок в сроках"],
  ["Уран", "нарушает привычный ритм решений", "подбрасывает решение старой задачи"],
  ["Нептун", "размывает границы срочного", "подсказывает верные формулировки"],
  ["Плутон", "требует полной остановки процессов", "завершает затянувшийся цикл"],
  ["Северный узел", "отводит путь от рабочих задач", "указывает на главную задачу дня"],
  ["Хирон", "обнажает уязвимость дедлайнов", "исцеляет застарелый завал"],
  ["Чёрная Луна", "гасит свет деловой инициативы", "отступает от рабочего сектора"],
  ["Белая Луна", "охраняет право на бездействие", "благословляет короткий рывок"],
];

const HOUSES = [
  "в доме незавершённых обещаний",
  "в секторе служебной переписки",
  "над линией финансовых ожиданий",
  "в поле чужих срочных запросов",
  "у границы коллективной ответственности",
  "в созвездии отложенных решений",
  "над осью профессиональной репутации",
  "в доме повторяющихся переделок",
  "в секторе ложной продуктивности",
  "у порога новых договорённостей",
  "в зоне хрупких дедлайнов",
  "над картой клиентских ожиданий",
  "в доме цифрового истощения",
  "на линии бесполезных созвонов",
  "в секторе преждевременных ответов",
  "над полем административной суеты",
  "в доме тихого восстановления",
];

// [знак, следствие]
const OMENS = {
  neg: [
    ["лунный узел удерживает любые ответы", "Всё отправленное сегодня потребует тройной переделки."],
    ["звёздный меридиан скрыт облаком сомнений", "Даже ясная задача примет противоположный смысл."],
    ["печать Альдебарана запрещает спешку", "Каждый дедлайн сегодня является оптической иллюзией."],
    ["руна Иса замораживает деловую инициативу", "Попытка ускориться лишь продлит ожидание."],
    ["три теневых аспекта образуют замкнутый круг", "Решения будут возвращаться к исходной точке."],
    ["карта дня показывает дефицит земной стихии", "Практические действия лишены космической опоры."],
    ["северный ветер Оракула стирает контекст", "Любые сообщения будут поняты слишком буквально."],
    ["созвездие Ворона собирает чужие задачи", "Работа незаметно умножится без вашего согласия."],
    ["зеркало Нептуна удваивает ошибки", "Одна правка неизбежно породит две новые."],
    ["комета молчания проходит над календарём", "Самое продуктивное действие — не отвечать."],
    ["солнечные часы показывают время внутренней тишины", "Внешняя активность нарушит естественный ход событий."],
    ["аркан Отшельника выпал лицом к ноутбуку", "Совместная работа сегодня противопоказана."],
    ["руна Перт скрывает последствия решений", "Согласие на задачу откроет нежелательную ветвь реальности."],
    ["Сириус не подтверждает полномочия календаря", "Ни одна встреча не обладает достаточной законностью."],
    ["фаза тёмной воды отменяет деловые обещания", "Все договорённости лучше оставить до рассвета."],
    ["магический квадрат дня не сходится по срокам", "Попытка всё успеть нарушит баланс недели."],
    ["небесный архив проводит переиндексацию судьбы", "Новые дела могут быть безвозвратно потеряны."],
    ["знак пустой ладони требует оставить её пустой", "Брать новые задачи сегодня небезопасно."],
    ["тринадцатая звезда требует паузы", "Любая занятость будет расценена космосом как самоуправство."],
  ],
  mid: [
    ["весы дня застыли между «надо» и «потом»", "Половина задач пройдёт легко, вторая — отложится сама."],
    ["Меркурий и Луна не договорились о приоритетах", "Начатое до обеда завершится, начатое после — перенесётся."],
    ["карта дня разделена линией терминатора", "Простые задачи благословлены, сложные — под вопросом."],
    ["маятник Оракула качается без остановки", "Решения стоит принимать только по чётным часам."],
    ["руна Соулу светит сквозь облако", "Энергии хватит ровно на половину списка."],
    ["звёздный меридиан открыт лишь частично", "Письма пройдут, созвоны — на свой страх и риск."],
    ["Колесо Фортуны застыло на ребре", "Итог дня решит первая же выполненная задача."],
    ["покровитель трудящихся ушёл в полутень", "Работа возможна, но только по любви, не по принуждению."],
  ],
  pos: [
    ["тройной аспект удачи накрывает рабочий сектор", "Задачи будут решаться быстрее, чем вы успеете их записать."],
    ["руна Феху развернулась доходной стороной", "Всё сделанное сегодня окупится вдвойне."],
    ["Сириус подтверждает полномочия вашего календаря", "Каждая встреча пройдёт на удивление по делу."],
    ["комета вдохновения проходит точно над ноутбуком", "Идеи будут приходить раньше, чем проблемы."],
    ["магический квадрат дня сошёлся с первого раза", "Дедлайны сегодня играют на вашей стороне."],
    ["аркан Мага выпал лицом к клавиатуре", "Сложное будет казаться простым — пользуйтесь."],
    ["небесный архив открыл ваш лучший черновик судьбы", "Начатое сегодня может стать делом года."],
    ["солнечные часы показывают время громких решений", "Смелые предложения будут услышаны."],
  ],
};

const ADVICE = {
  neg: [
    "Закройте ноутбук до следующего рассвета.",
    "Перенесите решения и выберите наблюдение.",
    "Разрешены только чай, прогулка и редкие сообщения.",
    "Сохраняйте молчание до смены лунного часа.",
    "Не начинайте нового и не улучшайте старого.",
    "Отмените созвоны во имя сохранения реальности.",
    "Проведите день вне зоны деловой досягаемости.",
    "Доверьте срочное более благоприятной версии себя.",
    "Зафиксируйте паузу и не объясняйте её дважды.",
    "До завтра допустимы только мягкие бытовые ритуалы.",
    "Любое действие замените внимательным бездействием.",
    "Сохраните силы: звёзды уже оформили разрешение.",
    "Оставьте рабочий статус в положении «недоступен».",
  ],
  mid: [
    "Делайте лёгкое, тяжёлое оставьте звёздам.",
    "Работайте до первого зевка — сегодня он вещий.",
    "Один важный шаг — и совесть чиста перед космосом.",
    "Соглашайтесь на встречи, но не на дедлайны.",
    "Сегодня половина усилий дороже целых.",
    "Начинайте с малого: большое подтянется само.",
    "Перечитывайте написанное дважды — Меркурий подглядывает.",
  ],
  pos: [
    "Берите самое сложное — сегодня оно поддастся.",
    "Отправляйте смелые письма до заката.",
    "Ставьте главное на первую половину дня.",
    "Просите о повышении, пока аспект действует.",
    "Закройте старый долг — космос спишет проценты.",
    "Начинайте то, что откладывали с прошлой луны.",
    "Такой день жалко тратить на прокрастинацию.",
  ],
};

const TEMPLATES = {
  neg: [
    ({ planet, state, house, omen, impact, advice }) =>
      `${planet} ${state} ${house}, а ${omen}. ${impact} ${advice}`,
    ({ planet, state, house, omen, impact, advice }) =>
      `${impact} Причина: ${planet} ${state} ${house}; вдобавок ${omen}. ${advice}`,
    ({ planet, state, house, omen, advice }) =>
      `Оракул зафиксировал: ${planet} ${state} ${house}. Дополнительный знак — ${omen}. ${advice}`,
    ({ planet, state, house, impact, advice }) =>
      `Рабочий сценарий отклонён: ${planet} ${state} ${house}. ${impact} ${advice}`,
  ],
  mid: [
    ({ planet, state, house, omen, impact, advice }) =>
      `${planet} ${state} ${house}, при этом ${omen}. ${impact} ${advice}`,
    ({ planet, state, house, omen, advice }) =>
      `Карта дня двойственна: ${planet} ${state} ${house}, и ${omen}. ${advice}`,
    ({ planet, state, house, omen, impact, advice }) =>
      `${impact} Расклад таков: ${planet} ${state} ${house}; ${omen}. ${advice}`,
    ({ planet, state, house, omen, impact, advice }) =>
      `Оракул пожимает плечами: ${planet} ${state} ${house}, но ${omen}. ${impact} ${advice}`,
  ],
  pos: [
    ({ planet, state, house, omen, impact, advice }) =>
      `${planet} ${state} ${house}, а ${omen}. ${impact} ${advice}`,
    ({ planet, state, house, omen, impact, advice }) =>
      `Редкая конфигурация: ${planet} ${state} ${house}; к тому же ${omen}. ${impact} ${advice}`,
    ({ planet, state, house, omen, impact, advice }) =>
      `${impact} Основание: ${planet} ${state} ${house}, и ${omen}. ${advice}`,
    ({ planet, state, house, omen, advice }) =>
      `Оракул доволен: ${planet} ${state} ${house}. Дополнительный знак — ${omen}. ${advice}`,
  ],
};

const TIERS = [
  {
    min: 0,
    polarity: "neg",
    verdicts: [
      "Сегодня работать нельзя",
      "Рабочий день аннулирован",
      "Космос отменил задачи",
      "Звёзды отклонили труд",
      "Действует запрет на работу",
    ],
    proofTitle: "Работа сегодня противопоказана",
    status: "Освобождён от задач",
  },
  {
    min: 15,
    polarity: "neg",
    verdicts: [
      "Шансы на работу призрачны",
      "Труд сегодня не в фаворе",
      "Работа под большим вопросом",
      "Звёзды советуют не спешить",
      "День почти потерян для дел",
    ],
    proofTitle: "Допуск к работе не выдан",
    status: "Освобождён почти от всего",
  },
  {
    min: 35,
    polarity: "mid",
    verdicts: [
      "День пятьдесят на пятьдесят",
      "Космос колеблется",
      "Возможны отдельные подвиги",
      "Работа на свой страх и риск",
      "Звёзды не против, но и не за",
    ],
    proofTitle: "Допуск выдан частично",
    status: "Допущен к лёгким задачам",
  },
  {
    min: 60,
    polarity: "pos",
    verdicts: [
      "Окно для работы открыто",
      "Звёзды скорее за труд",
      "Работать можно и нужно",
      "День пригоден для дел",
    ],
    proofTitle: "Допуск к работе выдан",
    status: "Допущен к работе",
  },
  {
    min: 80,
    polarity: "pos",
    verdicts: [
      "Звёзды требуют работать",
      "Редкий день рабочей силы",
      "Космос выдал полный допуск",
      "Идеальный день для великих дел",
    ],
    proofTitle: "Полный космический допуск",
    status: "Обязан работать (по звёздам)",
  },
];

const formatDate = (date) =>
  new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dayOfYear = (date) => {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.min(365, Math.max(1, Math.floor((current - start) / 86400000)));
};

const hashString = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createUserSeed = () => {
  const stored = localStorage.getItem(USER_SEED_KEY);
  if (stored) return stored;

  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  const seed = Array.from(bytes, (value) => value.toString(16).padStart(8, "0")).join("");
  localStorage.setItem(USER_SEED_KEY, seed);
  return seed;
};

const rerollKey = (date, userSeed) => `ne-segodnya:rerolls:${userSeed.slice(0, 8)}:${isoDate(date)}`;

const readRerolls = (date, userSeed) => {
  const value = Number.parseInt(localStorage.getItem(rerollKey(date, userSeed)) ?? "0", 10);
  return Number.isFinite(value) ? Math.min(MAX_REROLLS, Math.max(0, value)) : 0;
};

const pick = (list, hash, salt) => list[(hash + salt) % list.length];

const getReading = (date, userSeed, rerollCount) => {
  const day = dayOfYear(date);
  const key = `${userSeed}:${isoDate(date)}:${rerollCount}`;
  const personalHash = hashString(userSeed);
  const personalMark = personalHash.toString(16).padStart(8, "0").slice(-4).toUpperCase();

  // Шанс на работу: перекос в сторону низких значений (u^2.4)
  const u = hashString(`${key}:chance`) / 4294967296;
  const chance = Math.round(100 * Math.pow(u, 2.4));

  const tier = [...TIERS].reverse().find((item) => chance >= item.min);
  const { polarity } = tier;

  const detailHash = hashString(`${key}:detail`);
  const [planet, adverse, favorable] = pick(PLANETS, detailHash, 0);
  const state =
    polarity === "neg" ? adverse : polarity === "pos" ? favorable : detailHash % 2 ? adverse : favorable;
  const house = pick(HOUSES, detailHash, 101);
  const [omen, impact] = pick(OMENS[polarity], detailHash, 211);
  const advice = pick(ADVICE[polarity], detailHash, 307);
  const verdict = pick(tier.verdicts, detailHash, 401);
  const template = pick(TEMPLATES[polarity], detailHash, 503);
  const explanation = template({ planet, state, house, omen, impact, advice });

  const risk = Math.min(97, Math.max(3, 100 - chance + ((detailHash % 9) - 4)));

  return {
    day,
    code: `МК-${String(day).padStart(3, "0")}/365 · ${personalMark}-${rerollCount + 1}`,
    chance,
    verdict,
    proofTitle: tier.proofTitle,
    status: tier.status,
    planet,
    house,
    personalMark,
    rerollCount,
    impact,
    explanation,
    risk,
  };
};

export function App() {
  const [userSeed] = useState(createUserSeed);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [proofOpen, setProofOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [orbOpen, setOrbOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [rerollCount, setRerollCount] = useState(() => readRerolls(new Date(), userSeed));
  const dateInputRef = useRef(null);
  const reading = useMemo(() => getReading(selectedDate, userSeed, rerollCount), [selectedDate, userSeed, rerollCount]);
  const rerollsLeft = MAX_REROLLS - rerollCount;

  const shareText = `Космическое обоснование ${reading.code}\n${formatDate(selectedDate)}\n\n${reading.verdict}. Шанс на работу: ${reading.chance}%.\n${reading.explanation}\n\nКосмически убедительно. Научно не подтверждено.`;

  useEffect(() => {
    const handleInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handleInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleInstall);
  }, []);

  useEffect(() => {
    setRerollCount(readRerolls(selectedDate, userSeed));
  }, [selectedDate, userSeed]);

  const copyReason = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareReason = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Не сегодня", text: shareText });
    } else {
      await copyReason();
    }
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  const openCalendar = () => {
    setCalendarOpen(true);
    window.setTimeout(() => dateInputRef.current?.showPicker?.(), 120);
  };

  const spinOrb = () => {
    if (spinning || rerollsLeft <= 0) return;

    setSpinning(true);
    window.setTimeout(() => {
      const nextCount = Math.min(MAX_REROLLS, rerollCount + 1);
      localStorage.setItem(rerollKey(selectedDate, userSeed), String(nextCount));
      setRerollCount(nextCount);
      setSpinning(false);
      window.setTimeout(() => setOrbOpen(false), 350);
    }, 1750);
  };

  return (
    <main className="stage">
      <section
        className="mobile-prototype"
        aria-label="Ежедневная оценка шансов на работу"
        style={{ "--cosmic-bg": `url(${assetUrl("cosmic-bg.png")})` }}
      >
        <img className="cosmic-background" src={assetUrl("cosmic-bg.png")} alt="" />

        <div className="app-shell">
          <header className="topbar">
            <div className="brand">
              <img src={assetUrl("astral-chart.png")} alt="" />
              <span>НЕ СЕГОДНЯ?</span>
            </div>
            <button className="date-button" type="button" onClick={openCalendar} aria-label="Выбрать дату">
              <Sparkle weight="fill" size={13} />
              <span>{formatDate(selectedDate)}</span>
              <CaretRight size={17} weight="light" />
            </button>
          </header>

          <section className="hero" aria-labelledby="verdict-title">
            <div className="chart-wrap">
              <img className="astral-chart" src={assetUrl("astral-chart.png")} alt="Астрологическая карта сегодняшнего дня" />
            </div>
            <p className="day-number">
              ЗНАК {String(reading.day).padStart(3, "0")} ИЗ 365
              {rerollCount > 0 && <span> · ПЕРЕБРОС {rerollCount}</span>}
            </p>
            <h1 id="verdict-title">{reading.verdict}</h1>
            <div className="chance-meter" role="img" aria-label={`Шанс на работу ${reading.chance} процентов`}>
              <span className="chance-label">ШАНС НА РАБОТУ</span>
              <span className="chance-value">{reading.chance}%</span>
              <span className="chance-track"><span className="chance-fill" style={{ width: `${Math.max(3, reading.chance)}%` }} /></span>
            </div>
            <p className="reason-copy">{reading.impact}</p>
          </section>

          <div className="actions">
            <button className="primary-button" type="button" onClick={() => setProofOpen(true)}>
              <span className="button-orb"><img src={assetUrl("astral-chart.png")} alt="" /></span>
              <span>Показать обоснование</span>
            </button>
            <button className="orb-trigger" type="button" onClick={() => setOrbOpen(true)}>
              <img src={assetUrl("magic-orb.png")} alt="" />
              <span>{rerollsLeft > 0 ? `Крутить шар · ${rerollsLeft}/3` : "Шар молчит до завтра"}</span>
            </button>
          </div>

          <footer>
            {installPrompt && (
              <button className="install-link" type="button" onClick={installApp}>
                <DownloadSimple size={15} /> Установить приложение
              </button>
            )}
            <p><FingerprintSimple size={11} /> Личный знак {reading.personalMark} · Космически убедительно. Научно не подтверждено.</p>
          </footer>
        </div>

        {orbOpen && (
          <div className="orb-backdrop" role="presentation" onClick={() => !spinning && setOrbOpen(false)}>
            <section className="orb-sheet" role="dialog" aria-modal="true" aria-labelledby="orb-title" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-heading">
                <div>
                  <span className="eyebrow">ЛИЧНЫЙ ОРАКУЛ {reading.personalMark}</span>
                  <h2 id="orb-title">Спросить ещё раз</h2>
                </div>
                <button className="icon-button" type="button" onClick={() => setOrbOpen(false)} disabled={spinning} aria-label="Закрыть шар">
                  <X size={20} />
                </button>
              </div>

              <button className={`orb-stage ${spinning ? "is-spinning" : ""}`} type="button" onClick={spinOrb} disabled={spinning || rerollsLeft <= 0} aria-label="Крутить магический шар">
                <img src={assetUrl("magic-orb.png")} alt="Магический шар с персональным знаком" />
              </button>

              <p className="orb-copy">
                {spinning
                  ? "Звёзды пересчитывают ваши шансы…"
                  : rerollsLeft > 0
                    ? `Шар пересчитает шансы этого дня. Осталось вопросов: ${rerollsLeft}.`
                    : "Все три вопроса заданы. Новый заряд появится после полуночи."}
              </p>

              <button className="primary-button compact orb-spin-button" type="button" onClick={spinOrb} disabled={spinning || rerollsLeft <= 0}>
                <ArrowsClockwise size={19} />
                {spinning ? "Звёзды перестраиваются…" : rerollsLeft > 0 ? "Крутить магический шар" : "Шар разряжен"}
              </button>
            </section>
          </div>
        )}

        {calendarOpen && (
          <div className="sheet-backdrop" role="presentation" onClick={() => setCalendarOpen(false)}>
            <section className="date-sheet" role="dialog" aria-modal="true" aria-labelledby="date-sheet-title" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-heading">
                <div>
                  <span className="eyebrow">АРХИВ ЗНАКОВ</span>
                  <h2 id="date-sheet-title">Выберите день</h2>
                </div>
                <button className="icon-button" type="button" onClick={() => setCalendarOpen(false)} aria-label="Закрыть">
                  <X size={20} />
                </button>
              </div>
              <label className="date-field">
                <CalendarBlank size={22} />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={isoDate(selectedDate)}
                  onChange={(event) => {
                    const [year, month, day] = event.target.value.split("-").map(Number);
                    setSelectedDate(new Date(year, month - 1, day));
                    setCalendarOpen(false);
                  }}
                />
              </label>
              <p>В цикле 365 дней. У каждого дня — свой шанс на работу и своё космическое обоснование.</p>
            </section>
          </div>
        )}

        <section className={`proof-panel ${proofOpen ? "is-open" : ""}`} aria-hidden={!proofOpen} aria-labelledby="proof-title">
          <div className="proof-topbar">
            <button className="icon-button" type="button" onClick={() => setProofOpen(false)} aria-label="Вернуться">
              <ArrowLeft size={21} />
            </button>
            <span>КОСМИЧЕСКОЕ ОБОСНОВАНИЕ</span>
            <button className="icon-button" type="button" onClick={shareReason} aria-label="Поделиться">
              <ShareNetwork size={20} />
            </button>
          </div>

          <div className="proof-content">
            <img className="proof-seal" src={assetUrl("astral-chart.png")} alt="Космическая печать" />
            <p className="proof-code">{reading.code}</p>
            <p className="proof-date">{formatDate(selectedDate)}</p>
            <h2 id="proof-title">{reading.proofTitle}</h2>
            <div className="proof-rule" />
            <dl>
              <div><dt>Шанс на работу</dt><dd>{reading.chance}%</dd></div>
              <div><dt>Основание</dt><dd>{reading.planet}</dd></div>
              <div><dt>Сектор</dt><dd>{reading.house.replace(/^в |^над |^у |^на /, "")}</dd></div>
              <div><dt>Риск переделки</dt><dd>{reading.risk}%</dd></div>
              <div><dt>Личный знак</dt><dd>{reading.personalMark} · {rerollCount > 0 ? `переброс ${rerollCount}` : "исходный"}</dd></div>
              <div><dt>Статус</dt><dd>{reading.status}</dd></div>
            </dl>
            <p className="proof-explanation">{reading.explanation}</p>
            <p className="proof-valid">Действует до следующего рассвета</p>
          </div>

          <div className="proof-actions">
            <button className="primary-button compact" type="button" onClick={shareReason}>
              <ShareNetwork size={19} /> Предъявить справку
            </button>
            <button className="secondary-button" type="button" onClick={copyReason}>
              {copied ? <Check size={19} /> : <Copy size={19} />}
              {copied ? "Скопировано" : "Скопировать для начальника"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
