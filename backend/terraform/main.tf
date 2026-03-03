terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket = "vj-terraform-state-665561614671"
    key    = "vj-backend/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" { region = "us-east-1" }
