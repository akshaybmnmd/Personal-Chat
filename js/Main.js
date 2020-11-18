var FCM = "";
var client = "";
var channels = "";
var testvalue = 0;
var tempdatediff = "";
var tempauthor = "";
var total_users = [];
var selected_channel = "global";
var groupmembers = [];
var joined_channels = [];
var default_avather = "./images/default_profile.png";
var user_id = findGetParameter("username");
var googleToken = findGetParameter("googleToken");
var user_avather = findGetParameter("googleToken");
var test = "";
if (!user_id) window.location.href = "./login.html";

// $.get("https://personal-chat-3777.twil.io/get_users", function(json, status) {
//     for (i = 0; i < json.length; i++) {
//         total_users.push({
//             identity: json[i].identity,
//             friendlyName: json[i].friendlyName,
//             isNotifiable: json[i].isNotifiable,
//             isOnline: json[i].isOnline,
//             dateCreated: json[i].dateCreated,
//             attributes: json[i].attributes
//         });
//     }
loadertest();
// });

$.get("https://personal-chat-3777.twil.io/get_token?user=" + user_id, function (
  token,
  status
) {
  accessToken = token;
  loadertest();
  Twilio.Chat.Client.create(accessToken).then((chatClient) => {
    client = chatClient;
    FCMtoken();
    loadertest();
    updateJoinedChannel();
    chatClient
      .getChannelByUniqueName("global")
      .then((channel) => {
        channel
          .join()
          .then(() => {
            console.log("Joined global channel");
            console.log(channel.members.toJSON());
            updatechannelarray(channel.members.toJSON());
          })
          .catch(function (err) {
            updatechannelarray(channel.members.toJSON());
          });
      })
      .catch((e) => {
        console.log("Can't find global channel: " + e);
        client
          .createChannel({
            uniqueName: "global",
            friendlyName: "global Chat Channel",
          })
          .then(function (channel) {
            console.log("Created global channel:");
            console.log(channel);
            channel
              .join()
              .then(() => {
                console.log("Joined global channel");
                console.log(channel.members.toJSON());
                updatechannelarray(channel.members.toJSON());
              })
              .catch(function (err) {
                console.error("Couldn't join global channel because " + err);
              });
          });
      });

    chatClient.on("tokenAboutToExpire", function () {
      fetchToken(function (updatedToken) {
        chatClient.updateToken(updatedToken);
      });
    });

    chatClient.on("channelInvited", function (channel) {
      console.log("Invited to channel " + channel.uniqueName);
      channel
        .join()
        .then(() => {
          updatechannelarray();
        })
        .catch((err) => {});
    });

    chatClient.on("channelJoined", function (channel) {});
    loadertest();
  });
});

function loadertest() {
  $(".progress-bar")[0].style.width = (100 / 3) * testvalue + "%";
  if (testvalue == 3) {
    $(".progress-bar")[0].style.width = "100%";
    setTimeout(() => {
      $(".black").hide();
    }, 1100);
  } else {
    testvalue++;
  }
}

function FCMtoken() {
  messaging
    .requestPermission()
    .then(() => {
      console.log("Got permissiond from the user");
      get_token();
    })
    .catch((err) => {
      console.log("Permission denided");
    });
}

function get_token() {
  messaging
    .getToken({
      vapidKey:
        "BJ6jAKQlj-F8Cznr0wtyZOg-5WVOY-tZtolr-NyWcmxQyP9ufkrgFMK1uj5uaSrZ2N61Io5BelCidh_uw_Baud0",
    })
    .then((currentToken) => {
      if (currentToken) {
        FCM = currentToken;
        var attr = client.user.attributes;
        attr.fcm = currentToken;
        attr.googleToken = googleToken;
        attr.userAvather = user_avather;
        client.user.updateAttributes(attr);
        console.log("got current token. ", currentToken);
      } else {
        console.log(
          "No registration token available. Request permission to generate one."
        );
      }
    })
    .catch((err) => {
      console.error("An error occurred while retrieving token. ", err);
    });
}

function findGetParameter(parameterName) {
  var result = null,
    tmp = [];
  location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      tmp = item.split("=");
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    });
  return result;
}

function updateJoinedChannel() {
  client
    .getSubscribedChannels()
    .then(function (paginator) {
      for (i = 0; i < paginator.items.length; i++) {
        const channel = paginator.items[i];
        var name = channel.uniqueName;
        if (name !== "global") {
          name = name.replace("_" + user_id, "");
          name = name.replace(user_id + "_", "");
          joined_channels.push({ name: name, channel: channel.uniqueName });
        }
      }
    })
    .then(() => updatepersonalchatview());
}

function updatepersonalchatview() {
  $(".searchresultbox").empty();
  joined_channels.forEach((value, index) => {
    insertpersonalchat(value.name, value.channel);
  });
}

function insertpersonalchat(name, channel, time) {
  var control = "";
  if (time === undefined) {
    time = 0;
  }
  // var img = '<div class="avather"><img class="img-circle" style="width:100%;" src="./images/default_profile.png"></div>';
  // control = '<div class="searchresult" onclick="showChat(\'' + name + '\',\'' + channel + '\')">' +
  //     img +
  //     '<p style="margin: inherit;">' + name + '</p>' +
  //     '</div>';
  control =
    '<div class="msj macro" style="width:100%">' +
    '<div class="avather"><img class="img-circle" style="width:100%;" src="./images/default_profile.png" /></div>' +
    '<div class="text text-l">' +
    '<div class="authoryou"><b>' +
    name +
    "</b></div>" +
    "<p>Hello</p>" +
    "<p>Yesterday</p>" +
    "<br></div>" +
    "</div><hr>";
  setTimeout(function () {
    $(".searchresultbox").append(control);
  }, time);
}

function showChat(name, channel) {
  selected_channel = channel;
  $(".headername")[0].innerText = name;
  $(".MainContainer").hide();
  $(".chatbox").show();
  resetChat();
  client
    .getChannelByUniqueName(channel)
    .then((channel) => {
      channels = channel;
      channel.on("messageAdded", function (messages) {
        console.log("new message", messages);
        var d = new Date(messages.dateCreated);
        console.log(formatAMPM(d));
        if (messages.author == user_id) {
          insertGroupChat("self", messages.body, 0, d, messages.author);
        } else {
          insertGroupChat("other", messages.body, 0, d, messages.author);
        }
      });

      channel.getMessages(100).then(function (messages) {
        const totalMessages = messages.items.length;
        for (i = 0; i < totalMessages; i++) {
          const message = messages.items[i];
          var d = new Date(message.dateCreated);
          if (message.author == user_id) {
            insertGroupChat("me", message.body, 0, d, message.author);
          } else {
            insertGroupChat("other", message.body, 0, d, message.author);
          }
        }
      });

      channel.setAllMessagesConsumed();

      channel.on("typingStarted", function (member) {
        console.log("typingStarted");
        console.log(member);
        $(".subheder")[0].innerHTML = member.identity + " is typing";
      });

      channel.on("typingEnded", function (member) {
        console.log("typingEnded");
        console.log(member);
        $(".subheder")[0].innerHTML = "";
      });
    })
    .catch((e) => {
      console.error("Can't find global channel: " + e);
    });
}

function updatechannelarray(json) {
  for (i = 0; i < json.length; i++) {
    console.log(json[i]);
    var avather = json[i][1].attributes.userAvather
      ? json[i][1].attributes.userAvather
      : "./images/default_profile.png";
    groupmembers.push({
      identity: json[i][1].identity,
      avather: avather,
      lastonline: formatAMPM(json[i][1].lastConsumptionTimestamp),
      lastindex: json[i][1].lastConsumedMessageIndex,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    });
  }
  client
    .getChannelByUniqueName("global")
    .then((channel) => {
      channels = channel;
      channel.on("messageAdded", function (messages) {
        console.log("new message", messages);
        var d = new Date(messages.dateCreated);
        console.log(formatAMPM(d));
        if (messages.author == user_id) {
          insertGroupChat("self", messages.body, 0, d, messages.author);
        } else {
          insertGroupChat("other", messages.body, 0, d, messages.author);
        }
      });

      channel.getMessages(100).then(function (messages) {
        const totalMessages = messages.items.length;
        for (i = 0; i < totalMessages; i++) {
          const message = messages.items[i];
          var d = new Date(message.dateCreated);
          if (message.author == user_id) {
            insertGroupChat("me", message.body, 0, d, message.author);
          } else {
            insertGroupChat("other", message.body, 0, d, message.author);
          }
        }
      });

      channel.setAllMessagesConsumed();

      channel.on("typingStarted", function (member) {
        console.log("typingStarted");
        console.log(member);
        $(".subheder")[0].innerHTML = member.identity + " is typing";
      });

      channel.on("typingEnded", function (member) {
        console.log("typingEnded");
        console.log(member);
        $(".subheder")[0].innerHTML = "";
      });
    })
    .catch((e) => {
      console.error("Can't find global channel: " + e);
    });
  var attr = client.user.attributes;
  attr.fcm = currentToken;
  attr.googleToken = googleToken;
  attr.userAvather = user_avather;
  client.user.updateAttributes(attr);
}

function formatAMPM(date) {
  today = new Date();
  var diffTime = Math.abs(today - date);
  var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
  day = date.getDate();
  mnth = date.getMonth() + 1;
  year = date.getFullYear();
  if (diffDays == 1) {
    return "Yesterday";
  } else if (diffDays < 1) {
    if (date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      var strTime = hours + ":" + minutes + " " + ampm;
      return strTime;
    } else {
      return null;
    }
  } else {
    return day + "/" + mnth + "/" + year;
  }
}

function sendmessage() {
  var sms = $(".message")[0].value;
  if (sms == "") {
    alert("type a sms");
  } else {
    client.getChannelByUniqueName(selected_channel).then((channel) => {
      channel.sendMessage(sms).catch((e) => {
        console.log(e);
      });
      $(".message")[0].value = "";
    });
  }
}

$(".message").change(function () {
  typing();
});

function typing() {
  client.getChannelByUniqueName("global").then((channel) => {
    channel.typing();
  });
}

function insertGroupChat(who, text, time, date, author) {
  text = text.match(/(.{1,55})/g).join(" ");
  if (time === undefined) {
    time = 0;
  }
  var control = "";
  chattime = formatAMPM(date);
  const member = groupmembers.find((element) => element.identity == author);
  var avather = member ? member.avather : default_avather;
  var color = member ? member.color : "black";
  if (who == "other") {
    control =
      seperate(date, author) +
      '<li style="width:100%;padding-left: 15px;">' +
      '<div class="msj macro">' +
      '<div class="avather"><img class="img-circle" style="width:100%;" src="' +
      avather +
      '" /></div>' +
      '<div class="text text-l">' +
      '<div class="authoryou" style="color:' +
      color +
      '"><b>' +
      author +
      "</b></div>" +
      "<p>" +
      text +
      "</p>" +
      "<p>" +
      chattime +
      "</p>" +
      "<br></div>" +
      "</div>" +
      "</li>";
  } else {
    control =
      seperate(date, author) +
      '<li style="width:100%;padding-left: 15px;">' +
      '<div class="msj-rta macro">' +
      '<div class="text text-r">' +
      "<p>" +
      text +
      "</p>" +
      "<p>" +
      chattime +
      "</p>" +
      "<br></div>" +
      "</li>";
  }
  setTimeout(function () {
    $("ul").append(control).scrollTop($("ul").prop("scrollHeight"));
  }, time);
}

function seperate(date, author) {
  today = new Date();
  var diffTime = Math.abs(today - date);
  var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
  day = date.getDate();
  mnth = date.getMonth() + 1;
  year = date.getFullYear();
  var seperator = "";
  if (tempauthor != author) {
    seperator = "<br>";
  } else {
  }
  if (tempdatediff != diffDays) {
    if (diffDays == 1) {
      seperator =
        '<br><li><div class="datediveder">----Yesterday----</div></li><br>';
    } else if (diffDays < 1) {
      seperator =
        '<br><li><div class="datediveder">----Today----</div></li><br>';
    } else {
      seperator =
        '<br><li><div class="datediveder">----' +
        day +
        "/" +
        mnth +
        "/" +
        year +
        "----</div></li><br>";
    }
  }
  tempauthor = author;
  tempdatediff = diffDays;

  return seperator;
}

function resetChat() {
  $("ul").empty();
}

function backtomain() {
  gsap.from(".macro", {
    opacity: 50,
    x: "-100%",
    ease: "power2.in",
    duration: 1,
    stagger: 0.1,
  });
  $(".chatbox").hide();
  $(".infobutton").show();
  $(".searchresultbox").show();
  $(".backbutton").hide();
  $(".headername")[0].innerText = "Presonal Chat";
}

function infobutton() {
  console.log("test");
  $(".options").show();
}

function personalchat() {
  $(".options").hide();
  $(".addapersonalchat").show();
  $(".searchresultbox").empty();
}

function search() {
  $(".searchresultbox").empty();
  var name = $(".nameinput")[0].value;
  client
    .getUser(name)
    .then((UserDetails) => {
      console.log(UserDetails);
      $(".searchresultbox").append(
        '<div class="searchresult" onclick="checkchannel(\'' +
          UserDetails.identity +
          "')\">Name : " +
          UserDetails.identity +
          "</div>"
      );
    })
    .catch((error) => console.log(error));
}

function checkchannel(user) {
  var channelName1 = user_id + "_" + user;
  var channelName2 = user + "_" + user_id;
  client
    .getChannelByUniqueName(channelName1)
    .then((channel) => alert("Chat already exist"))
    .catch((e) => {
      client
        .getChannelByUniqueName(channelName2)
        .then((channel) => alert("Chat already exist"))
        .catch((e) => createChannel(channelName1, user));
    });
}

function createChannel(channelName, user) {
  client
    .createChannel({
      uniqueName: channelName,
      friendlyName: "personal chat",
    })
    .then((channel) => {
      console.log("Created personal chat: " + channelName);
      test = channel;
      channel
        .join()
        .then(() => {
          channel.invite(user).then(() => {
            console.log("Your friend " + user + " has been invited!");
          });
        })
        .catch(function (err) {
          console.error("Couldn't join the channel because " + err);
        });
    });
}

function inviteUser(user) {}

$(".sendbutton").click(function () {
  $(".message").trigger({ type: "keydown", which: 13, keyCode: 13 });
});

//-- Clear Chat
resetChat();
