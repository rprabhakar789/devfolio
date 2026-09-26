/**
 * gmail-apps-script.gs
 * Google Apps Script — forward labeled Gmail messages to GitHub repository_dispatch,
 * which triggers the Portfolio Agent workflow in rprabhakar789/devfolio.
 *
 * Setup:
 *   1. Open script.google.com → New project → paste this file.
 *   2. Add Script Properties (Project Settings → Script properties):
 *        GITHUB_TOKEN    — Personal Access Token with repo scope
 *        GITHUB_REPO     — defaults to "rprabhakar789/devfolio"
 *        GMAIL_LABEL     — Gmail label to watch, defaults to "portfolio-update"
 *        ALLOWED_SENDERS — REQUIRED, comma-separated sender emails, e.g.
 *                          "you@gmail.com, you@work.com"
 *   3. Create a time-driven trigger: forwardLabeledEmails, every 10 minutes.
 *
 * How it works:
 *   - Searches for unread messages carrying the configured Gmail label.
 *   - Enforces the ALLOWED_SENDERS allowlist; non-allowlisted mail is left
 *     untouched (still unread, still labeled) for manual review.
 *   - Uses the plain-text body of the latest message as the "instruction".
 *   - POSTs a repository_dispatch event of type "portfolio-update".
 *   - On success, marks the thread read and removes the label so it is not
 *     processed twice. On failure the label stays for the next run to retry.
 */

// ── Configuration (read from Script Properties) ──────────────────────────────

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  const repo = props.getProperty('GITHUB_REPO') || 'rprabhakar789/devfolio';
  const label = props.getProperty('GMAIL_LABEL') || 'portfolio-update';
  const allowedSendersRaw = props.getProperty('ALLOWED_SENDERS');

  if (!token) throw new Error('Script property GITHUB_TOKEN is not set.');
  if (!allowedSendersRaw) throw new Error('Script property ALLOWED_SENDERS is not set.');

  const allowedSenders = parseAllowedSenders(allowedSendersRaw);
  if (allowedSenders.length === 0) {
    throw new Error('Script property ALLOWED_SENDERS has no valid email addresses.');
  }

  return { token, repo, label, allowedSenders: allowedSenders };
}

/**
 * Parses the ALLOWED_SENDERS CSV into a normalized (trimmed, lowercased) list.
 * @param {string} raw
 * @returns {string[]}
 */
function parseAllowedSenders(raw) {
  return String(raw)
    .split(',')
    .map(function (entry) {
      return entry.trim().toLowerCase();
    })
    .filter(function (entry) {
      return entry.length > 0;
    });
}

/**
 * Extracts a sender email from a Gmail From header. Handles:
 *   "Jane Doe <jane@example.com>", "jane@example.com", "\"Jane, Inc\" <jane@example.com>"
 * @param {string} fromHeader
 * @returns {string|null}
 */
function extractSenderEmail(fromHeader) {
  if (!fromHeader) return null;
  const text = String(fromHeader).trim();

  const angleMatch = text.match(/<\s*([^<>@\s]+@[^<>@\s]+)\s*>/);
  if (angleMatch && angleMatch[1]) return angleMatch[1].trim().toLowerCase();

  const directMatch = text.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  if (directMatch && directMatch[1]) return directMatch[1].trim().toLowerCase();

  return null;
}

// ── Main entry point ─────────────────────────────────────────────────────────

function forwardLabeledEmails() {
  const config = getConfig();
  const threads = GmailApp.search('label:' + config.label + ' is:unread', 0, 10);

  if (threads.length === 0) {
    Logger.log('No labeled unread messages found.');
    return;
  }

  Logger.log('Found ' + threads.length + ' thread(s) to process.');
  const labelObj = GmailApp.getUserLabelByName(config.label);

  for (var i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    const message = messages[messages.length - 1];
    const subject = message.getSubject();
    const fromHeader = message.getFrom();
    const senderEmail = extractSenderEmail(fromHeader);

    if (!senderEmail) {
      Logger.log('Skipping "' + subject + '" — cannot parse sender from header: ' + fromHeader);
      continue;
    }

    if (config.allowedSenders.indexOf(senderEmail) === -1) {
      // Intentionally left unread and labeled so it can be reviewed manually.
      Logger.log('Skipping "' + subject + '" — sender "' + senderEmail + '" is not allowlisted.');
      continue;
    }

    const body = message.getPlainBody().trim();
    if (!body) {
      Logger.log('Skipping "' + subject + '" — empty body.');
      continue;
    }

    Logger.log('Processing: "' + subject + '" from ' + senderEmail);
    Logger.log('Instruction (first 120 chars): ' + body.slice(0, 120));

    if (dispatchToGitHub(config.token, config.repo, body, subject)) {
      thread.markRead();
      if (labelObj) thread.removeLabel(labelObj);
      Logger.log('Dispatched OK for thread: "' + subject + '"');
    } else {
      Logger.log('Dispatch FAILED for thread: "' + subject + '" — leaving label for retry.');
    }
  }
}

// ── GitHub repository_dispatch ───────────────────────────────────────────────

/**
 * Sends a repository_dispatch event to GitHub.
 * @param {string} token GitHub PAT
 * @param {string} repo "owner/repo"
 * @param {string} instruction free-text instruction
 * @param {string} subject email subject, included for context
 * @returns {boolean} true on HTTP 204
 */
function dispatchToGitHub(token, repo, instruction, subject) {
  const url = 'https://api.github.com/repos/' + repo + '/dispatches';

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: JSON.stringify({
      event_type: 'portfolio-update',
      client_payload: {
        instruction: instruction,
        source: 'gmail',
        subject: subject
      }
    }),
    muteHttpExceptions: true
  };

  var response;
  try {
    response = UrlFetchApp.fetch(url, options);
  } catch (error) {
    Logger.log('UrlFetchApp error: ' + error.message);
    return false;
  }

  const code = response.getResponseCode();
  if (code === 204) return true;

  Logger.log('GitHub API returned HTTP ' + code + ': ' + response.getContentText());
  return false;
}

// ── Utility: run manually from the Apps Script editor ────────────────────────

function testDispatch() {
  const config = getConfig();
  const ok = dispatchToGitHub(
    config.token,
    config.repo,
    'Test from Apps Script: add Rust at intermediate level to my languages.',
    'Test subject'
  );
  Logger.log(ok ? 'Dispatch succeeded.' : 'Dispatch failed — check the logs above.');
}
