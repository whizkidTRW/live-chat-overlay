var showOnlyFirstName;
var remoteServerURL = "wss://localhost:8443/";
var version = "0.4.0";
var config = {};
var lastID = "";
var autoHideTimer = null;

$("body").unbind("click").on("click", "yt-live-chat-text-message-renderer,yt-live-chat-paid-message-renderer,yt-live-chat-membership-item-renderer,ytd-sponsorships-live-chat-gift-purchase-announcement-renderer,yt-live-chat-paid-sticker-renderer", function () {
  clearTimeout(autoHideTimer);

  // Don't show deleted messages
  if ($(this)[0].hasAttribute("is-deleted")) {
    console.log("Not showing deleted message");
    return;
  }

  var data = {};

  data.chatId = $(this).attr("id");
  if (data.chatId === lastID) {
    hideActiveChat();
    return;
  }

  data.authorName = $(this).find("#author-name").text();
  if (showOnlyFirstName) {
    data.authorName = data.authorName.replace(/ [^ ]+$/, '');
  }

  data.authorImg = $(this).find("#img").attr('src');
  data.authorImg = data.authorImg.replace("32", "128");

  data.message = $(this).find("#message").html();

  data.badges = "";
  if ($(this).find("#chat-badges .yt-live-chat-author-badge-renderer img").length > 0) {
    data.badges = $(this).find("#chat-badges .yt-live-chat-author-badge-renderer img").parent().html();
  }

  // Mark this comment as shown
  $(this).addClass("shown-comment").addClass("active-comment");

  data.backgroundColor = "";
  data.textColor = "";

  lastID = data.chatId;

  var remote = {
    version: version,
    command: "show",
    data: data,
    config: config
  }
    
  webSocket.send(JSON.stringify(remote));

  if (config.autoHideSeconds && config.autoHideSeconds > 0) {
    autoHideTimer = setTimeout(function() {
      hideActiveChat();
    }, config.autoHideSeconds*1000);
  }
});


function hideActiveChat() {
  var remote = {
    version: version,
    command: "hide",
    config: config
  };

  webSocket.send(JSON.stringify(remote));
  $(".active-comment").removeClass("active-comment");
  lastID = false;
}


$("body").on("click", ".btn-clear", function () {
  hideActiveChat();
});

$("yt-live-chat-app").before('<button class="btn-clear">CLEAR</button>' );

// Restore settings
var configProperties = ["color","scale","sizeOffset","commentBottom","commentHeight","authorBackgroundColor","authorAvatarBorderColor","authorColor","commentBackgroundColor","commentColor","fontFamily","showOnlyFirstName","serverURL","autoHideSeconds","authorAvatarOverlayOpacity"];
chrome.storage.sync.get(configProperties, function(item) {
  showOnlyFirstName = item.showOnlyFirstName;

  if (item.serverURL) {
    remoteServerURL = item.serverURL;
  }

  config = item;
});


$(document).keyup(function(e) {
    // Escape key hides active chat
    if (e.keyCode === 27) {
      hideActiveChat();
    }

});


// Main starts here
$(function() {
  var url = remoteServerURL;
  console.log(`Opening ${url}`);
  webSocket = new WebSocket(url);
});



function onElementInserted(containerSelector, callback) {
    var watchedTagNames = [
      "yt-live-chat-text-message-renderer".toUpperCase(),
      "yt-live-chat-paid-message-renderer".toUpperCase(),
      "yt-live-chat-membership-item-renderer".toUpperCase(),
      "yt-live-chat-paid-sticker-renderer".toUpperCase(),
      "ytd-sponsorships-live-chat-gift-purchase-announcement-renderer".toUpperCase()
    ];

    var onMutationsObserved = function(mutations) {
        mutations.forEach(function(mutation) {
            // console.log("A mutation happened");
            if (mutation.addedNodes.length) {
                for (var i = 0, len = mutation.addedNodes.length; i < len; i++) {
                    if (watchedTagNames.includes(mutation.addedNodes[i].tagName)) {
                        callback(mutation.addedNodes[i]);
                    }
                }
            }
        });
    };

    var target = document.querySelectorAll(containerSelector)[0];
    var config = { childList: true, subtree: true };
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var observer = new MutationObserver(onMutationsObserved);
    observer.observe(target, config);
}
