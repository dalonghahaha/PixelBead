# 异步任务队列运维文档(spec 010)

> 最后更新:2026-09-20

## 1. 概述

PixelBead 使用 **RQ (Redis Queue)** 处理大图(>80×80)的异步生成。Worker 从 Redis 拉取任务,执行生成逻辑,更新任务状态。

## 2. 启动方式

### 2.1 Docker Compose(推荐)

```bash
cd /data/github/PixelBead
docker-compose up worker
```

服务定义见 `docker-compose.yml`:
```yaml
worker:
  command: python -m app.workers.generate_worker
  environment:
    REDIS_URL: redis://redis:6379/0
    WORKER_CONCURRENCY: 2
```

### 2.2 手动启动

```bash
cd apps/api
python -m app.workers.generate_worker
```

## 3. 配置项(环境变量)

| 变量 | 默认值 | 说明 |
|---|---|---|
| `REDIS_URL` | `redis://redis:6379/0` | Redis 连接 |
| `WORKER_CONCURRENCY` | `2` | Worker 并发任务数 |
| `TASK_TTL_SECONDS` | `2592000` (30 天) | 任务状态 TTL |
| `TASK_TIMEOUT_SECONDS` | `60` | 单任务超时 |
| `USER_MAX_CONCURRENT` | `2` | 单用户最大并发 |
| `QUEUE_MAX_DEPTH` | `100` | 全局队列深度上限 |
| `SYNC_GENERATION_THRESHOLD` | `80` | 同步阈值(>此值走异步) |

## 4. 监控

### 4.1 队列深度

```bash
docker-compose exec redis redis-cli LLEN rq:queue:pixelbead-default
```

### 4.2 Worker 状态

```bash
docker-compose exec worker ps aux | grep rq
```

### 4.3 失败任务

Sentry 会自动上报失败任务(006 协同):
- error code: oom / algorithm_error / timeout / invalid_input
- tags: feature, stage, locale
- contexts: pattern_id

## 5. 故障排查

| 症状 | 排查方向 |
|---|---|
| 任务一直 queued | 检查 Redis 连接 + Worker 进程是否运行 |
| 任务一直 running | 检查 worker 是否崩溃,看 docker logs |
| 任务 failed | Sentry 看错误分类 + 检查图片格式 |
| 队列堆积 | 增加 `WORKER_CONCURRENCY` 或扩展 worker 实例 |
| 限流触发 | 客户端应显示"系统繁忙,请稍后重试" |

## 6. 性能调优

- **并发数**:根据服务器内存调整(2 worker × 2GB = 4GB 上限)
- **超时**:大图(>200×200)适当调高 `TASK_TIMEOUT_SECONDS`
- **Redis**:单实例足够,内存监控 `INFO memory`

## 7. 扩展(Phase 2+)

- 分布式队列:多 worker 实例 + Redis Cluster
- 优先级队列:Pro 用户优先
- 实时进度条:算法侧推送中间状态