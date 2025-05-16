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
    wrapFirstLetter('h2','first-letter');
    wrapInitials('h1','initials');

    //言語切り替え
    setupLanguageSwitcher();

    // MathJaxのtypeset
    if ((document.body.dataset.scr || "").includes('mathjax')) {
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
  root.style.setProperty('--theme-dark', config.colors.themeDarkColor);
}

// in loadDOM
async function addToHead () {
    const scrlistRaw = document.body.dataset.scr || "";
    const scrlist = scrlistRaw.split(/\s+/).map(tag => tag.toLowerCase()); // タグを配列に
    const promises = Object.entries(config.scripts)
        .filter(([key, scr]) => {
            if (scr.loadToAllPages === true) return true;
            if (!Array.isArray(scr.tags)) return false;
            return scr.tags.some(tag => scrlist.includes(tag.toLowerCase()));
        })
        .map(([key, scr]) => importScript(scr.url, scr.defer));
  
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
    const dataset = document.body.dataset;
    if (dataset.contentsList !== undefined) {
        await loadContentsList(window.pluralize, env);
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