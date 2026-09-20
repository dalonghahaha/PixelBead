# API Contract — Task Endpoints (010 主契约)

<!-- 010-async-generation-task-queue/contracts/tasks.md -->

> **Version**: 1.0 · **Modified by**: 010

## 1. Task Object

```typescript
type TaskStatus = 'queued' | 'running' | 'complete' | 'failed' | 'cancelled';

interface Task {
  task_id: string;           // UUID v4
  user_id: string;           // 仅 server 端使用
  status: TaskStatus;
  progress: number;          // 0-100(粗粒度三阶段 30/60/90)
  params: {
    image_size_kb: number;
    palette_id: string;
    bead_size: 'mini' | 'midi';  // 009 协同
    // 其他生成参数
  };
  result_pattern_id?: string;  // complete 时
  error?: {
    code: 'oom' | 'algorithm_error' | 'timeout' | 'invalid_input';
    message: string;             // 人类可读
  };
  retry_count: number;
  created_at: string;          // ISO 8601
  updated_at: string;
}
```

## 2. Endpoints

### 2.1 `POST /tasks`

**用途**:创建异步生成任务

**Request**(multipart):
- `image`:图片文件(JPG/PNG/WebP)
- `palette_id`:色板 ID(默认 `mard-221`)
- `bead_size`:`mini` / `midi`(009 协同,默认 `mini`)

**Response 201**:
```json
{
  "task_id": "uuid",
  "status": "queued"
}
```

**Response 429**:队列深度超限

### 2.2 `GET /tasks/{task_id}`

**用途**:查询任务状态

**权限**:仅任务创建者(user_id 校验)

**Response 200**:`Task` 对象

**Response 403**:非创建者
**Response 404**:任务不存在或已过期(30 天)

### 2.3 `POST /tasks/{task_id}/cancel`

**用途**:用户主动取消任务

**权限**:仅任务创建者

**Response 200**:
```json
{
  "task_id": "uuid",
  "status": "cancelled"
}
```

**Response 409**:任务已完成(`complete` / `failed`),不可取消

## 3. State Machine

```
queued ──→ running ──→ complete
   │           │
   │           ├─→ failed ──→ (用户重试) → queued
   │           │
   │           └─→ cancelled
   │
   └─→ cancelled(worker 未拉取)
```

## 4. Routing Logic

`POST /patterns` 自动分流:
- 图纸格子数 ≤ 80×80:走同步路径(003 现状)
- 图纸格子数 > 80×80:转发到 `POST /tasks`(异步)

阈值可配置:`SYNC_GENERATION_THRESHOLD`(默认 80)

## 5. Redis Key Design

```
pixelbead:task:{task_id}              # Hash:Task 对象
pixelbead:tasks:user:{user_id}        # Set:用户的 task_id 列表
pixelbead:queue:default               # List:RQ 队列
```

TTL:任务完成后 30 天自动清理

## 6. Worker Configuration

| 配置 | 环境变量 | 默认 |
|---|---|---|
| Worker 并发数 | `WORKER_CONCURRENCY` | 2 |
| Redis URL | `REDIS_URL` | `redis://redis:6379/0` |
| Task TTL | `TASK_TTL_SECONDS` | 2592000 (30 天) |
| 任务超时 | `TASK_TIMEOUT_SECONDS` | 60 |
| 单用户最大并发 | `USER_MAX_CONCURRENT` | 2 |
| 队列深度上限 | `QUEUE_MAX_DEPTH` | 100 |
| 同步阈值 | `SYNC_GENERATION_THRESHOLD` | 80 |

## 7. Related Specs

- 003:`POST /patterns` 同步路径
- 009:`bead_size` 参数
- 006:`pb_task_*` 5 个埋点
- 008:任务完成后图纸可查 grid
- 011:任务完成后图纸可查 usage