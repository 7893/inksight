# 基础设施

## 资源命名规范

所有资源使用 `inksight-<组件>` 格式命名。

## Cloudflare 资源清单

| 类型 | 名称 | ID |
|------|------|-----|
| D1 数据库 | `inksight-d1` | `9fa9fc89-8336-48d8-b633-b0ed90ee8a4e` |
| R2 存储桶 | `inksight-r2` | 标准存储类 |
| KV 命名空间 | `inksight-kv` | `8c3c6a22dd1248278a1289d36acd6cdd` |
| Vectorize 索引 | `inksight-vectorize` | 768 维, cosine |
| Worker (API) | `inksight-api` | - |
| Worker (邮件) | `inksight-email` | - |
| Worker (处理器) | `inksight-processor` | - |
| Pages (前端) | `inksight` | - |

## IaC 管理

- Terraform 管理 Cloudflare 资源（`infra/` 目录）
- Vectorize 通过 wrangler CLI 管理（Terraform 暂不支持）

## 常用命令

```bash
# 初始化 terraform
cd infra && terraform init

# 查看变更计划
terraform plan

# 应用变更（需审批）
terraform apply

# 创建 vectorize 索引
wrangler vectorize create inksight-vectorize --dimensions=768 --metric=cosine
```
