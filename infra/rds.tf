resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_instance" "main" {
  identifier           = "${var.project_name}-db-${var.environment}"
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = var.rds_instance_class
  allocated_storage    = 20
  storage_type         = "gp3"
  
  db_name              = var.db_name
  username             = var.db_username
  password             = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = false
  publicly_accessible    = false
  skip_final_snapshot    = true # Set to false for production
  
  backup_retention_period = 0
  storage_encrypted       = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-${var.environment}"
  })
}
