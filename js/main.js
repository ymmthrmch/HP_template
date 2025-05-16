import {
    applyInterpolateToDOM,
    importScript,
    loadContentsList,
    setupLanguageSwitcher,
} from './utils.js';

let settings = {};
let lang = 'ja';
let t = {};
let env = {
    "settings": settings,
    "lang": lang,
    "t": t
    }

loadSettingsAndTranslations().then(() => readPage())

async function loadSettingsAndTranslations() {
    lang = location.pathname.split('/')[1];
    [settings, t] = await Promise.all([
        fetch('/data/settings.json').then(res => res.json()),
        fetch(`/locales/${lang}.json`).then(res => res.json()),
    ]);
    env.settings = settings;
    env.lang = lang;
    env.t = t;
    console.log('loaded Settings and Translations')
}

async function readPage() {
    await addToHead();
    await Promise.all([
        loadHeader(),
        addToBody(),
        loadFooter(),
    ])
    afterLoadDOM();
}

async function addToHead () {
    const scrlistRaw = document.body.dataset.scr || "";
    const scrlist = scrlistRaw.split(/\s+/).map(tag => tag.toLowerCase()); // タグを配列に
    const promises = Object.entries(settings.scripts)
        .filter(([key, scr]) => {
            if (scr.loadToAllPages === true) return true;
            if (!Array.isArray(scr.tags)) return false;
            return scr.tags.some(tag => scrlist.includes(tag.toLowerCase()));
        })
        .map(([key, scr]) => importScript(scr.url, scr.defer));
  
    await Promise.all(promises);
}

async function loadHeader() {
    const res = await fetch('/includes/header.html');
    const html = await res.text();
    const header = document.createElement('header');
    header.innerHTML = html;
    document.body.appendChild(header);
}

async function addToBody() {
    // 次ここ作る．
    const dataset = document.body.dataset;
    if (dataset.contentsList !== undefined) {
        if (!window.pluralize) {
            const pluralizeScript = settings.scripts['pluralize'];
            if (pluralizeScript) {
                await importScript(pluralizeScript.url, pluralizeScript.defer);
            } else {
                console.warn('pluralize script not found in settings!');
            }
        }
        await loadContentsList(window.pluralize, env);
    }
}

async function loadFooter() {
    const res = await fetch('/includes/footer.html');
    const html = await res.text();
    const footer = document.createElement('footer');
    footer.innerHTML = html;
    document.body.appendChild(footer);
}

async function afterLoadDOM() {
    // 変数の置き換え
    applyInterpolateToDOM(document, env);

    // 文字の装飾

    //言語切り替え
    setupLanguageSwitcher();

    // MathJaxのtypeset
    if ((document.body.dataset.scr || "").includes('mathjax')) {
        if (window.MathJax) {
        await MathJax.typesetPromise();
        }
    }
}