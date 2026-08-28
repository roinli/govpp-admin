<template>
  <div class="app-container gen-page nco-settings-container">
    <div class="new-style-menu-title">代码生成</div>
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
        <el-form-item label="表名称" prop="tableName">
          <el-input
            v-model="queryParams.tableName"
            placeholder="请输入表名称"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="表描述" prop="tableComment">
          <el-input
            v-model="queryParams.tableComment"
            placeholder="请输入表描述"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
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
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            class="ems-list-search__daterange"
            value-format="yyyy-MM-dd"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
      </el-form>

      <div class="gen-divider" role="separator" />

      <div class="gen-toolbar">
        <div class="gen-toolbar__left" />
        <div class="gen-toolbar__right">
          <el-button
            plain
            :disabled="single"
            @click="handleEditTable"
            v-hasPermi="['tool:gen:edit']"
          >修改</el-button>
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['tool:gen:remove']"
          >删除</el-button>
          <el-button
            plain
            @click="openImportTable"
            v-hasPermi="['tool:gen:import']"
          >导入</el-button>
          <el-button
            type="primary"
            @click="handleGenTable"
            v-hasPermi="['tool:gen:code']"
          >生成</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="tableList"
            class="ems-list-table"
            @selection-change="handleSelectionChange"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column type="selection" align="center" width="50" />
            <el-table-column label="序号" type="index" width="60" align="center">
              <template slot-scope="scope">
                <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="表名称"
              align="center"
              prop="tableName"
              :show-overflow-tooltip="true"
              min-width="140"
            />
            <el-table-column
              label="表描述"
              align="center"
              prop="tableComment"
              :show-overflow-tooltip="true"
              min-width="140"
            />
            <el-table-column
              label="实体"
              align="center"
              prop="className"
              :show-overflow-tooltip="true"
              min-width="120"
            />
            <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
            <el-table-column label="更新时间" align="center" prop="updateTime" width="160" />
            <el-table-column
              label="操作"
              align="center"
              width="180"
              fixed="right"
              class-name="small-padding fixed-width ems-list-table__ops"
            >
              <template slot-scope="scope">
                <el-tooltip content="预览" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-view"
                    class="ems-list-table__ops-btn"
                    @click="handlePreview(scope.row)"
                    v-hasPermi="['tool:gen:preview']"
                  />
                </el-tooltip>
                <el-tooltip content="编辑" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleEditTable(scope.row)"
                    v-hasPermi="['tool:gen:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['tool:gen:remove']"
                  />
                </el-tooltip>
                <el-tooltip content="同步" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-refresh"
                    class="ems-list-table__ops-btn"
                    @click="handleSynchDb(scope.row)"
                    v-hasPermi="['tool:gen:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="生成代码" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-download"
                    class="ems-list-table__ops-btn"
                    @click="handleGenTable(scope.row)"
                    v-hasPermi="['tool:gen:code']"
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

    <el-dialog
      :title="preview.title"
      :visible.sync="preview.open"
      width="80%"
      top="5vh"
      append-to-body
      custom-class="gen-preview-dialog scrollbar"
    >
      <el-tabs v-model="preview.activeName">
        <el-tab-pane
          v-for="(value, key) in preview.data"
          :label="key.substring(key.lastIndexOf('/')+1,key.indexOf('.vm'))"
          :name="key.substring(key.lastIndexOf('/')+1,key.indexOf('.vm'))"
          :key="key"
        >
          <el-link :underline="false" icon="el-icon-document-copy" v-clipboard:copy="value" v-clipboard:success="clipboardSuccess" style="float:right">复制</el-link>
          <pre><code class="hljs" v-html="highlightedCode(value, key)"></code></pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    <import-table ref="import" @ok="handleQuery" />
  </div>
</template>

<script>
import { listTable, previewTable, delTable, genCode, synchDb } from "@/api/tool/gen"
import importTable from "./importTable"
import tableEmptyIcon from "@/assets/images/empty.svg"
import hljs from "highlight.js/lib/highlight"
import "highlight.js/styles/github-gist.css"
hljs.registerLanguage("java", require("highlight.js/lib/languages/java"))
hljs.registerLanguage("xml", require("highlight.js/lib/languages/xml"))
hljs.registerLanguage("html", require("highlight.js/lib/languages/xml"))
hljs.registerLanguage("vue", require("highlight.js/lib/languages/xml"))
hljs.registerLanguage("javascript", require("highlight.js/lib/languages/javascript"))
hljs.registerLanguage("sql", require("highlight.js/lib/languages/sql"))

export default {
  name: "Gen",
  components: { importTable },
  data() {
    return {
      loading: true,
      uniqueId: "",
      ids: [],
      tableNames: [],
      single: true,
      multiple: true,
      showAdvanced: false,
      total: 0,
      tableList: [],
      dateRange: "",
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        tableName: undefined,
        tableComment: undefined
      },
      preview: {
        open: false,
        title: "代码预览",
        data: {},
        activeName: "domain.java"
      }
    }
  },
  created() {
    this.getList()
  },
  activated() {
    const time = this.$route.query.t
    if (time != null && time != this.uniqueId) {
      this.uniqueId = time
      this.queryParams.pageNum = Number(this.$route.query.pageNum)
      this.getList()
    }
  },
  methods: {
    getList() {
      this.loading = true
      listTable(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.tableList = response.data || []
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    handleGenTable(row) {
      const tableNames = row.tableName || this.tableNames
      if (tableNames == "") {
        this.$modal.msgError("请选择要生成的数据")
        return
      }
      if (row.genType === "1") {
        genCode(row.tableName).then(() => {
          this.$modal.msgSuccess("成功生成到自定义路径：" + row.genPath)
        })
      } else {
        this.$download.zip("/code/gen/batchGenCode?tables=" + tableNames, "witos.zip")
      }
    },
    handleSynchDb(row) {
      const tableName = row.tableName
      this.$modal.confirm('确认要强制同步"' + tableName + '"表结构吗？').then(function() {
        return synchDb(tableName)
      }).then(() => {
        this.$modal.msgSuccess("同步成功")
      }).catch(() => {})
    },
    openImportTable() {
      this.$refs.import.show()
    },
    resetQuery() {
      this.dateRange = []
      this.resetForm("queryForm")
      this.handleQuery()
    },
    handlePreview(row) {
      previewTable(row.tableId).then(response => {
        this.preview.data = response.data
        this.preview.open = true
        this.preview.activeName = "domain.java"
      })
    },
    highlightedCode(code, key) {
      const vmName = key.substring(key.lastIndexOf("/") + 1, key.indexOf(".vm"))
      var language = vmName.substring(vmName.indexOf(".") + 1, vmName.length)
      const result = hljs.highlight(language, code || "", true)
      return result.value || '&nbsp;'
    },
    clipboardSuccess() {
      this.$modal.msgSuccess("复制成功")
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.tableId)
      this.tableNames = selection.map(item => item.tableName)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    handleEditTable(row) {
      const tableId = row.tableId || this.ids[0]
      const tableName = row.tableName || this.tableNames[0]
      const params = { pageNum: this.queryParams.pageNum }
      this.$tab.openPage("修改[" + tableName + "]生成配置", '/tool/gen-edit/index/' + tableId, params)
    },
    handleDelete(row) {
      const tableIds = row.tableId || this.ids
      this.$modal.confirm('是否确认删除表数据项？').then(function() {
        return delTable(tableIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.gen-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.gen-page .ems-list-search--advanced {
  margin-top: 12px;
}

.gen-page .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.gen-page .ems-list-search__control {
  width: 11rem;
}

.gen-page .ems-list-search__daterange {
  width: calc(11rem * 2 + 90px + 16px);
}

.gen-page .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.gen-page .expand-trigger:hover,
.gen-page .expand-trigger:focus {
  color: #0747c7;
}

.gen-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.gen-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.gen-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.gen-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.gen-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.gen-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.gen-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.gen-toolbar__right .el-button--primary:hover,
.gen-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}
</style>

<style>
.gen-preview-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.gen-preview-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}
</style>
