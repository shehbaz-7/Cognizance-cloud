terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # backend "s3" {
  #   bucket         = "cognizance-tf-state"
  #   key            = "infra/terraform.tfstate"
  #   region         = "ap-south-2"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region
}
