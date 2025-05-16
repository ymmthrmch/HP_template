export function applyInterpolateToDOM(root, env) {
    for (const node of root.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = interpolate(node.textContent, env);
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            for (const attr of node.attributes) {
                attr.value = interpolate(attr.value, env);
            }

            applyInterpolateToDOM(node, env);
        }
    }
}

function extractHtmlSnippet(domNode, limit = 100, suffix = '') {
    let count = 0;
    let reachedLimit = false;

    function cloneWithLimit(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (reachedLimit) return null;

            const text = node.textContent;
            const remaining = limit - count;

        if (text.length <= remaining) {
            count += text.length;
            return document.createTextNode(text);
        } else {
            count += remaining;
            reachedLimit = true;
            return document.createTextNode(text.slice(0, remaining));
        }
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (
                node.tagName.toLowerCase() === 'p'
                || node.tagName.toLowerCase() === 'div'
                && node.classList.contains('content-text')
            ) {
                const fragment = document.createDocumentFragment();
                for (const child of node.childNodes) {
                    const limitedChild = cloneWithLimit(child);
                    if (limitedChild) fragment.appendChild(limitedChild);
                    if (reachedLimit) break;
                }
            return fragment;
            }

            const clone = node.cloneNode(false);
            for (const child of node.childNodes) {
                const limitedChild = cloneWithLimit(child);
                if (limitedChild) clone.appendChild(limitedChild);
                if (reachedLimit) break;
            }
        return clone;
        }

        return null;
    }

    const snippetNode = cloneWithLimit(domNode);
    if (!snippetNode) return '';

    const wrapper = document.createElement('div');
    wrapper.appendChild(snippetNode);
    if (reachedLimit && suffix) {
        const suffixSpan = document.createElement('span');
        suffixSpan.innerHTML = suffix;
        wrapper.appendChild(suffixSpan);
    }

    return wrapper.outerHTML;
}

export function importScript(url, deferFlag = true) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src = "${url}"]`)){
    resolve();
    return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.defer = deferFlag;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

export function interpolate(template,env) {
        const config = env.config;
        const lang = env.lang;
        return template.replace(/{{(.*?)}}/g, (_, key) => {
            const trimmedKey = key.trim();

            if (trimmedKey === "lang") {
                return lang ?? '???';
            }

            const path = trimmedKey.split('.');
            let val = config;
            for (const prop of path) {
                if (val && typeof val === 'object' && prop in val) {
                    val = val[prop];
                } else {
                    return '???';
                }
            }
            return val;
        });
}

async function loadContents(contentType, pluralize, env) {
    const contentTypeS = pluralize(contentType).toLowerCase();
    const contentsList = document.getElementById(`${contentTypeS}-list`);
    if (!contentsList) return;

    const config = env.config
    const lang = env.lang
    const t = env.t
    const listRes = await fetch(`/data/contents_list/${contentTypeS}.json`)
    const allContents = await listRes.json()
    if (!allContents || !Array.isArray(allContents) || allContents.length === 0) {
        const noContentsMessage = document.createElement('div');
        noContentsMessage.className = 'content no-contents-message';
        noContentsMessage.textContent = t.noContents.replace(
            "{{contentType}}",config.contentTypes[contentType][lang]
        ) ?? 'No contents here.';
        contentsList.appendChild(noContentsMessage);
        return;
    }

    const contents = allContents
        .filter(contents => contents.lang.includes(lang))
        .sort((a, b) => new Date(b.created) - new Date(a.created));

    const templateRes = await fetch(`/includes/content-summary.html`)
    const template = await templateRes.text()
    const renderPromises = contents.map(async file => {
        const pathToContent = contentTypeS + '/' + file.filename;

        const res = await fetch(pathToContent)
        const html = await res.text()
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const title = tempDiv.querySelector('.content-title')?.textContent.trim() || t.noTitle;
        const mainText = tempDiv.querySelector('.content-text') || (() => {
            const fallback = document.createElement('div');
            fallback.innerHTML = t.noIntro;
            return fallback;
        })();
        const introLength = config.introLength[lang] ?? config.introLength['ja'];
        const intro = extractHtmlSnippet(
            mainText,
            introLength,
            ` <a href="${contentTypeS}/${file.filename}" class="read-more-link">......${t.readMore}</a>`
        );

        const summary = template
            .replace(/{{title}}/g, title)
            .replace(/{{intro}}/g, intro)
            .replace(/{{link}}/g, pathToContent);

        const summaryDiv = document.createElement('div');
        summaryDiv.innerHTML = summary;
        contentsList.appendChild(summaryDiv);
    })
    return Promise.all(renderPromises);
}

export async function loadContentsList(pluralize, env) {
    const config = env.config
    try {
        const contentTypes = Object.keys(config.contentTypes);

        await Promise.all(
        contentTypes.map(contentType => loadContents(contentType, pluralize, env))
        );

        //typesetなくてもいけないかは要検証
        if (window.MathJax) {
            await MathJax.typesetPromise();
        }
    } catch (err) {
        console.error(`loadContentsList error:`, err);
    }
}

export function setupLanguageSwitcher(targetLang) {
    const buttons = document.querySelectorAll('#language-switcher button')
    buttons.forEach(btn => btn.addEventListener('click', () => {
        const currentPath = location.pathname;
        const currentLang = currentPath.split('/')[1];
        const newPath = currentPath.replace(`${currentLang}`,`${targetLang}`);
        location.pathname = newPath;
    }));
}

export function wrapFirstLetter(targetTag, classToAdd) {
    const targets = document.querySelectorAll(targetTag);
    function findFirstTextNode(node) {
        for (let child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
                return child;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const result = findFirstTextNode(child);
                if (result) return result;
            }
        }
        return null;
    }
    targets.forEach(target => {
        if (target.querySelector(classToAdd)) return;

        const textNode = findFirstTextNode(target);
        if (!textNode) return;

        const text = textNode.textContent.trim();
        if (!text || text.length === 0) return;

        const firstLetter = text.charAt(0);
        const rest = text.slice(1);

        const span = document.createElement('span');
        span.className = classToAdd;
        span.textContent = firstLetter;

        const restText = document.createTextNode(rest);

        const parent = textNode.parentNode;
        parent.insertBefore(span, textNode);
        parent.insertBefore(restText, textNode);
        parent.removeChild(textNode);
    });
}

export function wrapInitials(targetTag, classToAdd) {
    const targets = document.querySelectorAll(targetTag);

    targets.forEach(el => {
        if (el.querySelector(classToAdd)) return;

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: node => {
            if (node.textContent.trim()) return NodeFilter.FILTER_ACCEPT;
            return NodeFilter.FILTER_REJECT;
            }
        });

        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        textNodes.forEach(textNode => {
            const parts = textNode.textContent.split(/([ \-･]+)/);

            const fragment = document.createDocumentFragment();

            parts.forEach(part => {
                if (part.match(/([ \-･]+)/)) {
                    fragment.appendChild(document.createTextNode(part));
                } else if (part.length > 0) {
                    const span = document.createElement('span');
                    span.className = classToAdd;
                    span.textContent = part.charAt(0);
                    fragment.appendChild(span);
                    if (part.length > 1) {
                        fragment.appendChild(document.createTextNode(part.slice(1)));
                    }
                }
            });

            textNode.parentNode.replaceChild(fragment, textNode);
        });
    });
}