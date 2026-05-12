/**
 * EMAIL NOTIFICATION SCRIPT (Google Apps Script) - ENHANCED WITH ERROR HANDLING
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
    Logger.log("❌ CRITICAL: Failed to get Auth Token");
    sendErrorAlert("Failed to get Firestore Auth Token");
    return;
  }

  try {
    // 1. Fetch Mail Queue
    const queueItems = fetchQueue(token);
    if (queueItems.length === 0) {
      Logger.log("ℹ️ No pending changes in queue. Exiting.");
      return;
    }

    Logger.log(`✓ Found ${queueItems.length} items in queue.`);

    // 2. Aggregate Changes
    const summary = aggregateChanges(queueItems);

    if (Object.keys(summary).length === 0) {
        Logger.log("ℹ️ Changes cancelled each other out (Net Zero). Clearing queue but sending no email.");
        const result = clearQueue(token, queueItems);
        logDeletionSummary(result);
        return;
    }

    // 3. Format & Send Email
    const emailHtml = formatEmail(summary);
    try {
      MailApp.sendEmail({
        to: RECIPIENT_EMAIL,
        subject: `Cannes Calendar Updates - Daily Digest`,
        htmlBody: emailHtml
      });
      Logger.log("✓ Email sent successfully.");
    } catch (emailError) {
      Logger.log("⚠️ Email send failed: " + emailError.message);
      sendErrorAlert("Email send failed: " + emailError.message);
      return;
    }

    // 4. Clear Queue
    const result = clearQueue(token, queueItems);
    logDeletionSummary(result);

  } catch (error) {
    Logger.log("❌ CRITICAL ERROR in sendDailyDigest: " + error.message);
    Logger.log("Stack: " + error.stack);
    sendErrorAlert("Critical error in sendDailyDigest: " + error.message);
  }
}

/**
 * Aggregates logs into a net change summary per user.
 */
function aggregateChanges(items) {
  const userChanges = {};

  items.sort((a, b) => a.fields.timestamp.integerValue - b.fields.timestamp.integerValue);

  items.forEach(item => {
    try {
      const fields = item.fields;
      const user = fields.modifiedByName ? fields.modifiedByName.stringValue : (fields.modifiedBy.stringValue || "Unknown");
      
      if (!userChanges[user]) {
        userChanges[user] = { added: new Set(), removed: new Set() };
      }

      if (fields.addedDates && fields.addedDates.arrayValue && fields.addedDates.arrayValue.values) {
         fields.addedDates.arrayValue.values.forEach(v => {
           const date = v.stringValue;
           if (userChanges[user].removed.has(date)) {
             userChanges[user].removed.delete(date);
           } else {
             userChanges[user].added.add(date);
           }
         });
      }

      if (fields.removedDates && fields.removedDates.arrayValue && fields.removedDates.arrayValue.values) {
         fields.removedDates.arrayValue.values.forEach(v => {
           const date = v.stringValue;
           if (userChanges[user].added.has(date)) {
             userChanges[user].added.delete(date);
           } else {
             userChanges[user].removed.add(date);
           }
         });
      }
    } catch (itemError) {
      Logger.log("⚠️ Error processing item: " + itemError.message);
    }
  });

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
 */
function formatRanges(dates) {
  if (dates.length === 0) return "";
  
  try {
    const sortedDates = dates.map(d => new Date(d)).sort((a,b) => a - b);
    
    const ranges = [];
    let start = sortedDates[0];
    let prev = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
      const current = sortedDates[i];
      const diffDays = (current - prev) / (1000 * 60 * 60 * 24);
      
      if (diffDays > 1) {
        ranges.push(formatRangeString(start, prev));
        start = current;
      }
      prev = current;
    }
    ranges.push(formatRangeString(start, prev));
    
    return ranges.join(", ");
  } catch (error) {
    Logger.log("⚠️ Error in formatRanges: " + error.message);
    return dates.join(", ");
  }
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
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      throw new Error(`Fetch queue failed with status ${responseCode}: ${response.getContentText()}`);
    }
    
    const json = JSON.parse(response.getContentText());
    return json.documents || [];
  } catch (error) {
    Logger.log("❌ Error fetching queue: " + error.message);
    throw error;
  }
}

function clearQueue(token, items) {
  const result = {
    success: 0,
    failed: 0,
    errors: []
  };

  items.forEach((item, index) => {
    try {
      const name = item.name;
      const url = `https://firestore.googleapis.com/v1/${name}`;
      
      const response = UrlFetchApp.fetch(url, {
        method: 'delete',
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true
      });
      
      const statusCode = response.getResponseCode();
      
      if (statusCode === 200) {
        result.success++;
        Logger.log(`✓ Deleted mail_queue item ${index + 1}/${items.length}`);
      } else {
        result.failed++;
        const errorMsg = `Item ${index + 1}: Status ${statusCode}`;
        result.errors.push(errorMsg);
        Logger.log(`❌ Failed to delete: ${errorMsg}`);
      }
    } catch (itemError) {
      result.failed++;
      const errorMsg = `Item ${index + 1}: ${itemError.message}`;
      result.errors.push(errorMsg);
      Logger.log(`❌ Error deleting item: ${errorMsg}`);
    }
  });

  return result;
}

/**
 * Logs deletion summary and sends alert if failures occurred
 */
function logDeletionSummary(result) {
  Logger.log("");
  Logger.log("=== DELETION SUMMARY ===");
  Logger.log(`✓ Success: ${result.success}`);
  Logger.log(`❌ Failed: ${result.failed}`);
  
  if (result.errors.length > 0) {
    Logger.log("Errors:");
    result.errors.forEach(err => Logger.log(`  - ${err}`));
    sendErrorAlert(`Mail queue deletion had ${result.failed} failures`);
  }
  
  Logger.log("=======================");
}

/**
 * Sends error alert email to admins
 */
function sendErrorAlert(subject, details = "") {
  try {
    const body = `ERROR in Cannes Calendar Mail Digest Script:\n\n${subject}\n\n${details}\n\nCheck script.google.com execution logs for more details.`;
    MailApp.sendEmail(RECIPIENT_EMAIL, `[ERROR] ${subject}`, body);
  } catch (e) {
    Logger.log("⚠️ Could not send error alert: " + e.message);
  }
}

function getFirestoreToken() {
  try {
    const props = PropertiesService.getScriptProperties();
    const privateKey = props.getProperty('PRIVATE_KEY');
    const clientEmail = props.getProperty('CLIENT_EMAIL');
    
    if (!privateKey || !clientEmail) {
      throw new Error("Missing PRIVATE_KEY or CLIENT_EMAIL in Script Properties");
    }

    const formattedKey = privateKey.replace(/\\n/g, '\n');
    
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
    const signature = Utilities.computeRsaSha256Signature(signatureInput, formattedKey);
    const jwt = signatureInput + "." + Utilities.base64EncodeWebSafe(signature);
    
    const options = {
      method: "post",
      payload: {
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", options);
    const statusCode = response.getResponseCode();
    
    if (statusCode !== 200) {
      throw new Error(`Token request failed with status ${statusCode}`);
    }
    
    const json = JSON.parse(response.getContentText());
    
    if (!json.access_token) {
      throw new Error("No access_token in response");
    }
    
    return json.access_token;
  } catch (error) {
    Logger.log("❌ Error getting Firestore token: " + error.message);
    throw error;
  }
}
