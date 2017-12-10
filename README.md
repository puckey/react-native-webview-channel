# React Native WebView Messaging

React Native WebView extension with 2-way event-based communication API

![Demo](http://i.imgur.com/BPKQpLf.gif)

* [Installation](#installation)
* [Usage](#usage)
  - [React Native View](#react-native-view)
  - [WebView](#webview)
* [API Docs](#api-docs)
  - [WebView](#webview)
    - [send(text: String)](#webviewsendtext-string)
    - [sendJSON(json: Object)](#webviewsendjsonjson-object)
    - [emit(eventName: String, [eventData: Object])](#webviewemiteventname-string-eventdata-object)
    - [messagesChannel: EventEmitter](#messageschannel-eventemitter)
  - [RNMessagesChannel](#rnmessageschannel)
    - [send(text: String)](#rnmessageschannelsendtext-string)
    - [sendJSON(json: Object)](#rnmessageschannelsendjsonjson-object)
    - [emit(eventName: String, [eventData: Object])](#rnmessageschannelemiteventname-string-eventdata-object)

## Installation

```sh
npm install react-native-webview-messaging
```

or with yarn

```sh
yarn add react-native-webview-messaging
```

## Examples

* [Expo SDK](https://github.com/R1ZZU/react-native-webview-messaging/tree/master/examples/expo)
* [React Native](https://github.com/R1ZZU/react-native-webview-messaging/tree/master/examples/react-native)

### React Native view

```javascript
import React, { Component } from 'react';
import { View, TouchableHighlight } from 'react-native';
import createChannel from 'react-native-webview-messaging/channel';

export class ExampleView extends Component {
  render() {
    return (
      <View>
        <WebView
          ref={ webview => { this.channel = createChannel(webview); }}
          source={ require('./some-page.html') }
        />
        <TouchableHighlight onPress={this.sendMessageToWebView} underlayColor='transparent'>
          <Text>Send message to WebView</Text>
        </TouchableHighlight>
      </View>
    )
  }

  componentDidMount() {
    this.channel.on('message', text => console.log(text));
    this.channel.on('custom-event-from-webview', eventData => console.log(eventData));
  }

  sendMessageToWebView = () => {
    this.channel.send('message', 'greetings from web page');
    this.channel.send('custom-event-from-rn', {
      custom: true,
      data: [1, 2, 3],
    });
  }
}
```

### WebView

```javascript
import channel from 'react-native-webview-messaging';

channel.on('message', text => console.log(text));
channel.on('custom-event-from-rn', ({ custom, data }) => console.log(custom, data));

channel.send('message', 'all the best from WebView');
channel.send('custom-event-from-webview', {
  custom: true,
  data: [1, 2, 3],
});
```

## React Native API Docs

### Import
```javascript
// es6 modules
import createChannel from 'react-native-webview-messaging/channel';

// commonJS
const createChannel = require('react-native-webview-messaging/channel');
```
### createChannel(webview: WebView)
Creates a channel to the webview

### Channel#send(eventName: String, eventData: Any)
Send an event to WebView

### Channel#on(eventName: String, callback: Function)
Register an event handler for the given type.

### Channel#off(eventName: String, callback: Function)
Remove an event handler for the given type.

---

## Browser API Docs

### Import
```javascript
// es6 modules
import channel from 'react-native-webview-messaging';
// commonJS
const channel = require('react-native-webview-messaging');
```

### channel#send(eventName: String, eventData: Any)
Send an event to the React Native app

### channel#on(eventName: String, callback: Function)
Register an event handler for the given type.

### channel#off(eventName: String, callback: Function)
Remove an event handler for the given type.

## LICENSE

MIT
