<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSocket Example</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body {
      /* Set body to fill the entire OBS overlay */
      width: 100%;
      height: 100%;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #message-box {
      /* Adjust width and height as needed */
      width: 80%;
      /* 80% of the viewport width */
      height: 50%;
      /* 50% of the viewport height */
    }
  </style>

</head>

<!-- <body class="bg-gray-100 flex items-center justify-center min-h-screen"> -->

<body class="flex items-center justify-center min-h-screen">

  <div id="message-box" class="bg-white p-6 rounded
   shadow-lg text-center">
    <div id="message-content" class="mb-4">
      <!-- Messages will be displayed here -->
    </div>
    <div id="sender" class="mb-2 text-gray-500"></div>
    <div class="flex justify-center">
      <button id="back-button" class="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-700">Back</button>
      <button id="next-button" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">Next</button>
      <button id="jump-to-last-button" class="bg-green-500 text-white px-4 py-2 rounded ml-2 hover:bg-green-700">Jump to
        Last</button>
    </div>
    <div id="counter" class="mt-4 text-gray-500"></div>
    <div class="mt-4">
      <label for="filter-checkbox" class="mr-2">Show only messages containing '!q'</label>
      <input type="checkbox" id="filter-checkbox">
    </div>
  </div>

  <script src="https://js.pusher.com/7.0/pusher.min.js"></script>
  <script>
    // Function to fetch the chatroom ID
    async function fetchChatroomId(username) {
      const streamerUrl = `https://kick.com/api/v2/channels/${username}`;
      const response = await fetch(streamerUrl);
      const result = await response.json();
      console.log(result)
      return result.chatroom.id.toString();
    }

    // Main function to set up the WebSocket connection and message display
    async function setupChat(username) {
      const client = new Pusher('eb1d5f283081a78b932c', {
        cluster: 'us2',
        encrypted: true
      });

      // Fetch chatroom ID
      const chatroomId = await fetchChatroomId(username);
      console.log("Chatroom ID:", chatroomId);

      const channel = client.subscribe(`chatrooms.${chatroomId}.v2`);

      let messages = [];
      let currentIndex = -1;
      let newMessageCount = 0;
      let filterEnabled = false;

      channel.bind('App\\Events\\ChatMessageEvent', function (data) {
        console.log("Raw data:", data);
        try {
          const messageData = data;
          const messageContent = messageData.content;
          const senderUsername = messageData.sender.username;

          // Parse emotes and replace with image URLs
          const emoteRegex = /\[emote:(\d+):(\w+)\]/g;
          const formattedMessage = messageContent.replace(emoteRegex, (match, emoteId, emoteCode) => {
            return `<img src="https://files.kick.com/emotes/${emoteId}/fullsize" alt="${emoteCode}" class="inline-block h-6 w-6">`;
          });

          // Filter messages based on checkbox state
          if (!filterEnabled || messageContent.includes('!q')) {
            messages.push({
              content: formattedMessage.replace(/!q/g, ''),
              sender: senderUsername
            });
            if (messages.length === 1) {
              displayMessage(0);
              currentIndex = 0;
              updateCounter();

            } else {
              newMessageCount++;
              updateCounter();
            }

          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });

      function updateCounter() {
        const counter = document.getElementById('counter');
        if (newMessageCount > 0) {
          counter.innerText = `${newMessageCount} new messages`;
        } else {
          counter.innerText = '';
        }
      }

      function displayMessage(index) {
        const messageContent = document.getElementById('message-content');
        if (messages[index]) {
          messageContent.innerHTML = messages[index].content;
          document.getElementById('sender').innerText = `From: ${messages[index].sender}`;
        } else {
          messageContent.innerText = 'No more messages';
        }
      }


      document.getElementById('next-button').addEventListener('click', function () {
        currentIndex++;
        if (currentIndex >= messages.length) {
          currentIndex = messages.length - 1;
        }
        displayMessage(currentIndex);
        newMessageCount--;
        updateCounter();
      });

      document.getElementById('back-button').addEventListener('click', function () {
        currentIndex--;
        if (currentIndex < 0) {
          currentIndex = 0;
        }
        displayMessage(currentIndex);
      });

      document.getElementById('jump-to-last-button').addEventListener('click', function () {
        currentIndex = messages.length - 1;
        displayMessage(currentIndex);
        newMessageCount = 0;
        updateCounter();
      });

      document.getElementById('filter-checkbox').addEventListener('change', function () {
        filterEnabled = this.checked;
        resetMessages();
      });

      function resetMessages() {
        currentIndex = -1;
        messages = [];
        newMessageCount = 0;
        updateCounter();
      }
    }

    // Call setupChat with the username passed as an argument
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    setupChat(username);
  </script>
</body>

</html>
