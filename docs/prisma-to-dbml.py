import re, pathlib
src = pathlib.Path('/sessions/sweet-blissful-johnson/mnt/hoangnha/backend/prisma/schema.prisma').read_text(encoding='utf-8')

TYPE = {'Int':'int','String':'varchar','Boolean':'boolean','DateTime':'datetime','Float':'float','BigInt':'bigint'}
SCALARS = set(TYPE)

models = {}   # name -> dict(fields=[], atid=[], atuniq=[], comment)
order = []
cur = None
pending_comment = None

for raw in src.splitlines():
    line = raw.strip()
    m = re.match(r'^model\s+(\w+)\s*\{$', line)
    if m:
        cur = m.group(1); order.append(cur)
        models[cur] = {'fields': [], 'atid': None, 'atuniq': [], 'note': pending_comment}
        pending_comment = None; continue
    if cur is None:
        c = re.match(r'^//\s*(.+)$', line)
        pending_comment = c.group(1).strip() if c else pending_comment
        if line.startswith('/*') or line == '': pending_comment = None
        continue
    if line == '}': cur = None; continue
    if line.startswith('//') or not line: continue

    m = re.match(r'^@@id\(\[(.+?)\]\)', line)
    if m: models[cur]['atid'] = [s.strip() for s in m.group(1).split(',')]; continue
    m = re.match(r'^@@unique\(\[(.+?)\]\)', line)
    if m: models[cur]['atuniq'].append([s.strip() for s in m.group(1).split(',')]); continue
    if line.startswith('@@'): continue

    m = re.match(r'^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)$', line)
    if not m: continue
    name, typ, arr, opt, rest = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    comment = ''
    if '//' in rest:
        rest, comment = rest.split('//', 1); comment = comment.strip()
    models[cur]['fields'].append({
        'name': name, 'type': typ, 'list': bool(arr), 'opt': bool(opt),
        'attrs': rest.strip(), 'comment': comment,
    })

# ---- refs ----
refs = []
for mname, m in models.items():
    for f in m['fields']:
        r = re.search(r'@relation\(fields:\s*\[(\w+)\],\s*references:\s*\[(\w+)\]', f['attrs'])
        if r:
            fk, pkcol, parent = r.group(1), r.group(2), f['type']
            fkf = next((x for x in m['fields'] if x['name'] == fk), None)
            unique = fkf and ('@unique' in fkf['attrs'])
            refs.append((mname, fk, parent, pkcol, '-' if unique else '>'))

GROUPS = [
 ("nguoi_dung",  "Người dùng", ["User","Address","LoyaltyTransaction"]),
 ("san_pham",    "Sản phẩm & Kho", ["Category","Product","ProductImage","Variant","StockMovement","Tag","ProductTag","Collection","CollectionProduct","Campaign","CampaignProduct","ProductView"]),
 ("mua_sam",     "Mua sắm", ["CartItem","WishlistItem"]),
 ("don_hang",    "Đơn hàng & Thanh toán", ["Order","OrderItem","Payment","SepayWebhookLog","Shipment","OrderStatusHistory","ReturnRequest"]),
 ("khuyen_mai",  "Khuyến mãi", ["Voucher","VoucherRedemption"]),
 ("noi_dung",    "Nội dung", ["Review","ReviewImage","Notification","Banner","Post"]),
 ("he_thong",    "Hệ thống", ["Setting"]),
]

out = []
out.append('// ==========================================================')
out.append('// Hoàng Nha Fashion — ERD (DBML cho dbdiagram.io)')
out.append('// Sinh tự động từ backend/prisma/schema.prisma — 32 bảng')
out.append('// Dán toàn bộ file này vào https://dbdiagram.io/d')
out.append('// ==========================================================')
out.append('')

for mname in order:
    m = models[mname]
    if m['note']:
        out.append(f"// {m['note']}")
    out.append(f'Table {mname} {{')
    for f in m['fields']:
        if f['type'] not in SCALARS or f['list']:
            continue  # bỏ quan hệ ảo, đã thể hiện bằng Ref
        t = TYPE[f['type']]
        if '@db.Text' in f['attrs']: t = 'text'
        settings = []
        if '@id' in f['attrs'] and '@@' not in f['attrs']: settings.append('pk')
        if 'autoincrement()' in f['attrs']: settings.append('increment')
        if '@unique' in f['attrs']: settings.append('unique')
        if f['opt']: settings.append('null')
        else: settings.append('not null')
        if '@default(now())' in f['attrs']:
            settings.append('default: `now()`')
        else:
            d = re.search(r'@default\(([^()]*)\)', f['attrs'])
            if d and 'autoincrement' not in d.group(1):
                settings.append(f'default: {d.group(1)}')
        if f['comment']: settings.append(f"note: '{f['comment'].replace(chr(39), chr(96))}'")
        out.append(f"  {f['name']} {t} [{', '.join(settings)}]")
    idx = []
    if m['atid']:
        idx.append(f"    ({', '.join(m['atid'])}) [pk]")
    for u in m['atuniq']:
        idx.append(f"    ({', '.join(u)}) [unique]" if len(u) > 1 else f"    {u[0]} [unique]")
    if idx:
        out.append('  indexes {')
        out += idx
        out.append('  }')
    out.append('}')
    out.append('')

out.append('// ================== QUAN HỆ ==================')
for child, fk, parent, pk, sym in refs:
    out.append(f'Ref: {child}.{fk} {sym} {parent}.{pk}')
out.append('')
out.append('// ================== NHÓM BẢNG ==================')
for gid, gname, members in GROUPS:
    out.append(f'TableGroup {gid} {{ // {gname}')
    for x in members:
        if x in models: out.append(f'  {x}')
    out.append('}')
out.append('')

pathlib.Path('/tmp/dbml/hoangnha.dbml').write_text('\n'.join(out), encoding='utf-8')
print('tables', len(order), 'refs', len(refs))
missing = [m for m in order if not any(m in g[2] for g in GROUPS)]
print('chua xep nhom:', missing)
