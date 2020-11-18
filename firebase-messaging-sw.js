importScripts('https://www.gstatic.com/firebasejs/8.0.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.0.2/firebase-messaging.js');

var firebaseConfig = {
    apiKey: "AIzaSyDfFaLbHikphLkya3QwRcSpUO5-XvDhFl0",
    authDomain: "calm-collective-234905.firebaseapp.com",
    databaseURL: "https://calm-collective-234905.firebaseio.com",
    projectId: "calm-collective-234905",
    storageBucket: "calm-collective-234905.appspot.com",
    messagingSenderId: "940321156544",
    appId: "1:940321156544:web:24ddde6b4fc00f7bb66c25",
    measurementId: "G-R0TT1QVV9F",
  };
  firebase.initializeApp(firebaseConfig);
  
  const messaging = firebase.messaging();