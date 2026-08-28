import request from '@/utils/request'

// 查询平台用户列表
export function listPlatform(query) {
  return request({
    url: '/system/platform/list',
    method: 'get',
    params: query
  })
}

// 查询平台用户详细
export function getPlatform(id) {
  return request({
    url: '/system/platform/' + id,
    method: 'get'
  })
}

// 新增平台用户
export function addPlatform(data) {
  return request({
    url: '/system/platform',
    method: 'post',
    data: data
  })
}

// 修改平台用户
export function updatePlatform(data) {
  return request({
    url: '/system/platform',
    method: 'put',
    data: data
  })
}

// 删除平台用户
export function delPlatform(ids) {
  return request({
    url: '/system/platform/' + ids,
    method: 'delete'
  })
}

// 重置平台用户密码
export function resetPlatformPwd(data) {
  return request({
    url: '/system/platform/resetPwd',
    method: 'put',
    data: data
  })
}
