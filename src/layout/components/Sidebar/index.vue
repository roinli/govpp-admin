<template>
  <div
    class="sidebar-root"
    :class="{ 'is-collapse': isCollapse }"
    :style="{ backgroundColor: settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }"
  >
    <!-- 菜单图标精确上色（位图/写死 fill 的 SVG 也能变成指定色） -->
    <svg class="ems-menu-icon-filters" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <filter id="ems-menu-icon-theme" color-interpolation-filters="sRGB">
          <feFlood flood-color="#0a59f7" result="flood" />
          <feComposite in="flood" in2="SourceAlpha" operator="in" />
        </filter>
        <filter id="ems-menu-icon-white" color-interpolation-filters="sRGB">
          <feFlood flood-color="#ffffff" result="flood" />
          <feComposite in="flood" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
    </svg>
    <div class="sidebar-box">
      <div class="custom-sidebar-menu" :class="[settings.sideTheme, { 'is-collapse': isCollapse }]">
        <sidebar-item
          v-for="(route, index) in sidebarRouters"
          :key="`sidebar-${route.path || 'root'}-${route.name || 'unnamed'}-${index}`"
          :item="route"
          :base-path="route.path"
          :collapse="isCollapse"
          :default-expanded="isDefaultExpanded(route)"
        />
      </div>
    </div>
    <div class="sidebar-fold" :class="{ 'is-collapse': isCollapse }" title="展开/收起菜单">
      <span class="sidebar-fold__btn" @click="toggleSideBar">
        <svg-icon icon-class="sidebar-fold" class="sidebar-fold__icon" :class="{ 'is-collapse': isCollapse }" />
      </span>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import SidebarItem from './SidebarItem'
import variables from '@/assets/styles/variables.scss'

export default {
  components: { SidebarItem },
  computed: {
    ...mapState(['settings']),
    ...mapGetters(['sidebarRouters', 'sidebar']),
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    },
    firstVisibleMenuPath() {
      const first = (this.sidebarRouters || []).find(route => !route.hidden)
      return first ? first.path : ''
    }
  },
  methods: {
    isDefaultExpanded(route) {
      return !route.hidden && route.path === this.firstVisibleMenuPath
    },
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;

  &.is-collapse {
    .sidebar-box {
      overflow: visible;
    }

    .custom-sidebar-menu {
      overflow: visible;
    }
  }
}

.ems-menu-icon-filters {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.sidebar-box {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}

.custom-sidebar-menu {
  padding: 12px 12px;
  background: #ffffff;
  border-radius: 4px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &.is-collapse {
    padding: 12px 0;
    overflow-x: visible;
  }

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  ::v-deep .sidebar-menu-item {
    display: block !important;
  }
}

.sidebar-fold {
  flex-shrink: 0;
  align-self: stretch;
  width: 100%;
  box-sizing: border-box;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 12px;
  cursor: pointer;
  background: #fff;
  color: #666;

  &.is-collapse {
    justify-content: center;
    padding: 0;
  }

  .sidebar-fold__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    color: #666;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;

    &:hover {
      color: #0a59f7;
      background: #111a2c0d;
    }
  }

  .sidebar-fold__icon {
    font-size: 22px;
    width: 22px;
    height: 22px;
    transition: transform 0.28s ease;
    transform-origin: center;

    &.is-collapse {
      transform: rotate(180deg);
    }
  }
}
</style>
