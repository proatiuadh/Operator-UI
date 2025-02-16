// Get the necessary elements
const saveSettingsButton = document.getElementById('save-settings-button');
const apiKeyInput = document.getElementById('api-key-input');

// Load saved API key from storage
chrome.storage.sync.get(['apiKey'], function(result) {
    if (result.apiKey) {
        apiKeyInput.value = result.apiKey;
    }
});

// Save the settings when the "Save" button is clicked
saveSettingsButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value;
    chrome.storage.sync.set({ apiKey: apiKey }, function() {
        alert('Settings saved!');
    });
});
