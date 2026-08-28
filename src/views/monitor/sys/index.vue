<template>
  <div class="app-container sys-page nco-settings-container">
    <div class="new-style-menu-title">服务器管理</div>
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
        <el-form-item label="系统名称" prop="sysName">
          <el-input
            v-model="queryParams.sysName"
            placeholder="请输入系统名称"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input
            v-model="queryParams.ip"
            placeholder="请输入IP地址"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="是否在线" prop="isOnline">
          <el-select
            v-model="queryParams.isOnline"
            placeholder="请选择是否在线"
            clearable
            class="ems-list-search__control"
          >
            <el-option
              v-for="dict in dict.type.sys_notice_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="ems-list-search__actions">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="sys-divider" role="separator" />

      <div class="sys-toolbar">
        <div class="sys-toolbar__left" />
        <div class="sys-toolbar__right">
          <el-button
            plain
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['monitor:sys:edit']"
          >修改</el-button>
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['monitor:sys:remove']"
          >删除</el-button>
          <el-button
            plain
            @click="handleExport"
            v-hasPermi="['monitor:sys:export']"
          >导出</el-button>
          <el-button
            type="primary"
            @click="handleAdd"
            v-hasPermi="['monitor:sys:add']"
          >新增</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="sysList"
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
            <el-table-column label="序号" align="center" width="60">
              <template slot-scope="scope">
                <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + (scope.$index + 1) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="图标" align="center" width="80">
              <svg-icon icon-class="linux" />
            </el-table-column>
            <el-table-column label="主键" align="center" prop="id" v-if="false" />
            <el-table-column label="系统名称" align="center" prop="sysName" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="IP地址" align="center" prop="ip" min-width="120" />
            <el-table-column label="CPU(%)" align="center" prop="cpuInfo" width="90" />
            <el-table-column label="CPU核心" align="center" prop="cpuCoreInfo" width="90" />
            <el-table-column label="内存(%)" align="center" prop="memInfo" width="90" />
            <el-table-column label="硬盘大小" align="center" prop="diskInfo" width="100" />
            <el-table-column label="硬盘(%)" align="center" prop="diskPercent" width="90" />
            <el-table-column label="是否在线" align="center" prop="isOnline" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_notice_status" :value="scope.row.isOnline" />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="100" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
              <template slot-scope="scope">
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['monitor:sys:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['monitor:sys:remove']"
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
      width="550px"
      append-to-body
      custom-class="sys-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="系统名称" prop="sysName">
          <el-input v-model="form.sysName" placeholder="请输入系统名称" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="form.userName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="用户密码" prop="userPassword">
          <el-input v-model="form.userPassword" placeholder="请输入用户密码" type="password" />
        </el-form-item>
        <el-form-item label="系统端口" prop="ipPort">
          <el-input v-model="form.ipPort" placeholder="请输入系统端口" />
        </el-form-item>
        <el-form-item label="通知方式" prop="messageType">
          <el-select v-model="form.messageType" placeholder="请选通知类型" style="width: 100%" @change="chanageMessageType">
            <el-option
              v-for="dict in dict.type.sys_message_type"
              :key="parseInt(dict.value)"
              :label="dict.label"
              :value="parseInt(dict.value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="phoneshow" label="手机号码" prop="userPhone">
          <el-input v-model="form.userPhone" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item v-if="emailshow" label="邮箱地址" prop="userEmail">
          <el-input v-model="form.userEmail" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" plain @click="testLink">测试连接</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listSys, getSys, delSys, addSys, updateSys, testLink } from "@/api/monitor/sys"
import { parseTime } from "@/utils/witos"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "Sys",
  dicts: ['sys_notice_status', 'sys_message_type'],
  data() {
    return {
      phoneshow: true,
      emailshow: false,
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      sysList: [],
      title: "",
      open: false,
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        sysName: null,
        ip: null,
        isOnline: null
      },
      form: {},
      rules: {
        ip: [
          { required: true, message: "IP地址不能为空", trigger: "blur" }
        ],
        userName: [
          { required: true, message: "用户名不能为空", trigger: "blur" }
        ],
        userPassword: [
          { required: true, message: "用户密码不能为空", trigger: "blur" }
        ],
        ipPort: [
          { required: true, message: "系统端口不能为空", trigger: "blur" }
        ],
        isOnline: [
          { required: true, message: "是否在线 0在线 1离线不能为空", trigger: "change" }
        ],
        userPhone: [
          { required: true, message: "手机号码不能为空", trigger: "blur" },
          {
            pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
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
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    chanageMessageType(row) {
      this.phoneshow = row == 1 ? false : true
      this.emailshow = row == 1 ? true : false
    },
    getList() {
      this.loading = true
      listSys(this.queryParams).then(response => {
        this.sysList = response.data || []
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
        sysName: null,
        ip: null,
        userName: null,
        userPassword: null,
        ipPort: null,
        rsaAddr: null,
        isOnline: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        tenantId: null,
        messageType: 0,
        userPhone: null,
        userEmail: null
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
      this.title = "添加服务器管理"
      this.phoneshow = this.form.messageType == 1 ? false : true
      this.emailshow = this.form.messageType == 1 ? true : false
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getSys(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改服务器管理"
        this.phoneshow = this.form.messageType == 1 ? false : true
        this.emailshow = this.form.messageType == 1 ? true : false
      })
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateSys(this.form).then(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addSys(this.form).then(() => {
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
      this.$modal.confirm('是否确认删除当前服务器管理数据项？').then(function() {
        return delSys(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    handleExport() {
      this.download('monitor/sys/export', {
        ...this.queryParams
      }, `服务器管理_${parseTime(new Date().getTime(), '{y}-{m}-{d}') }.xlsx`)
    },
    testLink() {
      testLink(this.form).then(response => {
        if (response.data == "error") {
          this.$modal.msgError("连接失败!")
        } else {
          this.$modal.msgSuccess("连接成功!")
        }
      })
    }
  }
}
</script>

<style scoped>
.sys-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.sys-page .ems-list-search__control {
  width: 11rem;
}

.sys-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.sys-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.sys-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.sys-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.sys-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.sys-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.sys-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.sys-toolbar__right .el-button--primary:hover,
.sys-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}
</style>

<style>
.sys-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.sys-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.sys-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
