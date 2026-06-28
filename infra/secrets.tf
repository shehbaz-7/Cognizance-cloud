resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/db-credentials-${var.environment}"
  description             = "Database credentials for ${var.project_name} ${var.environment}"
  recovery_window_in_days = 0 # Set to 0 for easy teardown in dev, increase for prod

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

resource "aws_secretsmanager_secret" "app_config" {
  name                    = "${var.project_name}/app-config-${var.environment}"
  description             = "Application configuration for ${var.project_name} ${var.environment}"
  recovery_window_in_days = 0

  tags = local.common_tags
}

# Initial empty secret version, to be updated manually or via CI/CD
resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id     = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    NEXT_PUBLIC_FIREBASE_API_KEY = "placeholder"
    NVIDIA_API_KEY = "placeholder"
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}
