/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
let flag=0;
const GetRemoteDataHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetRemoteDataIntent');
  },
  async handle(handlerInput) {
    let outputSpeech = 'This is the default message.';
    let entityid = 0
    let entitytype ="Dunno"
    city="koramangala"
    await getRemoteData('https://developers.zomato.com/api/v2.1/locations?query='+city+'&apikey=3e347a7e610c904bbf827e1f4cefb1d0')
      .then((response) => {
        const data = JSON.parse(response);
        entityid=data.location_suggestions[0].entity_id;
        entitytype=data.location_suggestions[0].entity_type;
        //outputSpeech = `The entity id of ${city} is ${entitytype} `;
      })
      .catch((err) => {
        //set an optional error message here
        //outputSpeech = err.message;
      });
    await getRemoteData('https://developers.zomato.com/api/v2.1/location_details?entity_id='+entityid+'&entity_type='+entitytype+'&apikey=3e347a7e610c904bbf827e1f4cefb1d0')
      .then((response2)=>{
      const data2=JSON.parse(response2);
      outputSpeech='There are a lot of restaurants in a lot of cities, which city would you like to know about?';
    })

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech)
      .getResponse();

  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can introduce yourself by telling me your name';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CityNameIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'CityNameIntent'||handlerInput.requestEnvelope.request.intent.name==='AMAZON.YesIntent');
  },
  handle(handlerInput) {
    //console.log("Im here");
    let speechText;
    if(handlerInput.requestEnvelope.request.intent.name === 'CityNameIntent'){
      speechText = 'Which city would you like to know about?';
  }
    else{
      if(flag==0){
        speechText = 'What do you mean by yes? I do not understand. You can know about restaurants in your city by saying tell me about restaurants in followed by your city name';
      }
      else{
      speechText = 'Which city would you like to know about next?';
    }
    }


    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText) // <--- Here is our reprompt
      .withSimpleCard('What did I learn', speechText)
      .getResponse();
  },
};

const AnswerIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent';
  },
  async handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const city = slots['CityName'].value;
    let speechText = `Your city is ${city}.`
    flag=1;
    let entityid = 0;
    let entitytype ="Dunno";
    await getRemoteData('https://developers.zomato.com/api/v2.1/locations?query='+city+'&apikey=3e347a7e610c904bbf827e1f4cefb1d0')
      .then((response) => {
        const data = JSON.parse(response);
        entityid=data.location_suggestions[0].entity_id;
        entitytype=data.location_suggestions[0].entity_type;
        //outputSpeech = `The entity id of ${city} is ${entitytype} `;
      })
      .catch((err) => {
        //set an optional error message here
        //outputSpeech = err.message;
      });
    await getRemoteData('https://developers.zomato.com/api/v2.1/location_details?entity_id='+entityid+'&entity_type='+entitytype+'&apikey=3e347a7e610c904bbf827e1f4cefb1d0')
      .then((response2)=>{
      const data2=JSON.parse(response2);
      speechText=`There are ${data2.num_restaurant} restaurants in ${city}. The best ones are ${data2.best_rated_restaurant[0].restaurant.name} and ${data2.best_rated_restaurant[1].restaurant.name}. Would you like to know about some other city?`;
    })
    .catch((err) => {
      speechText="https://developers.zomato.com/api/v2.1/location_details?entity_id='+entityid+'&entity_type='+entitytype+'&apikey=3e347a7e610c904bbf827e1f4cefb1d0";
      //set an optional error message here
      //outputSpeech = err.message;
    });

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('What did I learn', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye and happy eating!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const getRemoteData = function (url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : require('http');
    const request = client.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Failed with status code: ' + response.statusCode));
      }
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.on('error', (err) => reject(err))
  })
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetRemoteDataHandler,
    HelpIntentHandler,
    CityNameIntentHandler,
    AnswerIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
