// Tesseract.jsからcreateWorkerをインポート
const { createWorker } = Tesseract;
const hiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわゐゑをん';
// const hiragana = 'あいうえお';
// 即時実行関数で非同期処理をラップ
(async () => {
  // ワーカーの初期化を最初に行う
  const worker = await initializeWorker('jpn', hiragana);

  // カメラ映像の表示と文字認識の処理
  const video = document.getElementById("camera");

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error("カメラの起動に失敗しました: ", err);
    });

  // キャプチャボタンのクリックイベントを設定
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

    preprocessImage(canvas); // 画像の前処理

    const text = await recognizeCard(canvas, worker); // 札の領域を基に認識
    document.getElementById("result").innerText = `判別結果:\n${text}`;

    const storedCards = localStorage.getItem("karutaCards");
    const karutaCards = storedCards ? JSON.parse(storedCards) : [];

    if (karutaCards.includes(text.trim())) {
      document.getElementById("result").innerText += "（試合で使用します）";
    } else {
      document.getElementById("result").innerText += "（試合で使用しません）";
    }
  });

})();

// ワーカーの初期化関数
async function initializeWorker(lang = 'jpn', whitelist = hiragana) {
  const worker = await createWorker(lang, 1, {
    logger: m => console.log(m), // ログ出力用
  });

  await worker.setParameters({
    tessedit_char_whitelist: whitelist,
    tessedit_pageseg_mode: Tesseract.PSM_SINGLE_WORD
  });

  console.log("ワーカーが初期化されました");
  return worker;
}

// 既存のワーカーを利用してOCRを実行
async function recognize(canvas, worker) {
  const { data: { text } } = await worker.recognize(canvas);
  return text;
}
function preprocessImage(canvas) {
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // グレースケール化
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;      // R
    data[i + 1] = avg;  // G
    data[i + 2] = avg;  // B
  }

  // バイナリ化（しきい値処理）
  const threshold = 128;
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] < threshold ? 0 : 255;
    data[i] = value;     // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
  }

  context.putImageData(imageData, 0, 0);
}

// 緑色の領域を検出して札のバウンディングボックスを取得する関数
function detectCardRegion(canvas) {
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // 緑色のしきい値設定
  const greenThreshold = {
    minRed: 0,
    maxRed: 255,
    minGreen: 128,
    maxGreen: 255,
    minBlue: 0,
    maxBlue: 255
  };

  // 緑色領域を元にバウンディングボックスを計算
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      // 緑色のしきい値に基づいて札の縁を検出
      if (red >= greenThreshold.minRed && red <= greenThreshold.maxRed &&
          green >= greenThreshold.minGreen && green <= greenThreshold.maxGreen &&
          blue >= greenThreshold.minBlue && blue <= greenThreshold.maxBlue) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // バウンディングボックスの結果を返す
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// 札の領域をOCRで認識する関数
async function recognizeCard(canvas, worker) {
  const region = detectCardRegion(canvas);

  if (region.width <= 0 || region.height <= 0) {
    console.error("札の領域が検出できませんでした。");
    return "";
  }

  // 札の領域を基に新しいキャンバスを作成してOCRを実行
  const cardCanvas = document.createElement("canvas");
  cardCanvas.width = region.width;
  cardCanvas.height = region.height;
  const cardContext = cardCanvas.getContext("2d");
  cardContext.drawImage(canvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);

  // OCRを実行
  const { data: { text } } = await worker.recognize(cardCanvas);
  return text;
}