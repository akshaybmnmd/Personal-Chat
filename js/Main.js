var FCM = "";
var client = "";
var channels = "";
var error = false;
var testvalue = 0;
var tempauthor = "";
var total_users = [];
var groupmembers = [];
var tempdatediff = "";
var isFirstTime = false;
var joined_channels = [];
var selected_channel = "global";
var errorValue = "Unknown Error!!";
var user_id = findGetParameter("username");
var user_password = findGetParameter("pass");
var user_avather = findGetParameter("avather");
var token = findGetParameter("googleToken")
  ? findGetParameter("googleToken")
  : "123";
var default_avather = "./images/default_profile.png";
var test = "";

const uuid = user_id + token;

if (!user_id) window.location.href = "./login.html";
if (typeof Storage !== "undefined") {
  if (window.localStorage[uuid]) {
    isFirstTime = false;
    groupmembers = JSON.parse(localStorage.getItem(uuid));
  } else {
    isFirstTime = true;
    groupmembers = [];
  }
} else {
  isFirstTime = false;
  error = true;
  errorValue = "Local Storage not available!";
  console.log("bad");
}

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

$.get(
  "https://personal-chat-3777.twil.io/get_token?user=" + user_id,
  function (token, status) {
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
              getmembers(channel.members.toJSON());
            })
            .catch(function (err) {
              getmembers(channel.members.toJSON());
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
                  getmembers(channel.members.toJSON());
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
  }
);

function loadertest() {
  $(".progress-bar")[0].style.width = (100 / 3) * testvalue + "%";
  if (isFirstTime) {
    setTimeout(() => {
      window.location.reload();
    }, 10000);
  } else if (error) {
    $("#error")[0].innerHTML = errorValue;
  } else {
    if (testvalue == 3) {
      $(".progress-bar")[0].style.width = "100%";
      setTimeout(() => {
        $(".black").hide();
      }, 1100);
      setTimeout(() => {
        setLocal();
      }, 20000);
    } else {
      testvalue++;
    }
  }
}

function logout() {
  localStorage.removeItem(uuid);
  localStorage.removeItem(uuid + "pass");
  localStorage.removeItem("PC_user");
  localStorage.removeItem("PC_token");
  window.location.href = "./login.html";
}

function setLocal() {
  localStorage.setItem(uuid + "pass", myHash(user_password));
  localStorage.setItem("PC_user", myHash(user_id));
  localStorage.setItem("PC_token", token);
}

function FCMtoken() {
  // messaging
  //   .requestPermission()
  //   .then(() => {
  //     console.log("Got permissiond from the user");
  //     get_token();
  //   })
  //   .catch((err) => {
  //     console.log("Permission denided");
  //   });
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
        attr.token = token;
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
  const member = groupmembers.find((element) => element.identity == name);
  var control = "";
  if (time === undefined) {
    time = 0;
  }
  control =
    '<div class="msj macro" style="width:100%" onclick="showChat(\'' +
    name +
    "','" +
    channel +
    "')\">" +
    '<div class="avather"><img class="img-circle" style="width:100%;" src="' +
    member.avather +
    '" /></div>' +
    '<div class="text text-l">' +
    '<div class="authoryou"><b>' +
    name +
    "</b></div>" +
    "<p>Hello</p>" +
    "<p>" +
    member.lastonline +
    "</p>" +
    "<br></div>" +
    "</div>";
  setTimeout(function () {
    $(".searchresultbox").append(control);
  }, time);
}

function showChat(name, channel) {
  const member = groupmembers.find((element) => element.identity == name);
  $(".backbutton").show();
  $(".headeravather").empty();
  $(".headeravather").append(
    '<img class="img-circle" style="width: 100%" src="' + member.avather + '"/>'
  );
  $(".headeravather").show();
  console.log(member);
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

function getmembers(json) {
  var k = 0;
  updatechannelarray();
  for (i = 0; i < json.length; i++) {
    client.getUser(json[i][1].identity).then((usr) => {
      k++;
      var avather = usr.attributes.userAvather
        ? usr.attributes.userAvather
        : "./images/default_profile.png";
      if (groupmembers.find((element) => element.identity == usr.identity)) {
      } else {
        groupmembers.push({
          identity: usr.identity,
          avather: avather,
          fcm: usr.attributes.fcm,
          lastonline: formatAMPM(usr.entity.dateUpdated),
          isOnline: usr.online,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        });
      }
      if (k === json.length) {
        console.log("loaded");
        loadertest();
        if (isFirstTime) {
          localStorage.setItem(uuid, JSON.stringify(groupmembers));
          setTimeout(() => {
            window.location.reload();
          }, 10000);
        }
      }
    });
  }
}

function updatechannelarray() {
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
        resetChat();
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
  attr.token = token;
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
        '<br><li><div class="datediveder"><p>----Yesterday----</p></div></li>';
    } else if (diffDays < 1) {
      seperator =
        '<br><li><div class="datediveder"><p>----Today----</p></div></li>';
    } else {
      seperator =
        '<br><li><div class="datediveder"><p>----' +
        day +
        "/" +
        mnth +
        "/" +
        year +
        "----</p></div></li>";
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
  // gsap.from(".macro", {
  //   opacity: 50,
  //   x: "-100%",
  //   ease: "power2.in",
  //   duration: 1,
  //   stagger: 0.1,
  // });
  $(".chatbox").hide();
  $(".infobutton").show();
  $(".searchresultbox").show();
  $(".MainContainer").show();
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
