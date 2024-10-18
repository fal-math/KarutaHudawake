// Tesseract.jsからcreateWorkerをインポート
const { createWorker } = Tesseract;
let worker;
const hiragana = 'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゕゖ';

// ワーカーの初期化を最初に行う
async function initializeWorker(lang = 'jpn', whitelist = hiragana) {
  worker = createWorker({
    logger: m => console.log(m),
  });
  await worker.load();
  await worker.loadLanguage(lang);
  await worker.initialize(lang);
  await worker.setParameters({
    tessedit_char_whitelist: whitelist
  });
}

// ページ読み込み時にワーカーを初期化する
initializeWorker().then(() => {
  console.log("ワーカーの初期化が完了しました");
}).catch(err => {
  console.error("ワーカーの初期化に失敗しました:", err);
});

// カメラ映像の表示と文字認識の処理
const video = document.getElementById("camera");
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("カメラの起動に失敗しました: ", err);
  });

// 「判別する」ボタンのクリックイベント
document.getElementById("capture").addEventListener("click", async () => {
  if (!worker) {
    alert("ワーカーの初期化がまだ完了していません。もう少しお待ちください。");
    return;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const text = await recognize(canvas);
  document.getElementById("result").innerText = `判別結果: ${text}`;

  const storedCards = localStorage.getItem("karutaCards");
  const karutaCards = storedCards ? JSON.parse(storedCards) : [];

  if (karutaCards.includes(text.trim())) {
    document.getElementById("result").innerText += "（試合で使用します）";
  } else {
    document.getElementById("result").innerText += "（試合で使用しません）";
  }
});

// 既存のワーカーを利用してOCRを実行
async function recognize(canvas) {
  const { data: { text } } = await worker.recognize(canvas);
  return text;
}

// ローカルストレージに50枚の札を保存する例
function saveKarutaCards(cards) {
  localStorage.setItem("karutaCards", JSON.stringify(cards));
}

// 初回の設定で使用する場合
saveKarutaCards(["ちはやふる", "あさぼらけ", "しのぶれど"]);  // 例
