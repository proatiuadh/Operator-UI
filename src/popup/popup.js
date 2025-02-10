document.addEventListener('DOMContentLoaded', function() {
    const promptInput = document.getElementById('prompt-input');
    const executeButton = document.getElementById('execute-button');
    const responseOutput = document.getElementById('response-output');

    executeButton.addEventListener('click', async function() {
        const prompt = promptInput.value;
        if (!prompt.trim()) return;

        executeButton.classList.add('loading');
        responseOutput.textContent = '';
        responseOutput.classList.remove('error');

        chrome.runtime.sendMessage(
            { type: 'executeCommand', prompt: prompt },
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
    });

    // Enable enter key to send
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeButton.click();
        }
    });
});