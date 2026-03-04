import json
import os
from deepmultilingualpunctuation import PunctuationModel

# Load once per container, reused across warm invocations
model = PunctuationModel()

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

def handler(event, context):
    # EventBridge warmer ping — just return, model is already loaded
    if event.get("warmer"):
        return {"statusCode": 200, "body": "warm"}

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
        text = body.get("text", "").strip()
    except (json.JSONDecodeError, AttributeError):
        return {"statusCode": 400, "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Invalid JSON"})}

    if not text:
        return {"statusCode": 400, "headers": CORS_HEADERS,
                "body": json.dumps({"error": "text is required"})}

    formatted_text = model.restore_punctuation(text)

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"formattedText": formatted_text}),
    }
