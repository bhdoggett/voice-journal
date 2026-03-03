resource "aws_lambda_function" "format_text" {
  function_name = "vj-backend-formatTextFunction-KGfnL9bqOTAG"
  role          = aws_iam_role.format_text_function.arn
  description   = "Formats raw speech-to-text using Gemini 2.5 Flash"
  handler       = "src/handlers/format-text.formatTextHandler"
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

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "vj-backend-formatTextFunctionApiPermissionProd-jYLo8ECBABS5"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.format_text.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:us-east-1:665561614671:fuhznte284/*/POST/format-text"
}
