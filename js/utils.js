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