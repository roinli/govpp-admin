<template>
  <div class="app-container tenantpackage-page nco-settings-container">
    <div class="new-style-menu-title">租户套餐</div>
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
        <el-form-item label="套餐名" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入套餐名"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="套餐状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择套餐状态"
            clearable
            class="ems-list-search__control"
          >
            <el-option
              v-for="dict in dict.type.sys_tenant_status"
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

      <div class="tenantpackage-divider" role="separator" />

      <div class="tenantpackage-toolbar">
        <div class="tenantpackage-toolbar__left" />
        <div class="tenantpackage-toolbar__right">
          <el-button
            plain
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['system:tenantpackage:edit']"
          >修改</el-button>
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:tenantpackage:remove']"
          >删除</el-button>
          <el-button
            plain
            @click="handleExport"
            v-hasPermi="['system:tenantpackage:export']"
          >导出</el-button>
          <el-button
            type="primary"
            @click="handleAdd"
            v-hasPermi="['system:tenantpackage:add']"
          >新增</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="tenantpackageList"
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
            <el-table-column label="序号" align="center" width="80">
              <template slot-scope="scope">
                <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + (scope.$index + 1) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="套餐编号" align="center" prop="id" v-if="false" />
            <el-table-column label="套餐名" align="center" prop="name" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column label="创建时间" align="center" prop="createTime" width="180">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="租户套餐状态" align="center" prop="status" width="140">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_tenant_status" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="100"
              fixed="right"
              class-name="small-padding fixed-width ems-list-table__ops"
            >
              <template slot-scope="scope">
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['system:tenantpackage:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['system:tenantpackage:remove']"
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

    <!-- 对话框(添加 / 修改) -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      width="550px"
      append-to-body
      custom-class="tenantpackage-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="套餐名" prop="name">
          <el-input v-model="form.name" placeholder="请输入套餐名" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event)">展开/折叠</el-checkbox>
          <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event)">全选/全不选</el-checkbox>
          <el-checkbox v-model="menuLinkage">父子联动</el-checkbox>
          <el-tree
            class="tree-border"
            :data="menuOptions"
            show-checkbox
            ref="menu"
            node-key="id"
            :check-strictly="!menuLinkage"
            empty-text="加载中，请稍后"
            :props="defaultProps"
          />
        </el-form-item>
        <el-form-item label="套餐状态">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in dict.type.sys_tenant_status"
              :key="dict.value"
              :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio>
          </el-radio-group>
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
import { listTenantpackage, getTenantpackage, delTenantpackage, addTenantpackage, updateTenantpackage } from "@/api/system/tenantpackage"
import { listSimpleMenus } from "@/api/system/menu"
import { parseTime } from "@/utils/witos"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "Tenantpackage",
  dicts: ['sys_tenant_status'],
  data() {
    return {
      defaultProps: {
        label: "name",
        children: "children"
      },
      menuOptions: [],
      menuExpand: false,
      menuNodeAll: false,
      menuLinkage: false,
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      tenantpackageList: [],
      title: "",
      open: false,
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        status: null
      },
      form: {},
      rules: {
        name: [{ required: true, message: "套餐名不能为空", trigger: "blur" }],
        status: [{ required: true, message: "状态不能为空", trigger: "blur" }],
        menuIds: [{ required: true, message: "关联的菜单编号不能为空", trigger: "blur" }]
      }
    }
  },
  created() {
    this.getList()
    this.getMenus()
  },
  methods: {
    getList() {
      this.loading = true
      listTenantpackage(this.queryParams).then(response => {
        this.tenantpackageList = response.data
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    getMenus() {
      listSimpleMenus().then(response => {
        this.menuOptions = []
        this.menuOptions.push(...this.handleTree(response.data, "id"))
      })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      if (this.$refs.menu !== undefined) {
        this.$refs.menu.setCheckedKeys([])
      }
      this.menuExpand = false
      this.menuNodeAll = false
      this.menuLinkage = false
      this.form = {
        id: null,
        name: null,
        menuIds: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        status: 0
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
      this.title = "添加租户套餐"
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      this.open = true
      this.title = "修改租户套餐"
      getTenantpackage(id).then(response => {
        this.form = response.data
        this.$nextTick(() => {
          this.$refs.menu.setCheckedKeys(response.data.menuIds.split(','))
        })
      })
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateTenantpackage({
              ...this.form,
              menuIds: [...this.$refs.menu.getCheckedKeys(), ...this.$refs.menu.getHalfCheckedKeys()].toString()
            }).then(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addTenantpackage({
              ...this.form,
              menuIds: [...this.$refs.menu.getCheckedKeys(), ...this.$refs.menu.getHalfCheckedKeys()].toString()
            }).then(() => {
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
      this.$modal.confirm('是否确认删除当前租户套餐数据项？').then(function() {
        return delTenantpackage(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    handleExport() {
      this.download('system/tenantpackage/export', {
        ...this.queryParams
      }, `租户套餐_${parseTime(new Date().getTime(), '{y}-{m}-{d}') }.xlsx`)
    },
    handleCheckedTreeExpand(value) {
      const treeList = this.menuOptions
      for (let i = 0; i < treeList.length; i++) {
        this.$refs.menu.store.nodesMap[treeList[i].id].expanded = value
      }
    },
    handleCheckedTreeNodeAll(value) {
      this.$refs.menu.setCheckedNodes(value ? this.menuOptions : [])
    },
    handleCheckedTreeConnect(value) {
      this.form.menuCheckStrictly = value
    }
  }
}
</script>

<style scoped>
.tenantpackage-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.tenantpackage-page .ems-list-search__control {
  width: 11rem;
}

.tenantpackage-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.tenantpackage-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.tenantpackage-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.tenantpackage-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.tenantpackage-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.tenantpackage-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.tenantpackage-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.tenantpackage-toolbar__right .el-button--primary:hover,
.tenantpackage-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}
</style>

<style>
.tenantpackage-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.tenantpackage-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.tenantpackage-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
