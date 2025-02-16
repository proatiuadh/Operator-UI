function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'getHtml') {
        const htmlContent = document.documentElement.outerHTML;
        console.log("Sending HTML content from content script:", htmlContent); // Log HTML content for testing
        sendResponse({ htmlContent: htmlContent });
    }
});

async function executeCommands(commands) {
    for (const command of commands) {
        // Execute the command
        await executeCommand(command);
        // Add a delay of 1 second (1000 milliseconds) between commands
        await delay(1000);
    }
}

async function executeCommand(command) {
    const [action, ...args] = command.split(":");
    console.log('Executing command:', action, args); // Add logging

    switch (action) {
        case "goto":
            const url = args.join(":");
            console.log('Navigating to:', url); // Add logging
            window.location.href = url;
            break;
        case "open-new-tab":
            window.open(args.join(":"), "_blank");
            break;
        case "click":
            const selector = args.join(":");
            const element = document.querySelector(selector);
            if (element) {
                console.log('Clicking element:', element); // Add logging
                element.click();
            } else {
                console.error('Element not found for selector:', selector); // Add logging
            }
            break;
        case "type":
            const [typeSelector, text] = args.join(":").split(":");
            const inputElement = document.querySelector(typeSelector);
            if (inputElement) inputElement.value = text;
            break;
        case "submit":
            document.querySelector(args.join(":"))?.submit();
            break;
        case "scroll":
            const [direction, amount] = args;
            window.scrollBy({
                top: direction === "down" ? parseInt(amount) : -parseInt(amount),
                behavior: "smooth"
            });
            break;
        case "wait-for":
            const [waitSelector, timeout] = args;
            setTimeout(() => {
                if (document.querySelector(waitSelector)) {
                    console.log(`Element ${waitSelector} appeared.`);
                }
            }, parseInt(timeout) * 1000);
            break;
        case "extract":
            const [extractSelector, dataType] = args;
            const extractElement = document.querySelector(extractSelector);
            if (extractElement) {
                console.log(dataType === "text" ? extractElement.innerText : extractElement.value);
            }
            break;
    }
}

function handleHTMLContent(htmlContent) {
    console.log("Full page HTML:", htmlContent);
    // You can add more logic here to process or store the HTML content as needed
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'executeCommands') {
        executeCommands(request.commands)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, message: error.message }));
        return true;  // Keep the message channel open for async response
    }
});