chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    filterMembershipVideos: true,
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("youtube.com")
  ) {
    chrome.storage.sync.get(["filterMembershipVideos"], (data) => {
      if (data.filterMembershipVideos) {
        chrome.tabs.sendMessage(
          tabId,
          { action: "enableMembershipFilter" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log("Content script not ready yet");
            }
          }
        );
      }
    });
  }
});

export {};
