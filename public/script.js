const submitCaptionButton = document.getElementById("submitCaptionButton");

submitCaptionButton.addEventListener("click", () => {
    document.forms["caption"].submit();
    recognizedTextArea.value = "";
});

let isListening = false;

const startListeningLabel = "音声認識を開始する";
const stopListeningLabel = "音声認識を終了する";

const toggleListeningButton = document.getElementById("toggleListeningButton");
toggleListeningButton.addEventListener("click", () => {
  if (!isListening) {
    startRecognition();
  } else {
    stopRecognition();
  }
});
updateButton();

function updateButton() {
  if (isListening) {
    toggleListeningButton.value = stopListeningLabel;
  } else {
    toggleListeningButton.value = startListeningLabel;
  }
}

const languageMenu = document.getElementById("language");

// https://docs.microsoft.com/ja-jp/azure/cognitive-services/speech-service/language-support#speech-to-text
const languages = {
  "日本語 (日本)": "ja-JP",
  "English (United Kingdom)": "en-GB",
  "English (United States)": "en-US",
};
for (let label of Object.keys(languages)) {
  let option = document.createElement("option");
  option.text = label;
  languageMenu.add(option);
}
languageMenu.selectedIndex = 0;
languageMenu.addEventListener("change", updateLanguage);

let language;
updateLanguage();

function updateLanguage() {
  language = languages[languageMenu.value];
  stopRecognition();
}

const recognizingTextArea = document.getElementById("recognizingTextArea");
const recognizedTextArea = document.getElementById("recognizedTextArea");
const statusTextArea = document.getElementById("statusTextArea");

const subscriptionKey = document.getElementById("subscriptionKey");
const serviceRegion = document.getElementById("serviceRegion");

let tokenizer;

kuromoji.builder({ dicPath: "./dict" }).build((err, tok) => {
  if (err) {
    console.log("error while building a tokenizer: ", err);
  } else {
    console.log("built a tokenizer");
  }
  tokenizer = tok;
});

function getTextWithoutFiller(text) {
  let withoutFillerText = "";
  let lastTokenWasFiller = false;

  if (text == null || text.length === 0) return "";

  // At the current moment, this function is only supported for the Japanese language
  if (language !== "ja-JP") {
    return text;
  }

  if (typeof tokenizer === "undefined") {
    return text;
  }

  const tokens = tokenizer.tokenize(text);

  tokens.forEach((token) => {
    if (token.pos !== "フィラー") {
      // フィラーの後に読点が続いた場合にはその読点も削除する
      // If a filler is followed by a punctuation mark, delete that punctuation mark as well
      if (
        !lastTokenWasFiller ||
        (lastTokenWasFiller && token.pos_detail_1 !== "読点")
      ) {
        withoutFillerText += token.surface_form;
        lastTokenWasFiller = false;
      }
    } else {
      lastTokenWasFiller = true;
    }
  });
  return withoutFillerText;
}

let SpeechSDK;
let recognizer;

if (!!window.SpeechSDK) {
  SpeechSDK = window.SpeechSDK;
}

// https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/how-to-recognize-speech?tabs=windowsinstall&pivots=programming-language-javascript#use-continuous-recognition
function startRecognition() {
  if (subscriptionKey.value === "") {
    alert(
      "Please enter your Microsoft Cognitive Services Speech subscription key!"
    );
    return;
  }
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    subscriptionKey.value,
    serviceRegion.value
  );
  speechConfig.speechRecognitionLanguage = language;

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognizing = (sender, event) => {
    const result = event.result;
    recognizingTextArea.value = "［認識中］" + result.text;
  };

  recognizer.recognized = (sender, event) => {
    const result = event.result;

    switch (result.reason) {
      case SpeechSDK.ResultReason.NoMatch:
        const noMatchDetail = SpeechSDK.NoMatchDetails.fromResult(result);
        statusTextArea.textContent = `NoMatch: ${
          SpeechSDK.NoMatchReason[noMatchDetail.reason]
        }`;
        break;
      case SpeechSDK.ResultReason.Canceled:
        const cancelDetails = SpeechSDK.CancellationDetails.fromResult(result);
        statusTextArea.textContent =
          `Canceled: ${SpeechSDK.CancellationReason[cancelDetails.reason]}` +
          (cancelDetails.reason === SpeechSDK.CancellationReason.Error
            ? `: ${cancelDetails.errorDetails}`
            : ``);
        break;
      case SpeechSDK.ResultReason.RecognizedSpeech:
        if (result.text) {
          let text = getTextWithoutFiller(result.text);

          console.log(text);
          recognizedTextArea.value = text;
          document.forms["caption"].submit();
        }
        break;
    }
  };

  recognizer.canceled = (sender, event) => {
    statusTextArea.textContent = `中断しました - Canceled: Reason=${event.reason}`;
    console.log(`CANCELED: Reason=${event.reason}`);

    if (event.reason == SpeechSDK.CancellationReason.Error) {
      console.log(`"CANCELED: ErrorCode=${event.errorCode}`);
      console.log(`"CANCELED: ErrorDetails=${event.errorDetails}`);
    }

    recognizer.stopContinuousRecognitionAsync();
  };

  recognizer.sessionStarted = (sender, event) => {
    statusTextArea.textContent = "開始しました - Started";
  };

  recognizer.sessionStopped = (sender, event) => {
    statusTextArea.textContent = "終了しました - Stopped";
    stopRecognition();
  };

  const phrases = document.getElementById("phrases");
  if (phrases.value) {
    const phraseListGrammar =
      SpeechSDK.PhraseListGrammar.fromRecognizer(recognizer);
    phraseListGrammar.addPhrases(phrases.value.split(";"));
  }

  recognizer.startContinuousRecognitionAsync();

  statusTextArea.textContent = "待機中";
  isListening = true;
  updateButton();
}

function stopRecognition() {
  if (!isListening) {
    return;
  }

  if (recognizer) {
    recognizer.stopContinuousRecognitionAsync(
      function () {
        recognizer.close();
        recognizer = undefined;
      },
      function (err) {
        recognizer.close();
        recognizer = undefined;
      }
    );
  }

  isListening = false;
  updateButton();
}
