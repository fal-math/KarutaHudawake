const video = document.getElementById("camera");

// カメラ映像を取得して表示
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        video.srcObject = stream;
    })
    .catch((err) => {
        console.error("カメラの起動に失敗しました: ", err);
    });

// 「判別する」ボタンのクリックイベント
document.getElementById("capture").addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Tesseract.jsを使ってOCRを実行
    Tesseract.recognize(
        canvas,
        'jpn',
        { logger: (m) => console.log(m) }
    ).then(({ data: { text } }) => {
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
});

// ローカルストレージに50枚の札を保存する例
function saveKarutaCards(cards) {
    localStorage.setItem("karutaCards", JSON.stringify(cards));
}

// 初回の設定で使用する場合
saveKarutaCards(["ちはやふる", "あさぼらけ", "しのぶれど"]);  // 例
