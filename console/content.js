/*
 * 绝世唐门RPG Chrome 扩展内容脚本。
 * 在游戏页面运行后提供 window.DouluoBot 与悬浮控制台。
 * 只点击当前页面的按钮；不调用游戏接口，不刷新页面。
 */
(() => {
  "use strict";

  const GAME_PATH = "/app/app_17dnukzxw22/game";
  const originalSite = false;
  const pagesSite = location.hostname === "bishouyi254-source.github.io" &&
    /^\/jueshi-tangmen-rpg(?:\/|$)/.test(location.pathname);
  const localSite = ["127.0.0.1", "localhost"].includes(location.hostname) && location.port === "4173";
  if (!originalSite && !pagesSite && !localSite) return;
  const isGamePage = () => originalSite ? location.pathname === GAME_PATH :
    pagesSite ? /^\/jueshi-tangmen-rpg\/game\/?$/.test(location.pathname) :
    [GAME_PATH, GAME_PATH + "/", "/game", "/game/"].includes(location.pathname);
  const huntAttributes = ["金", "木", "水", "火", "土", "冰", "光", "暗", "时间", "空间", "精神"];

  // 三轮转世预览观察到的名称：旧样本222组、100次重抽样本、200次重抽样本；不代表完整武魂池。
  const observedSouls = Object.freeze({
    "至高神级": ["两仪神剑", "吞噬茶"],
    "超神级": ["孤竹", "魔刀千刃", "如意金箍棒", "天诛剑", "造化玉蝶"],
    "神级": ["白银龙枪", "光明龙神蝶", "鸿蒙金乌", "黄金龙枪", "六翼天使", "轮回之眼", "命运之盘", "奶龙", "修罗之剑", "耀阳圣龙"],
    "传说": ["碧磷蛇皇", "冰碧帝皇蝎", "冰极霜灭龙", "冰晶刹弓", "冰神", "冰天雪女", "沧澜剑", "苍海棍", "赤炎饕餮牛", "春秋蝉", "堕天使", "骨龙", "光明女神蝶", "光明圣龙", "寒汐凝霜琴", "黑暗圣龙", "红尘魔龙", "黄金龙", "黄金叶", "欢愉面具", "疾风枪", "金眼黑龙", "九凤来仪萧", "绝望光环", "卡冥狮", "凯溟龙戟", "蓝冰莲花", "蓝电霸王龙", "雷霆夔牛", "烈阳弓", "灵眸", "冥王黑龙", "魔魂大白鲨", "盘龙棍", "破魔刀", "七宝琉璃塔", "七杀剑", "青莲地心火", "青龙", "擎天枪", "日冕圣龙", "柔骨兔", "瑞幸咖啡", "三生镇魂鼎", "三头赤魔獒", "三足金蟾", "生命之树", "十首火凤凰", "噬魂蛛皇", "死亡蛛皇", "太虚古龙", "饕餮神牛", "提丰", "天罡无极剑", "亡灵序曲·死者苏生", "香肠", "邪火凤凰", "邪魔虎鲸", "邪眸白虎", "星尘剑", "星穹灵鹿", "醒神茶盏", "玄龟", "玄铁重剑", "玄武", "虚无吞炎", "影戮剑", "幽冥灵猫", "斩龙刀", "斩魄刀", "镇魂碑", "终焉之龙", "朱晴冰蟾", "紫霄神雷", "昊天锤"],
    "史诗": ["板甲巨犀", "大力金刚熊", "大力猩猩", "海之矛", "尖尾雨燕", "蓝银草", "龙纹棍", "罗三炮", "猫鹰", "蛇矛", "摄魂铃", "震天斧", "追魂剑"],
  });

  function startOnGamePage() {
    if (!isGamePage()) return false;

    // 导航站先打开应用首页；点击「继续游戏」后才在当前页面切到 /game。
    // 因此扩展先在首页注入，等到路由切换后再初始化控制台。
    if (!window.DouluoBot) installGameBot();
    installControlPanel();
    return true;
  }

  function installGameBot() {
  "use strict";
  if (window.DouluoBot?.running) {
    throw new Error("已有任务正在运行，请先执行 DouluoBot.stop()。");
  }

  const previousState = window.DouluoBot?.status?.();
  const state = {
    running: false,
    stopRequested: false,
    phase: "空闲",
    bearWins: 0,
    ditianWins: 0,
    xiediWins: 0,
    snowWins: 0,
    heartWins: 0,
    millionWins: 0,
    lowAgeFled: 0,
    encounters: 0,
    rebirthMentorClaims: 0,
    rebirthArenaWins: 0,
    rebirthRings: 0,
    rebirthRingFailures: 0,
    rebirthSpiritReady: false,
    soulRolls: 0,
    lastSoulPreview: null,
    activeHuntDungeon: null,
    activeHuntAttribute: null,
    lastTarget: null,
    lastSkill: null,
    lastSkillNumber: null,
    lastBearDrop: null,
    lastError: null,
    ...previousState,
    running: false,
    stopRequested: false,
    phase: "空闲",
    lastError: null,
  };
  let lastFleeAt = 0;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const pageText = () => document.body?.innerText ?? "";
  const titleIs = (value) => [...document.querySelectorAll("h1,h2,h3")]
    .some((el) => clean(el.textContent) === value);
  const visible = (el) => Boolean(el && el.isConnected && el.getClientRects().length &&
    getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none");
  const buttons = () => [...document.querySelectorAll("button")].filter(visible);
  const button = (pattern) => buttons().find((el) => pattern.test(clean(el.textContent)));
  const exactButton = (label) => buttons().find((el) => clean(el.textContent) === label);
  const gameContent = () => document.querySelector("main") || document.querySelector("#root");
  const mainTitle = () => clean(document.querySelector("main h2")?.textContent ||
    document.querySelector("#root h2")?.textContent || document.querySelector("h1")?.textContent);
  const playerLevel = () => {
    const level = pageText().match(/Lv\.\s*(\d+)/);
    if (!level) throw new Error("无法读取角色等级，已停止一键轮回。");
    return Number(level[1]);
  };

  function checkStop() {
    if (state.stopRequested) throw new Error("用户已停止脚本。");
  }

  function waitFor(predicate, label, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      let finished = false;
      const observer = new MutationObserver(check);
      let poll;
      let timeout;
      function finish(error) {
        if (finished) return;
        finished = true;
        observer.disconnect();
        clearInterval(poll);
        clearTimeout(timeout);
        if (error) reject(error);
        else resolve();
      }
      function check() {
        if (finished) return;
        try {
          checkStop();
          if (predicate()) finish();
        } catch (error) {
          finish(error);
        }
      }
      observer.observe(document.body, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: ["disabled", "class", "aria-hidden"],
      });
      poll = setInterval(check, 200);
      timeout = setTimeout(() => {
        check();
        if (!finished) finish(new Error(`等待超时：${label}。当前页面：${clean(pageText()).slice(-300)}`));
      }, timeoutMs);
      check();
    });
  }

  function activateButton(el) {
    // 手机底部 Radix Tabs 在 mousedown 中切页，单独 click 不会触发切换。
    if (el.getAttribute("role") === "tab") {
      el.dispatchEvent(new MouseEvent("mousedown", {
        bubbles: true, cancelable: true, button: 0, ctrlKey: false, view: window,
      }));
    }
    el.click();
  }

  async function clickAndWait(el, predicate, label, timeoutMs = 10000) {
    checkStop();
    if (!visible(el) || el.disabled) throw new Error(`按钮不可点击：${label}`);
    activateButton(el);
    await waitFor(predicate, label, timeoutMs);
  }

  async function collectRingAndSkipDevour() {
    const devour = exactButton("🌀 吞噬");
    if (!devour) {
      const collect = exactButton("收起魂环");
      if (!collect) return false;
      await clickAndWait(collect,
        () => Boolean(exactButton("🌀 吞噬")) || !exactButton("收起魂环"),
        "收起魂环");
    }
    if (exactButton("🌀 吞噬")) {
      await clickAndWait(requireButton(/^放弃$/, "放弃吞噬"),
        () => !exactButton("🌀 吞噬"), "跳过吞噬");
    }
    await waitFor(() => !exactButton("收起魂环"), "魂环弹窗关闭", 10000);
    return true;
  }

  function requireButton(pattern, label) {
    const el = button(pattern);
    if (!el) throw new Error(`找不到按钮：${label}。当前页面：${clean(pageText()).slice(-300)}`);
    return el;
  }

  function report(message) {
    console.info(`[斗罗脚本] ${message}`, { ...state });
  }

  async function goWorld() {
    if (exactButton("确定，返回")) {
      await closeVictory();
    }
    if (titleIs("战斗中")) {
      throw new Error("当前战斗尚未结束，请先完成战斗再开启新任务。");
    }
    if (titleIs("斗罗大陆")) return;
    const mobileMap = [...document.querySelectorAll('[role="tab"]')]
      .find((el) => clean(el.textContent) === "地图");
    if (mobileMap) {
      if (mobileMap.getAttribute("aria-selected") !== "true") {
        await clickAndWait(mobileMap,
          () => mobileMap.getAttribute("aria-selected") === "true", "切换到地图标签");
      }
    } else if (clean(document.querySelector("h1")?.textContent) !== "地图") {
      const map = exactButton("地图");
      if (!map) throw new Error("找不到地图入口。请先结束当前战斗或弹窗。");
      activateButton(map);
      await waitFor(() => titleIs("斗罗大陆") || clean(document.querySelector("h1")?.textContent) === "地图",
        "地图页面");
    }
    for (let depth = 0; depth < 6 && !titleIs("斗罗大陆"); depth++) {
      const previous = mainTitle();
      const back = [...(gameContent()?.querySelectorAll("button") ?? [])]
        .find((el) => visible(el) && el.querySelector("svg.lucide-arrow-left"));
      if (!back) throw new Error(`无法从「${previous}」返回世界地图。`);
      await clickAndWait(back,
        () => titleIs("斗罗大陆") || mainTitle() !== previous,
        `从${previous}返回地图`);
    }
    if (!titleIs("斗罗大陆")) throw new Error("地图返回层级超过预期，已停止。");
  }

  async function goForest() {
    if (titleIs("星斗大森林")) return;
    await goWorld();
    await clickAndWait(requireButton(/^星斗大森林/, "星斗大森林"),
      () => titleIs("星斗大森林"), "星斗大森林");
  }

  async function goLake() {
    if (titleIs("生命之湖") || findBearButton()) return;
    await goForest();
    await clickAndWait(requireButton(/^5\s*生命之湖/, "生命之湖"),
      () => titleIs("生命之湖") || Boolean(findBearButton()), "生命之湖");
  }

  async function goSnow() {
    if (titleIs("极寒冰域") || findBossButton("雪帝")) return;
    if (!titleIs("极北之地")) {
      await goWorld();
      await clickAndWait(requireButton(/^极北之地/, "极北之地"),
        () => titleIs("极北之地"), "极北之地");
    }
    await clickAndWait(requireButton(/^极寒冰域/, "极寒冰域"),
      () => titleIs("极寒冰域") || Boolean(findBossButton("雪帝")), "极寒冰域");
  }

  function findBossButton(name) {
    const direct = buttons().find((el) => {
      const label = clean(el.textContent);
      return label.includes(name) && label.includes("挑战");
    });
    if (direct) return direct;
    const labels = [...document.querySelectorAll("body *")]
      .filter((el) => visible(el) && el.children.length === 0 &&
        clean(el.textContent) === name);
    for (const label of labels) {
      for (let parent = label.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const matches = [...parent.querySelectorAll("button")]
          .filter((el) => visible(el) && clean(el.textContent) === "挑战");
        if (matches.length === 1) return matches[0];
      }
    }
    return null;
  }

  const findBearButton = () => findBossButton("熊君");

  async function goHeart() {
    if (titleIs("日月山脉·九段")) return;
    await goWorld();
    await clickAndWait(requireButton(/^日月山脉/, "日月山脉"),
      () => titleIs("日月山脉"), "日月山脉");
    await clickAndWait(requireButton(/^9\s*日月山脉·九段/, "日月山脉·九段"),
      () => titleIs("日月山脉·九段"), "日月山脉·九段");
  }

  async function goCore() {
    if (titleIs("核心区") || titleIs("核心区 · 副本")) return;
    await goForest();
    await clickAndWait(requireButton(/^4\s*核心区/, "核心区"),
      () => titleIs("核心区"), "核心区");
  }

  function validateHuntAttribute(attribute) {
    if (!huntAttributes.includes(attribute)) throw new Error(`不支持的猎魂属性：${attribute}`);
    return attribute;
  }

  async function chooseHuntAttribute(attribute = "暗", dungeonName = "") {
    validateHuntAttribute(attribute);
    if (!titleIs("选择魂兽属性")) return false;
    if (dungeonName && !clean(pageText()).includes(dungeonName)) {
      throw new Error(`当前属性选择界面不是“${dungeonName}”，请先退出后重试。`);
    }
    const choice = buttons().find((el) => clean(el.textContent).includes(`${attribute}属性`));
    if (!choice) throw new Error(`属性选择界面找不到“${attribute}属性”。`);
    state.phase = `选择${attribute}属性魂兽`;
    await clickAndWait(choice,
      () => Boolean(button(/\d+\s*点击搜索/)) || /体力不足/.test(pageText()),
      `进入${attribute}属性猎魂探索`);
    if (/体力不足/.test(pageText())) throw new Error("体力不足，无法进入猎魂探索。");
    state.activeHuntDungeon = dungeonName || null;
    state.activeHuntAttribute = attribute;
    return true;
  }

  function encounter() {
    const text = pageText();
    const start = text.lastIndexOf("遭遇魂兽！");
    if (start < 0 || !exactButton("开始对战")) return null;
    const section = text.slice(start).split("开始对战")[0];
    const age = section.match(/(?:^|\n)\s*([\d,]+)\s*年(?:\s|$)/m);
    if (!age) throw new Error(`无法从遭遇界面读取魂兽年限：${clean(section).slice(0,180)}`);
    const name = section.split("\n").map(clean).filter(Boolean)[1];
    const hp = section.match(/气血\s*([\d,]+)/);
    const attack = section.match(/攻击\s*([\d,]+)/);
    return { name, age: Number(age[1].replaceAll(",", "")),
      hp: hp ? Number(hp[1].replaceAll(",", "")) : NaN,
      attack: attack ? Number(attack[1].replaceAll(",", "")) : NaN };
  }

  function explorationProgress() {
    const match = clean(gameContent()?.textContent)
      .match(/进度\s*(\d+)\s*\/\s*6/);
    return match ? Number(match[1]) : null;
  }

  async function fleeLowAge(beast) {
    const before = explorationProgress();
    if (before === null) throw new Error("无法确认逃跑前的探索进度，已停止。");
    for (let attempt = 0; attempt < 2; attempt++) {
      const cooldown = 1250 - (Date.now() - lastFleeAt);
      if (cooldown > 0) await sleep(cooldown);
      checkStop();
      const current = encounter();
      if (!current || current.name !== beast.name || current.age !== beast.age ||
          explorationProgress() !== before) {
        throw new Error("逃跑前遭遇目标或探索进度发生变化，已停止。");
      }
      lastFleeAt = Date.now();
      try {
        await clickAndWait(requireButton(/^逃跑$/, "低年限魂兽的逃跑按钮"),
          () => explorationProgress() !== before || !encounter(),
          "游戏响应逃跑点击", 1250);
      } catch (error) {
        if (state.stopRequested || !String(error?.message).startsWith("等待超时：")) throw error;
        const still = encounter();
        if (explorationProgress() !== before || !still) break;
        if (still.name !== beast.name || still.age !== beast.age) {
          throw new Error("逃跑重试前遭遇目标发生变化，已停止。");
        }
        if (attempt === 1) {
          throw new Error("游戏连续两次未响应逃跑点击，探索进度未变化，已停止。");
        }
        continue;
      }
      break;
    }
    await waitFor(() => !encounter(), "关闭逃跑后的遭遇界面", 3000);
  }

  function strongestNumberSkill() {
    return buttons()
      .filter((el) => !el.disabled && !clean(el.textContent).includes("武魂真身") &&
        /消耗\s*[\d,]+\s*魂力/.test(el.getAttribute("title") ?? ""))
      .map((el) => {
        const bottom = el.lastElementChild;
        const match = bottom?.tagName === "SPAN" &&
          clean(bottom.textContent).match(/(?:魂|神技)\s*·\s*([\d,]+)$/);
        return match ? { el, value: Number(match[1].replaceAll(",", "")) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value)[0] ?? null;
  }

  function battleText() {
    const heading = [...document.querySelectorAll("h1")]
      .find((el) => clean(el.textContent) === "战斗中");
    return heading?.parentElement?.parentElement?.innerText ?? "";
  }

  function battleResult(targetName, victoryText) {
    const text = pageText();
    if (exactButton("确定，返回")) {
      if (!(text.includes(victoryText) || text.includes("战斗胜利！")) ||
        !text.includes(`击败了 ${targetName}`)) {
        throw new Error(`${targetName}的结算界面与预期不符，脚本已停止。`);
      }
      return text.slice(Math.max(0, text.lastIndexOf(`击败了 ${targetName}`)));
    }
    if (/战斗失败|挑战失败|角色阵亡/.test(battleText())) {
      throw new Error(`${targetName}战斗失败`);
    }
    return null;
  }

  function readyForBattleAction() {
    return battleText().includes("你的回合 — 选择行动") && Boolean(availableBattleAction());
  }

  function twinBattleAction() {
    for (const id of ["strike", "break"]) {
      const el = document.querySelector(`[data-twin-skill="${id}"][data-auto-allowed="true"]`);
      if (el && !el.disabled && el.getClientRects().length) return {el, value: 0};
    }
    return null;
  }

  function availableBattleAction() {
    const twin = twinBattleAction();
    if (twin) return twin;
    const skill = strongestNumberSkill();
    if (skill) return skill;
    const basic = exactButton("普通攻击");
    return basic && !basic.disabled ? { el: basic, value: 0 } : null;
  }

  async function fight(targetName, victoryText) {
    // 游戏在战斗页出现后才初始化日志和回合锁；等首条遭遇记录出现再出招。
    await waitFor(() => titleIs("战斗中") &&
      battleText().includes(`遭遇了 ${targetName}`), `${targetName}的战斗初始化`);
    await sleep(200);
    checkStop();
    for (;;) {
      checkStop();
      const result = battleResult(targetName, victoryText);
      if (result !== null) return result;
      if (exactButton("收起魂环")) {
        await collectRingAndSkipDevour();
        continue;
      }
      if (!readyForBattleAction()) {
        await waitFor(() => Boolean(battleResult(targetName, victoryText) !== null ||
          exactButton("收起魂环") || readyForBattleAction()),
        `${targetName}的下一次行动或结算`, 20000);
        continue;
      }
      const strongest = availableBattleAction();
      const beforeSkill = battleText();
      state.lastSkill = clean([...strongest.el.children]
        .find((child) => child.tagName === "SPAN")?.textContent);
      state.lastSkillNumber = strongest.value;
      await clickAndWait(strongest.el, () => battleResult(targetName, victoryText) !== null ||
        battleText() !== beforeSkill,
      `${targetName}的技能结算（数字 ${strongest.value}）`, 12000);
      await waitFor(() => battleResult(targetName, victoryText) !== null || readyForBattleAction(),
        `${targetName}的下一回合或结算`, 20000);
    }
  }

  // 百万年魂兽沿用已经验证过的敌方行动记录流程。
  async function fightMillionBeast(targetName) {
    await waitFor(() => titleIs("战斗中"), `${targetName}的战斗开始`);
    await sleep(200);
    checkStop();
    for (let turn = 0; turn < 20; turn++) {
      checkStop();
      if (exactButton("收起魂环")) {
        await collectRingAndSkipDevour();
        continue;
      }
      const text = pageText();
      if (text.includes("战斗胜利！") && exactButton("确定，返回")) {
        if (!text.includes(targetName)) throw new Error(`胜利界面目标不符：${targetName}`);
        return text.slice(Math.max(0, text.lastIndexOf(`击败了 ${targetName}`)));
      }
      if (/战斗失败|挑战失败|角色阵亡/.test(battleText())) {
        throw new Error(`${targetName}战斗失败`);
      }
      const strongest = availableBattleAction();
      if (!strongest) {
        await waitFor(() => Boolean(exactButton("收起魂环") || exactButton("确定，返回") ||
          availableBattleAction() ||
          /战斗失败|挑战失败|角色阵亡/.test(battleText())),
        `${targetName}的战斗结算`, 12000);
        continue;
      }
      const beforeSkill = battleText();
      const enemyAction = new RegExp(`${targetName} (?:攻击|使用|发动)`);
      const priorEnemyActions = (beforeSkill.match(new RegExp(enemyAction.source, "g")) || []).length;
      state.lastSkill = clean([...strongest.el.children]
        .find((child) => child.tagName === "SPAN")?.textContent);
      state.lastSkillNumber = strongest.value;
      await clickAndWait(strongest.el, () => battleText() !== beforeSkill,
        `${targetName}的技能结算（数字 ${strongest.value}）`, 12000);
      const resultVisible = () => Boolean(exactButton("收起魂环") || exactButton("确定，返回")) ||
        /战斗失败|挑战失败|角色阵亡/.test(battleText());
      await waitFor(() => (battleText().match(new RegExp(enemyAction.source, "g")) || []).length > priorEnemyActions || resultVisible(),
        `${targetName}的敌方回合`, 15000);
      if (!resultVisible()) {
        await waitFor(() => battleText().includes("你的回合 — 选择行动") || resultVisible(),
          `${targetName}的下一回合`, 20000);
      }
    }
    throw new Error(`${targetName}战斗超过20回合，脚本已停止。`);
  }

  async function closeVictory() {
    await clickAndWait(requireButton(/^确定，返回$/, "确定，返回"),
      () => !exactButton("确定，返回"), "关闭胜利界面");
  }

  async function acceptFavorIfShown(targetName) {
    const title = [...document.querySelectorAll("body *")]
      .find((el) => visible(el) && el.children.length === 0 &&
        clean(el.textContent) === "获得青睐");
    if (!title) return false;
    const card = title.parentElement;
    if (!card || !clean(card.innerText).includes(targetName)) {
      throw new Error(`青睐弹窗不是${targetName}，脚本已停止。`);
    }
    const accept = [...card.querySelectorAll("button")]
      .find((el) => visible(el) && clean(el.textContent) === "接受");
    if (!accept) throw new Error(`找不到接受${targetName}青睐的按钮。`);
    await clickAndWait(accept, () => !title.isConnected || !visible(title),
      `接受${targetName}青睐`);
    return true;
  }

  async function runBearTask(options) {
    const wins = Number(options.wins ?? 200);
    const untilItem = options.untilItem ?? "奇茸通天菊";
    if (!Number.isInteger(wins) || wins < 1) throw new Error("熊君挑战次数必须是正整数。");
    state.phase = "挑战熊君";
    const startWins = state.bearWins;
    let itemFound = false;
    await goLake();
    for (let i = 0; i < wins; i++) {
      checkStop();
      await acceptFavorIfShown("熊君");
      const bear = findBearButton();
      if (!bear) throw new Error("生命之湖未找到熊君旁的「挑战」按钮，脚本已停止。");
      await clickAndWait(bear, () => titleIs("战斗中") && pageText().includes("熊君"),
        "进入熊君战斗");
      const reward = await fight("熊君", "讨伐成功");
      state.bearWins++;
      state.lastTarget = "熊君";
      const found = Boolean(untilItem && reward.includes(untilItem));
      if (found) {
        state.lastBearDrop = untilItem;
        itemFound = true;
      }
      report(`熊君 ${state.bearWins - startWins}/${wins}${found ? `；获得${untilItem}` : ""}`);
      await closeVictory();
      await sleep(100);
      checkStop();
      await acceptFavorIfShown("熊君");
      if (found) break;
    }
    return { wins: state.bearWins - startWins, itemFound };
  }

  async function runFierceBossTask(name, counterKey, options, goToBoss, locationName) {
    const wins = Number(options.wins ?? 100);
    if (!Number.isInteger(wins) || wins < 1) {
      throw new Error(`${name}挑战次数必须是正整数。`);
    }
    state.phase = `挑战${name}`;
    const startWins = state[counterKey];
    await goToBoss();
    for (let i = 0; i < wins; i++) {
      checkStop();
      const target = findBossButton(name);
      if (!target) throw new Error(`${locationName}未找到${name}旁的「挑战」按钮，脚本已停止。`);
      await clickAndWait(target, () => titleIs("战斗中") && pageText().includes(name),
        `进入${name}战斗`);
      await fight(name, "讨伐成功");
      state[counterKey]++;
      state.lastTarget = name;
      report(`${name} ${state[counterKey] - startWins}/${wins}`);
      await closeVictory();
    }
    return { wins: state[counterKey] - startWins };
  }

  async function runHeartTask(options) {
    const wins = Number(options.wins ?? 100);
    if (!Number.isInteger(wins) || wins < 1) throw new Error("神界之心挑战次数必须是正整数。");
    state.phase = "挑战神界之心";
    const startWins = state.heartWins;
    await goHeart();
    for (let i = 0; i < wins; i++) {
      checkStop();
      await waitFor(() => {
        const target = button(/^神界之心\s*288000/);
        return Boolean(target && !target.disabled);
      }, "神界之心副本按钮可用");
      const dungeon = requireButton(/^神界之心\s*288000/, "神界之心副本");
      if (!clean(dungeon.textContent).includes("2,000,000年")) {
        throw new Error("副本守护兽年限不是已核对的200万年，脚本已停止。");
      }
      if (!visible(dungeon) || dungeon.disabled) {
        i--;
        await sleep(100);
        continue;
      }
      await clickAndWait(dungeon, () => Boolean(exactButton("进入挑战")), "副本详情");
      await clickAndWait(exactButton("进入挑战"),
        () => titleIs("战斗中") && pageText().includes("神界守护兽"), "进入神界之心战斗");
      await fight("神界守护兽", "副本通关！");
      state.heartWins++;
      state.lastTarget = "神界守护兽";
      report(`神界之心 ${state.heartWins - startWins}/${wins}`);
      await closeVictory();
    }
    return { wins: state.heartWins - startWins };
  }

  async function ensureDungeon3(attribute = "暗") {
    const dungeonName = "五十万年禁区";
    if (await chooseHuntAttribute(attribute, dungeonName)) return;
    if (button(/\d+\s*点击搜索/) && state.activeHuntDungeon === dungeonName &&
        state.activeHuntAttribute === attribute) return;
    if (button(/\d+\s*点击搜索/)) {
      await clickAndWait(requireButton(/^撤离$/, "撤离其他猎魂副本"),
        () => !button(/\d+\s*点击搜索/), "撤离其他猎魂副本");
      state.activeHuntDungeon = null;
      state.activeHuntAttribute = null;
    }
    await goCore();
    if (exactButton("选择副本")) {
      await clickAndWait(exactButton("选择副本"),
        () => Boolean(button(/^副本\s*3\s*五十万年禁区/)), "选择年限副本");
    }
    const dungeon = requireButton(/^副本\s*3\s*五十万年禁区/, "副本三：五十万年禁区");
    await clickAndWait(dungeon,
      () => titleIs("选择魂兽属性") || Boolean(button(/\d+\s*点击搜索/)) ||
        /体力不足/.test(pageText()), "进入副本三");
    await chooseHuntAttribute(attribute, dungeonName);
    if (/体力不足/.test(pageText())) throw new Error("体力不足，已停止进入副本三。");
  }

  async function runMillionTask(options) {
    const attribute = validateHuntAttribute(options.attribute ?? "暗");
    const wins = Number(options.wins ?? 50);
    const minAge = Number(options.minAge ?? 1000000);
    const maxEncounters = Number(options.maxEncounters ?? 10000);
    if (![wins, minAge, maxEncounters].every(Number.isInteger) ||
        wins < 1 || minAge < 1000000 || maxEncounters < wins) {
      throw new Error("百万年模式参数无效：wins、minAge、maxEncounters须为有效正整数。");
    }
    state.phase = "筛选百万年魂兽";
    const startWins = state.millionWins;
    const startFled = state.lowAgeFled;
    const startEncounters = state.encounters;
    for (let i = 0; state.millionWins - startWins < wins && i < maxEncounters; i++) {
      checkStop();
      let beast = encounter();
      if (!beast) {
        await ensureDungeon3(attribute);
        const node = button(/\d+\s*点击搜索/);
        if (!node) throw new Error("副本三没有可搜索的节点。");
        await clickAndWait(node, () => Boolean(encounter()), "搜索魂兽");
        beast = encounter();
      }
      if (!beast) throw new Error("搜索后仍未出现魂兽。");
      state.encounters++;
      state.lastTarget = `${beast.name} ${beast.age}年`;
      if (beast.age < minAge) {
        await fleeLowAge(beast);
        state.lowAgeFled++;
        if (state.lowAgeFled % 20 === 0) report(`已逃离${state.lowAgeFled}只低年限魂兽`);
        continue;
      }
      await clickAndWait(requireButton(/^开始对战$/, "开始对战"),
        () => titleIs("战斗中"), "进入百万年魂兽战斗");
      await fightMillionBeast(beast.name);
      state.millionWins++;
      report(`百万年魂兽 ${state.millionWins - startWins}/${wins}：${beast.name} ${beast.age}年`);
      await closeVictory();
    }
    if (state.millionWins - startWins < wins) {
      throw new Error(`已达到最多${maxEncounters}次遭遇，当前完成${state.millionWins - startWins}/${wins}次。`);
    }
    return {
      wins: state.millionWins - startWins,
      fled: state.lowAgeFled - startFled,
      encounters: state.encounters - startEncounters,
    };
  }

  // 一键轮回只负责已转世角色从十级练至九十九级，不触发「转世重修」。
  function morePageEntry(label) {
    return [...(gameContent()?.querySelectorAll("button") ?? [])].find((el) =>
      visible(el) && (clean(el.textContent) === label ||
        [...el.querySelectorAll("div,span")].some((name) => clean(name.textContent) === label)));
  }

  async function openSidebarPage(label, heading) {
    if (mainTitle() === heading) return;
    let entry = exactButton(label);
    if (!entry && exactButton("更多")) {
      const more = exactButton("更多");
      if (more.getAttribute("aria-selected") !== "true") {
        await clickAndWait(more, () => more.getAttribute("aria-selected") === "true", "更多标签");
      }
      for (let depth = 0; depth < 6 && mainTitle() !== "更多功能"; depth++) {
        const previous = mainTitle();
        const back = [...(gameContent()?.querySelectorAll("button") ?? [])]
          .find((el) => visible(el) && el.querySelector("svg.lucide-arrow-left,svg.lucide-x"));
        if (!back) throw new Error(`无法从「${previous}」返回更多功能菜单。`);
        await clickAndWait(back, () => mainTitle() !== previous, "返回更多功能菜单");
      }
      if (mainTitle() !== "更多功能") throw new Error("更多功能菜单返回层级超过预期。");
      await waitFor(() => Boolean(morePageEntry(label)), `${label}菜单入口`);
      entry = morePageEntry(label);
    }
    if (!entry) throw new Error(`找不到页面入口：${label}`);
    if (entry.disabled) throw new Error(`页面入口尚未解锁：${label}。${clean(entry.textContent)}`);
    await clickAndWait(entry,
      () => mainTitle() === heading, `${heading}页面`);
  }

  async function openShrekPage(name) {
    if (mainTitle() === name) return;
    await goWorld();
    await clickAndWait(requireButton(/^史莱克学院/, "史莱克学院"),
      () => mainTitle() === "史莱克学院", "史莱克学院");
    await clickAndWait(requireButton(new RegExp(`^${name}`), name),
      () => mainTitle() === name, `${name}页面`);
  }

  function arenaStars() {
    const text = clean(gameContent()?.textContent);
    if (/当前段位\s*王者/.test(text)) return 30;
    const rank = text.match(/当前段位\s*(青铜|白银|黄金|铂金|钻石|星耀)/);
    const stars = text.match(/累计\s*(\d+)\s*星/);
    if (!rank || !stars) throw new Error("无法读取竞技场段位和星数。");
    return Number(stars[1]);
  }

  async function fightForRebirth(label) {
    const action = () => twinBattleAction() || strongestNumberSkill() ||
      (exactButton("普通攻击") && !exactButton("普通攻击").disabled
        ? { el: exactButton("普通攻击"), value: 0 } : null);
    const ready = () => battleText().includes("你的回合 — 选择行动") && Boolean(action());
    await waitFor(() => titleIs("战斗中") && battleText().length > 0,
      `${label}的战斗初始化`);
    await sleep(200);
    let turns = 0;
    while (turns < 60) {
      checkStop();
      if (/战斗失败|挑战失败|角色阵亡|你被击败了/.test(battleText())) {
        throw new Error(`${label}战斗失败，请检查战力后再开启。`);
      }
      if (exactButton("收起魂环") || exactButton("收入魂灵") ||
          exactButton("确定，返回") || !titleIs("战斗中")) {
        if (/你被击败了|战斗失败|挑战失败/.test(battleText())) {
          throw new Error(`${label}战斗失败，请检查战力后再开启。`);
        }
        return;
      }
      if (!ready()) {
        await waitFor(() => ready() || exactButton("收起魂环") ||
          exactButton("收入魂灵") || exactButton("确定，返回") ||
          !titleIs("战斗中") || /战斗失败|挑战失败|角色阵亡/.test(battleText()),
        `${label}的下一回合或结算`, 25000);
        continue;
      }
      const strongest = action();
      const before = battleText();
      state.lastSkillNumber = strongest.value;
      state.lastSkill = clean(strongest.el.textContent);
      await clickAndWait(strongest.el,
        () => battleText() !== before || !titleIs("战斗中"),
        `${label}的技能结算`, 15000);
      turns++;
    }
    throw new Error(`${label}超过60回合，脚本已停止。`);
  }

  async function closeBattleIfNeeded() {
    if (exactButton("确定，返回")) await closeVictory();
    await waitFor(() => !titleIs("战斗中"), "战斗页面退出", 10000);
  }

  async function enterInnerCourt() {
    state.phase = "史莱克学院晋升";
    await goWorld();
    await clickAndWait(requireButton(/^史莱克学院/, "史莱克学院"),
      () => mainTitle() === "史莱克学院", "进入史莱克学院");
    if (clean(gameContent()?.textContent).includes("当前身份 内院学员")) {
      await openShrekPage("内院");
      if (!button(/^修炼心得/)) throw new Error("内院学员无法进入修炼心得。");
      return;
    }
    if (exactButton("立即加入")) {
      await clickAndWait(exactButton("立即加入"),
        () => !exactButton("立即加入"), "加入史莱克学院");
    }
    await openShrekPage("新生区域");
    if (button(/^新生考核/) && !button(/^新生考核/).disabled) {
      await clickAndWait(requireButton(/^新生考核/, "新生考核"),
        () => mainTitle() === "新生考核", "进入新生考核");
      if (exactButton("开始考核")) {
        if (playerLevel() < 10) throw new Error("新生考核需要至少10级。");
        await clickAndWait(exactButton("开始考核"),
          () => titleIs("战斗中"), "开始新生考核");
        await fightForRebirth("新生考核");
        await waitFor(() => mainTitle() === "外院", "新生考核晋级为外院学员", 10000);
        await closeBattleIfNeeded();
      }
    }
    await openShrekPage("外院");
    if (!button(/^竞技场/)) throw new Error("新生考核后仍未解锁外院竞技场。");
    await clickAndWait(requireButton(/^竞技场/, "竞技场"),
      () => mainTitle() === "竞技场", "进入竞技场");
    for (let matches = 0; matches < 40; matches++) {
      checkStop();
      const before = arenaStars();
      if (before >= 30) break;
      state.phase = `竞技场 ${before}/30 星`;
      await clickAndWait(requireButton(/^开始对战$/, "竞技场开始对战"),
        () => titleIs("战斗中"), "进入竞技场战斗");
      await fightForRebirth("竞技场");
      await closeBattleIfNeeded();
      await waitFor(() => /战斗胜利！|战斗失败/.test(clean(document.querySelector(".fixed")?.textContent)) ||
        (mainTitle() === "竞技场" && arenaStars() > before), "竞技场对战结算");
      if (/战斗失败/.test(clean(document.querySelector(".fixed")?.textContent))) {
        throw new Error("竞技场战斗失败，请检查角色战力后继续。");
      }
      if (/战斗胜利！/.test(clean(document.querySelector(".fixed")?.textContent))) {
        await clickAndWait(requireButton(/^确定$/, "竞技场结算确定"),
          () => !/战斗胜利！/.test(clean(document.querySelector(".fixed")?.textContent)),
          "关闭竞技场结算");
      }
      await waitFor(() => mainTitle() === "竞技场" && arenaStars() > before,
        "竞技场获胜加星", 10000);
      state.rebirthArenaWins++;
    }
    if (arenaStars() < 30) throw new Error("竞技场40场内未达到王者段位。");
    await openShrekPage("内院");
    if (!button(/^修炼心得/)) throw new Error("达到王者后仍未解锁内院修炼心得。");
  }

  async function goMentors() {
    await openShrekPage("内院");
    await clickAndWait(requireButton(/^修炼心得/, "修炼心得"),
      () => mainTitle() === "修炼心得", "进入修炼心得");
  }

  function mentorButtons() {
    return [...(gameContent()?.querySelectorAll("button") ?? [])].filter(visible)
      .map((el) => {
        const text = clean(el.textContent);
        const reward = text.match(/修为奖励：\s*\+\s*([\d,]+)/);
        return reward ? { el, reward: Number(reward[1].replaceAll(",", "")),
          name: text.split(/\s/)[0] } : null;
      }).filter(Boolean).sort((a, b) => a.reward - b.reward);
  }

  async function cultivationStatus() {
    await openSidebarPage("闭关", "闭关修炼");
    const level = playerLevel();
    const text = clean(gameContent()?.textContent);
    const progress = text.match(/修为进度\s*([\d,]+)\s*\/\s*([\d,]+|MAX)/);
    if (!progress) throw new Error("闭关页无法读取修为进度。");
    return { level, exp: Number(progress[1].replaceAll(",", "")),
      required: progress[2] === "MAX" ? Infinity : Number(progress[2].replaceAll(",", "")) };
  }

  async function handleBreakthrough(status) {
    if (status.exp < status.required || status.level >= 99) return false;
    const level = status.level;
    if (level === 89) {
      state.phase = "89级凝聚阴魂核";
      const yin = requireButton(/^阴魂核/, "阴魂核");
      await clickAndWait(yin, () => playerLevel() === 90, "阴魂核突破至90级");
      return true;
    }
    if (level === 98) {
      state.phase = "98级凝聚第二魂核";
      const yang = requireButton(/^凝聚阳魂核/, "凝聚阳魂核");
      await clickAndWait(yang, () => playerLevel() === 99, "双魂核突破至99级");
      return true;
    }
    if (level % 10 !== 9) return false;
    state.phase = `${level}级闭关突破`;
    const start = requireButton(/^开始闭关突破$/, "开始闭关突破");
    await clickAndWait(start, () => playerLevel() > level,
      `${level}级闭关突破`, 110000);
    return true;
  }

  async function mainRingCount() {
    await openSidebarPage("魂环", "魂环");
    const mainSoul = button(/^主修武魂/);
    if (mainSoul && !mainSoul.className.includes("bg-cyan-800")) {
      await clickAndWait(mainSoul,
        () => Boolean(button(/^主修武魂/)?.className.includes("bg-cyan-800")),
        "切换主修武魂");
    }
    const count = clean(gameContent()?.textContent)
      .match(/已吸收\s*(\d+)\s*\/\s*(\d+)/);
    if (!count) throw new Error("无法确认主修武魂的魂环数。");
    return Number(count[1]);
  }

  function pendingRingButtons() {
    const heading = [...(gameContent()?.querySelectorAll("h3") ?? [])]
      .find((el) => clean(el.textContent) === "待吸收魂环");
    return heading ? [...heading.parentElement.parentElement.querySelectorAll("button")]
      .filter(visible) : [];
  }

  function mainRingLimit(index) {
    const base = [600, 900, 5000, 7000, 30000, 60000, 80000, 90000, 1000000][index];
    if (!base) throw new Error(`主修第${index + 1}环没有已知上限。`);
    if (index === 8) return 1000000; // 游戏说明：第九环100万年以下必定成功。
    const heading = [...(gameContent()?.querySelectorAll("h3") ?? [])]
      .find((el) => clean(el.textContent) === "魂环吸收上限表");
    const firstSoul = heading?.parentElement?.parentElement?.querySelector(".mb-4 .grid");
    const card = firstSoul?.children[index];
    if (!card) throw new Error(`无法读取主修第${index + 1}环的上限卡片。`);
    const bonus = clean(card?.textContent).match(/轮回\s*\+\s*([\d,]+)\s*年/);
    if (!bonus && clean(card.textContent).includes("轮回")) {
      throw new Error(`无法读取主修第${index + 1}环的轮回上限。`);
    }
    return base + (bonus ? Number(bonus[1].replaceAll(",", "")) : 0);
  }

  async function absorbEligibleRing(beforeCount, minAge, maxAge) {
    await mainRingCount();
    for (const candidate of pendingRingButtons()) {
      checkStop();
      if (!visible(candidate)) continue;
      const listedAge = clean(candidate.innerText).match(/([\d,]+)\s*年/);
      if (!listedAge) continue;
      const listedYears = Number(listedAge[1].replaceAll(",", ""));
      if (listedYears < minAge || listedYears > maxAge) continue;
      await clickAndWait(candidate, () => Boolean(exactButton("吸收魂环")),
        "查看待吸收魂环");
      const absorb = exactButton("吸收魂环");
      const modal = absorb?.closest(".fixed");
      const detail = clean(modal?.textContent);
      const years = detail.match(/来源：.*?([\d,]+)\s*年/);
      const age = years ? Number(years[1].replaceAll(",", "")) : NaN;
      const rate = Number(detail.match(/吸收成功率\s*(\d+(?:\.\d+)?)%/)?.[1]);
      if (rate > 0 && age >= minAge && age <= maxAge && !absorb.disabled) {
        state.phase = `吸收主修第${beforeCount + 1}环`;
        await clickAndWait(absorb,
          () => clean(gameContent()?.textContent)
            .match(/已吸收\s*(\d+)\s*\/\s*\d+/)?.[1] === String(beforeCount + 1) ||
            /吸收失败/.test(clean(modal?.textContent)) || !modal?.isConnected,
          `第${beforeCount + 1}环吸收结果`, 10000);
        await waitFor(() => !exactButton("吸收魂环"), "魂环吸收动画关闭", 10000);
        const afterCountText = clean(gameContent()?.textContent)
          .match(/已吸收\s*(\d+)\s*\/\s*\d+/)?.[1];
        if (afterCountText == null) throw new Error("吸收后无法确认主修魂环数，已停止。");
        const afterCount = Number(afterCountText);
        if (afterCount === beforeCount + 1) {
          state.rebirthRings++;
          if (titleIs("封 号 斗 罗")) {
            throw new Error("第九环已吸收。请手动设置不可修改的两字封号，然后重新开启一键轮回。");
          }
          return true;
        }
        if (afterCount !== beforeCount) throw new Error("吸收后主修魂环数异常，已停止。");
        state.rebirthRingFailures++;
        state.phase = `第${beforeCount + 1}环吸收失败，继续寻找`;
        report(`第${beforeCount + 1}环${age}年吸收失败（成功率${rate}%），继续寻找`);
        return false;
      }
      const close = modal?.querySelector('button[aria-label="关闭"]') ||
        [...(modal?.querySelectorAll("button") ?? [])].find((el) => clean(el.textContent) === "关闭");
      if (!close) throw new Error("无法关闭不满足年限或吸收条件的魂环详情。");
      await clickAndWait(close, () => !exactButton("吸收魂环"), "关闭魂环详情");
    }
    return false;
  }

  const ringDungeons = [
    { zone: "外围", dungeon: "十年魂兽集聚地", yearMin: 10, yearMax: 99, rareMax: 495 },
    { zone: "外围", dungeon: "百年魂兽聚集地", yearMin: 100, yearMax: 500, rareMax: 2000 },
    { zone: "外围", dungeon: "高阶百年猎场", yearMin: 500, yearMax: 1200, rareMax: 3600 },
    { zone: "中部", dungeon: "低阶千年秘境", yearMin: 1000, yearMax: 3000, rareMax: 9000 },
    { zone: "中部", dungeon: "中阶千年秘境", yearMin: 3000, yearMax: 6000, rareMax: 15000 },
    { zone: "中部", dungeon: "高阶千年秘境", yearMin: 6000, yearMax: 9999, rareMax: 19998 },
    { zone: "内圈", dungeon: "低阶万年猎场", yearMin: 10000, yearMax: 30000, rareMax: 90000 },
    { zone: "内圈", dungeon: "中阶万年猎场", yearMin: 30000, yearMax: 60000, rareMax: 150000 },
    { zone: "内圈", dungeon: "高阶万年猎场", yearMin: 60000, yearMax: 99000, rareMax: 198000 },
    { zone: "核心区", dungeon: "十万年边缘", yearMin: 100000, yearMax: 200000, rareMax: 500000 },
    { zone: "核心区", dungeon: "二十万年腹地", yearMin: 200000, yearMax: 500000, rareMax: 1000000 },
    { zone: "核心区", dungeon: "五十万年禁区", yearMin: 500000, yearMax: 990000, rareMax: 1485000 },
  ];

  function selectRingDungeon(minAge, maxAge) {
    if (!Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < 1 || minAge > maxAge) {
      throw new Error(`没有可吸收的魂环年限区间：${minAge}—${maxAge}年。`);
    }
    const ranked = ringDungeons.map((target) => {
      const eligibleYears = Math.max(0,
        Math.min(maxAge, target.yearMax) - Math.max(minAge, target.yearMin) + 1);
      const width = target.yearMax - target.yearMin + 1;
      return { target, eligibleYears, coverage: eligibleYears / width };
    }).filter(({ eligibleYears }) => eligibleYears > 0)
      .sort((a, b) => b.coverage - a.coverage || b.eligibleYears - a.eligibleYears ||
        b.target.yearMax - a.target.yearMax);
    if (ranked.length) return ranked[0].target;
    const rareRanked = ringDungeons.map((target) => {
      const rareMin = target.yearMax + 1;
      const eligibleYears = Math.max(0,
        Math.min(maxAge, target.rareMax) - Math.max(minAge, rareMin) + 1);
      return { target, eligibleYears, coverage: eligibleYears / (target.rareMax - target.yearMax) };
    }).filter(({ eligibleYears }) => eligibleYears > 0)
      .sort((a, b) => b.coverage - a.coverage || b.eligibleYears - a.eligibleYears);
    if (!rareRanked.length) throw new Error(`现有猎魂副本无法匹配${minAge}—${maxAge}年魂环。`);
    return rareRanked[0].target;
  }

  function ringSearchMaxAge(minAge, guaranteedLimit) {
    // 仅用于挑选猎场；用户填写下限时，遭遇和吸收阶段不设这个上界。
    if (minAge <= guaranteedLimit) return guaranteedLimit;
    const huntMax = Math.max(...ringDungeons.map((target) => target.rareMax));
    if (minAge > huntMax) {
      throw new Error(`最低年限${minAge}年超过已知猎魂副本最高可遇年限${huntMax}年。`);
    }
    return Math.min(huntMax, Math.ceil(minAge * 1.1));
  }

  function ringBeastEligible(beast, minAge, maxAge) {
    return Number.isFinite(beast.age) && beast.age >= minAge && beast.age <= maxAge;
  }

  async function ensureRingDungeon(target, attribute = "暗") {
    if (await chooseHuntAttribute(attribute, target.dungeon)) return;
    if (button(/\d+\s*点击搜索/) && mainTitle() === target.zone &&
        state.activeHuntDungeon === target.dungeon && state.activeHuntAttribute === attribute) return;
    if (button(/\d+\s*点击搜索/)) {
      await clickAndWait(requireButton(/^撤离$/, "撤离其他猎魂副本"),
        () => !button(/\d+\s*点击搜索/), "撤离其他猎魂副本");
      state.activeHuntDungeon = null;
      state.activeHuntAttribute = null;
    }
    await goForest();
    await clickAndWait(requireButton(new RegExp(`^\\d+\\s*${target.zone}`), target.zone),
      () => mainTitle() === target.zone, `进入${target.zone}`);
    await clickAndWait(requireButton(/^选择副本$/, "选择副本"),
      () => mainTitle() === `${target.zone} · 副本`, "选择年限副本");
    await clickAndWait(requireButton(new RegExp(`^副本\\s*\\d+\\s*${target.dungeon}`), target.dungeon),
      () => titleIs("选择魂兽属性") || Boolean(button(/\d+\s*点击搜索/)) ||
        /体力不足/.test(pageText()),
      `进入${target.dungeon}`);
    await chooseHuntAttribute(attribute, target.dungeon);
    if (/体力不足/.test(pageText())) throw new Error("体力不足，无法继续猎取主修魂环。");
  }

  function normalizeRingMinYears(values) {
    if (values == null) return Array(9).fill(null);
    if (!Array.isArray(values) || values.length !== 9) {
      throw new Error("主修魂环下限须包含第1至第9环的9个设置。");
    }
    return values.map((value, index) => {
      if (value == null || value === "") return null;
      if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`第${index + 1}环下限必须是正整数年限。`);
      }
      return value;
    });
  }

  function ringMinAge(index, limit, ringMinYears) {
    return ringMinYears[index] ?? Math.ceil(limit * 0.7);
  }

  async function ensureMainRing(level, attribute = "暗", ringMinYears = Array(9).fill(null)) {
    const needed = Math.min(9, Math.floor(level / 10));
    let count = await mainRingCount();
    for (; count < needed; count++) {
      checkStop();
      const limit = mainRingLimit(count);
      const minAge = ringMinAge(count, limit, ringMinYears);
      const guaranteedLimit = count === 8 ? 999999 : limit;
      const searchMaxAge = ringSearchMaxAge(minAge, guaranteedLimit);
      const maxAge = ringMinYears[count] == null ? guaranteedLimit : Number.MAX_SAFE_INTEGER;
      const target = selectRingDungeon(minAge, searchMaxAge);
      state.phase = `第${count + 1}环必成年限${guaranteedLimit}年，前往${target.zone}·${target.dungeon}`;
      report(`主修第${count + 1}环：最低${minAge}年，必成年限${guaranteedLimit}年，选择${target.zone}·${target.dungeon}${ringMinYears[count] == null ? "（自动环只选必成魂环）" : "（自定环不设年限上界）"}`);
      if (await absorbEligibleRing(count, minAge, maxAge)) continue;
      if (playerLevel() < (count + 1) * 10) return;
      let absorbed = false;
      for (let encounterNo = 0; encounterNo < 120 && !absorbed; encounterNo++) {
        checkStop();
        let beast = encounter();
        if (!beast) {
          await ensureRingDungeon(target, attribute);
          const node = button(/\d+\s*点击搜索/);
          if (!node) throw new Error("猎魂副本没有可搜索的节点。");
          await clickAndWait(node, () => Boolean(encounter()), "寻找魂环魂兽");
          beast = encounter();
        }
        if (!beast) throw new Error("搜索后未出现魂兽。");
        state.lastTarget = `${beast.name} ${beast.age}年`;
        if (!ringBeastEligible(beast, minAge, maxAge)) {
          await fleeLowAge(beast);
          continue;
        }
        await clickAndWait(requireButton(/^开始对战$/, "开始对战"),
          () => titleIs("战斗中"), "进入猎魂战斗");
        await fightForRebirth(beast.name);
        await collectRingAndSkipDevour();
        await closeBattleIfNeeded();
        if (/已收集魂环\s*[1-9]/.test(clean(gameContent()?.textContent))) {
          await clickAndWait(requireButton(/^撤离$/, "带魂环撤离"),
            () => !button(/\d+\s*点击搜索/), "撤离猎魂副本");
          absorbed = await absorbEligibleRing(count, minAge, maxAge);
          if (!absorbed && playerLevel() < (count + 1) * 10) return;
        }
      }
      if (!absorbed) throw new Error(`连续120次遭遇仍未成功吸收满足下限的第${count + 1}环。`);
      const actual = await mainRingCount();
      if (actual !== count + 1) throw new Error("吸收后主修魂环数未增加，已停止。");
    }
  }

  async function acquireLightSpirit() {
    state.phase = "契约极光神帝魂灵";
    await openSidebarPage("魂灵", "魂灵");
    const spiritCard = (selector) => [...(gameContent()?.querySelectorAll("span,div") ?? [])]
      .find((el) => visible(el) && clean(el.textContent) === "魂灵·光帝")?.closest(selector);
    const switchTab = async (pattern, label) => {
      const tab = requireButton(pattern, label);
      if (!tab.className.includes("border-b-2")) {
        await clickAndWait(tab, () => tab.className.includes("border-b-2"), label);
      }
    };
    const waitForCards = async (tabPattern, cardSelector, label) => {
      await waitFor(() => {
        const tab = button(tabPattern);
        const expected = Number(clean(tab?.textContent).match(/\((\d+)/)?.[1] ?? 0);
        return [...(gameContent()?.querySelectorAll(cardSelector) ?? [])].filter(visible).length >= expected;
      }, `${label}卡片加载`);
    };
    await switchTab(/^已契约\s*\(/, "已契约列表");
    await waitForCards(/^已契约\s*\(/, ".cursor-pointer", "已契约魂灵");
    let contracted = Boolean(spiritCard(".cursor-pointer"));
    if (!contracted) {
      await switchTab(/^待选择\s*\(/, "待选择列表");
      await waitForCards(/^待选择\s*\(/, ".rounded-xl:has(button)", "待选择魂灵");
    }
    if (!contracted && !spiritCard(".rounded-xl")) {
      await goWorld();
      await clickAndWait(requireButton(/^传灵塔/, "传灵塔"),
        () => mainTitle() === "传灵塔", "进入传灵塔");
      await clickAndWait(requireButton(/^光\s*光明鹿/, "光属性副本"),
        () => mainTitle() === "光属性副本", "进入光属性副本");
      await clickAndWait(requireButton(/^极\s*极光神帝/, "极光神帝"),
        () => titleIs("战斗中"), "挑战极光神帝");
      await fightForRebirth("极光神帝");
      await clickAndWait(requireButton(/^收入魂灵$/, "收入魂灵"),
        () => !exactButton("收入魂灵"), "收取光帝魂灵");
      await closeBattleIfNeeded();
      await openSidebarPage("魂灵", "魂灵");
      await switchTab(/^待选择\s*\(/, "待选择魂灵");
      await waitForCards(/^待选择\s*\(/, ".rounded-xl:has(button)", "待选择魂灵");
    }
    if (!contracted) {
      const pending = spiritCard(".rounded-xl");
      const contract = pending && [...pending.querySelectorAll("button")]
        .find((el) => clean(el.textContent) === "契约");
      if (!contract) throw new Error("待选择列表没有光帝魂灵，可能已过7分钟时限。");
      await clickAndWait(contract,
        () => !contract.isConnected,
        "契约光帝魂灵");
    }
    await openSidebarPage("魂灵", "魂灵");
    await switchTab(/^上阵\s*\(/, "上阵列表");
    await waitFor(() => /(?:未|已)上阵/.test(clean(spiritCard(".cursor-pointer")?.textContent)),
      "上阵列表的光帝魂灵");
    const activeCard = spiritCard(".cursor-pointer");
    if (!activeCard) throw new Error("上阵列表找不到光帝魂灵。");
    if (clean(activeCard.textContent).includes("未上阵")) activeCard.click();
    await waitFor(() => clean(spiritCard(".cursor-pointer")?.textContent).includes("已上阵"), "光帝魂灵上阵");
    await switchTab(/^已契约\s*\(/, "已契约列表");
    await waitFor(() => clean(spiritCard(".cursor-pointer")?.textContent).includes("光明"),
      "已契约列表的光帝魂灵");
    const card = spiritCard(".cursor-pointer");
    if (!card) throw new Error("已契约列表找不到光帝魂灵。");
    card.click();
    await waitFor(() => titleIs("魂灵详情"), "光帝魂灵详情");
    for (let upgrades = 0; upgrades < 100; upgrades++) {
      checkStop();
      const main = gameContent();
      const upgrade = [...main.querySelectorAll("button")].find((el) =>
        visible(el) && /^(升级|突破)\s/.test(clean(el.textContent)));
      if (!upgrade) {
        if (!clean(main.textContent).includes("已达神级")) {
          throw new Error("光帝魂灵升级按钮消失，状态无法确认。");
        }
        break;
      }
      if (upgrade.disabled) break; // 魂币不足：达到当前可升级的上限。
      const before = clean(main.textContent.match(/小境界进度\s*\d+\s*\/\s*9/)?.[0]);
      const label = clean(upgrade.textContent);
      await clickAndWait(upgrade,
        () => clean(gameContent()?.textContent.match(/小境界进度\s*\d+\s*\/\s*9/)?.[0]) !== before ||
          !button(new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)),
        `魂灵${label}`);
    }
    state.rebirthSpiritReady = true;
  }

  async function runRebirthTask(options = {}) {
    const attribute = validateHuntAttribute(options.attribute ?? "暗");
    const ringMinYears = normalizeRingMinYears(options.ringMinYears);
    const initialLevel = playerLevel();
    if (initialLevel >= 99) return { level: initialLevel, alreadyComplete: true };
    if (initialLevel < 10) throw new Error("一键轮回从初始10级开始；当前等级低于10级。");
    state.rebirthSpiritReady = false;
    let status = await cultivationStatus();
    if (status.level < 60) await ensureMainRing(status.level, attribute, ringMinYears);
    await enterInnerCourt();
    for (let claims = 0; claims < 1000; claims++) {
      checkStop();
      status = await cultivationStatus();
      if (status.level >= 99) return { level: status.level, mentorClaims: claims };
      if (status.level >= 60 && !state.rebirthSpiritReady) {
        await acquireLightSpirit();
        continue;
      }
      await ensureMainRing(status.level, attribute, ringMinYears);
      status = await cultivationStatus();
      if (await handleBreakthrough(status)) continue;
      await goMentors();
      let mentors = mentorButtons();
      if (!mentors.length) throw new Error("内院修炼心得没有导师按钮。");
      if (mentors.every(({ el }) => el.disabled)) {
        state.phase = "等待导师冷却";
        const deadline = Date.now() + 320000;
        while (Date.now() < deadline) {
          checkStop();
          if (mainTitle() !== "修炼心得") await goMentors();
          if (mentorButtons().some(({ el }) => !el.disabled)) break;
          await sleep(1000);
        }
        mentors = mentorButtons();
      }
      const mentor = mentors.find(({ el }) => !el.disabled);
      if (!mentor) throw new Error("导师冷却后仍不可领取修为。");
      const beforeLevel = playerLevel();
      state.phase = `领取${mentor.name}的${mentor.reward}修为`;
      await clickAndWait(mentor.el,
        () => playerLevel() !== beforeLevel || mentor.el.disabled ||
          clean(mentor.el.textContent).includes("冷却中"),
        `领取${mentor.name}修为`);
      state.rebirthMentorClaims++;
      const after = await cultivationStatus();
      if (after.level < beforeLevel) throw new Error("领取导师奖励后等级下降，已停止。");
      report(`导师${mentor.name} +${mentor.reward}；当前${after.level}级，修为${after.exp}/${after.required}`);
    }
    throw new Error("达到1000次导师指导上限，仍未到99级。");
  }

  async function execute(task) {
    if (state.running) throw new Error("脚本正在运行另一项任务。");
    state.running = true;
    state.stopRequested = false;
    state.lastError = null;
    try {
      if (exactButton("确定，返回")) await closeVictory();
      if (titleIs("战斗中")) {
        throw new Error("当前战斗尚未结束，请先完成战斗再开启新任务。");
      }
      const result = await task();
      state.phase = "完成";
      report("任务完成");
      return result;
    } catch (error) {
      state.lastError = String(error?.message ?? error);
      state.phase = state.stopRequested ? "已停止" : "出错";
      console.error("[斗罗脚本] 已停止：", error, { ...state });
      throw error;
    } finally {
      state.running = false;
    }
  }

  function soulPreview() {
    const modal = [...document.querySelectorAll("h3")]
      .find((el) => visible(el) && clean(el.textContent) === "转世确认")?.parentElement?.parentElement;
    const preview = [...(modal?.querySelectorAll("button") || [])]
      .find((el) => /再抽一次|抽取预览武魂/.test(clean(el.textContent)))?.parentElement;
    if (!preview) return [];
    return [...preview.querySelectorAll(".cursor-pointer")].map((card) => {
      const lines = card.innerText.split("\n").map(clean).filter(Boolean);
      const name = lines.at(-2);
      const rarity = lines.at(-1);
      if (!name || !rarity) throw new Error("无法读取武魂预览卡片，已停止刷新。");
      return { name, rarity, selected: lines.slice(0, -2).some((line) => line.includes("主修武魂") && !line.includes("设为主修")), card };
    });
  }

  async function runSoulSearchTask({ main, secondary = "" } = {}) {
    main = clean(main);
    secondary = clean(secondary);
    if (!main) throw new Error("请先选择主修目标武魂。");
    if (secondary && secondary === main && !main.startsWith("任意")) {
      throw new Error("主修和次修的具体武魂名称不能相同。");
    }
    const matches = ({ name, rarity }, target) => target.startsWith("任意")
      ? rarity === target.slice(2) : name === target;
    if (!titleIs("转世确认")) {
      if (!button(/^转世重修$/)) await openSidebarPage("转世轮回", "转世轮回");
      const open = requireButton(/^转世重修$/, "转世重修");
      await clickAndWait(open, () => titleIs("转世确认"), "转世确认窗口");
    }
    if (!button(/再抽一次|抽取预览武魂/)) {
      await clickAndWait(requireButton(/^重新觉醒/, "重新觉醒"),
        () => Boolean(button(/再抽一次|抽取预览武魂/)), "重新觉醒预览");
    }
    for (;;) {
      checkStop();
      const cards = soulPreview();
      const mainIndex = cards.findIndex((card, index) => matches(card, main) &&
        (!secondary || cards.some((other, otherIndex) => otherIndex !== index && matches(other, secondary))));
      if (mainIndex >= 0) {
        if (!cards[mainIndex].selected) {
          const selectedName = cards[mainIndex].name;
          cards[mainIndex].card.click();
          await waitFor(() => soulPreview().some((card) => card.name === selectedName && card.selected),
            "将目标武魂设为主修");
        }
        state.lastSoulPreview = soulPreview().map(({ name, rarity }) => ({ name, rarity }));
        state.phase = `找到目标：${main}${secondary ? ` + ${secondary}` : ""}`;
        return { found: true, rolls: state.soulRolls, preview: state.lastSoulPreview };
      }
      const roll = button(/再抽一次|抽取预览武魂/);
      if (!roll) throw new Error("未找到武魂重抽按钮；请确认仍在转世预览窗口。");
      if (roll.disabled) await waitFor(() => !roll.disabled, "武魂刷新按钮恢复");
      state.phase = `寻找${main}${secondary ? ` + ${secondary}` : ""}，已重抽${state.soulRolls}次`;
      roll.click();
      await waitFor(() => roll.disabled || !roll.isConnected, "武魂刷新开始", 3000);
      await waitFor(() => {
        const next = button(/再抽一次/);
        return Boolean(next && !next.disabled && soulPreview().length);
      }, "武魂刷新完成", 15000);
      state.soulRolls++;
      state.lastSoulPreview = soulPreview().map(({ name, rarity }) => ({ name, rarity }));
    }
  }

  window.DouluoBot = Object.freeze({
    runBear: (options = {}) => execute(() => runBearTask(options)),
    runDitian: (options = {}) => execute(() => runFierceBossTask("帝天", "ditianWins", options, goLake, "生命之湖")),
    runXiedi: (options = {}) => execute(() => runFierceBossTask("邪帝", "xiediWins", options, goLake, "生命之湖")),
    runSnow: (options = {}) => execute(() => runFierceBossTask("雪帝", "snowWins", options, goSnow, "极寒冰域")),
    runHeart: (options = {}) => execute(() => runHeartTask(options)),
    runMillion: (options = {}) => execute(() => runMillionTask(options)),
    runRebirth: (options = {}) => execute(() => runRebirthTask(options)),
    runSoulSearch: (options = {}) => execute(() => runSoulSearchTask(options)),
    observedSouls: () => observedSouls,
    runAll: (options = {}) => execute(async () => {
      const result = {};
      if (options.bear !== false) result.bear = await runBearTask(options.bear ?? {});
      if (options.heart !== false) result.heart = await runHeartTask(options.heart ?? {});
      if (options.million !== false) result.million = await runMillionTask(options.million ?? {});
      return result;
    }),
    stop: () => { state.stopRequested = true; },
    status: () => ({ ...state }),
  });
  report("已加载。可运行 DouluoBot.runBear()、runHeart()、runMillion()、runRebirth() 或 runAll()。\n用 DouluoBot.stop() 停止。");
  }

/* PANEL_UI_START */
  function installControlPanel() {
  "use strict";
  const bot = window.DouluoBot;
  if (!bot || document.getElementById("douluo-control-panel")) return;

  const host = document.createElement("div");
  host.id = "douluo-control-panel";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { position: fixed; z-index: 2147483647; font: 14px/1.5 system-ui, "Microsoft YaHei", sans-serif; color: #f4f0ff; }
      * { box-sizing: border-box; }
      .panel { width: min(318px, calc(100vw - 16px)); max-height: calc(100vh - 16px); overflow: auto; padding: 16px; border: 1px solid #9572cf; border-radius: 16px; background: #18152a; box-shadow: 0 16px 42px #0009; }
      header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; cursor: move; user-select: none; touch-action: none; }
      h2 { font-size: 17px; margin: 0; color: #fff; }
      .min { padding: 2px 8px; color: #e8dbff; background: #37304f; border: 0; border-radius: 7px; cursor: pointer; }
      .body[hidden] { display: none; }
      .row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 11px 0; border-top: 1px solid #413954; }
      .name { font-weight: 700; }
      .meta { color: #b9afd0; font-size: 12px; }
      .toggle { min-width: 64px; padding: 7px 10px; border: 0; border-radius: 8px; color: white; background: #7151ba; font-weight: 700; cursor: pointer; }
      .toggle.stop { background: #ad4c58; }
      .toggle:disabled { opacity: .42; cursor: not-allowed; }
      .hunt-options { display: block; border-top: 1px solid #413954; padding: 11px 0; color: #d9cff1; font-size: 12px; }
      .hunt-options select { width: 100%; margin-top: 5px; padding: 7px 9px; border: 1px solid #675487; border-radius: 7px; color: #fff; background: #302844; font: inherit; }
      .hunt-options select:disabled { opacity: .55; }
      .ring-options { border-top: 1px solid #413954; padding: 11px 0; color: #d9cff1; font-size: 12px; }
      .ring-options summary { cursor: pointer; font-weight: 700; }
      .ring-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
      .ring-grid label { min-width: 0; }
      .ring-grid input { width: 100%; margin-top: 3px; padding: 6px; border: 1px solid #675487; border-radius: 7px; color: #fff; background: #302844; font: inherit; }
      .ring-grid input:disabled { opacity: .55; }
      .soul-options { border-top: 1px solid #413954; padding: 11px 0; }
      .soul-options label { display: block; margin-top: 7px; color: #d9cff1; font-size: 12px; }
      .soul-options input { width: 100%; margin-top: 3px; padding: 7px 9px; border: 1px solid #675487; border-radius: 7px; color: #fff; background: #302844; font: inherit; }
      .soul-options input:disabled { opacity: .55; }
      .status { border-top: 1px solid #413954; padding-top: 10px; color: #d9cff1; font-size: 12px; overflow-wrap: anywhere; }
      .error { color: #ffadb4; }
      .hint { margin-top: 5px; color: #a99cbe; font-size: 11px; }
    </style>
    <section class="panel" aria-label="斗罗自动挑战控制台">
      <header><h2>斗罗复刻版控制台</h2><button class="min" title="折叠控制台">−</button></header>
      <div class="body">
        <div class="row"><div><div class="name">挑战熊君</div><div class="meta">直到获得奇茸通天菊</div></div><button class="toggle" data-task="bear">开启</button></div>
        <div class="row"><div><div class="name">挑战帝天</div><div class="meta">完成 100 次后停止</div></div><button class="toggle" data-task="ditian">开启</button></div>
        <div class="row"><div><div class="name">挑战邪帝</div><div class="meta">完成 100 次后停止</div></div><button class="toggle" data-task="xiedi">开启</button></div>
        <div class="row"><div><div class="name">挑战雪帝</div><div class="meta">完成 100 次后停止</div></div><button class="toggle" data-task="snow">开启</button></div>
        <div class="row"><div><div class="name">神界之心</div><div class="meta">持续通关副本</div></div><button class="toggle" data-task="heart">开启</button></div>
        <div class="row"><div><div class="name">百万年魂兽</div><div class="meta">核心区副本三；低于百万年就逃跑</div></div><button class="toggle" data-task="million">开启</button></div>
        <div class="row"><div><div class="name">一键轮回</div><div class="meta">转世后从10级修炼至99级；不自动转世</div></div><button class="toggle" data-task="rebirth">开启</button></div>
        <details class="ring-options">
          <summary>主修第1至第9环最低年限</summary>
          <div class="ring-grid">
            <label>第1环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第1环最低年限（年）"></label>
            <label>第2环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第2环最低年限（年）"></label>
            <label>第3环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第3环最低年限（年）"></label>
            <label>第4环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第4环最低年限（年）"></label>
            <label>第5环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第5环最低年限（年）"></label>
            <label>第6环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第6环最低年限（年）"></label>
            <label>第7环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第7环最低年限（年）"></label>
            <label>第8环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第8环最低年限（年）"></label>
            <label>第9环<input class="ring-min" type="number" min="1" step="1" placeholder="自动" aria-label="第9环最低年限（年）"></label>
          </div>
          <div class="hint">单位：年。输入值只设最低年限，不设年限上界；超过必成年限时仍会尝试吸收，失败后继续寻找。留空时所有环默认当前必成年限的70%。</div>
        </details>
        <label class="hunt-options">猎魂属性（百万年魂兽与一键轮回；默认暗）<select class="hunt-attribute"></select></label>
        <div class="row"><div><div class="name">自选武魂</div><div class="meta">重抽预览直到命中；不确认转世</div></div><button class="toggle" data-task="soul">开启</button></div>
        <div class="soul-options">
          <label>主修目标<input class="soul-main" list="douluo-soul-list" placeholder="输入或选择武魂名称" autocomplete="off"></label>
          <label>次修目标（可留空）<input class="soul-secondary" list="douluo-soul-list" placeholder="不限" autocomplete="off"></label>
          <datalist id="douluo-soul-list"></datalist>
          <div class="hint">三轮预览共发现105种；本轮200次重抽出现92种。可输入未收录名称，或选“任意至高神级”等品质。</div>
        </div>
        <div class="status" role="status" aria-live="polite">待命</div>
        <div class="hint">同一时间只运行一项；关闭后会在当前操作结束时停止。</div>
      </div>
    </section>`;
  document.body.append(host);

  const soulNames = [...new Set(Object.values(observedSouls).flat())]
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  const soulList = shadow.querySelector("#douluo-soul-list");
  for (const name of ["任意至高神级", "任意超神级", "任意神级", "任意传说", "任意史诗", ...soulNames]) {
    const option = document.createElement("option");
    option.value = name;
    soulList.append(option);
  }
  const soulMainInput = shadow.querySelector(".soul-main");
  const soulSecondaryInput = shadow.querySelector(".soul-secondary");
  const ringMinInputs = [...shadow.querySelectorAll(".ring-min")];
  const ringMinKey = "douluo-rebirth-ring-min-years-v1";
  try {
    const saved = JSON.parse(localStorage.getItem(ringMinKey) || "null");
    if (Array.isArray(saved) && saved.length === 9) {
      ringMinInputs.forEach((input, index) => { input.value = saved[index] ?? ""; });
    }
  } catch {}
  for (const input of ringMinInputs) input.addEventListener("change", () => {
    try { localStorage.setItem(ringMinKey, JSON.stringify(ringMinInputs.map((el) => el.value.trim()))); } catch {}
  });
  function readRingMinYears() {
    return ringMinInputs.map((input, index) => {
      const raw = input.value.trim();
      if (input.validity.badInput) throw new Error(`第${index + 1}环下限不是有效数字。`);
      if (!raw) return null;
      const value = Number(raw);
      if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`第${index + 1}环下限必须是正整数年限。`);
      }
      return value;
    });
  }
  const huntAttributeSelect = shadow.querySelector(".hunt-attribute");
  for (const attribute of huntAttributes) {
    const option = document.createElement("option");
    option.value = attribute;
    option.textContent = `${attribute}属性`;
    huntAttributeSelect.append(option);
  }
  const huntAttributeKey = "douluo-hunt-attribute-v1";
  try {
    const saved = localStorage.getItem(huntAttributeKey);
    if (huntAttributes.includes(saved)) huntAttributeSelect.value = saved;
    else huntAttributeSelect.value = "暗";
  } catch { huntAttributeSelect.value = "暗"; }
  huntAttributeSelect.addEventListener("change", () => {
    try { localStorage.setItem(huntAttributeKey, huntAttributeSelect.value); } catch {}
  });
  const soulChoiceKey = "douluo-soul-search-choice-v1";
  try {
    const saved = JSON.parse(localStorage.getItem(soulChoiceKey) || "null");
    soulMainInput.value = saved?.main || "";
    soulSecondaryInput.value = saved?.secondary || "";
  } catch {}
  for (const input of [soulMainInput, soulSecondaryInput]) input.addEventListener("change", () => {
    try { localStorage.setItem(soulChoiceKey, JSON.stringify({ main: soulMainInput.value, secondary: soulSecondaryInput.value })); } catch {}
  });

  const positionKey = "douluo-control-panel-position-v1";
  function placePanel(x, y) {
    const rect = host.getBoundingClientRect();
    const maxX = Math.max(0, window.innerWidth - rect.width);
    const maxY = Math.max(0, window.innerHeight - rect.height);
    host.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
    host.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
  }
  let savedPosition;
  try { savedPosition = JSON.parse(localStorage.getItem(positionKey) || "null"); } catch { savedPosition = null; }
  placePanel(
    Number.isFinite(savedPosition?.x) ? savedPosition.x : window.innerWidth - host.getBoundingClientRect().width - 18,
    Number.isFinite(savedPosition?.y) ? savedPosition.y : 95,
  );
  const dragHandle = shadow.querySelector("header");
  let drag = null;
  dragHandle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const rect = host.getBoundingClientRect();
    drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    dragHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  dragHandle.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    placePanel(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
  });
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = null;
    try { localStorage.setItem(positionKey, JSON.stringify({ x: parseFloat(host.style.left), y: parseFloat(host.style.top) })); } catch {}
  }
  dragHandle.addEventListener("pointerup", finishDrag);
  dragHandle.addEventListener("pointercancel", finishDrag);
  window.addEventListener("resize", () => placePanel(parseFloat(host.style.left), parseFloat(host.style.top)));

  const status = shadow.querySelector(".status");
  const toggles = [...shadow.querySelectorAll(".toggle")];
  let active = null;
  let stopRequested = false;
  let message = "待命";
  let error = false;

  const countFor = (kind, state) => ({ bear: state.bearWins, ditian: state.ditianWins,
    xiedi: state.xiediWins, snow: state.snowWins, heart: state.heartWins,
    million: state.millionWins, rebirth: state.rebirthMentorClaims, soul: state.soulRolls })[kind];
  const gameReady = () => isGamePage() && Boolean(document.querySelector("#root")) && (
    Boolean(document.querySelector("main") && document.querySelector("h1")) &&
      [...document.querySelectorAll("nav button")].some((el) => el.textContent.trim() === "地图") ||
    [...document.querySelectorAll('[role="tab"]')].some((el) => el.textContent.trim() === "地图")
  );
  function render() {
    const state = bot.status();
    const ready = gameReady();
    for (const toggle of toggles) {
      const kind = toggle.dataset.task;
      toggle.textContent = active?.kind === kind ? (stopRequested ? "停止中" : "关闭") : "开启";
      toggle.classList.toggle("stop", active?.kind === kind);
      toggle.disabled = active ? (active.kind !== kind || stopRequested) : (!ready || state.running);
    }
    soulMainInput.disabled = Boolean(active);
    soulSecondaryInput.disabled = Boolean(active);
    for (const input of ringMinInputs) input.disabled = Boolean(active);
    huntAttributeSelect.disabled = Boolean(active);
    const progress = active ? ` · 本次${countFor(active.kind, state) - active.startCount}次` : "";
    const display = !ready && !active
      ? "游戏尚未加载，请从游戏导航进入并点击「继续游戏」"
      : active && !stopRequested && message === "正在启动" ? state.phase : message;
    status.textContent = `${display}${progress}`;
    status.classList.toggle("error", error);
  }

  async function start(kind) {
    if (active || bot.status().running || !gameReady()) return;
    if (kind === "soul" && !soulMainInput.value.trim()) {
      message = "请先输入主修目标武魂";
      error = true;
      render();
      return;
    }
    let ringMinYears;
    if (kind === "rebirth") {
      try { ringMinYears = readRingMinYears(); }
      catch (cause) {
        message = `出错：${cause?.message ?? cause}`;
        error = true;
        render();
        return;
      }
    }
    const state = bot.status();
    active = { kind, startCount: countFor(kind, state) };
    stopRequested = false;
    error = false;
    message = "正在启动";
    render();
    try {
      while (!stopRequested) {
        let result;
        if (kind === "bear") result = await bot.runBear({ wins: 200, untilItem: "奇茸通天菊" });
        else if (kind === "ditian") result = await bot.runDitian({ wins: 100 });
        else if (kind === "xiedi") result = await bot.runXiedi({ wins: 100 });
        else if (kind === "snow") result = await bot.runSnow({ wins: 100 });
        else if (kind === "heart") result = await bot.runHeart({ wins: 500 });
        else if (kind === "million") result = await bot.runMillion({ wins: 50, minAge: 1000000, maxEncounters: 10000, attribute: huntAttributeSelect.value });
        else if (kind === "soul") result = await bot.runSoulSearch({ main: soulMainInput.value, secondary: soulSecondaryInput.value });
        else result = await bot.runRebirth({ attribute: huntAttributeSelect.value, ringMinYears });
        if (kind === "soul") {
          message = `已找到目标武魂，预览保留；本次重抽${countFor(kind, bot.status()) - active.startCount}次`;
          break;
        }
        if (kind === "rebirth") {
          message = result.alreadyComplete ? `当前已是${result.level}级，无需修炼` : `已修炼到${result.level}级，任务完成`;
          break;
        }
        if (kind === "bear" && result.itemFound) {
          message = "已获得奇茸通天菊，任务完成";
          break;
        }
        if (kind === "ditian" || kind === "xiedi" || kind === "snow") {
          message = `已完成${result.wins}次，任务完成`;
          break;
        }
      }
      if (stopRequested) message = "已停止";
      else if (kind !== "bear" && kind !== "ditian" && kind !== "xiedi" && kind !== "snow" && kind !== "rebirth" && kind !== "soul") message = "任务完成";
    } catch (cause) {
      if (stopRequested) message = "已停止";
      else {
        message = `出错：${cause?.message ?? cause}`;
        error = true;
      }
    } finally {
      active = null;
      stopRequested = false;
      render();
    }
  }

  for (const toggle of toggles) toggle.addEventListener("click", () => {
    const kind = toggle.dataset.task;
    if (active?.kind === kind) {
      stopRequested = true;
      message = "正在停止";
      bot.stop();
      render();
    } else if (!active) start(kind);
  });
  shadow.querySelector(".min").addEventListener("click", (event) => {
    const body = shadow.querySelector(".body");
    body.hidden = !body.hidden;
    event.currentTarget.textContent = body.hidden ? "+" : "−";
    placePanel(parseFloat(host.style.left), parseFloat(host.style.top));
  });
  setInterval(render, 400);
  render();
  }

  if (!startOnGamePage()) {
    const routePoll = setInterval(() => {
      if (!isGamePage()) return;
      clearInterval(routePoll);
      startOnGamePage();
    }, 200);
  }
})();
