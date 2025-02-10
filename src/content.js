function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
            break; // Change return to break
        case "open-new-tab":
            window.open(args.join(":"), "_blank");
            break;
        case "click":
            document.querySelector(args.join(":"))?.click();
            break;
        case "type":
            const [selector, text] = args.join(":").split(":");
            const inputElement = document.querySelector(selector);
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
            const element = document.querySelector(extractSelector);
            if (element) {
                console.log(dataType === "text" ? element.innerText : element.value);
            }
            break;
        default:
            console.warn("Unknown command:", command);
    }
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