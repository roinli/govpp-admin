<template>
  <div class="app-container auth-user-page nco-settings-container">
    <div class="new-style-menu-title">分配用户</div>
    <div class="nco-settings-container-content">
      <el-form
        ref="queryForm"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search"
        @submit.native.prevent
      >
        <el-form-item label="用户名称" prop="userName">
          <el-input
            v-model="queryParams.userName"
            placeholder="请输入用户名称"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号码" prop="phonenumber">
          <el-input
            v-model="queryParams.phonenumber"
            placeholder="请输入手机号码"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item class="ems-list-search__actions">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="auth-user-divider" role="separator" />

      <div class="auth-user-toolbar">
        <div class="auth-user-toolbar__left" />
        <div class="auth-user-toolbar__right">
          <el-button
            plain
            :disabled="multiple"
            @click="cancelAuthUserAll"
            v-hasPermi="['system:role:remove']"
          >批量取消授权</el-button>
          <el-button plain @click="handleClose">关闭</el-button>
          <el-button
            type="primary"
            @click="openSelectUser"
            v-hasPermi="['system:role:add']"
          >添加用户</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="userList"
            class="ems-list-table"
            @selection-change="handleSelectionChange"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="用户名称" prop="userName" align="center" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="用户昵称" prop="nickName" align="center" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="邮箱" prop="email" align="center" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column label="手机" prop="phonenumber" align="center" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="状态" align="center" prop="status" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="180">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="90"
              fixed="right"
              class-name="small-padding fixed-width ems-list-table__ops"
            >
              <template slot-scope="scope">
                <el-tooltip content="取消授权" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-circle-close"
                    class="ems-list-table__ops-btn"
                    @click="cancelAuthUser(scope.row)"
                    v-hasPermi="['system:role:remove']"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="table-footer">
          <pagination
            v-show="total > 0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
    </div>

    <select-user ref="select" :roleId="queryParams.roleId" @ok="handleQuery" />
  </div>
</template>

<script>
import { allocatedUserList, authUserCancel, authUserCancelAll } from "@/api/system/role"
import selectUser from "./selectUser"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "AuthUser",
  dicts: ['sys_normal_disable'],
  components: { selectUser },
  data() {
    return {
      loading: true,
      userIds: [],
      multiple: true,
      total: 0,
      userList: [],
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        roleId: undefined,
        userName: undefined,
        phonenumber: undefined
      }
    }
  },
  created() {
    const roleId = this.$route.params && this.$route.params.roleId
    if (roleId) {
      this.queryParams.roleId = roleId
      this.getList()
    } else {
      this.loading = false
      this.userList = []
    }
  },
  methods: {
    getList() {
      this.loading = true
      allocatedUserList(this.queryParams).then(response => {
        this.userList = response.data || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.userList = []
        this.total = 0
        this.loading = false
      })
    },
    handleClose() {
      const obj = { path: "/system/role" }
      this.$tab.closeOpenPage(obj)
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.userIds = selection.map(item => item.userId)
      this.multiple = !selection.length
    },
    openSelectUser() {
      this.$refs.select.show()
    },
    cancelAuthUser(row) {
      const roleId = this.queryParams.roleId
      this.$modal.confirm('确认要取消该用户"' + row.userName + '"角色吗？').then(function() {
        return authUserCancel({ userId: row.userId, roleId: roleId })
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("取消授权成功")
      }).catch(() => {})
    },
    cancelAuthUserAll() {
      const roleId = this.queryParams.roleId
      const userIds = this.userIds.join(",")
      this.$modal.confirm('是否取消选中用户授权数据项？').then(function() {
        return authUserCancelAll({ roleId: roleId, userIds: userIds })
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("取消授权成功")
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.auth-user-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.auth-user-page .ems-list-search__control {
  width: 11rem;
}

.auth-user-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.auth-user-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.auth-user-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.auth-user-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.auth-user-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.auth-user-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.auth-user-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.auth-user-toolbar__right .el-button--primary:hover,
.auth-user-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}

/* 固定列时空状态居中可见 */
.auth-user-page ::v-deep .ems-list-table .el-table__empty-block {
  position: sticky;
  left: 0;
  z-index: 1;
  width: 100% !important;
  min-height: 160px;
}

.auth-user-page ::v-deep .ems-list-table__empty-icon {
  width: 96px;
  height: auto;
}
</style>
