<template>
  <div class="app-container operlog-page nco-settings-container">
    <div class="new-style-menu-title">操作日志</div>
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
        <el-form-item label="系统模块" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入系统模块"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="操作人员" prop="operName">
          <el-input
            v-model="queryParams.operName"
            placeholder="请输入操作人员"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="操作类型" prop="businessType">
          <el-select
            v-model="queryParams.businessType"
            placeholder="请选择操作类型"
            clearable
            class="ems-list-search__control"
          >
            <el-option
              v-for="dict in dict.type.sys_oper_type"
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
        <el-form-item label="操作状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择操作状态"
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
        <el-form-item label="操作时间">
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

      <div class="operlog-divider" role="separator" />

      <div class="operlog-toolbar">
        <div class="operlog-toolbar__left" />
        <div class="operlog-toolbar__right">
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:operlog:remove']"
          >删除</el-button>
          <el-button
            plain
            @click="handleClean"
            v-hasPermi="['system:operlog:remove']"
          >清空</el-button>
          <el-button
            plain
            @click="handleExport"
            v-hasPermi="['system:operlog:export']"
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
            <el-table-column label="日志编号" align="center" prop="operId" min-width="100" />
            <el-table-column label="系统模块" align="center" prop="title" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="操作类型" align="center" prop="businessType" width="110">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_oper_type" :value="scope.row.businessType" />
              </template>
            </el-table-column>
            <el-table-column label="请求方式" align="center" prop="requestMethod" width="100" />
            <el-table-column
              label="操作人员"
              align="center"
              prop="operName"
              width="110"
              :show-overflow-tooltip="true"
              sortable="custom"
              :sort-orders="['descending', 'ascending']"
            />
            <el-table-column label="主机" align="center" prop="operIp" width="130" :show-overflow-tooltip="true" />
            <el-table-column label="操作状态" align="center" prop="status" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_common_status" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column
              label="操作日期"
              align="center"
              prop="operTime"
              width="180"
              sortable="custom"
              :sort-orders="['descending', 'ascending']"
            >
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.operTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="消耗时间"
              align="center"
              prop="costTime"
              width="110"
              :show-overflow-tooltip="true"
              sortable="custom"
              :sort-orders="['descending', 'ascending']"
            >
              <template slot-scope="scope">
                <span>{{ scope.row.costTime }}毫秒</span>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="80"
              fixed="right"
              class-name="small-padding fixed-width ems-list-table__ops"
            >
              <template slot-scope="scope">
                <el-tooltip content="详细" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-view"
                    class="ems-list-table__ops-btn"
                    @click="handleView(scope.row, scope.index)"
                    v-hasPermi="['system:operlog:query']"
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

    <!-- 操作日志详细 -->
    <el-dialog
      title="操作日志详细"
      :visible.sync="open"
      width="700px"
      append-to-body
      custom-class="operlog-form-dialog"
    >
      <el-form ref="form" :model="form" label-width="100px" size="mini">
        <el-row>
          <el-col :span="12">
            <el-form-item label="操作模块：">{{ form.title }} / {{ typeFormat(form) }}</el-form-item>
            <el-form-item label="登录信息：">{{ form.operName }} / {{ form.operIp }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求地址：">{{ form.operUrl }}</el-form-item>
            <el-form-item label="请求方式：">{{ form.requestMethod }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="操作方法：">{{ form.method }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="请求参数：">{{ form.operParam }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="返回参数：">{{ form.jsonResult }}</el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="操作状态：">
              <div v-if="form.status === 0">正常</div>
              <div v-else-if="form.status === 1">失败</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="消耗时间：">{{ form.costTime }}毫秒</el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="操作时间：">{{ parseTime(form.operTime) }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item v-if="form.status === 1" label="异常信息：">{{ form.errorMsg }}</el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { list, delOperlog, cleanOperlog } from "@/api/system/operlog"
import { parseTime } from "@/utils/witos"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "Operlog",
  dicts: ['sys_oper_type', 'sys_common_status'],
  data() {
    return {
      loading: true,
      ids: [],
      multiple: true,
      showAdvanced: false,
      total: 0,
      list: [],
      open: false,
      dateRange: [],
      defaultSort: { prop: 'operTime', order: 'descending' },
      form: {},
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: undefined,
        operName: undefined,
        businessType: undefined,
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
    typeFormat(row) {
      return this.selectDictLabel(this.dict.type.sys_oper_type, row.businessType)
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
      this.ids = selection.map(item => item.operId)
      this.multiple = !selection.length
    },
    handleSortChange(column) {
      this.queryParams.orderByColumn = column.prop
      this.queryParams.isAsc = column.order
      this.getList()
    },
    handleView(row) {
      this.open = true
      this.form = row
    },
    handleDelete(row) {
      const operIds = row.operId || this.ids
      this.$modal.confirm('是否确认删除当前日志数据项？').then(function() {
        return delOperlog(operIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    handleClean() {
      this.$modal.confirm('是否确认清空所有操作日志数据项？').then(function() {
        return cleanOperlog()
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("清空成功")
      }).catch(() => {})
    },
    handleExport() {
      this.download('system/operlog/export', {
        ...this.queryParams
      }, `操作日志_${parseTime(new Date().getTime(), '{y}-{m}-{d}') }.xlsx`)
    }
  }
}
</script>

<style scoped>
.operlog-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.operlog-page .ems-list-search--advanced {
  margin-top: 12px;
}

.operlog-page .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.operlog-page .ems-list-search__control {
  width: 11rem;
}

.operlog-page .ems-list-search__daterange {
  width: calc(11rem * 2 + 90px + 16px);
}

.operlog-page .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.operlog-page .expand-trigger:hover,
.operlog-page .expand-trigger:focus {
  color: #0747c7;
}

.operlog-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.operlog-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.operlog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.operlog-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.operlog-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.operlog-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}
</style>

<style>
.operlog-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.operlog-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.operlog-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
