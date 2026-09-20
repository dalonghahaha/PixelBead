# Project Constitution

<!-- 初版:2026-09-20 | status: active -->

## Principles

1. **Spec 优先于实现**:任何新功能先走 `specs/<NNN>-<short-name>/spec.md`,再讨论代码。
2. **顺序编号**:feature 目录统一用 `NNN-` 三位顺序号(由 `init-options.json` 控制)。
3. **本地模板可覆盖**:`.specify/templates/` 下的 spec-template / checklist-template 优先于远程 preset。
4. **工作目录与 git 分支解耦**:spec 目录命名不绑定分支,git 端的分支策略由项目自行决定。

## Governance

- Spec 内禁止出现实现细节(框架名、语言、库、API),只描述 WHAT/WHY。
- Functional Requirements 必须可测试,Success Criteria 必须可衡量且面向用户。
- 单次 `/speckit-specify` 只写一个 feature,不得批量合并。
- 每次写完 spec 立即生成 `checklists/requirements.md`,自检通过才进 plan 阶段。

## Open Items

(暂无,后续按需补充)
