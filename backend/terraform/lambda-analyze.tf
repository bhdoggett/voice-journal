resource "aws_iam_role" "analyze_lambda" {
  name = "vj-analyze-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "analyze_lambda_basic_execution" {
  role       = aws_iam_role.analyze_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "analyze_lambda_xray" {
  role       = aws_iam_role.analyze_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess"
}

resource "aws_iam_role_policy" "analyze_lambda_ssm" {
  name = "vj-analyze-lambda-ssm"
  role = aws_iam_role.analyze_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "ssm:GetParameter"
      Resource = [
        aws_ssm_parameter.database_url.arn,
        aws_ssm_parameter.gemini_api_key.arn,
      ]
    }]
  })
}

resource "aws_lambda_function" "analyze" {
  function_name = "vj-analyze"
  role          = aws_iam_role.analyze_lambda.arn
  description   = "Generates embeddings, extracts themes, and runs semantic analysis"
  handler       = "analyze.handler"
  runtime       = "nodejs22.x"
  timeout       = 30
  memory_size   = 512

  s3_bucket = "aws-sam-cli-managed-default-samclisourcebucket-voj2qq7uedow"
  s3_key    = "vj-backend/analyze.zip"

  tracing_config {
    mode = "Active"
  }

  logging_config {
    log_format = "JSON"
  }

  environment {
    variables = {
      DATABASE_URL    = aws_ssm_parameter.database_url.value
      GEMINI_API_KEY  = data.aws_ssm_parameter.gemini_api_key.value
    }
  }

  lifecycle {
    ignore_changes = [s3_key, source_code_hash]
  }
}

resource "aws_lambda_function_url" "analyze" {
  function_name      = aws_lambda_function.analyze.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["http://localhost:3000", "https://*.vercel.app"]
    allow_methods     = ["POST", "GET"]
    allow_headers     = ["Content-Type"]
    max_age           = 300
  }
}

output "analyze_lambda_url" {
  value = aws_lambda_function_url.analyze.function_url
}
