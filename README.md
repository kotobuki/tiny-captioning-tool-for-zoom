# Minimal Captioning tool for Zoom

```mermaid
sequenceDiagram
    actor H as Zoom host
    participant O as OBS
    participant B as Web Browser
    participant S as Web Server
    participant A as Azure Speech Service
    participant Z as Zoom
    participant ZA as Zoom App
    actor P as Zoom participant

    H->>O: Start the virtual camera
    H->>B: Input the Speech Service API key
    H->>B: Input the Zoom API key
    H->>B: Start recognition
    B->>A: Start continuous recognition async
    loop
        B--)+A: Audio signal
        A--)B: Recognizing text
        O--)B: Capture the recognizing text
        O--)Z: Show the recognizing text (as camera images)
        Z--)ZA: Recognizing text (as camera images)
        P--)ZA: Recognizing text (as camera images)
        A->>-B: Recognized text
        B->>S: Submit the recognized text + Zoom API key
        S->>+Z: Ask the seq number of the last successful send
        Z->>-S: The seq number
        S->>+Z: Submit the recognized text with the seq number
        Z->>-ZA: Recognized text as closed captions
        P--)ZA: Recognized text as closed captions
    end
    H->>B: Stop recognition
    B->>A: Stop continuous recognition async
    H->>O: Stop the virtual camera
```

## 本ツールについて

Microsoft Cognitive ServicesのSpeech Serviceで音声認識したテキストをZoomの字幕として表示する簡易的なツールです。あくまで最小限の機能だけを実装した簡易的なものであり、一般向け公開サービスとして使用されることを想定したものではありません。今後の予定についてはTODO.mdをご覧ください。

### 参考にした記事など

- [Quickstart: Recognize speech in JavaScript on a Web Browser](https://github.com/Azure-Samples/cognitive-services-speech-sdk/tree/master/quickstart/javascript/browser/from-microphone)
- [JavaScript Speech Recognition, Synthesis, and Translation Sample for the Web Browser](https://github.com/Azure-Samples/cognitive-services-speech-sdk/tree/master/samples/js/browser)
- [Cognitive Services Speech SDK for JavaScript](https://docs.microsoft.com/ja-jp/javascript/api/overview/azure/microsoft-cognitiveservices-speech-sdk-readme?view=azure-node-latest)

## About this tool

A simple tool to display text recognised by the Speech Service of Microsoft Cognitive Services as subtitles in Zoom. Only the minimum functions are implemented, and it is not intended to be used as a public service for general use. See TODO.md for plans.

### References

- [Quickstart: Recognize speech in JavaScript on a Web Browser](https://github.com/Azure-Samples/cognitive-services-speech-sdk/tree/master/quickstart/javascript/browser/from-microphone)
- [JavaScript Speech Recognition, Synthesis, and Translation Sample for the Web Browser](https://github.com/Azure-Samples/cognitive-services-speech-sdk/tree/master/samples/js/browser)
- [Cognitive Services Speech SDK for JavaScript](https://docs.microsoft.com/ja-jp/javascript/api/overview/azure/microsoft-cognitiveservices-speech-sdk-readme?view=azure-node-latest)
