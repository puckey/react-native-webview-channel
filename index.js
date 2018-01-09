import mitt from 'mitt';

const debug = false;
const RN_CHANNEL = 1;
const types = {
  CALL: 0,
  EVENT: 1,
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class Channel {
  constructor(webview) {
    Object.assign(this, mitt());
    this._local = {};
    this._responseUID = 0;
    this.target = webview || window;
    this.isWebview = !webview;
    this.onMessage = this.onMessage.bind(this);
  }

  onMessage(event) {
    const messageData = event.nativeEvent
      ? event.nativeEvent.data
      : event.data;
    if (!/RN_CHANNEL/.test(messageData)) return;
    const data = JSON.parse(messageData);
    if (debug) {
      console.log('channel.onMessage', data);
    }
    switch (data.type) {
      case types.CALL:
        this._callFromRemote(data.payload, data.responseName);
        break;

      case types.EVENT:
        this.emit(data.name, data.payload);
        break;
    }
  }

  async send(
    name,
    payload,
    _responseName,
    _type = types.EVENT
  ) {
    if (this.isWebview) {
      while (!window.originalPostMessage) {
        if (debug) {
          console.log(`channel.send waiting for postMessage injection`)
        }
        await sleep(100);
      }
    }
    const data = JSON.stringify({
      RN_CHANNEL,
      payload,
      name,
      responseName: _responseName,
      type: _type
    });
    if (debug) {
      console.log('channel.send', data);
    }
    this.target.postMessage(data);
  }

  register(functionsByName) {
    Object.assign(this._local, functionsByName);
  }

  deregister(functionsByName) {
    Object
      .keys(functionsByName)
      .filter(name => this._local[name] === functionsByName[name])
      .forEach((name) => {
        this._local[name] = null;
      });
  }

  call(name, ...args) {
    return this.query(
      null,
      {
        args,
        name,
      },
      types.CALL
    );
  }

  query(name, payload, _type) {
    let deferred;
    const responseName = `query-${this._responseUID++}`;
    const handler = (data) => {
      this.off(responseName, handler);
      if (data && data.error) {
        deferred.reject(data.error);
      } else {
        deferred.resolve(data);
      }
    };
    this.on(responseName, handler);
    this.send(name, payload, responseName, _type);
    return new Promise((resolve, reject) => {
      deferred = { resolve, reject };
    });
  }

  async _callFromRemote({ name, args }, responseName) {
    if (debug) {
      console.log('channel._callFromRemote', { name, args });
    }

    // TODO: timeout?
    while (!this._local[name]) {
      if (debug) {
        console.log(`channel._callFromRemote waiting for ${name}`)
      }
      await sleep(100);
    }
    try {
      const func = this._local[name];
      const result = await func.apply(func, args);
      if (debug) {
        console.log('channel._callFromRemote result', result);
      }
      this.send(responseName, result);
    } catch (error) {
      this.send(responseName, { error });
    }
  }
}

export default (webview) => {
  const channel = new Channel(webview);
  if (!webview) {
    document.addEventListener('message', channel.onMessage);
  }
  return channel;
};
