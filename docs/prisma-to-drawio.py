# -*- coding: utf-8 -*-
"""
Sinh docs/ERD-HoangNha.drawio từ backend/prisma/schema.prisma.

Vì sao sinh bằng script thay vì kéo tay trong draw.io:
  - Schema đổi (thêm FK, thêm cột) là chạy lại một lệnh, ERD không bao giờ
    lệch với database thật.
  - Vị trí bảng + đường đi của "dây" được khai báo trong LAYOUT/ROUTES bên
    dưới, mỗi quan hệ đi một kênh dọc riêng nên dây không chồng lên nhau.

Quy ước ký hiệu:
  - Cột nhãn: PK (khóa chính), FK1/FK2/FK3 (khóa ngoại, đánh số theo thứ tự
    xuất hiện trong bảng), UK (unique).
  - Đầu dây dùng chân quạ (crow's foot): phía "nhiều" là ERmany, phía "một"
    là ERone; FK cho phép NULL thì phía "một" là ERzeroToOne.
  - KHÔNG ghi nhãn "1:N" trên dây — ký hiệu chân quạ đã nói lên điều đó,
    ghi thêm chữ chỉ làm rối hình.

Chạy:  python docs/prisma-to-drawio.py
"""
import re
import pathlib
import sys

# Console Windows mặc định là cp1252, in dấu tiếng Việt hoặc "✓" sẽ ném
# UnicodeEncodeError sau khi file đã ghi xong — script coi như chạy lỗi dù
# kết quả đúng. Ép stdout sang UTF-8 cho hết chuyện.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHEMA = ROOT / 'backend' / 'prisma' / 'schema.prisma'
OUT = ROOT / 'docs' / 'ERD-HoangNha.drawio'

# ---------------------------------------------------------------- parse ----
SCALARS = {'Int', 'String', 'Boolean', 'DateTime', 'Float', 'BigInt', 'Decimal'}

models: dict[str, list[dict]] = {}
order: list[str] = []
cur = None

for raw in SCHEMA.read_text(encoding='utf-8').splitlines():
    line = raw.strip()
    m = re.match(r'^model\s+(\w+)\s*\{$', line)
    if m:
        cur = m.group(1)
        order.append(cur)
        models[cur] = []
        continue
    if cur is None or line.startswith('//') or not line:
        continue
    if line == '}':
        cur = None
        continue
    if line.startswith('@@'):
        continue
    m = re.match(r'^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$', line)
    if not m:
        continue
    name, typ, arr, opt, rest = m.groups()
    rest = rest.split('//')[0]
    if typ in SCALARS and not arr:
        models[cur].append({
            'name': name, 'type': typ, 'opt': bool(opt),
            'pk': '@id' in rest, 'uk': '@unique' in rest,
            'fk': None,
        })
    else:
        # trường quan hệ: @relation(fields: [x], references: [y]) → đánh dấu FK
        r = re.search(r'@relation\(fields:\s*\[(\w+)\],\s*references:\s*\[(\w+)\]', rest)
        if r:
            fkcol, refcol = r.group(1), r.group(2)
            for f in models[cur]:
                if f['name'] == fkcol:
                    f['fk'] = (typ, refcol)

# ---------------------------------------------------------------- layout ----
# (tên bảng trong DB, x, y). 4 cột: danh mục/ảnh → sản phẩm → dòng chi tiết →
# người dùng & đơn hàng. Mọi quan hệ chỉ nối cột kề nhau hoặc trong cùng cột,
# nhờ vậy dây luôn chạy trong khoảng trống giữa hai cột, không cắt qua bảng.
LAYOUT = {
    'Category':        ('categories',         40,   80),
    'ProductImage':    ('product_images',     40,  300),
    'Banner':          ('banners',            40,  640),
    'Product':         ('products',          460,   80),
    'Variant':         ('variants',          460,  640),
    'CartItem':        ('cart_items',        880,   80),
    'Review':          ('reviews',           880,  320),
    'OrderItem':       ('order_items',       880, 1080),
    'User':            ('users',            1300,   80),
    'Address':         ('addresses',        1300,  420),
    'Voucher':         ('vouchers',         1300,  760),
    'Order':           ('orders',           1300, 1080),
    'Payment':         ('payments',         1300, 1690),
    'SepayWebhookLog': ('sepay_webhook_logs', 1300, 2020),
    'Notification':    ('notifications',    1300, 2400),
}

# (bảng con, cột FK) -> (cạnh thoát, cạnh vào, kênh dọc x)
# Mỗi dây một kênh x riêng → không có hai dây nào chồng lên nhau.
ROUTES = {
    ('Product', 'categoryId'):        ('L', 'R', 330),
    ('ProductImage', 'productId'):    ('R', 'L', 390),
    # Variant nối lên Product bằng kênh bên TRÁI để không nhập chung bó dây
    # bên phải Product (bó này đã có 3 dây từ cart_items/reviews/order_items).
    ('Variant', 'productId'):         ('L', 'L', 430),
    ('CartItem', 'productId'):        ('L', 'R', 750),
    ('Review', 'productId'):          ('L', 'R', 778),
    ('OrderItem', 'productId'):       ('L', 'R', 806),
    ('CartItem', 'variantId'):        ('L', 'R', 834),
    ('Review', 'variantId'):          ('L', 'R', 848),
    ('OrderItem', 'variantId'):       ('L', 'R', 862),
    ('CartItem', 'userId'):           ('R', 'L', 1160),
    ('Review', 'userId'):             ('R', 'L', 1185),
    ('OrderItem', 'orderId'):         ('R', 'L', 1210),
    ('Address', 'userId'):            ('R', 'R', 1600),
    ('Order', 'userId'):              ('R', 'R', 1628),
    ('Order', 'voucherId'):           ('R', 'R', 1656),
    ('Payment', 'orderId'):           ('R', 'R', 1684),
    ('SepayWebhookLog', 'orderId'):   ('R', 'R', 1712),
    ('Notification', 'userId'):       ('R', 'R', 1740),
    ('Notification', 'orderId'):      ('R', 'R', 1768),
    ('Notification', 'voucherId'):    ('R', 'R', 1796),
}

W, HEAD, ROW, LBL = 250, 30, 26, 46

T_TABLE = ('shape=table;startSize=30;container=1;collapsible=0;childLayout=tableLayout;'
           'fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;strokeColor=#000000;'
           'fillColor=#FFFFFF;fontColor=#000000;fontSize=12;')
T_ROW = ('shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;'
         'strokeColor=inherit;top=0;left=0;bottom=0;right=0;collapsible=0;dropTarget=0;'
         'fillColor=none;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;')
T_LBL = ('shape=partialRectangle;html=1;whiteSpace=wrap;connectable=0;strokeColor=inherit;'
         'overflow=hidden;fillColor=none;top=0;left=0;bottom=1;right=1;align=center;'
         'verticalAlign=middle;fontStyle=1;fontSize=10;fontColor=#000000;')
T_NAME = ('shape=partialRectangle;html=1;whiteSpace=wrap;connectable=0;strokeColor=inherit;'
          'overflow=hidden;fillColor=none;top=0;left=0;bottom=1;right=0;align=left;'
          'verticalAlign=middle;spacingLeft=6;fontSize=11;fontColor=#000000;')


def esc(s: str) -> str:
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


xml = []
row_id: dict[tuple[str, str], str] = {}   # (model, field) -> id ô dòng

for model in order:
    if model not in LAYOUT:
        continue
    label, x, y = LAYOUT[model]
    fields = models[model]
    h = HEAD + ROW * len(fields)
    tid = f't_{model}'
    xml.append(f'<mxCell id="{tid}" value="{esc(label)}" style="{T_TABLE}" vertex="1" parent="1">'
               f'<mxGeometry x="{x}" y="{y}" width="{W}" height="{h}" as="geometry"/></mxCell>')

    fk_no = 0
    for i, f in enumerate(fields):
        rid = f'r_{model}_{f["name"]}'
        row_id[(model, f['name'])] = rid
        tags = []
        if f['pk']:
            tags.append('PK')
        if f['fk']:
            fk_no += 1
            tags.append(f'FK{fk_no}')
        if f['uk'] and not f['pk']:
            tags.append('UK')
        name = esc(f['name'])
        if f['pk']:
            name = f'&lt;u&gt;&lt;b&gt;{name}&lt;/b&gt;&lt;/u&gt;'
        elif f['fk']:
            name = f'&lt;i&gt;{name}&lt;/i&gt;'
        xml.append(f'<mxCell id="{rid}" value="" style="{T_ROW}" vertex="1" parent="{tid}">'
                   f'<mxGeometry y="{HEAD + i * ROW}" width="{W}" height="{ROW}" as="geometry"/></mxCell>')
        # Kẻ dọc ngăn cột nhãn chỉ vẽ ở dòng CÓ nhãn (PK/FK/UK) — giống mẫu
        # bảng chuẩn của draw.io, dòng thường không bị cắt đôi cho đỡ rối.
        lbl_style = T_LBL if tags else T_LBL.replace('right=1', 'right=0')
        xml.append(f'<mxCell id="{rid}_a" value="{",".join(tags)}" style="{lbl_style}" vertex="1" parent="{rid}">'
                   f'<mxGeometry width="{LBL}" height="{ROW}" as="geometry">'
                   f'<mxRectangle width="{LBL}" height="{ROW}" as="alternateBounds"/></mxGeometry></mxCell>')
        xml.append(f'<mxCell id="{rid}_b" value="{name}" style="{T_NAME}" vertex="1" parent="{rid}">'
                   f'<mxGeometry x="{LBL}" width="{W - LBL}" height="{ROW}" as="geometry">'
                   f'<mxRectangle width="{W - LBL}" height="{ROW}" as="alternateBounds"/></mxGeometry></mxCell>')


def row_y(model: str, field: str) -> int:
    """Toạ độ y tâm của một dòng (để đặt điểm gãy cho dây)."""
    _, _, ty = LAYOUT[model]
    idx = [f['name'] for f in models[model]].index(field)
    return ty + HEAD + idx * ROW + ROW // 2


def side_x(model: str, side: str) -> int:
    _, tx, _ = LAYOUT[model]
    return tx + W if side == 'R' else tx


# ---- gom danh sách quan hệ trước khi vẽ, để chia điểm cắm ở bảng cha ----
rels = []
for model in order:
    if model not in LAYOUT:
        continue
    for f in models[model]:
        if not f['fk']:
            continue
        parent, refcol = f['fk']
        if parent not in LAYOUT:
            continue
        exit_s, entry_s, ch = ROUTES.get((model, f['name']), ('R', 'L', side_x(model, 'R') + 30))
        rels.append({'child': model, 'field': f, 'parent': parent, 'ref': refcol,
                     'exit': exit_s, 'entry': entry_s, 'ch': ch})

# TÁCH DÂY Ở ĐẦU BẢNG CHA:
# nhiều bảng con cùng trỏ vào một khóa chính (vd 5 bảng trỏ vào products.id).
# Nếu dây nào cũng cắm đúng giữa dòng thì đoạn cuối của chúng nằm chồng lên
# nhau thành một vệt. Nên chia đều điểm cắm theo chiều cao của dòng: mỗi dây
# vào một cao độ riêng → nhìn ra ngay dây nào đi đâu.
FAN = {1: [0.5], 2: [0.28, 0.72], 3: [0.2, 0.5, 0.8], 4: [0.16, 0.38, 0.62, 0.84],
       5: [0.12, 0.31, 0.5, 0.69, 0.88], 6: [0.1, 0.26, 0.42, 0.58, 0.74, 0.9]}
groups: dict[tuple, list] = {}
for r in rels:
    groups.setdefault((r['parent'], r['ref'], r['entry']), []).append(r)
for key, grp in groups.items():
    # sắp theo y của bảng con để các dây song song, không cắt chéo nhau
    grp.sort(key=lambda r: row_y(r['child'], r['field']['name']))
    for r, ey in zip(grp, FAN[len(grp)]):
        r['entryY'] = ey

edges = 0
for r in rels:
    f, model, parent, refcol = r['field'], r['child'], r['parent'], r['ref']
    # FK unique → quan hệ 1:1; FK cho phép NULL → phía "một" là 0..1
    end = 'ERone' if not f['opt'] else 'ERzeroToOne'
    start = 'ERone' if f['uk'] else 'ERmany'
    style = (f'edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;jettySize=14;'
             f'startArrow={start};startFill=0;endArrow={end};endFill=0;strokeColor=#3C4A57;'
             f'exitX={1 if r["exit"] == "R" else 0};exitY=0.5;exitDx=0;exitDy=0;'
             f'entryX={1 if r["entry"] == "R" else 0};entryY={r["entryY"]};entryDx=0;entryDy=0;')
    src, tgt = row_id[(model, f['name'])], row_id[(parent, refcol)]
    # điểm cắm thật ở bảng cha (đã lệch theo entryY) → bẻ góc đúng chỗ đó
    ty = row_y(parent, refcol) - ROW // 2 + round(ROW * r['entryY'])
    pts = (f'<Array as="points"><mxPoint x="{r["ch"]}" y="{row_y(model, f["name"])}"/>'
           f'<mxPoint x="{r["ch"]}" y="{ty}"/></Array>')
    xml.append(f'<mxCell id="e{edges}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">'
               f'<mxGeometry relative="1" as="geometry">{pts}</mxGeometry></mxCell>')
    edges += 1

# tiêu đề + chú thích
xml.append('<mxCell id="title" value="ERD — HOÀNG NHA FASHION (15 bảng)" '
           'style="text;html=1;fontSize=22;fontStyle=1;fontColor=#0F2B46;align=left;verticalAlign=middle;" '
           'vertex="1" parent="1"><mxGeometry x="40" y="10" width="640" height="40" as="geometry"/></mxCell>')
legend = ('&lt;b&gt;Chú thích&lt;/b&gt;&lt;br&gt;'
          'PK — khóa chính (gạch chân) &amp;nbsp;•&amp;nbsp; FK1, FK2, FK3 — khóa ngoại (in nghiêng, đánh số theo thứ tự trong bảng)'
          '&amp;nbsp;•&amp;nbsp; UK — ràng buộc duy nhất&lt;br&gt;'
          'Chân quạ (nhiều) — phía bảng con &amp;nbsp;•&amp;nbsp; gạch đơn (một) — phía bảng cha '
          '&amp;nbsp;•&amp;nbsp; vòng tròn = khóa ngoại NULL được (quan hệ tùy chọn)')
xml.append(f'<mxCell id="lg" value="{legend}" '
           'style="rounded=0;whiteSpace=wrap;html=1;align=left;spacingLeft=10;fillColor=#F5F7FA;'
           'strokeColor=#C7D0DB;fontSize=11;fontColor=#0F2B46;verticalAlign=middle;" '
           'vertex="1" parent="1"><mxGeometry x="40" y="1000" width="700" height="70" as="geometry"/></mxCell>')

doc = ('<mxfile host="app.diagrams.net" agent="claude" version="24.0.0">'
       '<diagram id="erd-hoangnha" name="ERD — Hoàng Nha Fashion">'
       '<mxGraphModel dx="1400" dy="900" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" '
       'arrows="1" fold="1" page="1" pageScale="1" pageWidth="2000" pageHeight="2800" math="0" shadow="0">'
       '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' + ''.join(xml) +
       '</root></mxGraphModel></diagram></mxfile>')

OUT.write_text(doc, encoding='utf-8')
print(f'✓ {OUT.name}: {len(LAYOUT)} bảng, {edges} quan hệ')
