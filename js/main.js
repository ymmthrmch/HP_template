import {
    applyInterpolateToDOM,
    importScript
} from './utils.js';

let settings = {};
let lang = 'ja';
let t = {};

async function loadSettingsAndTranslations() {
    lang = location.pathname.split('/')[1];
    [settings, t] = await Promise.all([
        fetch('/data/settings.json').then(res => res.json()),
        fetch(`/locales/${lang}.json`).then(res => res.json()),
    ]);
}

loadSettingsAndTranslations()
    .then(() => readPage())

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
  const scrlist = document.body.dataset.scr || "";
  const promises = Object.entries(settings.scripts)
    .filter(([key, scr]) =>
      scr.loadToAllPages === true ||
      scrlist.includes(key.toLowerCase())
    )
    .map(([key, scr]) => importScript(scr.url, scr.defer));
  await Promise.all(promises);
}

async function loadHeader() {

}

async function addToBody() {

}

async function loadFooter() {

}

async function afterLoadDOM() {
    // 変数の置き換え
    applyInterpolateToDOM(document,settings,lang)

    // 文字の装飾

    // MathJaxのtypeset
    if ((document.body.dataset.scr || "").includes('mathjax')) {
        if (window.MathJax) {
        await MathJax.typesetPromise();
        }
    }
}