interface MessageRequest {
  action: string;
}

interface MessageResponse {
  success: boolean;
  data?: any;
  pageHtml?: string;
}

let isFilterEnabled = false;

function applyMembershipFilter(): void {
  console.log("Applying membership filter...");

  let removedCount = 0;

  const videoItems = document.querySelectorAll("ytd-rich-item-renderer");

  videoItems.forEach((item) => {
    if (isMembershipVideo(item)) {
      item.remove();
      removedCount++;
    }
  });

  console.log(
    `Membership filter applied - removed ${removedCount} membership videos`
  );
}

function isMembershipVideo(element: Element): boolean {
  const membershipBadge = element.querySelector(
    ".badge-style-type-members-only"
  );
  if (membershipBadge) {
    return true;
  }

  const badges = element.querySelectorAll("ytd-badge-supported-renderer");
  for (let i = 0; i < badges.length; i++) {
    const badge = badges[i];
    const text = badge.textContent?.trim().toLowerCase() || "";
    if (text.includes("members only") || text.includes("members-only")) {
      return true;
    }
  }

  const membershipIndicator = element.querySelector(
    '[aria-label*="Members only"]'
  );
  if (membershipIndicator) {
    return true;
  }

  return false;
}

function removeMembershipFilter(): void {
  console.log("Removing membership filter - refreshing page...");

  window.location.reload();
}

function setupMutationObserver(): void {
  if (!isFilterEnabled) return;

  const observer = new MutationObserver(() => {
    if (isFilterEnabled) {
      applyMembershipFilter();
    }
  });

  const targetNode = document.body;

  observer.observe(targetNode, {
    childList: true,
    subtree: true,
  });

  console.log("Mutation observer set up for dynamic content");
}

function getPageInfo(): any {
  return {
    pageHtml: document.documentElement.outerHTML.substring(0, 10000),
    url: window.location.href,
    title: document.title,
    videoCount: document.querySelectorAll("ytd-video-renderer").length,
  };
}

chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    console.log("Content script received message:", request);

    switch (request.action) {
      case "enableMembershipFilter":
        isFilterEnabled = true;
        applyMembershipFilter();
        setupMutationObserver();
        sendResponse({ success: true });
        break;

      case "disableMembershipFilter":
        isFilterEnabled = false;
        removeMembershipFilter();
        sendResponse({ success: true });
        break;

      case "getPageInfo":
        const pageInfo = getPageInfo();
        sendResponse({ success: true, ...pageInfo });
        break;

      default:
        sendResponse({ success: false, data: "Unknown action" });
    }

    return true;
  }
);

async function init() {
  console.log("YouTube Member Filter content script initialized");

  chrome.storage.sync.get(["filterMembershipVideos"], (data) => {
    if (data.filterMembershipVideos) {
      isFilterEnabled = true;
      applyMembershipFilter();
      setupMutationObserver();
    }
  });
}

init();

export {};
