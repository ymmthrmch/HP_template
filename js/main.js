import {
    applyInterpolateToDOM,
    importScript,
    loadContentsList,
    setupLanguageSwitcher,
    wrapFirstLetter,
    wrapInitials
} from './utils.js';

let config = {};
let settings = {};
let lang = 'ja';
let t = {};
let env = {
    "config": config,
    "lang": lang,
    "t": t
}

main();

async function main() {
  await initAppData();
  await loadDOM();
  await afterLoadingDOM();
}

async function initAppData() {
    await loadAppData();
    applyTheme();
}

async function loadDOM() {
    await addToHead();
    await Promise.all([
        loadHeader(),
        addToBody(),
        loadFooter(),
    ])
}

async function afterLoadingDOM() {
    // 変数の置き換え
    applyInterpolateToDOM(document, env);

    // 文字の装飾
    wrapFirstLetter('h3','first-letter');
    wrapInitials('h1','initials');
    wrapInitials('h2','initials');

    //言語切り替え
    setupLanguageSwitcher();

    // MathJaxのtypeset
    if ((document.body.dataset.tags || "").includes('mathjax')) {
        if (window.MathJax) {
        await MathJax.typesetPromise();
        }
    }
}

// in beforeLoadDOM
async function loadAppData() {
    lang = location.pathname.split('/')[1];
    [config, settings, t] = await Promise.all([
        fetch('/data/config.json').then(res => res.json()),
        fetch('/data/settings.json').then(res => res.json()),
        fetch(`/locales/${lang}.json`).then(res => res.json()),
    ]);
    env.config = config;
    env.settings = settings;
    env.lang = lang;
    env.t = t;
}

function applyTheme() {
    const root = document.documentElement;
    const themeName = config.colors.theme;
    const themeData = config.colors.colorBook[themeName];

    if (!themeData) {
        console.warn(`Theme "${themeName}" not found in config.colors.colorBook`);
        return;
    }

    const cssVarMap = {
        '--theme-dark': 'themeDarkColor',
        '--theme-light': 'themeLightColor',
        '--theme-tp-dark': 'themeTransparentDarkColor',
        '--theme-tp-light': 'themeTransparentLightColor',
        '--theme-text': 'themeTextColor',
        '--theme-bg': 'themeBackgroundColor',
        '--theme-tp-bg': 'themeTransparentBackground',
        '--accent-color': 'accentColor',
    };

    for (const [cssVar, jsonKey] of Object.entries(cssVarMap)) {
        if (themeData[jsonKey]) {
            root.style.setProperty(cssVar, themeData[jsonKey]);
        }
    }

    root.style.setProperty('--icon-image-dark', `url(${themeData.iconImageDark})`);
    root.style.setProperty('--icon-image-light', `url(${themeData.iconImageLight})`);
}

// in loadDOM
async function addToHead () {
    const scrlistRaw = document.body.dataset.tags || "";
    const scrlist = scrlistRaw.split(/\s+/).map(tag => tag.toLowerCase());

    const shouldLoadScript = (scr) => {
        if (scr.loadToAllPages === true) return true;
        if (!Array.isArray(scr.tags)) return false;
        return scr.tags.some(tag => {
        if (tag.includes("__PLACEHOLDER__")) {
            const pattern = tag.replace("__PLACEHOLDER__", ".*");
            const regex = new RegExp(`^${pattern}$`, 'i');
            return scr.tags.some(scrtag => regex.test(scrtag));
        }
        return scr.tags.some(tag => scrlist.includes(tag.toLowerCase()));
        });
    }

    const getScriptsToImport = (scriptsObj) => {
        return Object.values(scriptsObj)
            .filter(shouldLoadScript)
            .map(scr => importScript(scr.url, scr.defer));
    };

    const promises = [
        ...getScriptsToImport(settings.scripts),
        ...getScriptsToImport(config.scripts)
    ];

    await Promise.all(promises);
}

async function loadHeader() {
    if (document.querySelector('header')) return;
    const res = await fetch('/includes/header.html');
    const html = await res.text();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    document.body.insertBefore(tmp,document.body.firstChild);
}

async function addToBody() {
    try {
        if (!window.pluralize) {
            throw new Error("window.pluralize is not available");
        }
        await loadContentsList(window.pluralize, env);
    } catch (err) {
        console.error("addToBody error:", err);
    }
}


async function loadFooter() {
    if (document.querySelector('footer')) return;
    const res = await fetch('/includes/footer.html');
    const html = await res.text();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    document.body.appendChild(tmp);
}