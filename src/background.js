class BrowserController {
  constructor() {
      this.API_URL = 'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/v1/chat/completions';
      this.API_KEY = '';
  }

  async parseCommand(prompt, tabId) {
      try {
          // Inject content script into the specified tab
          await chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['src/content.js']
          });

          // Get the current URL of the active tab
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentUrl = tabs[0].url;

          const response = await fetch(this.API_URL, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.API_KEY}`
              },
              body: JSON.stringify({
                  model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
                  messages: [
                      {
                          role: "system",
                          content: `You are a browser automation AI. Your task is to generate structured commands that a local script will parse and execute to control a web browser. Your responses must strictly follow the command format provided below. Do not add explanations, extra text, or deviations—only return the required commands in plain text.

                          #### Command Format:
                          - goto:<URL> → Open a specific webpage.
                          - click:<selector> → Click on an element.
                          - type:<selector>:<text> → Type text into an input field.
                          - submit:<selector> → Submit a form.
                          - scroll:<direction>:<amount> → Scroll up/down by a specified amount.
                          - extract:<selector>:<data-type> → Extract data (text, value, etc.) from an element.
                          - open-new-tab:<URL> → Open a new tab and visit the URL.
                          - wait-for:<selector>:<timeout> → Wait for an element to appear before proceeding.
                          - parse-html → Analyze and extract commands based on provided raw HTML.

                          ### Additional Rules:
                          - Ignore any text inside <think>...</think> tags.
                          - Do not output explanations, only raw commands.
                          - Ensure proper formatting so the local script can parse commands correctly.
                          - Make sure when using goto to provide full url with https://`
                      },
                      {
                          role: "user",
                          content: `Current URL: ${currentUrl}\n\n${prompt}`
                      }
                  ],
                  max_tokens: 500,
                  stream: false
              })
          });

          if (!response.ok) {
              throw new Error(`API Error: ${response.status}`);
          }

          const data = await response.json();
          const aiResponse = data.choices[0].message.content;

          // Clean response and extract commands
          const commands = this.cleanAIResponse(aiResponse);

          if (commands.length > 0) {
              // Send commands to content script
              console.log('Sending commands to content script:', commands);
              chrome.tabs.sendMessage(tabId, { type: "executeCommands", commands }, (response) => {
                  if (chrome.runtime.lastError) {
                      console.error("Error sending message:", chrome.runtime.lastError.message);
                  } else {
                      console.log("Message sent successfully, response:", response);
                  }
              });
          } else {
              console.log("No commands to send.");
          }

          return { success: true, message: commands.join("\n") };
      } catch (error) {
          return { success: false, message: error.message };
      }
  }

  cleanAIResponse(response) {
      // Remove <think>...</think> and other non-command text
      response = response.replace(/<think>.*?<\/think>/gs, ""); // Remove think tags

      // Extract only valid commands (lines starting with a recognized action)
      return response.split("\n").filter(line =>
          line.match(/^(goto:|click:|type:|submit:|scroll:|extract:|open-new-tab:|wait-for:|parse-html)/)
      );
  }
}
const browserController = new BrowserController();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'executeCommand') {
      // Get the current active tab first
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          // Ensure there's at least one tab available
          if (tabs.length === 0) {
              sendResponse({ success: false, message: "No active tab found." });
              return;
          }

          const tabId = tabs[0].id;

          // Call the parseCommand function asynchronously
          browserController.parseCommand(request.prompt, tabId)
              .then(response => {
                  sendResponse(response);  // Send the response back to the sender
              })
              .catch(error => {
                  console.error("Error in parseCommand:", error);
                  sendResponse({ success: false, message: error.message });  // Handle errors
              });
      });

      return true;  // Keep the message channel open for async response
  }
});
