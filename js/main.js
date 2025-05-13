import {
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
    afterLoadDoms();
}

async function addToHead () {
    const promises = settings.externalScripts.map(
        scr => importExternalScript(scr.url, scr.defer)
    );
    await Promise.all(promises)
}

function loadHeader() {

}

function addToBody{

}

function loadFooter() {

}

function afterLoadDoms{
    if (document.body.dataset.useMathjax === 'true') {
        if (window.MathJax) {
        await MathJax.typesetPromise();
        }
    }
}