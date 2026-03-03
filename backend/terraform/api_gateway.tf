resource "aws_api_gateway_rest_api" "vj_backend" {
  name = "vj-backend"

  endpoint_configuration {
    types = ["EDGE"]
  }
}

resource "aws_api_gateway_resource" "format_text" {
  rest_api_id = aws_api_gateway_rest_api.vj_backend.id
  parent_id   = aws_api_gateway_rest_api.vj_backend.root_resource_id
  path_part   = "format-text"
}

resource "aws_api_gateway_method" "post_format_text" {
  rest_api_id   = aws_api_gateway_rest_api.vj_backend.id
  resource_id   = aws_api_gateway_resource.format_text.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_format_text" {
  rest_api_id             = aws_api_gateway_rest_api.vj_backend.id
  resource_id             = aws_api_gateway_resource.format_text.id
  http_method             = aws_api_gateway_method.post_format_text.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.format_text.invoke_arn
  timeout_milliseconds    = 29000
}

resource "aws_api_gateway_method" "options_format_text" {
  rest_api_id   = aws_api_gateway_rest_api.vj_backend.id
  resource_id   = aws_api_gateway_resource.format_text.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_format_text" {
  rest_api_id = aws_api_gateway_rest_api.vj_backend.id
  resource_id = aws_api_gateway_resource.format_text.id
  http_method = aws_api_gateway_method.options_format_text.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\n  \"statusCode\" : 200\n}\n"
  }

  timeout_milliseconds = 29000
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.vj_backend.id
  resource_id = aws_api_gateway_resource.format_text.id
  http_method = aws_api_gateway_method.options_format_text.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = false
    "method.response.header.Access-Control-Allow-Methods" = false
    "method.response.header.Access-Control-Allow-Origin"  = false
  }
}

resource "aws_api_gateway_integration_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.vj_backend.id
  resource_id = aws_api_gateway_resource.format_text.id
  http_method = aws_api_gateway_method.options_format_text.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = "{}\n"
  }
}

resource "aws_api_gateway_deployment" "vj_backend" {
  rest_api_id = aws_api_gateway_rest_api.vj_backend.id
  description = "RestApi deployment id: f1ee9545ff3cfb5cc47fad6f98be6b3516e918cf"
  triggers    = {}

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.vj_backend.id
  deployment_id = aws_api_gateway_deployment.vj_backend.id
  stage_name    = "Prod"

  xray_tracing_enabled = true
}
