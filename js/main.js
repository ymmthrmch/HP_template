import {
    importExternalScript
} from 'utils.js';

let settings = {};
let lang = 'ja';
let t = {};

async function loadSettingsAndTranslations() {
    const pathLang = location.pathname.split('/')[1];
    lang = settings.langs.includes(pathLang) ? pathLang : 'ja';
    [settings, t] = await Promise.all([
        fetch('/data/settings.json').then(res => res.json()),
        fetch(`/locales/${lang}.json`).then(res => res.json()),
    ]);
}

loadSettingsAndTranslations()
    .then(
        readPages();
    )

async function readPage() {
    await addToHead();
    await Promise.all([
        loadHeader(),
        loadFooter(),
        loadContentsList()
    ])

    if (document.body.dataset.useMathjax === 'true') {
        if (window.MathJax) {
        await MathJax.typesetPromise();
        }
    }
}

async function addToHead () {
    const promises = settings.externalLibraries.map(
        lib => importExternalScript(lib.url, lib.defer)
    );
    await Promise.all(promises)
}

function loadHeader() {

}

function loadFooter() {

}

