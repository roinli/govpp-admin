import request from '@/utils/request'

// 查询结算分账列表
export function listSettlement(query) {
  return request({ url: '/vpp-dispatch/settlement/list', method: 'get', params: query })
}
// 查询结算列表（不分页）
export function listSettlementAll(query) {
  return request({ url: '/vpp-dispatch/settlement/listAll', method: 'get', params: query })
}
// 生成结算单
export function generateSettlement(eventId, unitPrice) {
  return request({ url: '/vpp-dispatch/settlement/generate/' + eventId, method: 'post', params: { unitPrice: unitPrice } })
}
// 确认结算（0生成 -> 1已确认）
export function confirmSettlement(settlementIds) {
  return request({ url: '/vpp-dispatch/settlement/confirm/' + settlementIds, method: 'put' })
}
// 确认打款（1已确认 -> 2已打款）
export function paySettlement(settlementIds) {
  return request({ url: '/vpp-dispatch/settlement/pay/' + settlementIds, method: 'put' })
}
// 导出结算单
export function exportSettlement(query) {
  return request({ url: '/vpp-dispatch/settlement/export', method: 'post', params: query, responseType: 'blob' })
}
// 删除结算
export function delSettlement(settlementIds) {
  return request({ url: '/vpp-dispatch/settlement/' + settlementIds, method: 'delete' })
}