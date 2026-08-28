<template>
  <div class="app-container job-group-page nco-settings-container">
    <div class="new-style-menu-title">执行器管理</div>
    <div class="nco-settings-container-content">
      <el-form
        ref="queryForm"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="120px"
        class="ems-list-search"
        @submit.native.prevent
      >
        <el-form-item label="执行器AppName" prop="appname">
          <el-input
            v-model="queryParams.appname"
            placeholder="请输入执行器AppName"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="执行器名称" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入执行器名称"
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

      <div class="job-group-divider" role="separator" />

      <div class="job-group-toolbar">
        <div class="job-group-toolbar__left" />
        <div class="job-group-toolbar__right">
          <el-button
            plain
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['job:group:edit']"
          >修改</el-button>
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['job:group:remove']"
          >删除</el-button>
          <el-button
            type="primary"
            @click="handleAdd"
            v-hasPermi="['job:group:add']"
          >新增</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="groupList"
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
            <el-table-column label="执行器AppName" align="center" prop="appname" min-width="140" :show-overflow-tooltip="true" />
            <el-table-column label="执行器名称" align="center" prop="title" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="执行器地址类型" align="center" prop="addressType" width="130">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_job_address_type" :value="scope.row.addressType" />
              </template>
            </el-table-column>
            <el-table-column label="执行器地址列表" align="center" prop="addressList" min-width="180" :show-overflow-tooltip="true" />
            <el-table-column label="操作" align="center" width="100" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
              <template slot-scope="scope">
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['job:group:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['job:group:remove']"
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
      :title="title"
      :visible.sync="open"
      width="500px"
      append-to-body
      custom-class="job-group-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="执行器AppName" prop="appname">
          <el-input v-model="form.appname" placeholder="请输入执行器AppName" />
        </el-form-item>
        <el-form-item label="执行器名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入执行器名称" />
        </el-form-item>
        <el-form-item label="执行器地址类型" prop="addressType">
          <el-radio v-model="form.addressType" :label="0">自动注册</el-radio>
          <el-radio v-model="form.addressType" :label="1">手动录入</el-radio>
        </el-form-item>
        <el-form-item label="执行器地址列表" prop="addressList">
          <el-input v-model="form.addressList" type="textarea" placeholder="执行器地址列表，多地址逗号分隔" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listGroup, getGroup, delGroup, addGroup, updateGroup } from "@/api/job/group"
import { parseTime } from "@/utils/witos"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "Group",
  dicts: [
    'sys_job_address_type'
  ],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      groupList: [],
      title: "",
      open: false,
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        appName: null,
        title: null,
        addressType: null,
        addressList: null,
        tenantId: null
      },
      form: {},
      rules: {
        appname: [
          { required: true, message: "执行器AppName不能为空", trigger: "blur" }
        ],
        title: [
          { required: true, message: "执行器名称不能为空", trigger: "blur" }
        ],
        addressType: [
          { required: true, message: "请选择执行器地址类型", trigger: "change" }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listGroup(this.queryParams).then(response => {
        this.groupList = response.data || []
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {
        id: null,
        appName: null,
        title: null,
        addressType: null,
        addressList: null,
        updateTime: null,
        tenantId: null
      }
      this.resetForm("form")
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
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加执行器信息"
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getGroup(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改执行器信息"
      })
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateGroup(this.form).then(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addGroup(this.form).then(() => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除当前定时任务分组数据项？').then(function() {
        return delGroup(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    handleExport() {
      this.download('job/group/export', {
        ...this.queryParams
      }, `定时任务分组_${parseTime(new Date().getTime(), '{y}-{m}-{d}') }.xlsx`)
    }
  }
}
</script>

<style scoped>
.job-group-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.job-group-page .ems-list-search__control {
  width: 11rem;
}

.job-group-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.job-group-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.job-group-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.job-group-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.job-group-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.job-group-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.job-group-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.job-group-toolbar__right .el-button--primary:hover,
.job-group-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}
</style>

<style>
.job-group-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.job-group-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.job-group-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
