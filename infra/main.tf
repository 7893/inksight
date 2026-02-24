terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {}

variable "account_id" {
  type = string
}

# =============================================================================
# Storage Resources
# =============================================================================

resource "cloudflare_d1_database" "db" {
  account_id = var.account_id
  name       = "inksight-d1"
}

resource "cloudflare_r2_bucket" "storage" {
  account_id = var.account_id
  name       = "inksight-r2"
}

resource "cloudflare_workers_kv_namespace" "kv" {
  account_id = var.account_id
  title      = "inksight-kv"
}

# =============================================================================
# Workers
# =============================================================================

resource "cloudflare_workers_script" "app" {
  account_id = var.account_id
  name       = "inksight"
  content    = file("${path.module}/workers/placeholder.js")
  module     = true

  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.db.id
  }

  r2_bucket_binding {
    name        = "STORAGE"
    bucket_name = cloudflare_r2_bucket.storage.name
  }

  kv_namespace_binding {
    name         = "KV"
    namespace_id = cloudflare_workers_kv_namespace.kv.id
  }
}

resource "cloudflare_queue" "email_queue" {
  account_id = var.account_id
  name       = "inksight-email-queue"
}

resource "cloudflare_workers_script" "email" {
  account_id = var.account_id
  name       = "inksight-email"
  content    = file("${path.module}/workers/placeholder.js")
  module     = true

  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.db.id
  }

  r2_bucket_binding {
    name        = "STORAGE"
    bucket_name = cloudflare_r2_bucket.storage.name
  }

  queue_binding {
    binding = "EMAIL_QUEUE"
    queue   = cloudflare_queue.email_queue.name
  }
}

resource "cloudflare_workers_script" "processor" {
  account_id = var.account_id
  name       = "inksight-processor"
  content    = file("${path.module}/workers/placeholder.js")
  module     = true

  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.db.id
  }

  kv_namespace_binding {
    name         = "KV"
    namespace_id = cloudflare_workers_kv_namespace.kv.id
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "d1_database_id" {
  value = cloudflare_d1_database.db.id
}

output "r2_bucket_name" {
  value = cloudflare_r2_bucket.storage.name
}

output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.kv.id
}

output "queue_id" {
  value = cloudflare_queue.email_queue.id
}
