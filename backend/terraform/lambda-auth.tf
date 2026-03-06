resource "aws_lambda_function" "auth" {
  function_name = "vj-auth"
  role          = aws_iam_role.auth_lambda.arn
  description   = "Validates Better Auth session tokens"
  handler       = "auth.handler"
  runtime       = "nodejs22.x"
  timeout       = 10
  memory_size   = 256

  s3_bucket = "aws-sam-cli-managed-default-samclisourcebucket-voj2qq7uedow"
  s3_key    = "vj-backend/auth.zip"

  tracing_config {
    mode = "Active"
  }

  logging_config {
    log_format = "JSON"
  }

  environment {
    variables = {
      DATABASE_URL = aws_ssm_parameter.database_url.value
    }
  }

  lifecycle {
    ignore_changes = [s3_key, source_code_hash]
  }
}

resource "aws_lambda_function_url" "auth" {
  function_name      = aws_lambda_function.auth.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["http://localhost:3000", "https://*.vercel.app"]
    allow_methods     = ["POST"]
    allow_headers     = ["Content-Type"]
    max_age           = 300
  }
}
