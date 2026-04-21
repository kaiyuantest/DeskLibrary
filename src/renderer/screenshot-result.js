const captureImg = document.getElementById('captureImg');
const ocrText = document.getElementById('ocrText');
const translatedText = document.getElementById('translatedText');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const closeBtn = document.getElementById('closeBtn');

let currentText = '';

window.deskLibraryScreenshot.onResultData((payload = {}) => {
  captureImg.src = String(payload.imageDataUrl || '');
  currentText = String(payload.ocrText || '').trim();
  ocrText.value = currentText || '未识别到文本';
  translatedText.value = '';
});

translateBtn.addEventListener('click', async () => {
  const text = String(ocrText.value || '').trim();
  if (!text) return;
  translatedText.value = '翻译中...';
  const result = await window.deskLibraryScreenshot.requestTranslate({ text, targetLang: 'zh-CN' });
  if (!result || !result.ok) {
    translatedText.value = result && result.message ? result.message : '翻译失败';
    return;
  }
  translatedText.value = String(result.translatedText || '');
});

copyBtn.addEventListener('click', async () => {
  const text = String(ocrText.value || '').trim();
  if (!text) return;
  await window.deskLibraryScreenshot.copyText(text);
});

closeBtn.addEventListener('click', async () => {
  await window.deskLibraryScreenshot.closeResult();
});

window.addEventListener('keydown', async (event) => {
  if (event.key === 'Escape') {
    await window.deskLibraryScreenshot.closeResult();
  }
});
