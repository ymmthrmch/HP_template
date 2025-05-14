export function importExternalScript(url, deferFlag = true) {
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

export function applyInterpolateToDOM (root, context){
    function interpolate (template, context) {
        return template.replace(/{{(.*?)}}/g, (_, key) => {
            const path = key.trim().split('.');
            let val = context;
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

    for (const node of root.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = interpolate(node.textContent, context);
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            for (const attr of node.attributes) {
                attr.value = interpolate(attr.value, context);
            }

            applyInterpolateToDOM(node, context);
        }
    }
}