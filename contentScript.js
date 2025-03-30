// contentScript.js - Enhanced debugging version
(function () {
  console.log(
    "🔍 LeetCode to GitHub: Content script starting on " +
      window.location.href
  );

  // Add a visible indicator that the extension is active
  const indicator = document.createElement("div");
  indicator.textContent = "🟢 LeetCode GitHub Extension Active";
  indicator.style.position = "fixed";
  indicator.style.top = "10px";
  indicator.style.right = "10px";
  indicator.style.zIndex = "9999";
  indicator.style.padding = "5px 10px";
  indicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  indicator.style.color = "white";
  indicator.style.borderRadius = "4px";
  indicator.style.fontSize = "12px";
  document.body.appendChild(indicator);

  // Method to extract solution details and send to GitHub
  function extractSolutionDetails() {
    console.log("📊 Extracting solution details...");

    // Extract code from editor - updated selectors
    let code = "";
    let language = "";

    // ✅ Corrected selectors for Monaco Editor + fallback for other editors
    const codeSelectors = [
      ".view-lines .view-line", // Corrected Monaco Editor selector
      ".CodeMirror-line", // Old LeetCode editor
      "pre[data-lang]", // Generic pre element
      ".ace_content .ace_line", // Ace editor (if any)
    ];

    // Try each selector to extract code
    for (const selector of codeSelectors) {
      const codeElements = document.querySelectorAll(selector);
      console.log(
        `🔍 Checking code selector: ${selector} - found ${codeElements.length} elements`
      );

      if (codeElements.length > 0) {
        code = Array.from(codeElements)
          .map((el) => el.innerText || el.textContent)
          .join("\n");
        console.log(`📝 Extracted code using selector: ${selector}`);
        break;
      }
    }

    // 🔥 Fallback: Use Monaco Editor API if selector fails
    if (!code && window.monaco && window.monaco.editor) {
      console.log("🔍 Attempting to extract code from Monaco editor model...");
      try {
        const models = window.monaco.editor.getModels();
        if (models.length > 0) {
          code = models[0].getValue();
          console.log("✅ Code extracted successfully from Monaco model");
        }
      } catch (e) {
        console.error("❌ Error extracting from Monaco model:", e);
      }
    }

    // Extract language
    const languageSelectors = [
      ".select-lang button",
      '[data-cy="code-lang"]',
      ".language-btn",
    ];

    for (const selector of languageSelectors) {
      const languageElement = document.querySelector(selector);
      if (languageElement) {
        language = languageElement.textContent.trim().toLowerCase();
        console.log(`🔤 Found language: ${language}`);
        break;
      }
    }

    // Extract problem title
    let problemTitle = "";
    const titleSelectors = [
      'div[data-cy="question-title"]',
      ".question-title",
      "h4.title",
      "title",
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement) {
        problemTitle = titleElement.textContent.trim();
        console.log(`📌 Found title: ${problemTitle}`);
        break;
      }
    }

    // If title not found, extract from URL
    if (!problemTitle) {
      const match = window.location.pathname.match(/problems\/([^/]+)/);
      if (match && match[1]) {
        problemTitle = match[1].replace(/-/g, " ");
        problemTitle =
          problemTitle.charAt(0).toUpperCase() + problemTitle.slice(1);
        console.log(`📌 Extracted title from URL: ${problemTitle}`);
      }
    }

    // Extract difficulty
    let difficulty = "";
    const difficultySelectors = [
      ".css-14oi08n",
      ".difficulty-label",
      "[data-difficulty]",
    ];

    for (const selector of difficultySelectors) {
      const difficultyElement = document.querySelector(selector);
      if (difficultyElement) {
        difficulty = difficultyElement.textContent.trim();
        console.log(`🔵 Found difficulty: ${difficulty}`);
        break;
      }
    }

    // ✅ Send extracted data if code and title are found
    if (code && problemTitle) {
      console.log("✅ Data collected successfully, sending to background script");

      // Add a visible notification
      const notification = document.createElement("div");
      notification.textContent = "🔄 Sending solution to GitHub...";
      notification.style.position = "fixed";
      notification.style.top = "50px";
      notification.style.right = "10px";
      notification.style.zIndex = "9999";
      notification.style.padding = "10px";
      notification.style.backgroundColor = "#4CAF50";
      notification.style.color = "white";
      notification.style.borderRadius = "4px";
      document.body.appendChild(notification);

      // Send solution data to background script
      chrome.runtime.sendMessage(
        {
          action: "saveSolution",
          data: {
            code: code,
            language: language || "unknown",
            problem: problemTitle,
            difficulty: difficulty || "Unknown",
            url: window.location.href,
          },
        },
        function (response) {
          console.log("📤 Message sent to background script, response:", response);
          if (chrome.runtime.lastError) {
            console.error("❌ Error sending message:", chrome.runtime.lastError);
            notification.textContent = "❌ Error: " + chrome.runtime.lastError.message;
            notification.style.backgroundColor = "#F44336";
          }
        }
      );

      setTimeout(() => {
        notification.remove();
      }, 5000);
    } else {
      console.error("❌ Missing required data: code or problem title");
    }
  }

  // 🖱️ Add a manual test button to test GitHub save
  const testButton = document.createElement("button");
  testButton.textContent = "🧪 Test GitHub Save";
  testButton.style.position = "fixed";
  testButton.style.top = "30px";
  testButton.style.right = "10px";
  testButton.style.zIndex = "9999";
  testButton.style.padding = "5px 10px";
  testButton.style.backgroundColor = "#2196F3";
  testButton.style.color = "white";
  testButton.style.border = "none";
  testButton.style.borderRadius = "4px";
  testButton.style.cursor = "pointer";

  testButton.addEventListener("click", function () {
    console.log("🧪 Test button clicked");
    extractSolutionDetails();
  });

  document.body.appendChild(testButton);

  // ✅ Listen for submit button clicks
  document.addEventListener(
    "click",
    function (e) {
      if (e.target && e.target.tagName === "BUTTON") {
        const buttonText = e.target.textContent.toLowerCase();
        if (buttonText.includes("submit") || buttonText.includes("run")) {
          console.log(`🖱️ Submit/Run button clicked: "${e.target.textContent}"`);

          // Wait and then extract solution after submission
          setTimeout(() => {
            console.log("⏱️ Checking for results after submit click");
            extractSolutionDetails();
          }, 5000);
        }
      }
    },
    true
  );

  // ✅ Listen for messages from background script
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("📩 Received message in content script:", request);

    if (request.action === "solutionSaved") {
      console.log("✅ Solution saved confirmation received");

      const notification = document.createElement("div");
      notification.textContent = "✅ Solution saved to GitHub!";
      notification.style.position = "fixed";
      notification.style.top = "50px";
      notification.style.right = "10px";
      notification.style.zIndex = "9999";
      notification.style.padding = "10px";
      notification.style.backgroundColor = "#4CAF50";
      notification.style.color = "white";
      notification.style.borderRadius = "4px";
      document.body.appendChild(notification);

      setTimeout(function () {
        notification.remove();
      }, 5000);

      sendResponse({ received: true });
      return true;
    }
  });

  // ✅ Log that content script is initialized successfully
  console.log("✅ LeetCode to GitHub: Content script initialized successfully");
})();
