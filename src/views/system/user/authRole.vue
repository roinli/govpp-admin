<template>
  <div class="app-container auth-role-page nco-settings-container">
    <div class="new-style-menu-title">分配角色</div>
    <div class="nco-settings-container-content">
      <h4 class="form-header h4">基本信息</h4>
      <el-form ref="form" :model="form" label-width="80px">
        <el-row>
          <el-col :span="8" :offset="2">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8" :offset="2">
            <el-form-item label="登录账号" prop="userName">
              <el-input v-model="form.userName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <h4 class="form-header h4">角色信息</h4>
      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            ref="table"
            :row-key="getRowKey"
            :data="roles.slice((pageNum - 1) * pageSize, pageNum * pageSize)"
            class="ems-list-table"
            @row-click="clickRow"
            @selection-change="handleSelectionChange"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column label="序号" type="index" align="center" width="80">
              <template slot-scope="scope">
                <span>{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column type="selection" :reserve-selection="true" width="50" />
            <el-table-column label="角色编号" align="center" prop="roleId" />
            <el-table-column label="角色名称" align="center" prop="roleName" />
            <el-table-column label="权限字符" align="center" prop="roleKey" />
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
            :page.sync="pageNum"
            :limit.sync="pageSize"
          />
        </div>
      </div>

      <el-form label-width="100px">
        <el-form-item style="text-align: center;margin-left:-120px;margin-top:30px;">
          <el-button type="primary" @click="submitForm()">提交</el-button>
          <el-button @click="close()">返回</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { getAuthRole, updateAuthRole } from "@/api/system/user"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "AuthRole",
  data() {
    return {
      loading: true,
      total: 0,
      pageNum: 1,
      pageSize: 10,
      roleIds: [],
      roles: [],
      form: {},
      tableEmptyIcon
    }
  },
  created() {
    const userId = this.$route.params && this.$route.params.userId
    if (userId) {
      this.loading = true
      getAuthRole(userId).then((response) => {
        this.form = response.user
        this.roles = response.roles || []
        this.total = this.roles.length
        this.$nextTick(() => {
          this.roles.forEach((row) => {
            if (row.flag) {
              this.$refs.table.toggleRowSelection(row)
            }
          })
        })
        this.loading = false
      }).catch(() => {
        this.roles = []
        this.loading = false
      })
    }
  },
  methods: {
    clickRow(row) {
      this.$refs.table.toggleRowSelection(row)
    },
    handleSelectionChange(selection) {
      this.roleIds = selection.map((item) => item.roleId)
    },
    getRowKey(row) {
      return row.roleId
    },
    submitForm() {
      const userId = this.form.userId
      const roleIds = this.roleIds.join(",")
      updateAuthRole({ userId: userId, roleIds: roleIds }).then(() => {
        this.$modal.msgSuccess("授权成功")
        this.close()
      })
    },
    close() {
      const obj = { path: "/system/user" }
      this.$tab.closeOpenPage(obj)
    }
  }
}
</script>
