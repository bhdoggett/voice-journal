output "format_text_endpoint" {
  description = "URL for the format-text API endpoint"
  value       = "https://${aws_api_gateway_rest_api.vj_backend.id}.execute-api.us-east-1.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}/format-text"
}
