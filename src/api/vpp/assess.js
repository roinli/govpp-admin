import request from '@/utils/request'

// 查询效果评估列表
export function listAssess(query) {
  return request({ url: '/vpp-dispatch/assess/list', method: 'get', params: query })
}
// 查询评估列表（不分页）
export function listAssessAll(query) {
  return request({ url: '/vpp-dispatch/assess/listAll', method: 'get', params: query })
}
// 删除评估
export function delAssess(assessIds) {
  return request({ url: '/vpp-dispatch/assess/' + assessIds, method: 'delete' })
}
