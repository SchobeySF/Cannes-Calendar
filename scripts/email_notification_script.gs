/**
 * EMAIL NOTIFICATION SCRIPT (Google Apps Script)
 * 
 * Instructions:
 * 1. Create a new Google Apps Script project (script.google.com).
 * 2. Copy the content of this file into 'Code.gs'.
 * 3. Go to Project Settings (Gear icon) -> Script Properties.
 * 4. Add the following properties:
 *    - PROJECT_ID: 'cannes-house'
 *    - PRIVATE_KEY: (The contents of your Service Account private key JSON file)
 *    - CLIENT_EMAIL: (The client_email from your Service Account JSON file)
 * 5. Set up a Trigger:
 *    - Function: 'sendDailyDigest'
 *    - Event Source: 'Time-driven'
 *    - Type: 'Day timer' (e.g. 8am to 9am)
 */

// CONFIGURATION
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/' + PropertiesService.getScriptProperties().getProperty('PROJECT_ID') + '/databases/(default)/documents';
const RECIPIENT_EMAIL = 'maison-schober@googlegroups.com';

/**
 * Main function to run daily.
 */
function sendDailyDigest() {
  const token = getFirestoreToken();
  if (!token) {
    Logger.log("Failed to get Auth Token");
    return;
  }

  // 1. Fetch Mail Queue
  const queueItems = fetchQueue(token);
  if (queueItems.length === 0) {
    Logger.log("No pending changes in queue. Exiting.");
    return;
  }

  Logger.log(`Found ${queueItems.length} items in queue.`);

  // 2. Aggregate Changes
  const summary = aggregateChanges(queueItems);

  if (Object.keys(summary).length === 0) {
      Logger.log("Changes cancelled each other out (Net Zero). Clearing queue but sending no email.");
      clearQueue(token, queueItems);
      return;
  }

  // 3. Format & Send Email
  const emailHtml = formatEmail(summary);
  MailApp.sendEmail({
    to: RECIPIENT_EMAIL,
    subject: `Cannes Calendar Updates - Daily Digest`,
    htmlBody: emailHtml
  });

  Logger.log("Email sent.");

  // 4. Clear Queue
  clearQueue(token, queueItems);
}

/**
 * Aggregates logs into a net change summary per user.
 */
function aggregateChanges(items) {
  const userChanges = {}; // { "Username": { added: Set, removed: Set } }

  // Sort items chronologically
  items.sort((a, b) => a.fields.timestamp.integerValue - b.fields.timestamp.integerValue);

  items.forEach(item => {
    const fields = item.fields;
    const user = fields.modifiedByName ? fields.modifiedByName.stringValue : (fields.modifiedBy.stringValue || "Unknown");
    
    if (!userChanges[user]) {
      userChanges[user] = { added: new Set(), removed: new Set() };
    }

    // Process Added Dates
    if (fields.addedDates && fields.addedDates.arrayValue && fields.addedDates.arrayValue.values) {
       fields.addedDates.arrayValue.values.forEach(v => {
         const date = v.stringValue;
         // If it was previously removed, un-remove it (net neutral)
         if (userChanges[user].removed.has(date)) {
           userChanges[user].removed.delete(date);
         } else {
           userChanges[user].added.add(date);
         }
       });
    }

    // Process Removed Dates
    if (fields.removedDates && fields.removedDates.arrayValue && fields.removedDates.arrayValue.values) {
       fields.removedDates.arrayValue.values.forEach(v => {
         const date = v.stringValue;
         // If it was previously added, un-add it (net neutral)
         if (userChanges[user].added.has(date)) {
           userChanges[user].added.delete(date);
         } else {
           userChanges[user].removed.add(date);
         }
       });
    }
  });

  // Filter out users with no net changes
  const finalSummary = {};
  Object.keys(userChanges).forEach(user => {
    const added = Array.from(userChanges[user].added).sort();
    const removed = Array.from(userChanges[user].removed).sort();
    
    if (added.length > 0 || removed.length > 0) {
      finalSummary[user] = { added, removed };
    }
  });

  return finalSummary;
}

/**
 * Formats the summary into HTML.
 */
function formatEmail(summary) {
  let html = `<div style="font-family: sans-serif; color: #333;">
    <h2 style="color: #4CAF50;">Daily Calendar Updates</h2>
    <p>The following changes were made to the calendar in the last 24 hours:</p>`;

  Object.keys(summary).forEach(user => {
    const { added, removed } = summary[user];
    
    html += `<div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #2196F3;">
      <h3 style="margin-top: 0;">${user}</h3>`;
    
    if (added.length > 0) {
      html += `<p><strong>Booked:</strong><br>${formatRanges(added)}</p>`;
    }
    
    if (removed.length > 0) {
      html += `<p><strong>Cancelled:</strong><br>${formatRanges(removed)}</p>`;
    }
    
    html += `</div>`;
  });

  html += `<p style="font-size: 0.8em; color: #888;">This is an automated message from the Cannes Calendar Website.</p></div>`;
  return html;
}

/**
 * Helper to format consecutive dates into ranges.
 * Input: ["2026-01-01", "2026-01-02", "2026-01-05"]
 * Output: "Jan 1 - Jan 2, Jan 5"
 */
function formatRanges(dates) {
  if (dates.length === 0) return "";
  
  // Parse dates
  const sortedDates = dates.map(d => new Date(d)).sort((a,b) => a - b);
  
  const ranges = [];
  let start = sortedDates[0];
  let prev = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i];
    const diffDays = (current - prev) / (1000 * 60 * 60 * 24);
    
    if (diffDays > 1) {
      // End of range
      ranges.push(formatRangeString(start, prev));
      start = current;
    }
    prev = current;
  }
  ranges.push(formatRangeString(start, prev));
  
  return ranges.join(", ");
}

function formatRangeString(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString('en-US', opts);
  }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

// --- FIRESTORE HELPERS ---

function fetchQueue(token) {
  const url = `${FIRESTORE_URL}/mail_queue`;
  const options = {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  return json.documents || [];
}

function clearQueue(token, items) {
  // Batch delete or individual delete. Individual for simplicity.
  items.forEach(item => {
    const name = item.name; // "projects/.../documents/mail_queue/ID"
    const url = `https://firestore.googleapis.com/v1/${name}`;
    UrlFetchApp.fetch(url, {
      method: 'delete',
      headers: { Authorization: 'Bearer ' + token }
    });
  });
}

function getFirestoreToken() {
  const props = PropertiesService.getScriptProperties();
  const privateKey = props.getProperty('PRIVATE_KEY').replace(/\\n/g, '\n');
  const clientEmail = props.getProperty('CLIENT_EMAIL');
  
  // Create JWT for OAuth
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  
  const signatureInput = Utilities.base64EncodeWebSafe(JSON.stringify(header)) + "." + Utilities.base64EncodeWebSafe(JSON.stringify(claim));
  const signature = Utilities.computeRsaSha256Signature(signatureInput, privateKey);
  const jwt = signatureInput + "." + Utilities.base64EncodeWebSafe(signature);
  
  const options = {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    }
  };
  
  const response = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", options);
  const json = JSON.parse(response.getContentText());
  return json.access_token;
}
