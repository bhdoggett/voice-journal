resource "aws_ecr_repository" "format_text_nlp" {
  name                 = "vj-format-text-nlp"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
