import {
    applyInterpolateToDOM,
    importExternalScript
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
    // const promises = settings.externalScripts.map(
    //     scr => importExternalScript(scr.key[0], scr.key[1])
    // );
    // await Promise.all(promises)
}

async function loadHeader() {

}

async function addToBody() {

}

async function loadFooter() {

}

async function afterLoadDOM() {
    // 変数の置き換え
    applyInterpolateToDOM(document,settings)

    // 文字の装飾

    // MathJaxのtypeset
    await Promise.all(promises)
    if (document.body.dataset.useMathjax === 'true') {
        if (window.MathJax) {
        await MathJax.typesetPromise();
        }
    }
}