interface Settings {
  filterMembershipVideos: boolean;
}

interface MessageRequest {
  action: string;
  settings?: Settings;
}

interface MessageResponse {
  success: boolean;
  data?: any;
}

function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["filterMembershipVideos"], (data) => {
      resolve((data as Settings) || { filterMembershipVideos: false });
    });
  });
}

function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

async function sendFilterMessage(enabled: boolean): Promise<boolean> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    return false;
  }

  if (!tab.url || !tab.url.includes("youtube.com")) {
    showStatus("Please visit YouTube to use this filter", 3000);
    return false;
  }

  const message: MessageRequest = {
    action: enabled ? "enableMembershipFilter" : "disableMembershipFilter",
  };

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id!, message, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);

        if (
          chrome.runtime.lastError.message?.includes(
            "Receiving end does not exist"
          )
        ) {
          showStatus("Extension not ready. Refreshing page...", 2000);
          setTimeout(() => {
            chrome.tabs.reload(tab.id!);
          }, 500);
        } else {
          showStatus("Please refresh the YouTube page and try again", 3000);
        }

        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

function showStatus(
  message: string,
  duration: number = 2000,
  elementId: string = "status"
): void {
  const statusDiv = document.getElementById(elementId) as HTMLDivElement;
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.style.display = "block";

  setTimeout(() => {
    statusDiv.style.display = "none";
  }, duration);
}

async function init() {
  const filterCheckbox = document.getElementById(
    "filterMembershipVideos"
  ) as HTMLInputElement;
  const supportButton = document.getElementById(
    "supportProject"
  ) as HTMLButtonElement;
  const reportButton = document.getElementById(
    "reportIssue"
  ) as HTMLButtonElement;

  if (!filterCheckbox) {
    console.error("Filter checkbox not found!");
    return;
  }

  if (!supportButton) {
    console.error("Support button not found!");
    return;
  }

  if (!reportButton) {
    console.error("Report button not found!");
    return;
  }

  const settings = await loadSettings();
  filterCheckbox.checked = settings.filterMembershipVideos;

  filterCheckbox.addEventListener("change", async () => {
    const isEnabled = filterCheckbox.checked;

    await saveSettings({ filterMembershipVideos: isEnabled });

    await sendFilterMessage(isEnabled);
  });

  supportButton.addEventListener("click", () => {
    chrome.tabs.create({
      url: "https://buymeacoffee.com/incognitobyte",
    });
  });

  reportButton.addEventListener("click", () => {
    chrome.tabs.create({
      url: "https://github.com/incognito-byte/youtube-member-filter/issues",
    });
  });
}

document.addEventListener("DOMContentLoaded", init);

export {};
