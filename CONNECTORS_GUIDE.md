# DapplePot Connectors Setup Guide

This guide explains how to generate the necessary webhook URLs to configure alert channels in DapplePot.

---

## 1. Slack

To send DapplePot alerts to a Slack channel, you need an **Incoming Webhook URL**.

### How to get a Slack Webhook URL:
1. Go to [api.slack.com/apps](https://api.slack.com/apps) and log in to your Slack workspace.
2. Click **Create New App** and choose **From scratch**.
3. Name your app (e.g., "DapplePot Security Alerts") and select your workspace.
4. On the app settings page, click **Incoming Webhooks** on the left menu.
5. Toggle **Activate Incoming Webhooks** to **On**.
6. Scroll down and click **Add New Webhook to Workspace**.
7. Select the specific channel (e.g., `#security-alerts`) where you want the alerts to be posted, and click **Allow**.
8. Copy the **Webhook URL** (it will look like `https://hooks.slack.com/services/T0000/B0000/XXXX`).
9. Paste this URL into the DapplePot UI when configuring the Slack channel.

---

## 2. Microsoft Teams

To send DapplePot alerts to Microsoft Teams, you need to create an **Incoming Webhook** connector in your specific Teams channel.

### How to get a MS Teams Webhook URL:
1. Open Microsoft Teams and navigate to the channel where you want to receive alerts.
2. Click the **More options (•••)** next to the channel name and select **Connectors**.
   *(Note: In newer versions of Teams, this might be under **Manage Channel** -> **Edit** or within the **Workflows / Apps** menu).*
3. Search for **Incoming Webhook** and click **Add**.
4. Give the webhook a name (e.g., "DapplePot Alerts") and upload an image if desired.
5. Click **Create**.
6. Copy the unique **Webhook URL** provided in the dialog box.
7. Click **Done**.
8. Paste this URL into the DapplePot UI when configuring the MS Teams channel.

---

## 3. Custom Webhook

The Custom Webhook allows you to send raw JSON payloads of security alerts directly to your own infrastructure, internal tools, or SIEM (Security Information and Event Management) system.

### Configuration Details:
1. **Endpoint URL:** This is the URL of your server that will receive the `POST` requests (e.g., `https://api.yourcompany.com/webhooks/dapplepot`).
2. **Secret (Optional):** If you provide a secret, DapplePot will sign the payload using HMAC SHA-256. The signature will be included in the headers of the request (usually `X-DapplePot-Signature`). You should use this secret on your server to verify that the request genuinely came from DapplePot.

### Payload Format:
When an alert triggers, DapplePot will send a POST request with a JSON body similar to this:
```json
{
  "alert_id": "alrt_123456",
  "severity": "high",
  "type": "prompt_injection",
  "message": "OWASP LLM01 - Prompt Injection detected",
  "agent_id": "ag_7890",
  "session_id": "sess_4567",
  "timestamp": "2026-05-25T12:00:00Z"
}
```
