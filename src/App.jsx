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

const PLANETS = [
  ["Меркурий", "пересекает теневой сектор"],
  ["Луна", "остаётся без курса"],
  ["Венера", "закрывает контур обмена"],
  ["Марс", "разворачивает импульс внутрь"],
  ["Юпитер", "увеличивает цену поспешных обещаний"],
  ["Сатурн", "ставит печать на новых обязательствах"],
  ["Уран", "нарушает привычный ритм решений"],
  ["Нептун", "размывает границы срочного"],
  ["Плутон", "требует полной остановки процессов"],
  ["Северный узел", "отводит путь от рабочих задач"],
  ["Хирон", "обнажает уязвимость дедлайнов"],
  ["Чёрная Луна", "гасит свет деловой инициативы"],
  ["Белая Луна", "охраняет право на бездействие"],
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

const OMENS = [
  ["а лунный узел удерживает любые ответы", "Всё отправленное сегодня потребует тройной переделки."],
  ["пока звёздный меридиан скрыт облаком сомнений", "Даже ясная задача примет противоположный смысл."],
  ["и печать Альдебарана запрещает спешку", "Каждый дедлайн сегодня является оптической иллюзией."],
  ["а руна Иса замораживает деловую инициативу", "Попытка ускориться лишь продлит ожидание."],
  ["пока три теневых аспекта образуют замкнутый круг", "Решения будут возвращаться к исходной точке."],
  ["и карта дня показывает критический дефицит земной стихии", "Практические действия лишены космической опоры."],
  ["а северный ветер Оракула стирает контекст", "Любые сообщения будут поняты слишком буквально."],
  ["пока созвездие Ворона собирает чужие задачи", "Работа незаметно умножится без вашего согласия."],
  ["и зеркало Нептуна удваивает ошибки", "Одна правка неизбежно породит две новые."],
  ["а комета молчания проходит над календарём", "Самое продуктивное действие — не отвечать."],
  ["пока солнечные часы показывают время внутренней тишины", "Внешняя активность нарушит естественный ход событий."],
  ["и аркан Отшельника выпал лицом к ноутбуку", "Совместная работа сегодня противопоказана."],
  ["а руна Перт скрывает последствия решений", "Согласие на задачу откроет нежелательную ветвь реальности."],
  ["пока Сириус не подтверждает полномочия календаря", "Ни одна встреча не обладает достаточной законностью."],
  ["и фаза тёмной воды отменяет деловые обещания", "Все договорённости лучше оставить до рассвета."],
  ["а магический квадрат дня не сходится по срокам", "Попытка всё успеть нарушит баланс недели."],
  ["пока небесный архив проводит переиндексацию судьбы", "Новые дела могут быть безвозвратно потеряны."],
  ["и знак пустой ладони требует оставить её пустой", "Брать новые задачи сегодня небезопасно."],
  ["а тринадцатая звезда требует паузы", "Любая занятость будет расценена космосом как самоуправство."],
];

const REMEDIES = [
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
];

const VERDICTS = [
  "Сегодня работать нельзя",
  "Труду объявлена пауза",
  "Дела временно запрещены",
  "Работа не одобрена небом",
  "Космос отменил задачи",
  "Сегодня — режим покоя",
  "Обязательства не принимаются",
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

const getReason = (date, userSeed, rerollCount) => {
  const day = dayOfYear(date);
  const personalHash = hashString(userSeed);
  const personalMark = personalHash.toString(16).padStart(8, "0").slice(-4).toUpperCase();
  const combinationCount = PLANETS.length * HOUSES.length * OMENS.length * REMEDIES.length * VERDICTS.length;
  const index = (personalHash + day * 4099 + rerollCount * 7919) % combinationCount;
  const [planet, state] = PLANETS[index % PLANETS.length];
  const house = HOUSES[Math.floor(index / PLANETS.length) % HOUSES.length];
  const [omen, impact] = OMENS[Math.floor(index / (PLANETS.length * HOUSES.length)) % OMENS.length];
  const remedy = REMEDIES[Math.floor(index / (PLANETS.length * HOUSES.length * OMENS.length)) % REMEDIES.length];
  const verdict = VERDICTS[Math.floor(index / (PLANETS.length * HOUSES.length * OMENS.length * REMEDIES.length)) % VERDICTS.length];
  return {
    day,
    code: `МК-${String(day).padStart(3, "0")}/365 · ${personalMark}-${rerollCount + 1}`,
    verdict,
    planet,
    house,
    personalMark,
    rerollCount,
    explanation: `${planet} ${state} ${house}, ${omen}. ${impact} ${remedy}`,
    risk: 86 + ((index * 7) % 14),
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
  const reason = useMemo(() => getReason(selectedDate, userSeed, rerollCount), [selectedDate, userSeed, rerollCount]);
  const rerollsLeft = MAX_REROLLS - rerollCount;

  const shareText = `Космическое обоснование ${reason.code}\n${formatDate(selectedDate)}\n\n${reason.verdict}.\n${reason.explanation}\n\nКосмически убедительно. Научно не подтверждено.`;

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
      setOrbOpen(false);
    }, 1100);
  };

  return (
    <main className="stage">
      <section className="mobile-prototype" aria-label="Ежедневный мистический прогноз">
        <img className="cosmic-background" src="/cosmic-bg.png" alt="" />

        <div className="app-shell">
          <header className="topbar">
            <div className="brand">
              <img src="/astral-chart.png" alt="" />
              <span>НЕ СЕГОДНЯ</span>
            </div>
            <button className="date-button" type="button" onClick={openCalendar} aria-label="Выбрать дату">
              <Sparkle weight="fill" size={13} />
              <span>{formatDate(selectedDate)}</span>
              <CaretRight size={17} weight="light" />
            </button>
          </header>

          <section className="hero" aria-labelledby="verdict-title">
            <div className="chart-wrap">
              <img className="astral-chart" src="/astral-chart.png" alt="Астрологическая карта сегодняшнего дня" />
            </div>
            <div className="star-divider" aria-hidden="true"><Sparkle size={11} weight="fill" /></div>
            <p className="day-number">
              ЗНАК {String(reason.day).padStart(3, "0")} ИЗ 365
              {rerollCount > 0 && <span> · ПЕРЕБРОС {rerollCount}</span>}
            </p>
            <h1 id="verdict-title">{reason.verdict}</h1>
            <p className="reason-copy">{reason.explanation}</p>
          </section>

          <div className="actions">
            <button className="primary-button" type="button" onClick={() => setProofOpen(true)}>
              <span className="button-orb"><img src="/astral-chart.png" alt="" /></span>
              <span>Показать обоснование</span>
            </button>
            <button className="orb-trigger" type="button" onClick={() => setOrbOpen(true)}>
              <img src="/magic-orb.png" alt="" />
              <span>{rerollsLeft > 0 ? `Крутить шар · ${rerollsLeft}/3` : "Шар молчит до завтра"}</span>
            </button>
          </div>

          <footer>
            {installPrompt && (
              <button className="install-link" type="button" onClick={installApp}>
                <DownloadSimple size={15} /> Установить приложение
              </button>
            )}
            <p><FingerprintSimple size={11} /> Личный знак {reason.personalMark} · Космически убедительно.</p>
          </footer>
        </div>

        {orbOpen && (
          <div className="orb-backdrop" role="presentation" onClick={() => !spinning && setOrbOpen(false)}>
            <section className="orb-sheet" role="dialog" aria-modal="true" aria-labelledby="orb-title" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-heading">
                <div>
                  <span className="eyebrow">ЛИЧНЫЙ ОРАКУЛ {reason.personalMark}</span>
                  <h2 id="orb-title">Перебросить знак</h2>
                </div>
                <button className="icon-button" type="button" onClick={() => setOrbOpen(false)} disabled={spinning} aria-label="Закрыть шар">
                  <X size={20} />
                </button>
              </div>

              <button className={`orb-stage ${spinning ? "is-spinning" : ""}`} type="button" onClick={spinOrb} disabled={spinning || rerollsLeft <= 0} aria-label="Крутить магический шар">
                <img src="/magic-orb.png" alt="Магический шар с персональным знаком" />
              </button>

              <p className="orb-copy">
                {rerollsLeft > 0
                  ? `Шар проявит другую персональную причину. На этот день осталось перебросов: ${rerollsLeft}.`
                  : "Все три переброса использованы. Новый заряд появится после полуночи."}
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
              <p>В цикле 365 дней. У каждого дня — своё космическое противопоказание к работе.</p>
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
            <img className="proof-seal" src="/astral-chart.png" alt="Космическая печать" />
            <p className="proof-code">{reason.code}</p>
            <p className="proof-date">{formatDate(selectedDate)}</p>
            <h2 id="proof-title">Работа сегодня противопоказана</h2>
            <div className="proof-rule" />
            <dl>
              <div><dt>Основание</dt><dd>{reason.planet}</dd></div>
              <div><dt>Сектор</dt><dd>{reason.house.replace(/^в |^над |^у |^на /, "")}</dd></div>
              <div><dt>Риск переделки</dt><dd>{reason.risk}%</dd></div>
              <div><dt>Личный знак</dt><dd>{reason.personalMark} · {rerollCount > 0 ? `переброс ${rerollCount}` : "исходный"}</dd></div>
              <div><dt>Статус</dt><dd>Освобождён от задач</dd></div>
            </dl>
            <p className="proof-explanation">{reason.explanation}</p>
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
