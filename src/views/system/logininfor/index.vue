<template>
  <div class="app-container logininfor-page nco-settings-container">
    <div class="new-style-menu-title">登录日志</div>
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
        <el-form-item label="登录状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择登录状态"
            clearable
            class="ems-list-search__control"
          >
            <el-option
              v-for="dict in dict.type.sys_common_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="ems-list-search__actions">
          <el-button type="text" class="expand-trigger" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? '收起' : '展开' }}
            <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
          </el-button>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-form
        v-show="showAdvanced"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search ems-list-search--advanced"
        @submit.native.prevent
      >
        <el-form-item label="登录时间">
          <el-date-picker
            v-model="dateRange"
            class="ems-list-search__daterange"
            value-format="yyyy-MM-dd HH:mm:ss"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="['00:00:00', '23:59:59']"
          />
        </el-form-item>
      </el-form>

      <div class="logininfor-divider" role="separator" />

      <div class="logininfor-toolbar">
        <div class="logininfor-toolbar__left" />
        <div class="logininfor-toolbar__right">
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:logininfor:remove']"
          >删除</el-button>
          <el-button
            plain
            @click="handleClean"
            v-hasPermi="['system:logininfor:remove']"
          >清空</el-button>
          <el-button
            plain
            :disabled="single"
            @click="handleUnlock"
            v-hasPermi="['system:logininfor:unlock']"
          >解锁</el-button>
          <el-button
            plain
            @click="handleExport"
            v-hasPermi="['system:logininfor:export']"
          >导出</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            ref="tables"
            v-loading="loading"
            :data="list"
            class="ems-list-table"
            :default-sort="defaultSort"
            @selection-change="handleSelectionChange"
            @sort-change="handleSortChange"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="访问编号" align="center" prop="infoId" min-width="100" />
            <el-table-column
              label="用户名称"
              align="center"
              prop="userName"
              min-width="120"
              :show-overflow-tooltip="true"
              sortable="custom"
              :sort-orders="['descending', 'ascending']"
            />
            <el-table-column label="地址" align="center" prop="ipaddr" width="130" :show-overflow-tooltip="true" />
            <el-table-column label="登录状态" align="center" prop="status" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_common_status" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column label="描述" align="center" prop="msg" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column
              label="访问时间"
              align="center"
              prop="accessTime"
              width="180"
              sortable="custom"
              :sort-orders="['descending', 'ascending']"
            >
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.accessTime) }}</span>
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
  </div>
</template>

<script>
import { list, delLogininfor, cleanLogininfor, unlockLogininfor } from "@/api/system/logininfor"
import { parseTime } from "@/utils/witos"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "Logininfor",
  dicts: ['sys_common_status'],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      selectName: "",
      showAdvanced: false,
      total: 0,
      list: [],
      dateRange: [],
      defaultSort: { prop: 'accessTime', order: 'descending' },
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        ipaddr: undefined,
        userName: undefined,
        status: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      list(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.list = response.data || []
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.list = []
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.resetForm("queryForm")
      this.queryParams.pageNum = 1
      this.$refs.tables.sort(this.defaultSort.prop, this.defaultSort.order)
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.infoId)
      this.single = selection.length != 1
      this.multiple = !selection.length
      this.selectName = selection.map(item => item.userName)
    },
    handleSortChange(column) {
      this.queryParams.orderByColumn = column.prop
      this.queryParams.isAsc = column.order
      this.getList()
    },
    handleDelete(row) {
      const infoIds = row.infoId || this.ids
      this.$modal.confirm('是否确认删除当前访问编号数据项？').then(function() {
        return delLogininfor(infoIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    handleClean() {
      this.$modal.confirm('是否确认清空所有登录日志数据项？').then(function() {
        return cleanLogininfor()
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("清空成功")
      }).catch(() => {})
    },
    handleUnlock() {
      const username = this.selectName
      this.$modal.confirm('是否确认解锁用户"' + username + '"数据项?').then(function() {
        return unlockLogininfor(username)
      }).then(() => {
        this.$modal.msgSuccess("用户" + username + "解锁成功")
      }).catch(() => {})
    },
    handleExport() {
      this.download('system/logininfor/export', {
        ...this.queryParams
      }, `登陆信息_${parseTime(new Date().getTime(), '{y}-{m}-{d}') }.xlsx`)
    }
  }
}
</script>

<style scoped>
.logininfor-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.logininfor-page .ems-list-search--advanced {
  margin-top: 12px;
}

.logininfor-page .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.logininfor-page .ems-list-search__control {
  width: 11rem;
}

.logininfor-page .ems-list-search__daterange {
  width: calc(11rem * 2 + 90px + 16px);
}

.logininfor-page .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.logininfor-page .expand-trigger:hover,
.logininfor-page .expand-trigger:focus {
  color: #0747c7;
}

.logininfor-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.logininfor-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.logininfor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.logininfor-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.logininfor-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.logininfor-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}
</style>
