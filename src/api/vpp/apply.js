import request from '@/utils/request'

// 查询事件申报列表
export function listApply(query) {
  return request({ url: '/vpp-event/apply/list', method: 'get', params: query })
}
// 查询申报列表（不分页）
export function listApplyAll(query) {
  return request({ url: '/vpp-event/apply/listAll', method: 'get', params: query })
}
// 新增申报
export function addApply(data) {
  return request({ url: '/vpp-event/apply', method: 'post', data: data })
}
// 修改申报
export function updateApply(data) {
  return request({ url: '/vpp-event/apply', method: 'put', data: data })
}
// 确认申报（0待确认 → 1已确认）
export function confirmApply(applyIds) {
  return request({ url: '/vpp-event/apply/confirm/' + applyIds, method: 'put' })
}
// 删除申报
export function delApply(applyIds) {
  return request({ url: '/vpp-event/apply/' + applyIds, method: 'delete' })
}