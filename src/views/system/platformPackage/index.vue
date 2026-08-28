<template>
  <div class="app-container platform-pkg-page nco-settings-container">
    <div class="new-style-menu-title">平台套餐管理</div>
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
        <el-form-item label="套餐名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入套餐名称"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="ems-list-search__control">
            <el-option
              v-for="dict in dict.type.sys_normal_disable"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value, 10)"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="ems-list-search__actions">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="pp-divider" role="separator" />

      <div class="pp-toolbar">
        <div class="pp-toolbar__left" />
        <div class="pp-toolbar__right">
          <el-button plain :disabled="single" @click="handleUpdate" v-hasPermi="['system:platformpackage:edit']">修改</el-button>
          <el-button plain :disabled="multiple" @click="handleDelete" v-hasPermi="['system:platformpackage:remove']">删除</el-button>
          <el-button type="primary" @click="handleAdd" v-hasPermi="['system:platformpackage:add']">新增</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="packageList"
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
            <el-table-column label="套餐名称" align="center" prop="name" min-width="140" :show-overflow-tooltip="true" />
            <el-table-column label="状态" align="center" prop="status" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
            <el-table-column label="备注" align="center" prop="remark" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="操作" align="center" width="140" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
              <template slot-scope="scope">
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button type="text" icon="el-icon-edit" class="ems-list-table__ops-btn" @click="handleUpdate(scope.row)" v-hasPermi="['system:platformpackage:edit']" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button type="text" icon="el-icon-delete" class="ems-list-table__ops-btn" @click="handleDelete(scope.row)" v-hasPermi="['system:platformpackage:remove']" />
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

    <!-- 添加或修改套餐对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body custom-class="pp-form-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="套餐名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入套餐名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in dict.type.sys_normal_disable"
                  :key="dict.value"
                  :label="parseInt(dict.value, 10)"
                >{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="菜单权限">
              <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event)">展开/折叠</el-checkbox>
              <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event)">全选/全不选</el-checkbox>
              <el-checkbox v-model="menuLinkage">父子联动</el-checkbox>
              <el-tree
                ref="menuTree"
                :data="menuOptions"
                show-checkbox
                node-key="id"
                empty-text="加载中..."
                :check-strictly="!menuLinkage"
                :props="{ children: 'children', label: 'label' }"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPlatformPackage, getPlatformPackage, addPlatformPackage, updatePlatformPackage, delPlatformPackage } from "@/api/system/platformpackage"
import { treeselect as menuTreeselect } from "@/api/system/menu"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "PlatformPackage",
  dicts: ['sys_normal_disable'],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      packageList: [],
      title: "",
      open: false,
      menuOptions: [],
      menuExpand: false,
      menuNodeAll: false,
      menuLinkage: false,
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        status: null
      },
      form: {},
      rules: {
        name: [
          { required: true, message: "套餐名称不能为空", trigger: "blur" }
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
      listPlatformPackage(this.queryParams).then(response => {
        this.packageList = response.data || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    getMenuTreeSelect() {
      return menuTreeselect().then(response => {
        this.menuOptions = response.data || []
      })
    },
    /** 根据套餐的 menuIds 字符串设置树的勾选状态 */
    setMenuCheckedKeys(menuIdsStr) {
      if (!menuIdsStr) {
        return
      }
      const checkedKeys = menuIdsStr.split(',').filter(s => s).map(id => parseInt(id, 10))
      this.$nextTick(() => {
        this.$refs.menuTree.setCheckedKeys(checkedKeys, false)
      })
    },
    reset() {
      if (this.$refs.menuTree !== undefined) {
        this.$refs.menuTree.setCheckedKeys([])
      }
      this.menuExpand = false
      this.menuNodeAll = false
      this.menuLinkage = false
      this.form = {
        id: null,
        name: null,
        menuIds: '',
        status: 0,
        remark: null
      }
      this.resetForm("form")
    },
    cancel() {
      this.open = false
      this.reset()
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
      this.getMenuTreeSelect()
      this.open = true
      this.title = "新增平台套餐"
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids[0]
      getPlatformPackage(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改平台套餐"
        // 先加载菜单树，再设置勾选
        this.getMenuTreeSelect().then(() => {
          this.setMenuCheckedKeys(this.form.menuIds)
        })
      })
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          const checkedKeys = this.$refs.menuTree.getCheckedKeys()
          const halfCheckedKeys = this.$refs.menuTree.getHalfCheckedKeys()
          this.form.menuIds = [...checkedKeys, ...halfCheckedKeys].join(',')
          if (this.form.id != null) {
            updatePlatformPackage(this.form).then(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addPlatformPackage(this.form).then(() => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDelete(row) {
      const id = row.id || this.ids[0]
      this.$modal.confirm('是否确认删除套餐"' + row.name + '"？').then(function() {
        return delPlatformPackage(id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 展开/折叠所有节点 */
    handleCheckedTreeExpand(value) {
      const treeList = this.menuOptions
      for (let i = 0; i < treeList.length; i++) {
        this.$refs.menuTree.store.nodesMap[treeList[i].id].expanded = value
      }
    },
    /** 全选/全不选所有节点 */
    handleCheckedTreeNodeAll(value) {
      this.$refs.menuTree.setCheckedNodes(value ? this.menuOptions : [])
    }
  }
}
</script>

<style scoped>
.platform-pkg-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}
.platform-pkg-page .ems-list-search__control {
  width: 11rem;
}
.pp-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 16px 0;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.pp-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.pp-toolbar__left { flex: 1 1 auto; }
.pp-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}
.pp-toolbar__right .el-button + .el-button { margin-left: 1rem; }
.pp-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}
.pp-toolbar__right .el-button--primary:hover,
.pp-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}
</style>

<style>
.pp-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}
.pp-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}
.pp-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
