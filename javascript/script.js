// Tesseract.jsからcreateWorkerをインポート
const { createWorker } = Tesseract;
let worker;

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
initializeWorker();

// カメラ映像の表示と文字認識の処理
const video = document.getElementById("camera");
const hiragana = 'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゕゖ';

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("カメラの起動に失敗しました: ", err);
  });

document.getElementById("capture").addEventListener("click", async () => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth/5;
  canvas.height = video.videoHeight/5;
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
