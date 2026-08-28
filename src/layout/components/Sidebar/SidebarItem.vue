<template>
  <div
    v-if="!item.hidden"
    class="sidebar-menu-item"
    :class="{ 'is-collapse': collapse, 'is-popup-open': collapse && collapseHover }"
    @mouseenter="onCollapseEnter"
    @mouseleave="onCollapseLeave"
  >
    <!-- 第一层：主菜单项 -->
    <div class="main-menu-item" :class="{ 'active': isMainMenuActive, 'is-hover': collapse && collapseHover }">
      <div class="main-menu-header" @click="toggleMainMenu">
        <div class="main-menu-content">
          <item v-if="item.meta" :icon="item.meta && item.meta.icon" :title="collapse ? '' : item.meta.title" />
        </div>
        <div v-if="!collapse" class="main-menu-arrow" :class="{ 'expanded': isMainMenuExpanded }">
          <i class="el-icon-arrow-down"></i>
        </div>
      </div>

      <!-- 展开态：内嵌二级菜单 -->
      <div v-if="!collapse && isMainMenuExpanded && visibleChildren.length" class="sub-menu-items">
        <div class="sub-menu-grid">
          <div
            v-for="(child, index) in visibleChildren"
            :key="`submenu-${child.path || 'sub'}-${child.name || 'unnamed'}-${index}`"
            class="sub-menu-item"
            :class="{ 'active': isSubMenuActive(child) }"
            @click="handleSubMenuClick(child)"
          >
            <template v-if="isOpenInNewWindow(child)">
              <template v-if="child.meta && child.meta.title && child.meta.title.length>8">
                <el-tooltip :content="child.meta.title" placement="bottom" :disabled="!child.meta.title">
                  <span class="sub-menu-text">{{ child.meta.title }}</span>
                </el-tooltip>
              </template>
              <template v-else>
                <span class="sub-menu-text">{{ child.meta && child.meta.title }}</span>
              </template>
            </template>
            <app-link v-else-if="child.meta" :to="resolvePath(child.path, child.query)">
              <template v-if="child.meta.title.length>8">
                <el-tooltip :content="child.meta.title" placement="bottom" :disabled="!child.meta.title">
                  <span class="sub-menu-text">{{ child.meta.title }}</span>
                </el-tooltip>
              </template>
              <template v-else>
                <span class="sub-menu-text">{{ child.meta.title }}</span>
              </template>
            </app-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 折叠态：悬停弹出二级菜单（fixed，避免被 overflow 裁剪） -->
    <div
      v-show="collapse && collapseHover"
      class="collapse-popup"
      :style="popupStyle"
      @mouseenter="onCollapseEnter"
      @mouseleave="onCollapseLeave"
    >
      <div class="collapse-popup__title">{{ item.meta && item.meta.title }}</div>
      <div
        v-for="(child, index) in visibleChildren"
        :key="`popup-${child.path || 'sub'}-${child.name || 'unnamed'}-${index}`"
        class="collapse-popup__item"
        :class="{ 'active': isSubMenuActive(child) }"
        @click.stop="handlePopupClick(child)"
      >
        {{ child.meta && child.meta.title }}
      </div>
      <div v-if="!visibleChildren.length" class="collapse-popup__empty">暂无子菜单</div>
    </div>
  </div>
</template>

<script>
import path from 'path'
import { isExternal } from '@/utils/validate'
import Item from './Item'
import AppLink from './Link'
import FixiOSBug from './FixiOSBug'

export default {
  name: 'SidebarItem',
  components: { Item, AppLink },
  mixins: [FixiOSBug],
  props: {
    item: {
      type: Object,
      required: true
    },
    isNest: {
      type: Boolean,
      default: false
    },
    basePath: {
      type: String,
      default: ''
    },
    collapse: {
      type: Boolean,
      default: false
    },
    defaultExpanded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isMainMenuExpanded: this.defaultExpanded,
      collapseHover: false,
      popupStyle: {},
      leaveTimer: null
    }
  },
  computed: {
    visibleChildren() {
      return (this.item.children || []).filter(child => !child.hidden)
    },
    isMainMenuActive() {
      return this.visibleChildren.some(child => this.isSubMenuActive(child))
    }
  },
  watch: {
    // 顶部搜索 / 标签页等跳转时，自动展开当前路由所属一级菜单
    isMainMenuActive: {
      immediate: true,
      handler(active) {
        if (active) {
          this.isMainMenuExpanded = true
        }
      }
    },
    '$route.path'() {
      if (this.isMainMenuActive) {
        this.isMainMenuExpanded = true
      }
    }
  },
  beforeDestroy() {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer)
    }
  },
  methods: {
    onCollapseEnter() {
      if (!this.collapse) {
        return
      }
      if (this.leaveTimer) {
        clearTimeout(this.leaveTimer)
        this.leaveTimer = null
      }
      this.collapseHover = true
      this.$nextTick(() => {
        this.updatePopupPosition()
      })
    },
    onCollapseLeave() {
      if (!this.collapse) {
        return
      }
      this.leaveTimer = setTimeout(() => {
        this.collapseHover = false
      }, 120)
    },
    updatePopupPosition() {
      if (!this.$el || !this.$el.getBoundingClientRect) {
        return
      }
      const rect = this.$el.getBoundingClientRect()
      let top = rect.top
      // 避免贴底被裁切
      const maxTop = window.innerHeight - 220
      if (top > maxTop) {
        top = Math.max(8, maxTop)
      }
      this.popupStyle = {
        position: 'fixed',
        top: `${top}px`,
        left: `${rect.right + 6}px`,
        zIndex: 3000
      }
    },
    toggleMainMenu() {
      if (this.collapse) {
        // 折叠态点击仍可进入第一个子菜单；悬停看二级
        const first = this.visibleChildren[0]
        if (first) {
          this.handleSubMenuClick(first)
        }
        return
      }
      this.isMainMenuExpanded = !this.isMainMenuExpanded
    },
    isSubMenuActive(child) {
      const activeMenu = this.$route.meta && this.$route.meta.activeMenu
      const currentPath = activeMenu || this.$route.path
      const resolved = this.resolvePath(child.path, child.query)
      const childPath = typeof resolved === 'string' ? resolved : (resolved && resolved.path)
      if (!childPath) {
        return false
      }
      return currentPath === childPath || currentPath.startsWith(childPath + '/')
    },
    handlePopupClick(child) {
      this.collapseHover = false
      this.handleSubMenuClick(child)
    },
    isOpenInNewWindow(child) {
      return !!(child && child.meta && child.meta.openInNewWindow)
    },
    handleSubMenuClick(child) {
      if (this.isOpenInNewWindow(child)) {
        const resolved = (child.meta && child.meta.newWindowPath) || this.resolvePath(child.path)
        let target = typeof resolved === 'string' ? resolved : (resolved && resolved.path)
        if (target) {
          if (target.indexOf('http') !== 0) {
            const base = (process.env.BASE_URL || '/').replace(/\/$/, '')
            target = window.location.origin + (base === '/' ? '' : base) + (target.startsWith('/') ? target : '/' + target)
          }
          window.open(target, '_blank')
        }
        return
      }
      const childPath = this.resolvePath(child.path)
      const target = typeof childPath === 'string' ? childPath : (childPath && childPath.path)
      if (target && target !== this.$route.path) {
        this.$router.push(childPath)
      }
    },
    resolvePath(routePath, routeQuery) {
      if (isExternal(routePath)) {
        return routePath
      }
      if (isExternal(this.basePath)) {
        return this.basePath
      }
      if (routeQuery) {
        let query = JSON.parse(routeQuery)
        return { path: path.posix ? path.posix.resolve(this.basePath, routePath) : path.resolve(this.basePath, routePath), query: query }
      }
      return path.posix ? path.posix.resolve(this.basePath, routePath) : path.resolve(this.basePath, routePath)
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar-menu-item {
  position: relative;

  // —— 折叠态
  &.is-collapse {
    .main-menu-item {
      display: flex;
      justify-content: center;
    }

    .main-menu-header {
      width: 40px;
      height: 40px;
      min-height: 40px !important;
      margin: 0 auto;
      padding: 0;
      justify-content: center;
      border-radius: 8px;

      &:hover {
        background: #111a2c0d;
      }
    }

    .main-menu-content {
      justify-content: center;
      flex: none;
      width: 100%;
      height: 100%;

      ::v-deep .svg-icon {
        margin-right: 0 !important;
        font-size: 18px;
        color: #666666 !important;
        fill: currentColor !important;
      }

      ::v-deep span {
        display: none;
      }
    }

    .main-menu-item.is-hover .main-menu-header {
      background: #111a2c0d;

      .main-menu-content ::v-deep .svg-icon {
        color: #666666 !important;
        fill: currentColor !important;
      }
    }

    .main-menu-item.active .main-menu-header {
      background: #0a59f7;

      .main-menu-content ::v-deep .svg-icon {
        color: #ffffff !important;
        fill: currentColor !important;
        /* 精确白色：按图标透明度填充 */
        filter: url(#ems-menu-icon-white);
      }
    }

    // 选中再滑过：保持蓝底白图标
    .main-menu-item.active.is-hover .main-menu-header,
    .main-menu-item.active .main-menu-header:hover {
      background: #0a59f7;

      .main-menu-content ::v-deep .svg-icon {
        color: #ffffff !important;
        fill: currentColor !important;
        filter: url(#ems-menu-icon-white);
      }
    }

    .main-menu-item.active {
      background: transparent;
    }
  }

  .main-menu-item {
    background: transparent;
    border-radius: 8px;
    transition: all 0.3s ease;

    .main-menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0px 12px;
      min-height: 44px;
      box-sizing: border-box;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s ease;
      margin: 4px 0;
      padding-right: 15px;

      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      .main-menu-content {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;

        ::v-deep .svg-icon {
          margin-right: 12px;
          font-size:20px;
          color: #666666 !important;
          fill: currentColor !important;
          flex-shrink: 0;
          transition: color 0.2s ease;
        }

        ::v-deep span {
          font-weight: 400;
          font-size: 14px;
          color: #333333;
          letter-spacing: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
      }

      .main-menu-arrow {
        transition: transform 0.3s ease, color 0.2s ease;
        color: #666666;
        font-size: 10px !important;
        margin-left: 8px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;

        i {
          color: inherit;
          font-weight: 700;
          -webkit-text-stroke: 0.6px currentColor;
          font-size: 10px !important;
        }

        // 收起：朝下；展开：旋转朝上
        &.expanded {
          transform: rotate(180deg);
        }
      }
    }

    .sub-menu-items {
      padding: 2px 0px 8px;

      .sub-menu-grid {
        display: grid;
        gap: 4px;

        .sub-menu-item {
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          display: flex;
          align-items: center;
          min-width: 0;
          height: 40px;
          line-height: 40px;
          overflow: hidden;
          padding-left: 56px !important;
          padding-right: 12px;
          box-sizing: border-box;
          position: relative;
          text-overflow: ellipsis;
          color: #666666;

          &:hover {
            background-color: rgba(0, 0, 0, 0.04);
            color: #333333;
          }

          &.active {
            color: #fff;
            background-color: #0a59f7;

            .sub-menu-text {
              font-weight: 400;
              color: #fff;
            }
          }

          .sub-menu-text {
            font-size: 14px;
            font-weight: 400;
            line-height: 40px;
            color: inherit;
            display: block;
            text-decoration: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            min-width: 0;
            color: #000000d9;
          }

          a {
            text-decoration: none;
            color: inherit;
            width: 100%;
            display: block;
            min-width: 0;
            overflow: hidden;
          }
        }
      }
    }
  }

  // 仅展开态：二级选中时一级文字/图标变主题色 #0a59f7
  &:not(.is-collapse) {
    .main-menu-item.active {
      background: transparent;

      .main-menu-header {
        .main-menu-content {
          ::v-deep .svg-icon {
            color: #0a59f7 !important;
            fill: currentColor !important;
            /* 精确主题色：按图标透明度填充 #0a59f7 */
            filter: url(#ems-menu-icon-theme);
          }

          ::v-deep span {
            color: #0a59f7 !important;
          }
        }

        .main-menu-arrow,
        .main-menu-arrow i {
          color: #0a59f7 !important;
        }
      }
    }
  }
}

// 折叠弹出二级菜单
.collapse-popup {
  width: 224px;
  padding: 12px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px 0 #111a2c1a;

  &__title {
    padding: 12px 12px 8px;
    color: #191919;
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 4px;
  }

  &__item {
    height: 40px;
    line-height: 40px;
    padding: 0 12px;
    border-radius: 8px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 4px 0px;

    &:hover {
      background: #111a2c0d;
      color: #333;
    }

    &.active {
      background: #0a59f7;
      color: #fff;
    }
  }

  &__empty {
    padding: 10px 12px;
    font-size: 12px;
    color: #999;
  }
}

// 深色主题适配（展开态）
.theme-dark {
  .sidebar-menu-item:not(.is-collapse) {
    .main-menu-item {
      &.active {
        .main-menu-header {
          .main-menu-content {
            ::v-deep .svg-icon {
              color: #0a59f7 !important;
              filter: url(#ems-menu-icon-theme);
            }

            ::v-deep span {
              color: #0a59f7 !important;
            }
          }

          .main-menu-arrow,
          .main-menu-arrow i {
            color: #0a59f7 !important;
          }
        }
      }

      .main-menu-header {
        &:hover {
          background: rgba(64, 158, 255, 0.08);
        }

        .main-menu-content {
          ::v-deep span {
            color: #e4e7ed;
          }
        }

        .main-menu-arrow {
          color: #a8abb2;
        }
      }

      .sub-menu-items {
        .sub-menu-grid {
          .sub-menu-item {
            &:hover {
              background: rgba(64, 158, 255, 0.12);
            }

            .sub-menu-text {
              color: #c0c4cc;
            }
          }
        }
      }
    }
  }
}
</style>
