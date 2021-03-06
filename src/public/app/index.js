const chatArea = document.getElementById('chat-area');
const messageInput = document.getElementById('message');
const profileElement = document.getElementById('profile');
const signInButton = document.getElementById('sign-in');

messageInput.addEventListener('keyup', async (event) => {
  if (event.code !== 'Enter') return;
  firebaseClient.addMessage(messageInput.value);
  messageInput.value = '';
});

signInButton.addEventListener('click', async () => {
  auth0Client.signIn();
});

async function setFirebaseCustomToken() {
  const response = await fetch('http://localhost:3001/firebase', {
    headers: {
      'Authorization': `Bearer ${auth0Client.getIdToken()}`,
    },
  });

  const data = await response.json();
  await firebaseClient.setToken(data.firebaseToken);
  await firebaseClient.updateProfile(auth0Client.getProfile());
}

(async () => {
  firebaseClient.setAuthStateListener((user) => {
    if (!user) {
      profileElement.innerText = '';
      signInButton.style.display = 'inline-block';
      messageInput.disabled = true;
      return;
    }

    profileElement.innerText = `Hello, ${firebaseClient.getCurrentUser().displayName}.`;
    signInButton.style.display = 'none';
    messageInput.disabled = false;
    firebaseClient.setMessagesListener((querySnapshot) => {
      chatArea.innerHTML = '';
      querySnapshot.forEach((doc) => {
        const messageContainer = document.createElement('div');
        const timestampElement = document.createElement('small');
        const messageElement = document.createElement('p');

        const messageDate = new Date(doc.data().createdAt.seconds * 1000);
        timestampElement.innerText = doc.data().author + ' - ' + messageDate.toISOString().replace('T', ' ').substring(0, 19);
        messageElement.innerText = doc.data().message;
        messageContainer.appendChild(timestampElement);
        messageContainer.appendChild(messageElement);
        messageContainer.className = 'alert alert-secondary';
        chatArea.appendChild(messageContainer);
      });
    });
  });

  const loggedInThroughCallback = await auth0Client.handleCallback();

  if (loggedInThroughCallback) await setFirebaseCustomToken();
})();
