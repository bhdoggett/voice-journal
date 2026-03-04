output "format_text_endpoint" {
  description = "URL for the format-text API endpoint"
  value       = "https://${aws_api_gateway_rest_api.vj_backend.id}.execute-api.us-east-1.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}/format-text"
}

output "format_text_nlp_endpoint" {
  description = "URL for the format-text-nlp API endpoint"
  value       = "https://${aws_api_gateway_rest_api.vj_backend.id}.execute-api.us-east-1.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}/format-text-nlp"
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions to build and push the NLP image"
  value       = aws_iam_role.github_actions_nlp.arn
}
