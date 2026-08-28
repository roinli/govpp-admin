<template>
  <div class="app-container online-page nco-settings-container">
    <div class="new-style-menu-title">在线用户</div>
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
        <el-form-item label="登录地址" prop="ipaddr">
          <el-input
            v-model="queryParams.ipaddr"
            placeholder="请输入登录地址"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="用户名称" prop="userName">
          <el-input
            v-model="queryParams.userName"
            placeholder="请输入用户名称"
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

      <div class="online-divider" role="separator" />

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="list.slice((pageNum - 1) * pageSize, pageNum * pageSize)"
            class="ems-list-table"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column label="序号" type="index" align="center" width="60">
              <template slot-scope="scope">
                <span>{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="会话编号" align="center" prop="tokenId" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column label="登录名称" align="center" prop="userName" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="主机" align="center" prop="ipaddr" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="登录地点" align="center" prop="loginLocation" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="浏览器" align="center" prop="browser" min-width="100" />
            <el-table-column label="操作系统" align="center" prop="os" min-width="120" />
            <el-table-column label="登录时间" align="center" prop="loginTime" width="180">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.loginTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="80" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
              <template slot-scope="scope">
                <el-tooltip content="强退" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleForceLogout(scope.row)"
                    v-hasPermi="['monitor:online:forceLogout']"
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
            :page.sync="pageNum"
            :limit.sync="pageSize"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { list, forceLogout } from "@/api/monitor/online"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "Online",
  data() {
    return {
      loading: true,
      total: 0,
      list: [],
      pageNum: 1,
      pageSize: 10,
      tableEmptyIcon,
      queryParams: {
        ipaddr: undefined,
        userName: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      list(this.queryParams).then(response => {
        this.list = response.data || []
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    handleForceLogout(row) {
      this.$modal.confirm('是否确认强退名称为"' + row.userName + '"的用户？').then(function() {
        return forceLogout(row.tokenId)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("强退成功")
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.online-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.online-page .ems-list-search__control {
  width: 11rem;
}

.online-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.online-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
