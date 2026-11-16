/** Complete local UI and narrative dictionaries. No network translation or English fallback. */
export const dictionaries = {
  ru: {
    title: "Вес света",
    kicker: "KIKKEY GAMES · ИСТОРИЯ В ЧЕТЫРЁХ ГЛАВАХ",
    tagline: "Одно бережное движение — и город снова дышит.",
    begin: "Войти в город",
    continue: "Продолжить путь",
    newGame: "Новая история",
    loading: "Зажигаем первый фонарь…",
    loadError: "Город не удалось загрузить. Попробуйте ещё раз.",
    retry: "Попробовать снова",
    exit: "Выйти в меню",
    pause: "Пауза",
    resume: "Вернуться в город",
    settings: "Настройки",
    journal: "Письма и находки",
    help: "Как играть",
    close: "Закрыть",
    back: "Назад",
    undo: "Отменить ход",
    restart: "Начать главу заново",
    confirmRestart: "Начать эту главу заново? Ходы в ней будут сброшены.",
    confirm: "Подтвердить",
    cancel: "Отмена",
    nextChapter: "Дальше по улице",
    chapterComplete: "Путь открыт",
    chapterCount: "Глава {n} из 4",
    carry: "{n} / 2",
    carryLabel: "Курьерский футляр",
    insulated: "Изолирован от весов",
    transfers: "Переносы: {n}",
    traces: "Следы матери: {n} / 3",
    sound: "Звук",
    music: "Музыка",
    effects: "Звуки города",
    mute: "Без звука",
    reducedMotion: "Меньше движения",
    quality: "Графика",
    qualityLow: "Бережный режим",
    qualityHigh: "Полная детализация",
    language: "Язык",
    objective: "Ваш путь",
    forecast: "После переноса",
    confirmAction: "Перенести свет",
    available: "Путь открыт",
    blocked: "Путь закрыт",
    here: "Ноя здесь",
    emptyCase: "Футляр пуст",
    fullCase: "Футляр полон",
    helpTitle: "Свет умеет быть тяжёлым",
    helpBody:
      "В подвешенных колбах свет становится весом. Более тяжёлая сторона опускается; при равновесии обе площадки встречаются посередине. Переходите по открытым мостам, берите и отдавайте по одному заряду. В футляре помещается два. Домашние лампы и футляр не влияют на весы. Перед переносом виден прогноз; ход можно отменить.",
    keysHelp:
      "Выбирайте действия кнопками или касанием. Tab — выбрать кнопку, Enter — нажать. Стрелки ведут к доступному пути слева или справа. Esc — пауза. Z — отмена.",
    hint: "Небольшая подсказка",
    hintRule:
      "При равновесии можно перейти между площадками. Свет в футляре ничего не весит.",
    hintNode:
      "Посмотрите на доступную колбу и высоту следующего схода. Возможно, свет пригодится по другую сторону.",
    hintNext: "Попробуйте: {action}",
    noHint: "Путь уже открыт. Можно идти дальше.",
    "hint.choice":
      "Два заряда в мемориальном фонаре сохранят голос матери; по одному в двух домах осветят улицу. Оба пути завершают историю. Выбор подтверждается у выхода.",
    "hint.0.rule":
      "Более тяжёлая сторона опускается. При равном числе зарядов обе площадки встречаются посередине.",
    "hint.0.node":
      "Взгляните на ближайшую колбу: чтобы перейти мост, площадки должны оказаться на одной высоте.",
    "hint.1.rule":
      "В футляре есть место для двух зарядов. Один понадобится домашней лампе; она не влияет на весы.",
    "hint.1.node":
      "Посчитайте, сколько света нужно забрать для равновесия, и оставьте один заряд для окна за правым сходом.",
    "hint.2.rule":
      "Лампа-замок доступна с обоих нижних сходов. Забрав её свет, вы закроете проход за собой. У двери маяка нужен один заряд.",
    "hint.2.node":
      "Проверьте свет в лампе прохода с другой стороны. А к следу матери ведёт верхний сход левой площадки вторых весов.",
    "hint.3.rule":
      "Лампа лестницы требует отдельный заряд. После записи она открывает обратный путь. Ещё два заряда можно оставить в маяке или домах.",
    "hint.3.node":
      "Перед подъёмом проверьте лампу на центральном балконе. К записи ведёт верхний правый сход вторых весов. Выбор подтверждается у выхода.",
    "ending.memorial": "Голос в маяке",
    "ending.homes": "Свет в окнах",
    "ending.memorial.title": "Голос в маяке",
    "ending.memorial.body":
      "Два огонька остаются у записи. Голос матери звучит над улицей, а Ноя знает дорогу домой. Иногда дом — это место, где нас всё ещё слышат.",
    "ending.homes.title": "Свет в окнах",
    "ending.homes.body":
      "Запись умолкает. В двух домах снова светло; их отражения касаются окна матери. Ноя доставила посылку тем, кто ещё живёт на этой улице.",
    finishPrompt:
      "Завершить историю с этим выбором? До подтверждения свет можно забрать и выбрать другой путь.",
    brandCTA: "Игра для моего бренда",
    projectCTA: "Разработать игровой проект",
    email: "Написать Kikkey",
    whatsapp: "Открыть WhatsApp",
    replay: "Пройти ещё раз",
    credits: "Об этой истории",
    creditBody:
      "Авторская игровая история Kikkey Games. Модели созданы для этого мира в Blender; музыка и звуки — процедурная композиция. Переводы на русский, английский и иврит. Проверка иврита носителем языка ещё не проведена.",
    saved: "Путь сохранён на этом устройстве",
    saveUnavailable:
      "Браузер не разрешил сохранение. Можно играть, но после закрытия вкладки путь не сохранится.",
    saveCorrupt: "Сохранение не удалось прочитать. Можно начать новую историю.",
    contextLost:
      "Изображение временно потеряно. Попробуйте восстановить город; сохранённый путь останется.",
    unsupported:
      "Для этого города нужен WebGL. Попробуйте современный браузер с включённым аппаратным ускорением.",
    pausedNote: "Город подождёт вас.",
    tutorial: "Первый перенос",
    goal: "Куда дальше",
    "chapter.0.title": "Порог",
    "chapter.0.subtitle": "I · Недоставленная посылка",
    "chapter.0.goal": "Перейдите к правому нижнему сходу.",
    "chapter.0.story":
      "Ноя, ночная курьерка, нашла посылку матери: «Для тех, кто ещё живёт на этой улице». На дальнем маяке ждёт последнее сообщение. Сначала — один мост.",
    "chapter.1.title": "Окно",
    "chapter.1.subtitle": "II · Кто-то ещё не спит",
    "chapter.1.goal":
      "Доберитесь до домашней лампы и оставьте в ней один заряд.",
    "chapter.1.story":
      "Парадный фонарь погас, но на кухне накрыт стол. Мать отдала свет не площади, а людям, которые возвращались домой.",
    "chapter.2.title": "Обратная сторона",
    "chapter.2.subtitle": "III · Дорога, которую можно вернуть",
    "chapter.2.goal":
      "Пройдите через лампу-замок и зажгите одним зарядом лампу у двери маяка.",
    "chapter.2.story":
      "На центральном балконе — лампа-замок. Она держит проход открытым, пока хранит свет. Забрать его можно с другой стороны. Только не забудьте, как вернуться.",
    "chapter.3.title": "Для всей улицы",
    "chapter.3.subtitle": "IV · Последняя доставка",
    "chapter.3.goal":
      "Зажгите лампу обратной лестницы и найдите запись. Оставьте два заряда в маяке или домах; подтвердите выбор у выхода.",
    "chapter.3.story":
      "Два механизма отделяют Ною от комнаты записи. Дорога наверх должна стать дорогой обратно. У последней посылки нет единственного адреса.",
    "story.recording":
      "Ноя: «Я думала, ты погасила город». В записи мать отвечает: «Я хотела, чтобы свет дошёл до дома». Ставни раскрываются. Теперь Ноя видит всю улицу.",
    "story.trace1":
      "На деревянной стойке — отметка роста: «Ноя, семь лет». Рядом маленькая черта: «И ещё чуть-чуть, на цыпочках».",
    "story.trace2":
      "На столе лежит игрушечная птица с починенным крылом. Под ней записка матери: «Не всё, что сломалось, нужно выбрасывать».",
    "story.trace3":
      "Фрагмент письма: «Если проход закроется за тобой, это ещё не значит, что ты потерялась. Ты помнишь, где оставила свет».",
    "story.lamp":
      "За стеклом появляется человек. Он поправляет вторую тарелку на столе. Здесь кого-то ждут.",
    "story.gate":
      "Лампа удерживает проход. Свет можно забрать с обеих сторон — если до неё есть путь.",
    "action.take": "Взять один заряд",
    "action.give": "Отдать один заряд",
    "action.walk": "К месту: {place}",
    "action.light": "Добавить свет: {place}",
    "action.reclaim": "Забрать свет: {place}",
    "action.read": "Прочитать находку",
    "action.listen": "Прослушать запись",
    "action.finish": "Выбрать: {place}",
    "node.aL": "Левая площадка",
    "node.aR": "Правая площадка",
    "node.bL": "Левая площадка II",
    "node.bR": "Правая площадка II",
    "node.exit": "Дальше по улице",
    "node.home": "Кухонное окно",
    "node.balcony": "Центральный балкон",
    "node.trace": "След матери",
    "node.recording": "Комната записи",
    "node.homeA": "Дом швеи",
    "node.homeB": "Дом игрушечника",
    "lamp.gate": "Лампа прохода",
    "lamp.door": "Дверь маяка",
    "lamp.return": "Лампа лестницы",
    "lamp.memorial": "Мемориальный фонарь",
    "lamp.home": "Кухонная лампа",
    "lamp.homeA": "Лампа в доме швеи",
    "lamp.homeB": "Лампа в доме игрушечника",
  },
  en: {
    title: "Weight of Light",
    kicker: "KIKKEY GAMES · A STORY IN FOUR CHAPTERS",
    tagline: "One gentle movement, and the city breathes again.",
    begin: "Enter the city",
    continue: "Continue the journey",
    newGame: "A new story",
    loading: "Lighting the first lantern…",
    loadError: "The city could not load. Please try again.",
    retry: "Try again",
    exit: "Return to menu",
    pause: "Pause",
    resume: "Return to the city",
    settings: "Settings",
    journal: "Letters & discoveries",
    help: "How to play",
    close: "Close",
    back: "Back",
    undo: "Undo a move",
    restart: "Restart chapter",
    confirmRestart: "Restart this chapter? Its moves will be reset.",
    confirm: "Confirm",
    cancel: "Cancel",
    nextChapter: "Further down the street",
    chapterComplete: "The way is open",
    chapterCount: "Chapter {n} of 4",
    carry: "{n} / 2",
    carryLabel: "Courier case",
    insulated: "Isolated from the scales",
    transfers: "Transfers: {n}",
    traces: "Mother’s traces: {n} / 3",
    sound: "Sound",
    music: "Music",
    effects: "Sounds of the city",
    mute: "Mute",
    reducedMotion: "Reduced motion",
    quality: "Graphics",
    qualityLow: "Gentle mode",
    qualityHigh: "Full detail",
    language: "Language",
    objective: "Your journey",
    forecast: "After the transfer",
    confirmAction: "Transfer the light",
    available: "Path open",
    blocked: "Path closed",
    here: "Noya is here",
    emptyCase: "The case is empty",
    fullCase: "The case is full",
    helpTitle: "Light can be heavy",
    helpBody:
      "Light becomes weight in suspended vials. The heavier side descends; when balanced, both platforms meet in the middle. Follow open bridges and move one charge at a time. Your case holds two. The case and household lamps do not affect the scales. Preview each transfer before confirming it; you can undo a move.",
    keysHelp:
      "Choose actions with buttons or touch. Tab selects a button; Enter activates it. Arrow keys follow available paths to the left or right. Esc pauses. Z undoes a move.",
    hint: "A small hint",
    hintRule:
      "Balanced platforms let you cross between them. Light in your case adds no weight.",
    hintNode:
      "Look at the vial you can reach and the height of the next landing. You may need light on the other side.",
    hintNext: "Try: {action}",
    noHint: "The way is already open. You can move on.",
    "hint.choice":
      "Two charges in the memorial lantern keep her mother’s voice; one in each of two homes lights the street. Both paths complete the story. Confirm your choice at the exit.",
    "hint.0.rule":
      "The heavier side descends. With equal charges, both platforms meet in the middle.",
    "hint.0.node":
      "Look at the nearest vial: to cross the bridge, the platforms must be at the same height.",
    "hint.1.rule":
      "Your case has room for two charges. Keep one for the household lamp; it does not affect the scales.",
    "hint.1.node":
      "Count how much light you need to take for balance, and keep one charge for the window beyond the right landing.",
    "hint.2.rule":
      "The gate lamp is accessible from both low landings. Taking its light closes the passage behind you. The lighthouse door needs one charge.",
    "hint.2.node":
      "Check the passage lamp from the far side. Mother’s trace is reached from the upper landing of the second mechanism’s left platform.",
    "hint.3.rule":
      "The stair lamp needs its own charge. After the recording, it opens the way back. Two further charges can stay in the lighthouse or go to the homes.",
    "hint.3.node":
      "Check the lamp on the central balcony before climbing. The recording is reached from the second mechanism’s upper right landing. Confirm your choice at the exit.",
    "ending.memorial": "A voice in the lighthouse",
    "ending.homes": "Light in the windows",
    "ending.memorial.title": "A voice in the lighthouse",
    "ending.memorial.body":
      "Two lights remain beside the recording. Her mother’s voice carries over the street, and Noya knows the way home. Sometimes home is the place where we are still heard.",
    "ending.homes.title": "Light in the windows",
    "ending.homes.body":
      "The recording falls silent. Two homes glow again, their reflections reaching her mother’s window. Noya has delivered the parcel to those who still live on this street.",
    finishPrompt:
      "End the story with this choice? Until you confirm, you can take the light back and choose another path.",
    brandCTA: "A game for my brand",
    projectCTA: "Develop a game project",
    email: "Write to Kikkey",
    whatsapp: "Open WhatsApp",
    replay: "Play again",
    credits: "About this story",
    creditBody:
      "An original game story by Kikkey Games. Models were made for this world in Blender; music and sound form an original procedural composition. Available in Russian, English, and Hebrew. The Hebrew translation has not yet been reviewed by a native speaker.",
    saved: "Journey saved on this device",
    saveUnavailable:
      "Your browser did not allow saving. You can play, but the journey will not be saved after closing this tab.",
    saveCorrupt:
      "The saved journey could not be read. You can begin a new story.",
    contextLost:
      "The image was temporarily lost. Try restoring the city; your saved journey will remain.",
    unsupported:
      "This city needs WebGL. Try a modern browser with hardware acceleration enabled.",
    pausedNote: "The city will wait for you.",
    tutorial: "The first transfer",
    goal: "Where next",
    "chapter.0.title": "The Threshold",
    "chapter.0.subtitle": "I · An undelivered parcel",
    "chapter.0.goal": "Reach the lower landing on the right.",
    "chapter.0.story":
      "Noya, a night courier, finds her mother’s parcel: “For those who still live on this street.” A final message awaits at the distant lighthouse. First, one bridge.",
    "chapter.1.title": "The Window",
    "chapter.1.subtitle": "II · Someone is still awake",
    "chapter.1.goal": "Reach the household lamp and leave one charge in it.",
    "chapter.1.story":
      "The grand lantern is dark, but the kitchen table is set. Her mother gave the light to people coming home, instead of the square.",
    "chapter.2.title": "The Other Side",
    "chapter.2.subtitle": "III · A way back",
    "chapter.2.goal":
      "Pass the gate lamp and light the lamp at the lighthouse door with one charge.",
    "chapter.2.story":
      "A gate lamp waits on the central balcony. The passage stays open while it holds light. You can take that light from the other side. Just remember how to return.",
    "chapter.3.title": "For the Whole Street",
    "chapter.3.subtitle": "IV · The last delivery",
    "chapter.3.goal":
      "Light the return stair and find the recording. Leave two charges in the lighthouse or homes; confirm at the exit.",
    "chapter.3.story":
      "Two mechanisms stand between Noya and the recording room. The way up must also be a way back. The last parcel has more than one possible address.",
    "story.recording":
      "Noya: “I thought you had darkened the city.” In the recording, her mother answers: “I wanted the light to reach home.” The shutters open. Now Noya can see the whole street.",
    "story.trace1":
      "A height mark on a wooden post: “Noya, age seven.” A smaller line beside it: “And a little more, on tiptoe.”",
    "story.trace2":
      "A toy bird with a mended wing rests on the table. Beneath it, her mother’s note: “Not everything broken needs to be thrown away.”",
    "story.trace3":
      "A scrap of a letter: “A passage closing behind you does not mean you are lost. You remember where you left the light.”",
    "story.lamp":
      "Someone appears behind the glass. They straighten a second plate on the table. Someone is expected here.",
    "story.gate":
      "The lamp holds the passage open. You can take its light from either side, if you can reach it.",
    "action.take": "Take one charge",
    "action.give": "Give one charge",
    "action.walk": "Go to: {place}",
    "action.light": "Add light: {place}",
    "action.reclaim": "Take back light: {place}",
    "action.read": "Read the discovery",
    "action.listen": "Listen to the recording",
    "action.finish": "Choose: {place}",
    "node.aL": "Left platform",
    "node.aR": "Right platform",
    "node.bL": "Left platform II",
    "node.bR": "Right platform II",
    "node.exit": "Further down the street",
    "node.home": "Kitchen window",
    "node.balcony": "Central balcony",
    "node.trace": "Mother’s trace",
    "node.recording": "Recording room",
    "node.homeA": "Seamstress’s house",
    "node.homeB": "Toy maker’s house",
    "lamp.gate": "Passage lamp",
    "lamp.door": "Lighthouse door",
    "lamp.return": "Stair lamp",
    "lamp.memorial": "Memorial lantern",
    "lamp.home": "Kitchen lamp",
    "lamp.homeA": "Seamstress’s lamp",
    "lamp.homeB": "Toy maker’s lamp",
  },
  he: {
    title: "משקל האור",
    kicker: "KIKKEY GAMES · סיפור בארבעה פרקים",
    tagline: "תנועה עדינה אחת, והעיר שוב נושמת.",
    begin: "להיכנס לעיר",
    continue: "להמשיך בדרך",
    newGame: "סיפור חדש",
    loading: "מדליקים את הפנס הראשון…",
    loadError: "לא הצלחנו לטעון את העיר. אפשר לנסות שוב.",
    retry: "לנסות שוב",
    exit: "חזרה לתפריט",
    pause: "השהיה",
    resume: "לחזור לעיר",
    settings: "הגדרות",
    journal: "מכתבים ותגליות",
    help: "איך משחקים",
    close: "סגירה",
    back: "חזרה",
    undo: "לבטל מהלך",
    restart: "להתחיל את הפרק מחדש",
    confirmRestart: "להתחיל את הפרק הזה מחדש? המהלכים בו יאופסו.",
    confirm: "אישור",
    cancel: "ביטול",
    nextChapter: "בהמשך הרחוב",
    chapterComplete: "הדרך פתוחה",
    chapterCount: "פרק {n} מתוך 4",
    carry: "{n} / 2",
    carryLabel: "תיק השליחה",
    insulated: "מבודד מהמאזניים",
    transfers: "העברות: {n}",
    traces: "עקבות האם: {n} / 3",
    sound: "צליל",
    music: "מוזיקה",
    effects: "קולות העיר",
    mute: "השתקה",
    reducedMotion: "תנועה מופחתת",
    quality: "גרפיקה",
    qualityLow: "מצב חסכוני",
    qualityHigh: "פירוט מלא",
    language: "שפה",
    objective: "הדרך שלכם",
    forecast: "אחרי ההעברה",
    confirmAction: "להעביר את האור",
    available: "הדרך פתוחה",
    blocked: "הדרך סגורה",
    here: "נויה כאן",
    emptyCase: "התיק ריק",
    fullCase: "התיק מלא",
    helpTitle: "גם לאור יש משקל",
    helpBody:
      "במכלים התלויים האור הופך למשקל. הצד הכבד יורד; כשהמשקל שווה, שתי הבמות נפגשות באמצע. חוצים גשרים פתוחים ומעבירים יחידת אור אחת בכל פעם. בתיק יש מקום לשתיים. התיק והמנורות הביתיות אינם משפיעים על המאזניים. לפני האישור אפשר לראות מה ישתנה; תמיד אפשר לבטל מהלך.",
    keysHelp:
      "בוחרים פעולה בכפתורים או במגע. Tab בוחר כפתור; Enter מפעיל אותו. מקשי החצים מובילים לנתיב פתוח משמאל או מימין. Esc משהה. Z מבטל מהלך.",
    hint: "רמז קטן",
    hintRule: "כשהבמות מאוזנות אפשר לחצות ביניהן. האור שבתיק אינו מוסיף משקל.",
    hintNode:
      "הסתכלו על המכל הנגיש ועל גובה המעבר הבא. אולי תצטרכו אור בצד השני.",
    hintNext: "כדאי לנסות: {action}",
    noHint: "הדרך כבר פתוחה. אפשר להמשיך.",
    "hint.choice":
      "שתי יחידות אור בפנס הזיכרון ישמרו את קולה של אמא; יחידה אחת בכל אחד משני הבתים תאיר את הרחוב. שתי הדרכים משלימות את הסיפור. מאשרים את הבחירה ביציאה.",
    "hint.0.rule":
      "הצד הכבד יורד. כשיש מספר שווה של יחידות אור, שתי הבמות נפגשות באמצע.",
    "hint.0.node":
      "הביטו במכל הקרוב: כדי לחצות את הגשר, הבמות צריכות להיות באותו גובה.",
    "hint.1.rule":
      "בתיק יש מקום לשתי יחידות אור. שמרו אחת למנורה הביתית; היא אינה משפיעה על המאזניים.",
    "hint.1.node":
      "בדקו כמה אור צריך לקחת כדי להגיע לאיזון, ושמרו יחידה אחת לחלון שמעבר למעבר הימני.",
    "hint.2.rule":
      "אפשר להגיע למנורת השער משני המעברים התחתונים. לקיחת האור שלה סוגרת את המעבר מאחוריכם. דלת המגדלור זקוקה ליחידת אור אחת.",
    "hint.2.node":
      "בדקו את מנורת המעבר מהצד השני. עקבות האם נמצאות ליד המעבר העליון של הבמה השמאלית במנגנון השני.",
    "hint.3.rule":
      "מנורת המדרגות זקוקה ליחידת אור משלה. אחרי ההקלטה היא פותחת את הדרך חזרה. שתי יחידות נוספות יכולות להישאר במגדלור או להגיע לבתים.",
    "hint.3.node":
      "בדקו את המנורה במרפסת המרכזית לפני העלייה. אל ההקלטה מגיעים מהמעבר הימני העליון של המנגנון השני. מאשרים את הבחירה ביציאה.",
    "ending.memorial": "קול במגדלור",
    "ending.homes": "אור בחלונות",
    "ending.memorial.title": "קול במגדלור",
    "ending.memorial.body":
      "שני אורות נשארים ליד ההקלטה. קולה של אמה נשמע מעל הרחוב, ונויה מכירה את הדרך הביתה. לפעמים הבית הוא המקום שבו עדיין מקשיבים לנו.",
    "ending.homes.title": "אור בחלונות",
    "ending.homes.body":
      "ההקלטה משתתקת. שני בתים מוארים שוב, וההשתקפויות שלהם נוגעות בחלון של אמא. נויה מסרה את החבילה לאלה שעדיין גרים ברחוב הזה.",
    finishPrompt:
      "לסיים את הסיפור עם הבחירה הזאת? עד לאישור אפשר לקחת את האור בחזרה ולבחור דרך אחרת.",
    brandCTA: "משחק למותג שלי",
    projectCTA: "פיתוח פרויקט משחק",
    email: "לכתוב ל־Kikkey",
    whatsapp: "לפתוח WhatsApp",
    replay: "לשחק שוב",
    credits: "על הסיפור",
    creditBody:
      "סיפור משחק מקורי מאת Kikkey Games. הדגמים נוצרו עבור העולם הזה ב־Blender; המוזיקה והצלילים הם יצירה מקורית המופקת בתוכנה. המשחק זמין ברוסית, באנגלית ובעברית. התרגום לעברית עדיין לא נבדק בידי דוברי עברית כשפת אם.",
    saved: "הדרך נשמרה במכשיר הזה",
    saveUnavailable:
      "הדפדפן לא אפשר לשמור. אפשר לשחק, אבל הדרך לא תישמר אחרי סגירת הלשונית.",
    saveCorrupt: "לא הצלחנו לקרוא את השמירה. אפשר להתחיל סיפור חדש.",
    contextLost:
      "התמונה אבדה זמנית. אפשר לנסות לשחזר את העיר; הדרך שנשמרה תישאר.",
    unsupported:
      "העיר הזאת זקוקה ל־WebGL. נסו דפדפן עדכני שבו האצת חומרה פעילה.",
    pausedNote: "העיר תחכה לכם.",
    tutorial: "ההעברה הראשונה",
    goal: "לאן ממשיכים",
    "chapter.0.title": "הסף",
    "chapter.0.subtitle": "I · חבילה שלא נמסרה",
    "chapter.0.goal": "הגיעו למעבר התחתון מימין.",
    "chapter.0.story":
      "נויה, שליחת לילה, מוצאת חבילה של אמה: ״לאלה שעדיין גרים ברחוב הזה״. הודעה אחרונה מחכה במגדלור הרחוק. קודם צריך לחצות גשר אחד.",
    "chapter.1.title": "החלון",
    "chapter.1.subtitle": "II · מישהו עדיין ער",
    "chapter.1.goal": "הגיעו למנורה הביתית והשאירו בה יחידת אור אחת.",
    "chapter.1.story":
      "הפנס המפואר כבה, אבל במטבח השולחן ערוך. אמה נתנה את האור לאנשים ששבו הביתה, במקום לכיכר.",
    "chapter.2.title": "הצד השני",
    "chapter.2.subtitle": "III · דרך חזרה",
    "chapter.2.goal":
      "עברו את מנורת השער והדליקו ביחידת אור אחת את המנורה ליד דלת המגדלור.",
    "chapter.2.story":
      "במרפסת המרכזית מחכה מנורת שער. המעבר נשאר פתוח כל עוד היא מחזיקה אור. אפשר לקחת אותו גם מהצד השני. רק זכרו איך חוזרים.",
    "chapter.3.title": "לכל הרחוב",
    "chapter.3.subtitle": "IV · המשלוח האחרון",
    "chapter.3.goal":
      "האירו את מדרגות החזרה ומצאו את ההקלטה. השאירו שתי יחידות אור במגדלור או בבתים; אשרו את הבחירה ביציאה.",
    "chapter.3.story":
      "שני מנגנונים מפרידים בין נויה לחדר ההקלטה. הדרך למעלה צריכה לאפשר גם חזרה. לחבילה האחרונה יש יותר מכתובת אפשרית אחת.",
    "story.recording":
      "נויה: ״חשבתי שהחשכת את העיר.״ בהקלטה אמה עונה: ״רציתי שהאור יגיע הביתה.״ התריסים נפתחים. עכשיו נויה רואה את הרחוב כולו.",
    "story.trace1":
      "על עמוד עץ סימון גובה: ״נויה, בת שבע״. לידו קו קטן נוסף: ״ועוד קצת, על קצות האצבעות״.",
    "story.trace2":
      "על השולחן מונחת ציפור צעצוע עם כנף שתוקנה. מתחתיה פתק של אמא: ״לא כל מה שנשבר צריך לזרוק״.",
    "story.trace3":
      "קטע ממכתב: ״אם המעבר נסגר מאחורייך, זה עוד לא אומר שהלכת לאיבוד. את זוכרת היכן השארת את האור״.",
    "story.lamp":
      "דמות מופיעה מאחורי הזכוכית ומיישרת צלחת שנייה על השולחן. כאן מחכים למישהו.",
    "story.gate":
      "המנורה מחזיקה את המעבר פתוח. אפשר לקחת ממנה אור משני הצדדים, אם יש דרך להגיע אליה.",
    "action.take": "לקחת יחידת אור",
    "action.give": "לתת יחידת אור",
    "action.walk": "ללכת אל: {place}",
    "action.light": "להוסיף אור: {place}",
    "action.reclaim": "לקחת אור בחזרה: {place}",
    "action.read": "לקרוא את התגלית",
    "action.listen": "להקשיב להקלטה",
    "action.finish": "לבחור: {place}",
    "node.aL": "הבמה השמאלית",
    "node.aR": "הבמה הימנית",
    "node.bL": "הבמה השמאלית II",
    "node.bR": "הבמה הימנית II",
    "node.exit": "בהמשך הרחוב",
    "node.home": "חלון המטבח",
    "node.balcony": "המרפסת המרכזית",
    "node.trace": "עקבות האם",
    "node.recording": "חדר ההקלטה",
    "node.homeA": "בית התופרת",
    "node.homeB": "בית יוצר הצעצועים",
    "lamp.gate": "מנורת המעבר",
    "lamp.door": "דלת המגדלור",
    "lamp.return": "מנורת המדרגות",
    "lamp.memorial": "פנס הזיכרון",
    "lamp.home": "מנורת המטבח",
    "lamp.homeA": "מנורת התופרת",
    "lamp.homeB": "מנורת יוצר הצעצועים",
  },
};

export const languages = ["ru", "en", "he"];
const locales = { ru: "ru-RU", en: "en-GB", he: "he-IL" };

export function number(lang, value) {
  if (!locales[lang]) throw new RangeError(`Unsupported locale: ${lang}`);
  return new Intl.NumberFormat(locales[lang]).format(value);
}

export function plural(lang, value, forms) {
  if (!locales[lang]) throw new RangeError(`Unsupported locale: ${lang}`);
  const category = new Intl.PluralRules(locales[lang]).select(value);
  const form = forms[category] ?? forms.other;
  if (typeof form !== "string")
    throw new Error(`Missing plural form: ${lang}/${category}`);
  return form;
}

export function t(lang, key, params = {}) {
  const template = dictionaries[lang]?.[key];
  if (typeof template !== "string")
    throw new Error(`Missing translation: ${lang}/${key}`);
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    if (!(name in params))
      throw new Error(`Missing translation parameter: ${key}/${name}`);
    return typeof params[name] === "number"
      ? number(lang, params[name])
      : String(params[name]);
  });
}
