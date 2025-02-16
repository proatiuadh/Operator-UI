document.addEventListener('DOMContentLoaded', function() {
    const promptInput = document.getElementById('prompt-input');
    const executeButton = document.getElementById('execute-button');
    const responseOutput = document.getElementById('response-output');
    const settingsButton = document.getElementById('settings-button');

    executeButton.addEventListener('click', async function() {
        const prompt = promptInput.value;
        if (!prompt.trim()) return;

        const appendHtml = document.getElementById('html-toggle').checked;
        let message = prompt;

        if (appendHtml) {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs.length === 0) {
                    console.error("No active tab found.");
                    return;
                }
                const tabId = tabs[0].id;

                // Inject content script if not already injected
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['src/content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Failed to inject content script:", chrome.runtime.lastError.message);
                        return;
                    }
                    chrome.tabs.sendMessage(tabId, { type: 'getHtml' }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error("Failed to get HTML content from the tab:", chrome.runtime.lastError.message);
                            return;
                        }
                        if (response && response.htmlContent) {
                            console.log("HTML Content to be appended:", response.htmlContent); // Log HTML content for testing
                            message += `\n\nHTML Content:\n${response.htmlContent}`;
                            sendMessage(message);
                        } else {
                            console.error("Failed to get HTML content from the tab.");
                        }
                    });
                });
            });
        } else {
            sendMessage(message);
        }
    });

    function sendMessage(message) {
        executeButton.classList.add('loading');
        responseOutput.textContent = '';
        responseOutput.classList.remove('error');

        chrome.runtime.sendMessage(
            { type: 'executeCommand', prompt: message },
            function(response) {
                executeButton.classList.remove('loading');
                if (response.success) {
                    responseOutput.textContent = response.message;
                } else {
                    responseOutput.textContent = response.message;
                    responseOutput.classList.add('error');
                }
            }
        );
    }

    // Enable enter key to send
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeButton.click();
        }
    });

    // Navigate to settings page
    settingsButton.addEventListener('click', function() {
        window.location.href = 'settings.html';
    });
});