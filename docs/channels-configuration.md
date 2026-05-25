# DapplePot Notification Channels Configuration

This document explains how to configure notification channels in DapplePot to receive real-time security alerts.

## 1. Slack

To receive DapplePot alerts in a Slack channel, you must configure an Incoming Webhook in your Slack workspace.

**Steps:**
1. Go to your Slack workspace's **App Directory** and search for **Incoming Webhooks**.
2. Click **Add to Slack**.
3. Choose the channel where you want DapplePot to post alerts (e.g., `#security-alerts`) and click **Add Incoming Webhooks integration**.
4. Copy the **Webhook URL** provided by Slack.
5. In the DapplePot UI, go to **Settings > Notification Channels** and click **Add Channel**.
6. Select **Slack** as the channel type.
7. Paste the Webhook URL into the **Webhook URL** field.
8. (Optional) Enter the channel name in the **Channel** field if you want to override the default channel configured in the Slack app.
9. Click **Create Channel**.

## 2. Microsoft Teams

To receive DapplePot alerts in Microsoft Teams, you must configure an Incoming Webhook connector for a specific channel.

**Steps:**
1. In Microsoft Teams, navigate to the channel where you want to receive alerts.
2. Click the **More options** (three dots) button next to the channel name and select **Connectors**.
3. Search for **Incoming Webhook** and click **Add**.
4. Give the webhook a name (e.g., "DapplePot Alerts") and optionally upload a custom icon.
5. Click **Create**.
6. Copy the generated **Webhook URL** and click **Done**.
7. In the DapplePot UI, go to **Settings > Notification Channels** and click **Add Channel**.
8. Select **Microsoft Teams** as the channel type.
9. Paste the Webhook URL into the **Teams Webhook URL** field.
10. Click **Create Channel**.

## 3. Custom Webhook

For advanced integrations, you can configure DapplePot to send a POST request with a JSON payload to a custom HTTP endpoint whenever a security alert is triggered.

**Steps:**
1. Ensure your endpoint can receive POST requests and process JSON payloads.
2. In the DapplePot UI, go to **Settings > Notification Channels** and click **Add Channel**.
3. Select **Custom Webhook** as the channel type.
4. Enter the URL of your endpoint in the **Endpoint URL** field.
5. (Optional) Enter a **Secret** to sign the requests. If provided, DapplePot will include an `X-Signature` header in the POST request containing an HMAC SHA-256 signature of the payload using your secret. You can use this to verify that the request came from DapplePot.
6. Click **Create Channel**.

**Payload Schema:**
The payload sent to your custom webhook will look like this:
```json
{
  "event": "security_alert",
  "timestamp": "2026-05-25T12:00:00Z",
  "data": {
    "agent_id": "...",
    "session_id": "...",
    "severity": "high",
    "signals": [
      {
        "id": "OW-LLM01",
        "description": "Prompt Injection Detected"
      }
    ]
  }
}
```
