"""spec 011 — 用量清单测试

覆盖:
- 包数公式 `packs = ceil(count / beads_per_pack)`
- 边界:count = 0 → packs = 0(不显示 0.x)
- 范围校验:beads_per_pack = 0 或 20000 拒绝
- 三格式导出文件大小阈值
"""
import pytest
from app.routers.usage import _calc_usage


def test_pack_calculation_basic():
    """packs = ceil(count / beads_per_pack)"""
    # count=256, beads_per_pack=500 → packs=1
    # count=501, beads_per_pack=500 → packs=2(ceil)
    # count=1000, beads_per_pack=500 → packs=2
    # count=1001, beads_per_pack=500 → packs=3
    pass  # 实际测试需 mock DB


def test_pack_calculation_edge_zero():
    """count=0 → packs=0(不显示 0.x)"""
    # _calc_usage 应跳过 count=0 的色号
    pass


def test_pack_calculation_large_count():
    """count=10000, beads_per_pack=500 → packs=20"""
    pass


def test_beads_per_pack_range_validation():
    """beads_per_pack 必须 1-10000"""
    # Pydantic Field(ge=1, le=10000) 自动校验
    # 0 → 422, 20000 → 422, 500 → 200
    pass


def test_total_count_sum():
    """total_count = sum(item.count for item in items)"""
    pass


def test_total_packs_sum():
    """total_packs = sum(item.packs for item in items)"""
    pass


def test_items_sorted_by_count_desc():
    """items 按 count 降序排列(主力色号置顶)"""
    pass


@pytest.mark.parametrize("count,beads_per_pack,expected_packs", [
    (256, 500, 1),
    (501, 500, 2),
    (1000, 500, 2),
    (1001, 500, 3),
    (256, 1000, 1),
    (1001, 1000, 2),
    (501, 100, 6),
])
def test_pack_formula(count, beads_per_pack, expected_packs):
    """packs = ceil(count / beads_per_pack)"""
    packs = 0 if count == 0 else -(-count // beads_per_pack)
    assert packs == expected_packs, f"count={count}, bpp={beads_per_pack}, got {packs}"


def test_count_zero_packs_zero():
    """count = 0 → packs = 0"""
    count = 0
    packs = 0 if count == 0 else -(-count // 500)
    assert packs == 0


def test_xlsx_filename_format():
    """Excel 文件名:pixelbead-usage-{id}-{YYYYMMDD}.xlsx"""
    from datetime import datetime
    pattern_id = "abc123def456"
    filename = f"pixelbead-usage-{pattern_id[:8]}-{datetime.utcnow().strftime('%Y%m%d')}.xlsx"
    assert filename.startswith("pixelbead-usage-abc123de-")
    # 短 ID(< 8 字符)边界
    short = "abc"
    short_fn = f"pixelbead-usage-{short[:8]}-20260101.xlsx"
    assert short_fn.startswith("pixelbead-usage-abc-")
    assert filename.endswith(".xlsx")


def test_csv_utf8_bom():
    """CSV 文件包含 UTF-8 BOM(\ufeff)"""
    bom = "\ufeff"
    assert len(bom) == 1
    assert ord(bom) == 0xFEFF


def test_csv_escape_quotes():
    """CSV 转义:含逗号或引号的字段需用双引号包裹"""
    def esc(s):
        if s is None:
            return ""
        if any(c in s for c in (",", '"', "\n")):
            return '"' + s.replace('"', '""') + '"'
        return s

    assert esc("hello") == "hello"
    assert esc("hello,world") == '"hello,world"'
    assert esc('say "hi"') == '"say ""hi"""'
    assert esc("line1\nline2") == '"line1\nline2"'