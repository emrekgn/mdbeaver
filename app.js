const CLIENT_ID = "YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

const els = {
  signInBtn: document.getElementById("signInBtn"),
  authStatus: document.getElementById("authStatus"),
  fileInfo: document.getElementById("fileInfo"),
  fileName: document.getElementById("fileName"),
  fileOwner: document.getElementById("fileOwner"),
  fileModified: document.getElementById("fileModified"),
  markdownInput: document.getElementById("markdownInput"),
  previewPane: document.getElementById("previewPane"),
  statusMessage: document.getElementById("statusMessage"),
  refreshBtn: document.getElementById("refreshBtn"),
  saveBtn: document.getElementById("saveBtn"),
  autosaveToggle: document.getElementById("autosaveToggle"),
};

let tokenClient;
let gapiReady = false;
let accessToken = null;
let autosaveTimer;
let currentFileId = null;
let driveState = null;

document.addEventListener("DOMContentLoaded", () => {
  parseDriveState();
  wireEvents();
  renderPreview("");
});

function wireEvents() {
  els.signInBtn.addEventListener("click", authorize);
  els.refreshBtn.addEventListener("click", () => {
    if (!currentFileId) return;
    loadFile();
  });
  els.saveBtn.addEventListener("click", () => saveFile());
  els.markdownInput.addEventListener("input", () => {
    renderPreview(els.markdownInput.value);
    scheduleAutosave();
  });
  els.autosaveToggle.addEventListener("change", () => {
    if (!els.autosaveToggle.checked) clearTimeout(autosaveTimer);
  });
}

function parseDriveState() {
  const stateParam = new URLSearchParams(window.location.search).get("state");
  if (!stateParam) {
    updateStatus("Drive launch state missing. Open a file via Drive → Open with.", true);
    return;
  }

  try {
    driveState = JSON.parse(decodeURIComponent(stateParam));
    currentFileId = driveState.ids?.[0] ?? null;
    if (!currentFileId) {
      updateStatus("Drive launch payload did not contain a file id.", true);
    } else {
      els.fileInfo.classList.remove("hidden");
      updateStatus("Ready to authorize and load the file.");
    }
  } catch (err) {
    console.error("Failed to parse drive state", err);
    updateStatus("Invalid Drive launch state payload.", true);
  }
}

async function authorize() {
  if (!currentFileId) return;
  updateStatus("Authorizing with Google…");
  els.signInBtn.disabled = true;

  try {
    await ensureGapi();
    await ensureTokenClient();

    if (accessToken) {
      loadFile();
      return;
    }

    tokenClient.requestAccessToken({
      prompt: "",
    });
  } catch (err) {
    console.error(err);
    updateStatus("Failed to initialize Google APIs. Check console.", true);
    els.signInBtn.disabled = false;
  }
}

async function ensureGapi() {
  if (gapiReady) return;
  await waitFor(() => window.gapi?.load);
  await new Promise((resolve, reject) => {
    window.gapi.load("client", async () => {
      try {
        await window.gapi.client.init({
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        });
        gapiReady = true;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function ensureTokenClient() {
  if (tokenClient) return;
  await waitFor(() => window.google?.accounts?.oauth2?.initTokenClient);
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        console.error(response);
        updateStatus("Authorization error.", true);
        els.signInBtn.disabled = false;
        return;
      }
      accessToken = response.access_token;
      window.gapi.client.setToken({ access_token: accessToken });
      els.authStatus.textContent = "Authorized";
      loadFile();
    },
  });
}

async function loadFile() {
  if (!currentFileId) return;
  updateStatus("Loading file…");
  els.markdownInput.disabled = true;
  els.saveBtn.disabled = true;

  try {
    const [metaResponse, contentResponse] = await Promise.all([
      window.gapi.client.drive.files.get({
        fileId: currentFileId,
        fields: "id, name, owners(displayName), modifiedTime",
      }),
      window.gapi.client.drive.files.get({
        fileId: currentFileId,
        alt: "media",
      }),
    ]);

    const meta = metaResponse.result;
    els.fileName.textContent = meta.name ?? "Untitled";
    els.fileOwner.textContent = meta.owners?.[0]?.displayName ?? "Unknown";
    els.fileModified.textContent = meta.modifiedTime
      ? new Date(meta.modifiedTime).toLocaleString()
      : "—";

    const content = contentResponse.body ?? "";
    els.markdownInput.value = content;
    els.markdownInput.disabled = false;
    els.saveBtn.disabled = false;
    renderPreview(content);
    updateStatus("Loaded. Start editing!");
  } catch (err) {
    console.error(err);
    updateStatus("Failed to load file. Check console for details.", true);
    els.signInBtn.disabled = false;
  }
}

function renderPreview(markdown) {
  if (window.marked) {
    els.previewPane.innerHTML = window.marked.parse(markdown ?? "");
  } else {
    els.previewPane.textContent = markdown ?? "";
  }
}

function scheduleAutosave() {
  if (!els.autosaveToggle.checked || !accessToken || !currentFileId) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveFile({ silent: true }), 1200);
}

async function saveFile(options = {}) {
  if (!currentFileId) return;
  const { silent = false } = options;

  if (!silent) {
    updateStatus("Saving…");
    els.saveBtn.disabled = true;
  }

  try {
    const body = els.markdownInput.value ?? "";
    await window.gapi.client.request({
      path: `/upload/drive/v3/files/${currentFileId}`,
      method: "PATCH",
      params: {
        uploadType: "media",
      },
      headers: {
        "Content-Type": "text/markdown",
      },
      body,
    });

    updateStatus("Saved to Drive.");
    els.saveBtn.disabled = false;
  } catch (err) {
    console.error(err);
    updateStatus("Save failed. Check console.", true);
    els.saveBtn.disabled = false;
  }
}

function updateStatus(message, isError = false) {
  els.statusMessage.textContent = message;
  els.statusMessage.style.color = isError ? "#c62828" : "inherit";
}

function waitFor(checkFn, interval = 100, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (checkFn()) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error("Timed out waiting for dependency"));
      }
    }, interval);
  });
}

window.addEventListener("pageshow", () => {
  // GIS closes popups when returning focus; ensure button reflects state.
  els.signInBtn.disabled = false;
});
