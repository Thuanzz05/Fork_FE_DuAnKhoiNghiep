import { api, ApiError } from '../services/api'
import type { Order, OrderStatus } from './orders'
import { getStoreSettings } from './storeSettings'

export type PrintDocumentType =
  | 'DON_BAN_HANG'
  | 'PHIEU_DONG_GOI'
  | 'PHIEU_GIAO_HANG'
  | 'NHAN_VAN_CHUYEN'
  | 'PHIEU_XUAT_KHO'
  | 'PHIEU_GIAO_THAT_BAI'
  | 'PHIEU_NHAP_KHO'
  | 'PHIEU_NHAP_HOAN_HANG'

export const printDocumentLabels: Record<PrintDocumentType, string> = {
  DON_BAN_HANG: 'Đơn bán hàng đầy đủ',
  PHIEU_DONG_GOI: 'Phiếu đóng gói',
  PHIEU_GIAO_HANG: 'Phiếu giao hàng',
  NHAN_VAN_CHUYEN: 'Nhãn vận chuyển',
  PHIEU_XUAT_KHO: 'Phiếu xuất kho',
  PHIEU_GIAO_THAT_BAI: 'Phiếu giao hàng thất bại',
  PHIEU_NHAP_KHO: 'Phiếu nhập kho',
  PHIEU_NHAP_HOAN_HANG: 'Phiếu nhập hoàn hàng',
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const money = (value: number) => `${Number(value).toLocaleString('vi-VN')}đ`
const orderStatusLabels: Record<OrderStatus, string> = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_CHUAN_BI: 'Đang chuẩn bị hàng',
  DANG_GIAO: 'Đang giao hàng',
  DA_GIAO: 'Đã giao hàng',
  GIAO_THAT_BAI: 'Giao thất bại',
  GIAO_LAI: 'Đang giao lại',
  DANG_HOAN_HANG: 'Đang hoàn hàng',
  DA_HOAN_HANG: 'Đã hoàn hàng',
  DA_HUY: 'Đã hủy',
}

const packingStatuses = new Set<OrderStatus>(['DA_XAC_NHAN', 'DANG_CHUAN_BI', 'DANG_GIAO', 'DA_GIAO'])
const deliveryStatuses = new Set<OrderStatus>(['DA_XAC_NHAN', 'DANG_CHUAN_BI', 'DANG_GIAO', 'DA_GIAO', 'GIAO_LAI'])
const failedStatuses = new Set<OrderStatus>(['GIAO_THAT_BAI', 'GIAO_LAI', 'DANG_HOAN_HANG', 'DA_HOAN_HANG'])

export function availableOrderPrintDocuments(order: Order): PrintDocumentType[] {
  const result: PrintDocumentType[] = ['DON_BAN_HANG']
  if (packingStatuses.has(order.orderStatus)) result.push('PHIEU_DONG_GOI')
  if (deliveryStatuses.has(order.orderStatus)) result.push('PHIEU_GIAO_HANG')
  if (order.orderStatus !== 'DA_HUY' && order.shippingProvider && order.trackingCode) result.push('NHAN_VAN_CHUYEN')
  if (order.exports?.length) result.push('PHIEU_XUAT_KHO')
  if (failedStatuses.has(order.orderStatus)) result.push('PHIEU_GIAO_THAT_BAI')
  if (order.orderStatus === 'DA_HOAN_HANG') result.push('PHIEU_NHAP_HOAN_HANG')
  return result
}

function paymentNotice(order: Order) {
  if (order.paymentMethod === 'COD' && order.paymentStatus !== 'DA_THANH_TOAN') {
    return `<div class="notice cod">THU TIỀN KHI GIAO HÀNG<br><strong>Số tiền cần thu: ${money(order.totalPayment)}</strong></div>`
  }
  if (order.paymentStatus === 'DA_THANH_TOAN') {
    return '<div class="notice paid">ĐÃ THANH TOÁN – KHÔNG THU TIỀN</div>'
  }
  return '<div class="notice unpaid">CHƯA THANH TOÁN – KHÔNG ĐƯỢC GIAO HÀNG</div>'
}

function productRows(order: Order, withPrice: boolean, withCheck = false) {
  return order.items.map((item, index) => `<tr>
    <td>${index + 1}</td>
    ${withCheck ? '<td class="check">□</td>' : ''}
    <td>${escapeHtml(item.productId)}</td>
    <td>${escapeHtml(item.productName)}${item.weight ? `<br><small>${escapeHtml(item.weight)}</small>` : ''}</td>
    <td class="number">${item.quantity}</td>
    ${withPrice ? `<td class="number">${money(item.price)}</td><td class="number">${money(item.price * item.quantity)}</td>` : ''}
  </tr>`).join('')
}

function documentBody(type: PrintDocumentType, order: Order) {
  const withPrice = ['DON_BAN_HANG', 'PHIEU_GIAO_HANG'].includes(type)
  const title = printDocumentLabels[type].toUpperCase()
  const status = orderStatusLabels[order.orderStatus]
  const cancelled = order.orderStatus === 'DA_HUY' ? '<div class="watermark">ĐÃ HỦY</div>' : ''
  const preview = order.orderStatus === 'CHO_XAC_NHAN' ? '<div class="watermark">CHƯA XÁC NHẬN</div>' : ''

  if (type === 'NHAN_VAN_CHUYEN') {
    const cod = order.paymentMethod === 'COD' && order.paymentStatus !== 'DA_THANH_TOAN' ? order.totalPayment : 0
    return `${cancelled}<h1>${title}</h1>
      <div class="shipping-code">${escapeHtml(order.trackingCode)}</div>
      <div class="grid"><div><b>Đơn vị vận chuyển</b><span>${escapeHtml(order.shippingProvider)}</span></div><div><b>Mã đơn</b><span>${escapeHtml(order.orderCode)}</span></div></div>
      <section class="recipient"><b>NGƯỜI NHẬN</b><h2>${escapeHtml(order.recipientName)}</h2><p>${escapeHtml(order.phone)}</p><p>${escapeHtml(order.shippingAddress)}</p></section>
      <div class="cod-box">COD CẦN THU: <strong>${money(cod)}</strong></div>
      <p class="privacy">Nhãn chỉ chứa thông tin giao nhận; không hiển thị chi tiết sản phẩm hoặc giá trị hàng hóa.</p>`
  }

  const summary = withPrice ? `<div class="summary">
    <p><span>Tiền hàng</span><b>${money(order.totalProductPrice)}</b></p>
    <p><span>Giảm giá</span><b>-${money(order.discountAmount)}</b></p>
    <p><span>Phí vận chuyển</span><b>${money(order.shippingFee)}</b></p>
    <p class="total"><span>Tổng thanh toán</span><b>${money(order.totalPayment)}</b></p>
  </div>${paymentNotice(order)}` : ''

  const special = type === 'PHIEU_GIAO_THAT_BAI'
    ? `<div class="notice unpaid"><b>LÝ DO GIAO THẤT BẠI</b><br>${escapeHtml(order.adminNote || order.cancelReason || 'Chưa ghi nhận')}</div>`
    : type === 'PHIEU_NHAP_HOAN_HANG'
      ? '<div class="notice paid">Chứng từ kiểm nhận hàng hoàn. Chỉ cộng lại tồn kho đối với hàng còn đủ điều kiện bán.</div>'
      : ''

  return `${cancelled}${preview}<h1>${title}</h1>
    <div class="meta"><p><b>Mã đơn:</b> ${escapeHtml(order.orderCode)}</p><p><b>Ngày đặt:</b> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p><p><b>Trạng thái:</b> ${status}</p><p><b>Thanh toán:</b> ${escapeHtml(order.paymentStatus)}</p></div>
    <section><h2>Thông tin giao nhận</h2><p><b>Người nhận:</b> ${escapeHtml(order.recipientName)} · ${escapeHtml(order.phone)}</p><p><b>Địa chỉ:</b> ${escapeHtml(order.shippingAddress)}</p>${order.customerNote ? `<p><b>Ghi chú khách:</b> ${escapeHtml(order.customerNote)}</p>` : ''}</section>
    ${special}
    <table><thead><tr><th>STT</th>${type === 'PHIEU_DONG_GOI' ? '<th>Kiểm</th>' : ''}<th>Mã SP</th><th>Sản phẩm</th><th>SL</th>${withPrice ? '<th>Đơn giá</th><th>Thành tiền</th>' : ''}</tr></thead><tbody>${productRows(order, withPrice, type === 'PHIEU_DONG_GOI')}</tbody></table>
    ${summary}
    <div class="signatures"><div>Người lập phiếu<br><i>(Ký, ghi rõ họ tên)</i></div><div>${type === 'PHIEU_DONG_GOI' ? 'Người đóng gói' : 'Người giao/nhận'}<br><i>(Ký, ghi rõ họ tên)</i></div><div>Người kiểm tra<br><i>(Ký, ghi rõ họ tên)</i></div></div>`
}

export async function printOrderDocument(type: PrintDocumentType, order: Order) {
  const popup = window.open('', '_blank', 'width=900,height=900')
  if (!popup) throw new Error('Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.')
  popup.document.write('<p style="font-family:Arial;padding:24px">Đang chuẩn bị chứng từ...</p>')

  let printInfo: { printNumber: number; reprint: boolean }
  const relatedExport = type === 'PHIEU_XUAT_KHO' ? order.exports?.[0] : undefined
  const printObjectId = relatedExport ? relatedExport.id : order.id
  const printStatus = relatedExport ? relatedExport.status : order.orderStatus
  try {
    printInfo = await api.post<{ printNumber: number; reprint: boolean }>('/admin/document-prints', {
      type,
      objectId: printObjectId,
      documentStatus: printStatus,
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) {
      popup.close()
      throw error
    }
    const reason = window.prompt('Chứng từ đã từng được in. Vui lòng nhập lý do in lại:')
    if (!reason?.trim()) {
      popup.close()
      throw new Error('Đã hủy in lại vì chưa nhập lý do.')
    }
    printInfo = await api.post<{ printNumber: number; reprint: boolean }>('/admin/document-prints', {
      type,
      objectId: printObjectId,
      documentStatus: printStatus,
      reprintReason: reason.trim(),
    })
  }

  const settings = getStoreSettings()
  const reprint = printInfo.reprint ? `<div class="reprint">BẢN IN LẠI – LẦN ${printInfo.printNumber}</div>` : ''
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${printDocumentLabels[type]} ${escapeHtml(order.orderCode)}</title>
    <style>
      @page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#222;font:13px Arial,sans-serif;line-height:1.45}.page{position:relative;max-width:800px;margin:auto}.store{text-align:center;border-bottom:2px solid #222;padding-bottom:12px}.store h3{margin:0;font-size:19px}.store p{margin:3px}.reprint,.watermark{border:2px solid #b32631;color:#b32631;font-weight:800;text-align:center}.reprint{padding:6px;margin:12px 0}.watermark{position:absolute;right:0;top:70px;padding:8px 18px;transform:rotate(-8deg);font-size:20px}h1{text-align:center;font-size:23px;margin:22px 0 14px}h2{font-size:14px;margin:10px 0}.meta,.grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 20px}.meta p{margin:2px}section{margin:14px 0}table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid #777;padding:7px}th{background:#eee}.number{text-align:right}.check{text-align:center;font-size:18px}.summary{width:48%;margin-left:auto}.summary p{display:flex;justify-content:space-between;margin:4px}.summary .total{border-top:1px solid;padding-top:7px;font-size:15px}.notice{margin:14px 0;padding:10px;border:2px solid;text-align:center;font-weight:700}.paid{border-color:#26734d;color:#185b3b}.unpaid,.cod{border-color:#b32631;color:#93212a}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:38px;text-align:center;font-weight:700}.signatures i{font-size:11px;font-weight:400}.shipping-code{text-align:center;font-size:30px;font-weight:900;letter-spacing:3px;border:3px solid;padding:12px;margin:18px 0}.grid>div{display:flex;flex-direction:column;border:1px solid;padding:10px}.recipient{border:2px solid;padding:18px}.recipient h2{font-size:24px}.cod-box{font-size:18px;border:3px solid #222;padding:12px;text-align:center}.privacy{font-size:11px;color:#666}@media print{button{display:none}}
    </style></head><body><div class="page"><header class="store"><h3>${escapeHtml(settings.storeName)}</h3><p>${escapeHtml(settings.address || '')}</p><p>Hotline: ${escapeHtml(settings.hotline || '')}</p></header>${reprint}${documentBody(type, order)}<footer style="margin-top:25px;text-align:right;font-size:10px">In lúc ${new Date().toLocaleString('vi-VN')}</footer></div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
}

export interface PrintableStockVoucher {
  id: string
  code: string
  type: 'in' | 'out'
  status: 'NHAP_TAM' | 'DA_HOAN_THANH' | 'DA_HUY'
  movementType: string
  createdAt: string
  partner: string
  note: string
  createdBy: string
  orderCode?: string
  items: Array<{
    sku: string
    productName: string
    unit: string
    quantity: number
    unitCost: number
    total: number
  }>
}

export async function printStockVoucher(voucher: PrintableStockVoucher) {
  if (!voucher.items.length) throw new Error('Phiếu kho chưa có sản phẩm nên không thể in.')
  const type: PrintDocumentType = voucher.type === 'in' ? 'PHIEU_NHAP_KHO' : 'PHIEU_XUAT_KHO'
  const objectId = Number(voucher.id.replace(/^\D+/, ''))
  if (!Number.isInteger(objectId) || objectId < 1) throw new Error('Mã phiếu kho không hợp lệ.')

  const popup = window.open('', '_blank', 'width=900,height=900')
  if (!popup) throw new Error('Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.')
  popup.document.write('<p style="font-family:Arial;padding:24px">Đang chuẩn bị chứng từ...</p>')

  let printInfo: { printNumber: number; reprint: boolean }
  try {
    printInfo = await api.post<{ printNumber: number; reprint: boolean }>('/admin/document-prints', {
      type, objectId, documentStatus: voucher.status,
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) {
      popup.close()
      throw error
    }
    const reason = window.prompt('Chứng từ đã từng được in. Vui lòng nhập lý do in lại:')
    if (!reason?.trim()) {
      popup.close()
      throw new Error('Đã hủy in lại vì chưa nhập lý do.')
    }
    printInfo = await api.post<{ printNumber: number; reprint: boolean }>('/admin/document-prints', {
      type, objectId, documentStatus: voucher.status, reprintReason: reason.trim(),
    })
  }

  const settings = getStoreSettings()
  const title = printDocumentLabels[type].toUpperCase()
  const statusLabel = voucher.status === 'NHAP_TAM' ? 'Nháp' : voucher.status === 'DA_HUY' ? 'Đã hủy' : 'Đã hoàn thành'
  const watermark = voucher.status === 'NHAP_TAM'
    ? `<div class="watermark">PHIẾU NHÁP – CHƯA ${voucher.type === 'in' ? 'NHẬP' : 'XUẤT'} KHO</div>`
    : voucher.status === 'DA_HUY' ? '<div class="watermark">ĐÃ HỦY</div>' : ''
  const reprint = printInfo.reprint ? `<div class="reprint">BẢN IN LẠI – LẦN ${printInfo.printNumber}</div>` : ''
  const rows = voucher.items.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.sku)}</td><td>${escapeHtml(item.productName)}</td><td>${escapeHtml(item.unit)}</td><td class="number">${item.quantity}</td><td class="number">${money(item.unitCost)}</td><td class="number">${money(item.total)}</td></tr>`).join('')
  const totalQuantity = voucher.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = voucher.items.reduce((sum, item) => sum + item.total, 0)
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${title} ${escapeHtml(voucher.code)}</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#222;font:13px Arial,sans-serif;line-height:1.45}.page{position:relative;max-width:800px;margin:auto}.store{text-align:center;border-bottom:2px solid #222;padding-bottom:12px}.store h3{margin:0;font-size:19px}.store p{margin:3px}.reprint,.watermark{border:2px solid #b32631;color:#b32631;font-weight:800;text-align:center}.reprint{padding:6px;margin:12px 0}.watermark{position:absolute;right:0;top:70px;padding:8px 18px;transform:rotate(-8deg);font-size:18px}h1{text-align:center;font-size:23px;margin:22px 0 14px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:5px 20px}.meta p{margin:2px}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{border:1px solid #777;padding:7px}th{background:#eee}.number{text-align:right}.summary{width:50%;margin-left:auto}.summary p{display:flex;justify-content:space-between;border-top:1px solid #aaa;padding-top:7px}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:42px;text-align:center;font-weight:700}.signatures i{font-size:11px;font-weight:400}
  </style></head><body><div class="page"><header class="store"><h3>${escapeHtml(settings.storeName)}</h3><p>${escapeHtml(settings.address || '')}</p><p>Hotline: ${escapeHtml(settings.hotline || '')}</p></header>${reprint}${watermark}<h1>${title}</h1><div class="meta"><p><b>Mã phiếu:</b> ${escapeHtml(voucher.code)}</p><p><b>Ngày lập:</b> ${new Date(voucher.createdAt).toLocaleString('vi-VN')}</p><p><b>Trạng thái:</b> ${statusLabel}</p><p><b>Người lập:</b> ${escapeHtml(voucher.createdBy || 'Hệ thống')}</p><p><b>${voucher.type === 'in' ? 'Nhà cung cấp' : 'Nơi nhận'}:</b> ${escapeHtml(voucher.partner || 'Không có')}</p>${voucher.orderCode ? `<p><b>Đơn liên quan:</b> ${escapeHtml(voucher.orderCode)}</p>` : ''}<p><b>Nghiệp vụ:</b> ${escapeHtml(voucher.movementType)}</p><p><b>Ghi chú:</b> ${escapeHtml(voucher.note || 'Không có')}</p></div><table><thead><tr><th>STT</th><th>SKU</th><th>Sản phẩm</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><p><span>Tổng số lượng</span><b>${totalQuantity}</b></p><p><span>Tổng giá trị</span><b>${money(totalValue)}</b></p></div><div class="signatures"><div>Người lập phiếu<br><i>(Ký, ghi rõ họ tên)</i></div><div>Thủ kho<br><i>(Ký, ghi rõ họ tên)</i></div><div>${voucher.type === 'in' ? 'Người giao hàng' : 'Người nhận hàng'}<br><i>(Ký, ghi rõ họ tên)</i></div></div><footer style="margin-top:25px;text-align:right;font-size:10px">In lúc ${new Date().toLocaleString('vi-VN')}</footer></div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
}
