import mitt from 'mitt';
import { RN_MESSAGES_CHANNEL_PREFIX } from '../config';

// create string from passed object
function createStringified(type, payload){
  return JSON.stringify({
    type,
    payload
  })
}

const events = mitt();

class RNMessagesChannel {
  sendJSON(json) {
    window.postMessage(RN_MESSAGES_CHANNEL_PREFIX + createStringified('json', json));
  }

  send(string) {
    window.postMessage(RN_MESSAGES_CHANNEL_PREFIX + createStringified('text', string));
  }

  emit(eventName, eventData, fromRN) {
    events.emit(eventName, eventData);

    if (fromRN) {
      return;
    }

    window.postMessage(RN_MESSAGES_CHANNEL_PREFIX + JSON.stringify({
      type: 'event',
      meta: {
        eventName
      },
      payload: eventData
    }));
  }
}

window.RNMessagesChannel = new RNMessagesChannel();

module.exports = window.RNMessagesChannel;
