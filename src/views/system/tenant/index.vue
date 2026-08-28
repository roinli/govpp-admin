<template>
  <div class="app-container tenant-page nco-settings-container">
    <div class="new-style-menu-title">运营商管理</div>
    <div class="nco-settings-container-content">
      <div class="tenant-tip" role="alert">
        <i class="el-icon-info tenant-tip__icon" aria-hidden="true" />
        <div class="tenant-tip__message">
          特别提醒：运营商管理员初始密码为 admin123，采用邮件通知方式发放，请填写正确的邮箱！
        </div>
      </div>

      <el-form
        ref="queryForm"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search"
        @submit.native.prevent
      >
        <el-form-item label="运营商名称" prop="tenantName">
          <el-input
            v-model="queryParams.tenantName"
            placeholder="请输入运营商名称"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="管理员账号" prop="userName">
          <el-input
            v-model="queryParams.userName"
            placeholder="请输入管理员账号"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号码" prop="userPhone">
          <el-input
            v-model="queryParams.userPhone"
            placeholder="请输入手机号码"
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
        <el-form-item label="运营商状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择运营商状态" clearable class="ems-list-search__control">
            <el-option
              v-for="dict in dict.type.sys_tenant_status"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value, 10)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="daterangeTenantTime"
            class="ems-list-search__daterange"
            value-format="yyyy-MM-dd"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
      </el-form>

      <div class="tenant-divider" role="separator" />

      <div class="tenant-toolbar">
        <div class="tenant-toolbar__left" />
        <div class="tenant-toolbar__right">
          <el-button
            plain
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['system:tenant:edit']"
          >修改</el-button>
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:tenant:remove']"
          >删除</el-button>
          <el-button
            plain
            @click="handleExport"
            v-hasPermi="['system:tenant:export']"
          >导出</el-button>
          <el-button
            type="primary"
            @click="handleAdd"
            v-hasPermi="['system:tenant:add']"
          >新增</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="tenantList"
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
            <el-table-column label="运营商名称" align="center" prop="tenantName" min-width="140" :show-overflow-tooltip="true" />
            <el-table-column label="管理员账号" align="center" prop="userName" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="手机号码" align="center" prop="userPhone" min-width="120" />
            <el-table-column label="邮箱地址" align="center" prop="userEmail" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column label="运营商套餐" align="center" prop="tenantPackage" width="180">
              <template slot-scope="scope">
                <el-tag>{{ getPackageName(scope.row.tenantPackage) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="过期时间" align="center" prop="tenantTime" width="120">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.tenantTime, '{y}-{m}-{d}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="运营商状态" align="center" prop="status" width="110">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_tenant_status" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
              <template slot-scope="scope">
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['system:tenant:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="分成设置" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-setting"
                    class="ems-list-table__ops-btn"
                    @click="openRate(scope.row)"
                    v-hasPermi="['system:tenant:rate']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['system:tenant:remove']"
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

    <!-- 添加或修改运营商管理对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      width="550px"
      append-to-body
      custom-class="tenant-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="运营商名称" prop="tenantName">
          <el-input v-model="form.tenantName" placeholder="请输入运营商名称" :disabled="updateOrAdd" />
        </el-form-item>
        <el-form-item label="管理员账号" prop="userName">
          <el-input v-model="form.userName" placeholder="请输入管理员账号" :disabled="updateOrAdd" />
        </el-form-item>
        <el-form-item label="手机号码" prop="userPhone">
          <el-input v-model="form.userPhone" placeholder="请输入手机号码" />
        </el-form-item>
        <el-form-item label="邮箱地址" prop="userEmail">
          <el-input v-model="form.userEmail" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="运营商套餐" prop="tenantPackage">
          <el-select v-model="form.tenantPackage" placeholder="请选择运营商套餐" clearable size="small" style="width: 100%">
            <el-option v-for="item in packageList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间" prop="tenantTime">
          <el-date-picker
            v-model="form.tenantTime"
            clearable
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择过期时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="运营商状态">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in dict.type.sys_tenant_status"
              :key="dict.value"
              :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 分成设置弹窗 -->
    <el-dialog
      :title="'分成设置：' + rateForm.tenantName"
      :visible.sync="rateOpen"
      width="400px"
      append-to-body
      custom-class="tenant-rate-dialog"
    >
      <el-form label-width="120px">
        <el-form-item label="平台占比(%)">
          <el-input-number v-model="rateForm.platformPercent" :min="0" :max="100" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="运营商占比(%)">
          <el-input :value="100 - Number(rateForm.platformPercent)" disabled />
        </el-form-item>
      </el-form>
      <div class="tenant-rate-hint">平台与运营商的分成比例，总和为 100%</div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rateOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitRate">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listTenant, getTenant, delTenant, addTenant, updateTenant } from "@/api/system/tenant"
import { getTenantPackageList } from "@/api/system/tenantpackage"
import { parseTime } from "@/utils/witos"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "Tenant",
  dicts: ['sys_tenant_status'],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showAdvanced: false,
      total: 0,
      tenantList: [],
      title: "",
      open: false,
      rateOpen: false,
      rateForm: {},
      packageList: [],
      daterangeTenantTime: [],
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        tenantName: null,
        userName: null,
        userPhone: null,
        tenantTime: null,
        status: null
      },
      form: {},
      updateOrAdd: false,
      rules: {
        tenantName: [
          { required: true, message: "运营商名称不能为空", trigger: "blur" }
        ],
        userName: [
          { required: true, message: "管理员账号不能为空", trigger: "blur" }
        ],
        userPhone: [
          { required: true, message: "手机号码不能为空", trigger: "blur" },
          {
            pattern: /^((0\d{2,3}-\d{7,8})|(1[34578]\d{9}))$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ],
        userEmail: [
          { required: true, message: "邮箱地址不能为空", trigger: "blur" },
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"]
          }
        ],
        tenantPackage: [
          { required: true, message: "运营商套餐不能为空", trigger: "blur" }
        ],
        tenantTime: [
          { required: true, message: "过期时间不能为空", trigger: "blur" }
        ],
        status: [
          { required: true, message: "运营商状态不能为空", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getList()
    getTenantPackageList().then(response => {
      this.packageList = response.data
    })
  },
  methods: {
    getList() {
      this.loading = true
      this.queryParams.params = {}
      if (null != this.daterangeTenantTime && '' != this.daterangeTenantTime) {
        this.queryParams.params["beginTenantTime"] = this.daterangeTenantTime[0]
        this.queryParams.params["endTenantTime"] = this.daterangeTenantTime[1]
      }
      listTenant(this.queryParams).then(response => {
        this.tenantList = response.data || []
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
    openRate(row) {
      this.rateForm = {
        id: row.id,
        tenantName: row.tenantName,
        platformPercent: (row.platformRate != null ? Number(row.platformRate) : 0.01) * 100
      }
      this.rateOpen = true
    },
    submitRate() {
      const platformRate = (Number(this.rateForm.platformPercent) / 100).toFixed(2)
      updateTenant({ id: this.rateForm.id, platformRate: platformRate }).then(() => {
        this.$modal.msgSuccess("分成设置已保存")
        this.rateOpen = false
        this.getList()
      })
    },
    reset() {
      this.form = {
        id: null,
        tenantName: null,
        userName: null,
        userPhone: null,
        userEmail: null,
        tenantPackage: null,
        tenantTime: null,
        status: 0,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      }
      this.resetForm("form")
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.daterangeTenantTime = []
      this.resetForm("queryForm")
      this.queryParams.status = null
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
      this.updateOrAdd = false
      this.title = "新增运营商"
      getTenantPackageList().then(response => {
        this.packageList = response.data
      })
    },
    handleUpdate(row) {
      this.reset()
      getTenantPackageList().then(response => {
        this.packageList = response.data
      })
      this.updateOrAdd = true
      const id = row.id || this.ids
      getTenant(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改运营商"
      })
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null && this.updateOrAdd) {
            updateTenant(this.form).then(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addTenant(this.form).then(() => {
              this.$modal.msgSuccess("新增成功,密码已发送至邮箱")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除当前运营商数据项？').then(function() {
        return delTenant(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    handleExport() {
      this.download('system/tenant/export', {
        ...this.queryParams
      }, `运营商管理_${parseTime(new Date().getTime(), '{y}-{m}-{d}') }.xlsx`)
    },
    getPackageName(packageId) {
      let t_name = ""
      for (const t_item of this.packageList) {
        if (t_item.id === parseInt(packageId)) {
          t_name = t_item.name
        }
      }
      return t_name
    }
  }
}
</script>

<style scoped>
.tenant-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.tenant-page .ems-list-search--advanced {
  margin-top: 12px;
}

.tenant-page .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.tenant-page .ems-list-search__control {
  width: 11rem;
}

.tenant-page .ems-list-search__daterange {
  width: calc(11rem * 2 + 90px + 16px);
}

.tenant-page .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.tenant-page .expand-trigger:hover,
.tenant-page .expand-trigger:focus {
  color: #0747c7;
}

.tenant-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.tenant-tip {
  display: flex;
  align-items: flex-start;
  box-sizing: border-box;
  margin: 0 0 32px;
  padding: 15px 19px;
  border: 1px solid #5990fd;
  border-radius: 12px;
  background-color: rgba(89, 144, 253, 0.1);
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  word-wrap: break-word;
}

.tenant-tip__icon {
  flex-shrink: 0;
  margin-right: 12px;
  color: #5990fd;
  font-size: 20px;
  line-height: 1;
}

.tenant-tip__message {
  flex: 1;
  min-width: 0;
  color: rgba(0, 0, 0, 0.85);
}

.tenant-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.tenant-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.tenant-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.tenant-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.tenant-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.tenant-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.tenant-toolbar__right .el-button--primary:hover,
.tenant-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}

.tenant-rate-hint {
  color: #909399;
  font-size: 12px;
  margin-top: -8px;
  padding-left: 120px;
}
</style>

<style>
.tenant-form-dialog .el-dialog__title,
.tenant-rate-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.tenant-form-dialog .el-dialog__header,
.tenant-rate-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.tenant-form-dialog .el-form-item__label,
.tenant-rate-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
