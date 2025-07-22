const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('fileInput');
const fileContent = document.getElementById('file-content');
const optionViewerArea = document.getElementById('option-viewer-area');
const exportBtn = document.getElementById('exportBtn');
const importAgainBtn = document.getElementById('importAgainBtn');
const option1 = document.getElementById('option1');
const option2 = document.getElementById('option2');
const option3 = document.getElementById('option3');
const errorArea = document.getElementById('error-area');
const viewerTitle = document.getElementById('viewerTitle');
const filenameLabel = document.getElementById('filenameLabel');
const noticeArea = document.getElementById('noticeArea');
const charCountLabel = document.getElementById('charCountLabel');
const fileSizeLabel = document.getElementById('fileSizeLabel');
const statsArea = document.getElementById('statsArea');

let importedText = '';
let importedFilename = '';
let lastErrorInfo = null; // エラー情報保存

const texts = {
    ja: {
        title: "KRPT-UniCoder v3",
        desc: "JSONファイルをアップロードして、暗号化（改行・空白削除・Unicode変換・ごみコード追加）してエクスポートできます。",
        drop: "ここからファイルを選んでください<br>または<br>ここにドラッグ＆ドロップしてください",
        optionTitle: "暗号化オプション",
        viewerTitle: "ファイル内容表示",
        errorTitle: "エラー内容表示",
        export: "エクスポート",
        importAgain: "インポート",
        option1: "改行と空白を削除",
        option2: "Unicode変換する",
        option3: "ごみコードを追加",
        filenameLabel: "編集中のファイル名：",
        charCountLabel: "文字数",
        fileSizeLabel: "ファイルサイズ",
        notice: `
            必ずバックアップはとってください。<br>
            リソースパックの暗号化は非推奨です。
        `,
        errorKinds: {
            badControl: "制御文字エラー",
            unexpectedToken: "構文エラー",
            unexpectedEnd: "終端エラー",
            unknown: "不明"
        },
        errorExplains: {
            badControl: "文字列内に改行やタブなどの制御文字が直接含まれています。",
            unexpectedToken: "想定外の文字があります。カンマ抜けや括弧ミスなどが原因かもしれません。",
            unexpectedEnd: "JSONの終わり方がおかしいです。閉じ括弧や引用符が抜けている可能性があります。",
            unknown: "詳細不明のエラーです。構文や記述を確認してください。"
        }
    },
    en: {
        title: "KRPT-UniCoder v3",
        desc: "Upload your JSON file and export after encryption (remove line breaks, spaces, Unicode conversion, and add junk code).",
        drop: "Select a file here<br>or<br>Drag & drop it here",
        optionTitle: "Encryption Options",
        viewerTitle: "File Content",
        errorTitle: "Error Content",
        export: "Export File",
        importAgain: "Import File",
        option1: "Remove line breaks and spaces",
        option2: "Unicode conversion",
        option3: "Add junk code",
        filenameLabel: "Editing filename:",
        charCountLabel: "Character count",
        fileSizeLabel: "File size",
        notice: `
            Always make a backup before using.<br>
            Encrypting resource packs is NOT recommended.
        `,
        errorKinds: {
            badControl: "Control Character Error",
            unexpectedToken: "Syntax Error",
            unexpectedEnd: "End Error",
            unknown: "Unknown"
        },
        errorExplains: {
            badControl: "A control character (like newline or tab) is directly present in a string.",
            unexpectedToken: "An unexpected character was found. Perhaps a missing comma or bracket.",
            unexpectedEnd: "JSON ended unexpectedly. Maybe a closing bracket or quote is missing.",
            unknown: "Unknown error. Please check your syntax and formatting."
        }
    }
};

function setLang(lang) {
    document.getElementById('title').textContent = texts[lang].title;
    document.getElementById('descText').textContent = texts[lang].desc;
    document.getElementById('dropText').innerHTML = texts[lang].drop;
    document.getElementById('optionTitle').textContent = texts[lang].optionTitle;
    viewerTitle.textContent = lastErrorInfo ? texts[lang].errorTitle : texts[lang].viewerTitle;
    exportBtn.textContent = texts[lang].export;
    importAgainBtn.textContent = texts[lang].importAgain;

    // ファイル名ラベルの表示制御
    if (importedFilename) {
        filenameLabel.style.display = "";
        filenameLabel.textContent = texts[lang].filenameLabel + importedFilename;
    } else {
        filenameLabel.style.display = "none";
        filenameLabel.textContent = "";
    }

    // オプションラベル
    const label1 = document.querySelector('label[for="option1"]');
    if (label1) {
        let found = false;
        for (let node of label1.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = " " + texts[lang].option1;
                found = true;
            }
        }
        if (!found) label1.appendChild(document.createTextNode(" " + texts[lang].option1));
    }
    const label2 = document.querySelector('label[for="option2"]');
    if (label2) {
        let found = false;
        for (let node of label2.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = " " + texts[lang].option2;
                found = true;
            }
        }
        if (!found) label2.appendChild(document.createTextNode(" " + texts[lang].option2));
    }
    const label3 = document.querySelector('label[for="option3"]');
    if (label3) {
        let found = false;
        for (let node of label3.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = " " + texts[lang].option3;
                found = true;
            }
        }
        if (!found) label3.appendChild(document.createTextNode(" " + texts[lang].option3));
    }

    // 注意書き
    if (noticeArea) {
        noticeArea.innerHTML = texts[lang].notice;
    }

    // エラー表示の言語切替
    if (lastErrorInfo) {
        showError(lastErrorInfo);
    } else {
        errorArea.style.display = "none";
        errorArea.textContent = "";
    }

    updateViewer();
}

document.getElementById('langSelect').addEventListener('change', function() {
    setLang(this.value);
});
setLang('ja');

// ファイル選択（クリック or ドロップ）
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
    }
});
fileInput.addEventListener('change', e => {
    if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
    }
});

function handleFile(file) {
    importedFilename = file.name;
    // ファイル名ラベルの表示制御
    if (importedFilename) {
        filenameLabel.style.display = "";
        filenameLabel.textContent = texts[document.getElementById('langSelect').value].filenameLabel + importedFilename;
    } else {
        filenameLabel.style.display = "none";
        filenameLabel.textContent = "";
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        importedText = event.target.result;
        lastErrorInfo = null;
        errorArea.style.display = "none";
        errorArea.textContent = "";

        try {
            JSON.parse(importedText);
            viewerTitle.textContent = texts[document.getElementById('langSelect').value].viewerTitle;
            dropZone.style.display = "none";
            optionViewerArea.style.display = "flex";
            updateViewer();
        } catch (err) {
            // エラー位置抽出
            let posMatch = err.message.match(/at position (\d+)/);
            let lineColMatch = err.message.match(/line (\d+) column (\d+)/);
            let pos = posMatch ? parseInt(posMatch[1], 10) : null;
            let line = lineColMatch ? parseInt(lineColMatch[1], 10) : null;
            let col = lineColMatch ? parseInt(lineColMatch[2], 10) : null;

            // エラー種別判定
            let kindKey = "unknown";
            if (err.message.includes("Bad control character")) {
                kindKey = "badControl";
            } else if (err.message.includes("Unexpected token")) {
                kindKey = "unexpectedToken";
            } else if (err.message.includes("Unexpected end of JSON input")) {
                kindKey = "unexpectedEnd";
            }
            // エラー情報を保存
            lastErrorInfo = {
                pos, line, col, kindKey,
                rawMsg: err.message
            };

            showError(lastErrorInfo);

            viewerTitle.textContent = texts[document.getElementById('langSelect').value].errorTitle;
            dropZone.style.display = "none";
            optionViewerArea.style.display = "flex";
        }
    };
    reader.readAsText(file);
}

function showError(errorInfo) {
    if (!errorInfo) return;
    let lang = document.getElementById('langSelect').value;
    let textsForLang = texts[lang];

    // 範囲抜粋
    let range = 100;
    let start = Math.max(0, errorInfo.pos - range);
    let end = Math.min(importedText.length, errorInfo.pos + range);
    let before = importedText.substring(start, errorInfo.pos);
    let errorChar = importedText.substring(errorInfo.pos, errorInfo.pos+1);
    let after = importedText.substring(errorInfo.pos+1, end);

    // 英語エラー文（先頭のみ）
    let englishError = errorInfo.rawMsg.split('(')[0];

    // エラー表示欄（上部）
    errorArea.innerHTML =
        `<strong>${textsForLang.errorTitle}</strong><br>` +
        `${lang === 'ja'
            ? `行: ${errorInfo.line ?? "-"} / 列: ${errorInfo.col ?? "-"} / 位置: ${errorInfo.pos ?? "-"}`
            : `Line: ${errorInfo.line ?? "-"} / Column: ${errorInfo.col ?? "-"} / Position: ${errorInfo.pos ?? "-"}`}` +
        `<br>${lang === 'ja' ? "種類" : "Type"}: ${textsForLang.errorKinds[errorInfo.kindKey]}<br>` +
        `${lang === 'ja' ? "説明" : "Description"}: ${textsForLang.errorExplains[errorInfo.kindKey]}`;
    errorArea.style.display = "block";

    // ファイル内容表示欄（抜粋＋赤色ハイライト）
    fileContent.innerHTML =
        `<pre style="white-space:pre-wrap;background:#f7f7fa;padding:10px;border-radius:8px;">
${before}<span style="color:red;background:#fee;font-weight:bold;">${errorChar || '?'}</span>${after}
</pre>`;
}

// Unicodeでキー名のみ変換（バックスラッシュ1つにする）
function escapeUnicodeKey(key) {
    return key.split('').map(char =>
        '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')
    ).join('');
}

function encodeKeysToUnicode(obj) {
    if (Array.isArray(obj)) {
        return obj.map(encodeKeysToUnicode);
    } else if (obj !== null && typeof obj === 'object') {
        let newObj = {};
        for (let k in obj) {
            // キー名だけUnicode変換
            newObj[escapeUnicodeKey(k)] = encodeKeysToUnicode(obj[k]);
        }
        return newObj;
    }
    return obj; // 値はそのまま
}

function applyUnicodeOption(text, enabled) {
    if (!enabled) return text;
    try {
        let json = JSON.parse(text);
        let encodedJson = encodeKeysToUnicode(json);
        // JSON.stringify経由だと\\uXXXXになるので、\uXXXXに直す
        let str = JSON.stringify(encodedJson, null, 2);
        return str.replace(/\\\\u/g, '\\u');
    } catch {
        // パース失敗ならそのまま
        return text;
    }
}

// ごみコード（コメント）を追加
function addRandomCommentsToJsonText(jsonText, enabled) {
    if (!enabled) return jsonText;
    function randomComment(length = 40) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let str = '';
        for(let i=0; i<length; i++) {
            str += chars[Math.floor(Math.random()*chars.length)];
        }
        return `/*${str}*/`;
    }
    return jsonText
        .split('\n')
        .map(line => {
            // 1行に3～8個のコメントを付加（コメントの長さは40～60文字）
            let amount = Math.floor(Math.random()*6)+3; // 3～8個
            let comments = '';
            for(let i=0; i<amount; i++) {
                let len = Math.floor(Math.random()*21)+40; // 40～60文字
                comments += randomComment(len);
            }
            return comments + line;
        }).join('\n');
}

option1.addEventListener('change', updateViewer);
option2.addEventListener('change', updateViewer);
option3.addEventListener('change', updateViewer);

function getByteSize(str) {
  return new Blob([str]).size;
}

function formatSize(bytes, lang) {
  if (bytes >= 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + (lang === 'ja' ? ' MB' : ' MB');
  if (bytes >= 1024)
      return (bytes / 1024).toFixed(2) + (lang === 'ja' ? ' KB' : ' KB');
  return bytes + (lang === 'ja' ? ' B' : ' B');
}

function updateViewer() {
    if (lastErrorInfo) {
        return;
    }
    if (!importedText) {
        fileContent.textContent = "";
        statsArea.style.display = 'none';
        filenameLabel.style.display = "none";
        filenameLabel.textContent = "";
        return;
    }
    const removeNewline = option1.checked;
    const unicodeEnabled = option2.checked;
    const junkEnabled = option3.checked;
    const lang = document.getElementById('langSelect').value;

    let toShow = importedText;

    // 1. 整形（JSON.stringify）→ 2. Unicode変換（キーのみ）→ 3. ごみコード追加 → 4. 空白・改行削除
    try {
        toShow = JSON.stringify(JSON.parse(importedText), null, 2);
    } catch {
        toShow = importedText;
    }
    toShow = applyUnicodeOption(toShow, unicodeEnabled);
    toShow = addRandomCommentsToJsonText(toShow, junkEnabled);

    if (removeNewline) {
        toShow = toShow.replace(/\s+/g, ' ').trim();
    }

    fileContent.textContent = toShow;
    viewerTitle.textContent = texts[lang].viewerTitle;
    errorArea.style.display = "none";
    errorArea.textContent = "";
    lastErrorInfo = null;

    // ファイル名ラベルの表示制御
    if (importedFilename) {
        filenameLabel.style.display = "";
        filenameLabel.textContent = texts[lang].filenameLabel + importedFilename;
    } else {
        filenameLabel.style.display = "none";
        filenameLabel.textContent = "";
    }

    if (importedText) {
        const beforeChars = importedText.length;
        const afterChars = toShow.length;
        const beforeSize = getByteSize(importedText);
        const afterSize = getByteSize(toShow);

        charCountLabel.textContent =
            `${texts[lang].charCountLabel}: ${beforeChars} → ${afterChars}`;
        fileSizeLabel.textContent =
            `${texts[lang].fileSizeLabel}: ${formatSize(beforeSize, lang)} → ${formatSize(afterSize, lang)}`;
        statsArea.style.display = '';
    } else {
        statsArea.style.display = 'none';
    }
}

exportBtn.addEventListener('click', () => {
    let exportText = lastErrorInfo ? fileContent.textContent : fileContent.textContent;
    const blob = new Blob([exportText], {type: "application/json"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = importedFilename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
});

importAgainBtn.addEventListener('click', () => {
    fileInput.value = "";
    fileInput.click();
});