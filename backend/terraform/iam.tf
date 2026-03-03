resource "aws_iam_role" "format_text_function" {
  name = "vj-backend-formatTextFunctionRole-UCn6O5DWYsro"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    "lambda:createdBy" = "SAM"
  }
}

resource "aws_iam_role_policy_attachment" "xray" {
  role       = aws_iam_role.format_text_function.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.format_text_function.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
