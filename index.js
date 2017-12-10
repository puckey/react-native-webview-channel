import mitt from 'mitt';

const RN_MESSAGES_CHANNEL = 'RN_MESSAGES_CHANNEL';
const types = {
  REGISTER: 'register',
  DEREGISTER: 'deregister',
  CALL: 'call',
  EVENT: 'event',
}

const createChannel = () => Object.assign(
  mitt(),
  {
    remote: {},
    _local: {},
    _responseUID: 0,

    send: (
      name,
      payload,
      _responseName,
      _type = types.EVENT
    ) => window.postMessage(
      {
        RN_MESSAGES_CHANNEL,
        payload,
        name,
        responseName: _responseName,
        type: _type
      },
    ),

    register: (functionsByName) => {
      const names = Object.keys(functionsByName);
      return this.query(null, names, types.REGISTER)
        .then(() => {
          Object.assign(this._local, functionsByName);
        });
    },

    deregister: (functionsByName) => {
      Object
        .keys(functionsByName)
        .forEach(name => this._local[name] = null);
      return this.query(null, names, types.DEREGISTER);
    },

    query: (name, payload, _type) => {
      let deferred;
      const responseName = `query-${this._responseUID++}`;
      const handler = (data) => {
        this.off(responseName, handler);
        if (data.error) {
          deferred.reject(data.error);
        } else {
          deferred.resolve(data);
        }
      }
      this.on(responseName, handler);
      this.send(name, payload, responseName, _type);
      return new Promise(function(resolve, reject) {
        deferred = { resolve, reject };
      })
    },

    _callFromRemote: async ({ name, payload, responseName }) => {
      const localFunc = this._local[name];
      if (!localFunc) {
        channel.send(responseName, { error: 'missing remote function' });
        return;
      }
      try {
        const result = await localFunc(payload);
        channel.send(responseName, result);
      } catch(error) {
        channel.send(responseName, { error });
      }
    },

    _deregisterFromRemote: ({ functions, responseName }) => {
      const { remote } = this;
      functions.forEach(name => { remote[name] = null; });
      this.send(data.responseName);
    },

    _registerFromRemote: ({ functions, responseName }) => {
      const { remote } = this;
      functions.forEach(name => {
        remote[name] = (...payload) => {
          return this.query(null, {
            payload,
            name,
          },
          types.CALL
        );
        }
      });
      this.send(data.responseName);
    }
  }
);

export default (webview) => {
  const channel = createChannel();
  const receivedMessage = async (data) => {
    if (data.RN_MESSAGES_CHANNEL !== RN_MESSAGES_CHANNEL) return;
    switch(data.type) {
      case types.CALL:
        channel._callFromRemote(data);
        break;

      case types.REGISTER:
        channel._registerFromRemote(data);
        break;

      case types.DEREGISTER:
        channel._deregisterFromRemote(data);
        break;

      case types.EVENT:
        channel.emit(data.eventName, data.payload);
        break;
    }
  };

  if (webview) {
    webview.onMessage = ({ nativeEvent }) => {
      receivedMessage(nativeEvent);
    };
  } else {
    document.addEventListener('message', receivedMessage);
  }
};
