resource "aws_lambda_function" "format_text_gemini" {
  function_name = "vj-backend-formatTextFunction-KGfnL9bqOTAG"
  role          = aws_iam_role.format_text_function.arn
  description   = "Formats raw speech-to-text using Gemini 2.5 Flash"
  handler       = "src/handlers/format-text-gemini.formatTextHandler"
  runtime       = "nodejs22.x"
  timeout       = 30
  memory_size   = 256

  s3_bucket        = "aws-sam-cli-managed-default-samclisourcebucket-voj2qq7uedow"
  s3_key           = "vj-backend/cea829b4f2856013d114ddc6ccb36ea5"
  source_code_hash = "aTM/twMGzcgUa0fjAHVOuw2RLp2FgAvWIqPEJr6nDqk="

  tracing_config {
    mode = "Active"
  }

  logging_config {
    log_format = "JSON"
  }

  environment {
    variables = {
      GEMINI_API_KEY = data.aws_ssm_parameter.gemini_api_key.value
    }
  }

  tags = {
    "lambda:createdBy" = "SAM"
  }
}

resource "aws_lambda_permission" "api_gateway_gemini" {
  statement_id  = "vj-backend-formatTextFunctionApiPermissionProd-jYLo8ECBABS5"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.format_text_gemini.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:us-east-1:665561614671:fuhznte284/*/POST/format-text"
}

resource "aws_lambda_function" "format_text_nlp" {
  function_name = "vj-format-text-nlp"
  role          = aws_iam_role.format_text_nlp.arn
  description   = "Formats raw speech-to-text using deepmultilingualpunctuation"
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.format_text_nlp.repository_url}:latest"
  timeout       = 60
  memory_size   = 2048

  tracing_config { mode = "Active" }
  logging_config { log_format = "JSON" }

  lifecycle {
    ignore_changes = [image_uri]
  }
}

resource "aws_cloudwatch_event_rule" "nlp_warmer" {
  name                = "vj-format-text-nlp-warmer"
  schedule_expression = "rate(10 minutes)"
}

resource "aws_cloudwatch_event_target" "nlp_warmer" {
  rule      = aws_cloudwatch_event_rule.nlp_warmer.name
  target_id = "WarmNLPLambda"
  arn       = aws_lambda_function.format_text_nlp.arn
  input     = jsonencode({ warmer = true })
}

resource "aws_lambda_permission" "cloudwatch_warmer" {
  statement_id  = "AllowCloudWatchWarmNLP"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.format_text_nlp.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.nlp_warmer.arn
}

resource "aws_lambda_permission" "api_gateway_nlp" {
  statement_id  = "AllowAPIGatewayInvokeNLP"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.format_text_nlp.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:us-east-1:665561614671:${aws_api_gateway_rest_api.vj_backend.id}/*/POST/format-text-nlp"
}
