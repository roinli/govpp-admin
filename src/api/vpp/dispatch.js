import request from '@/utils/request'

// 查询调度分配列表
export function listDispatch(query) {
  return request({ url: '/vpp-dispatch/dispatch/list', method: 'get', params: query })
}
// 查询调度分配列表（不分页）
export function listDispatchAll(query) {
  return request({ url: '/vpp-dispatch/dispatch/listAll', method: 'get', params: query })
}
// 一键分配：按可调容量/申报容量比例分配
export function allocateDispatch(eventId) {
  return request({ url: '/vpp-dispatch/dispatch/allocate/' + eventId, method: 'post' })
}
// 分配结果人工确认（传微调后的完整列表）
export function confirmDispatch(list) {
  return request({ url: '/vpp-dispatch/dispatch/confirm', method: 'put', data: list })
}
// 生成并下发指令
export function sendDispatch(dispatchIds) {
  return request({ url: '/vpp-dispatch/dispatch/send/' + dispatchIds, method: 'put' })
}
// 删除调度分配
export function delDispatch(dispatchIds) {
  return request({ url: '/vpp-dispatch/dispatch/' + dispatchIds, method: 'delete' })
}
// 查询运营商分配列表（平台全部 / 运营商自己收到的）
export function listOperatorDispatch(query) {
  return request({ url: '/vpp-dispatch/dispatch/operatorList', method: 'get', params: query })
}
// 平台一键分配：按运营商申报量占比分配
export function allocateByOperator(eventId) {
  return request({ url: '/vpp-dispatch/dispatch/allocateByOperator/' + eventId, method: 'post' })
}
// 平台确认运营商分配（传微调后的完整列表）
export function confirmOperatorDispatch(list) {
  return request({ url: '/vpp-dispatch/dispatch/confirmOperator', method: 'put', data: list })
}