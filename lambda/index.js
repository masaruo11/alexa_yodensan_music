// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const Util = require('./util.js');

// ---楽曲やイメージのデータ---
//楽曲のデータ
const m1 = "Media/music/Felice.mp3";
const m2 = "Media/music/Kisekinohikari.mp3";
const m3 = "Media/music/Kaikou.mp3";
const m4 = "Media/music/Haruakane.mp3";
const m5 = "Media/music/Departure.mp3";
const m6 = "Media/music/Winegrasswomotsumusume.mp3";
const m7 = "Media/music/Juno.mp3";
const m8 = "Media/music/Yorkandlancaster.mp3";
const m9 = "Media/music/Myhometown.mp3";
const m10 = "Media/music/Magi.mp3";

//曲の総数
const lastSong = 9;

//ピクチャーのデータ
const pic_L = "Media/pics/large.jpg";
const pic_S = "Media/pics/small.jpg";
//楽曲格納オブジェクト
const audioList = [
    {name:"Felice", url:m1,track:0},
    {name:"Kisekinohikari", url:m2,track:1},
    {name:"Kaikou", url:m3,track:2},
    {name:"Haruakane", url:m4,track:3},
    {name:"Departure", url:m5,track:4},
    {name:"Winegrasswomotsumusume", url:m6,track:5},
    {name:"Juno", url:m7,track:6},
    {name:"Yorkandlancaster", url:m8,track:7},
    {name:"Myhometown", url:m9,track:8},
    {name:"Magi", url:m10,track:9},
    ];

// ---処理---

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'よでんさんの音楽にようこそ。音楽を聞くには「音楽を再生」と言ってください。';
        const speakReprompt = '音楽を聞くには「音楽を再生」と言ってください。';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakReprompt)
            .getResponse();
    }
};
// Initial music play
const PlayIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayIntent';
    },
    async handle(handlerInput) {
        const speakOutput = 'わかりました。再生します。!';
        const url = Util.getS3PreSignedUrl(audioList[0].url);
        const token = String(audioList[0].track);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, 0, null) // playBehavior, url, token, offsetInMilliseconds, expectedPreviousToken
            .getResponse();
    }
};

//testing...
// async function getPlaybackInfo(handlerInput){
//     const attributes = await handlerInput.attributesManager.getPersistentAttributes();
//     return attributes.playbackInfo;
// }

// Sequential music play
const PlaybackNearlyFinishedHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackNearlyFinished';
    },
    async handle(handlerInput) {
        const AudioPlayer = handlerInput.requestEnvelope.context.AudioPlayer;
        if (AudioPlayer.token===lastSong){
            const speakOutput = '最初の楽曲に戻り、再生を再開します。';
            const url = Util.getS3PreSignedUrl(audioList[0].url);
            const token = String(audioList[0].track);
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, 0, null) // playBehavior, url, token, offsetInMilliseconds, expectedPreviousToken
                .getResponse();
    }else{
            const expectedPreviousToken = AudioPlayer.token;
            const token = String(parseInt(AudioPlayer.token)+1);
            const url = Util.getS3PreSignedUrl(audioList[parseInt(token)].url);
            console.log(expectedPreviousToken, "prevToken in NearlyFinish");
            console.log(token,"Next token");
            console.log(url, "Next Song URL");
            return handlerInput.responseBuilder
                .addAudioPlayerPlayDirective('ENQUEUE', url, token, 0, expectedPreviousToken)
                // .addAudioPlayerPlayDirective('REPLACE_ENQUEUED', url, token, 0)
                .getResponse();
        }
    }
};

//佐瀬さんインテント。ジョークなので、実装時は削除。
const NameIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'NameIntent';
    },
    async handle(handlerInput) {
        const speakOutput = '佐瀬さんって、こわもてで、怖い感じがします。私は、菅谷さんの方がやさしそうで素敵だと思います。';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};


const PauseIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.PauseIntent');
    },
    async handle(handlerInput) {
        return handlerInput.responseBuilder
        .speak('再生を中断します。')
        .addAudioPlayerStopDirective()
        .getResponse();
    }
};

const ResumeIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.ResumeIntent');
    },
    async handle(handlerInput) {
        const AudioPlayer = handlerInput.requestEnvelope.context.AudioPlayer;
        const token = AudioPlayer.token;
        const offset = AudioPlayer.offsetInMilliseconds;
        const url = Util.getS3PreSignedUrl(audioList[parseInt(token)].url);
        return handlerInput.responseBuilder
            .speak("再生を再開します")
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, offset, null)
            .getResponse();
  }
};

const NextIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NextIntent');
    },
        async handle(handlerInput) {
        const AudioPlayer = handlerInput.requestEnvelope.context.AudioPlayer;
        const token = String(parseInt(AudioPlayer.token)+1);
        const url = Util.getS3PreSignedUrl(audioList[parseInt(token)].url);
        return handlerInput.responseBuilder
            .speak('次の曲にうつります。')
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, 0, null)
            .getResponse();
  }
};

const PreviousIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.PreviousIntent');
    },
        async handle(handlerInput) {
        const AudioPlayer = handlerInput.requestEnvelope.context.AudioPlayer;
        const token = String(parseInt(AudioPlayer.token)-1);
        const url = Util.getS3PreSignedUrl(audioList[parseInt(token)].url);
        return handlerInput.responseBuilder
            .speak('前の曲に戻ります。')
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, 0, null)
            .getResponse();
  }
};

const StartOverIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StartOverIntent';
    },
    async handle(handlerInput) {
        const speakOutput = '再度始めから再生します。!';
        const url = Util.getS3PreSignedUrl(audioList[0].url);
        const token = String(audioList[0].track);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, 0, null) // playBehavior, url, token, offsetInMilliseconds, expectedPreviousToken
            .getResponse();
    }
};

const AudioFallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && ( Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ShuffleOffIntent'
                 || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ShuffleOnIntent'
                 || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.LoopOnIntent'
                 || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.LoopOffIntent'
                 || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NavigateHomeIntent'
                 || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent');
        },
    async handle(handlerInput) {
        const speech = 'すみません。まだ、この機能には対応していません。';
        // const url    = Util.getS3PreSignedUrl('Media/hiking.mp3');
        // const token  = String(Math.random());
        return handlerInput.responseBuilder
            .speak(speech)
            // .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, 0, null) // playBehavior, url, token, offsetInMilliseconds, expectedPreviousToken
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = '音楽を再生と言ってください。また、次の曲、前の曲、一時停止、再開もわかります。';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'さようなら。また聞いてくださいね。';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

//Failをピックアップ
const PlaybackFailedHandler ={
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'AudioPlayer.PlaybackFailed';
    },
    handle(handlerInput) {
        const event = handlerInput.event.payloads;
        const err = handlerInput.event.error;
        console.log("token", event.token);
        console.log("currentPBS_token", event.currentPlaybackState.token);
        console.log("currentPBS_offset", event.currentPlaybackState.offsetInMilliseconds);
        console.log("currentPBS_playerActivity", event.currentPlaybackState.playerActivity);
        console.log("err type", err.type);
        console.log("err msg", err.message);
    }
};

const PlaybackHandler = {
  canHandle(handlerInput) {
      const type = Alexa.getRequestType(handlerInput.requestEnvelope);
      return (type === 'AudioPlayer.PlaybackStarted' || // 再生開始
              type === 'AudioPlayer.PlaybackFinished' || // 再生終了
              type === 'AudioPlayer.PlaybackStopped' || // 再生停止
              type === 'AudioPlayer.PlaybackNearlyFinished' || // もうすぐ再生終了
              type === 'AudioPlayer.PlaybackFailed'); // 再生失敗
  },
  async handle(handlerInput) {
      console.log("プレイバックハンドラー",handlerInput.requestEnvelope.type)
      return handlerInput.responseBuilder
      .getResponse();
  }
};


// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `${intentName}を実行しました。`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `ごめんなさい、わかりません。これから勉強します。`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        PlayIntentHandler,
        PlaybackNearlyFinishedHandler,
        NameIntentHandler,//←　ジョークなので実装時は削除
        PauseIntentHandler,
        ResumeIntentHandler,
        NextIntentHandler,
        PreviousIntentHandler,
        StartOverIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        AudioFallbackIntentHandler,
        PlaybackHandler,
        PlaybackFailedHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .withPersistenceAdapter(
         new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
    )
    .lambda();
