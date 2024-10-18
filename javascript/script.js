// Tesseract.jsからcreateWorkerをインポート
const { createWorker } = Tesseract;

const video = document.getElementById("camera");
const hiragana = 'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゕゖ';

// カメラ映像を取得して表示
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("カメラの起動に失敗しました: ", err);
  });

// 「判別する」ボタンのクリックイベント
document.getElementById("capture").addEventListener("click", async () => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth/5;
  canvas.height = video.videoHeight/5;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Tesseract.jsを使ってOCRを実行
  const text = await recognize(canvas);

  document.getElementById("result").innerText = `判別結果: ${text}`;

  // 50枚の札に含まれるかを判別
  const storedCards = localStorage.getItem("karutaCards");
  const karutaCards = storedCards ? JSON.parse(storedCards) : [];

  if (karutaCards.includes(text.trim())) {
    document.getElementById("result").innerText += "（試合で使用します）";
  } else {
    document.getElementById("result").innerText += "（試合で使用しません）";
  }
});

// Tesseract.jsのワーカーを使用した認識関数
async function recognize(canvas, lang = 'jpn', whitelist = hiragana) {
  const worker = createWorker({
    logger: m => console.log(m),
  });
  await worker.load();
  // 言語を設定
  await worker.loadLanguage(lang);
  await worker.initialize(lang);
  // 限定する文字を設定
  await worker.setParameters({
    tessedit_char_whitelist: whitelist
  });
  // 認識
  const { data: { text } } = await worker.recognize(canvas);
  await worker.terminate(); // 作業終了後にワーカーを終了
  return text;
}

// ローカルストレージに50枚の札を保存する例
function saveKarutaCards(cards) {
  localStorage.setItem("karutaCards", JSON.stringify(cards));
}

// 初回の設定で使用する場合
saveKarutaCards(["ちはやふる", "あさぼらけ", "しのぶれど"]);  // 例
