<template>
  <!-- 授权用户 -->
  <el-dialog
    title="选择用户"
    :visible.sync="visible"
    width="800px"
    top="5vh"
    append-to-body
    custom-class="select-user-dialog"
  >
    <el-form
      ref="queryForm"
      :model="queryParams"
      size="small"
      :inline="true"
      label-width="90px"
      class="ems-list-search select-user-dialog__search"
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

    <div class="table-shell">
      <div class="table-shell__wrap">
        <el-table
          ref="table"
          :data="userList"
          class="ems-list-table"
          height="260px"
          @row-click="clickRow"
          @selection-change="handleSelectionChange"
        >
          <template slot="empty">
            <div class="ems-list-table__empty">
              <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
              <p class="ems-list-table__empty-text">暂无数据</p>
            </div>
          </template>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="用户名称" prop="userName" align="center" :show-overflow-tooltip="true" />
          <el-table-column label="用户昵称" prop="nickName" align="center" :show-overflow-tooltip="true" />
          <el-table-column label="邮箱" prop="email" align="center" :show-overflow-tooltip="true" />
          <el-table-column label="手机" prop="phonenumber" align="center" :show-overflow-tooltip="true" />
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
    <div slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" @click="handleSelectUser">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { unallocatedUserList, authUserSelectAll } from "@/api/system/role"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  dicts: ['sys_normal_disable'],
  props: {
    roleId: {
      type: [Number, String]
    }
  },
  data() {
    return {
      visible: false,
      userIds: [],
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
  methods: {
    show() {
      this.queryParams.roleId = this.roleId
      this.getList()
      this.visible = true
    },
    clickRow(row) {
      this.$refs.table.toggleRowSelection(row)
    },
    handleSelectionChange(selection) {
      this.userIds = selection.map(item => item.userId)
    },
    getList() {
      unallocatedUserList(this.queryParams).then(res => {
        this.userList = res.data || []
        this.total = res.total || 0
      }).catch(() => {
        this.userList = []
        this.total = 0
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    handleSelectUser() {
      const roleId = this.queryParams.roleId
      const userIds = this.userIds.join(",")
      if (userIds == "") {
        this.$modal.msgError("请选择要分配的用户")
        return
      }
      authUserSelectAll({ roleId: roleId, userIds: userIds }).then(res => {
        this.$modal.msgSuccess(res.msg)
        if (res.code === 200) {
          this.visible = false
          this.$emit("ok")
        }
      })
    }
  }
}
</script>

<style>
.select-user-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.select-user-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.select-user-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}

.select-user-dialog .select-user-dialog__search .el-form-item {
  margin-bottom: 12px;
}

.select-user-dialog .ems-list-search__control {
  width: 11rem;
}

.select-user-dialog .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.select-user-dialog .ems-list-search .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.select-user-dialog .ems-list-search .el-button--primary:hover,
.select-user-dialog .ems-list-search .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}

.select-user-dialog .table-shell {
  margin-top: 4px;
}

.select-user-dialog .table-footer {
  min-height: 48px;
  padding-top: 8px;
}
</style>
