<template>
  <div class="header-search" :class="{ 'is-open': show }">
    <img
      ref="trigger"
      :src="searchIcon"
      class="header-search__trigger"
      alt="搜索"
      @click.stop="toggle"
    >

    <div
      v-show="show"
      ref="panel"
      class="header-search__panel"
      :style="panelStyle"
      @click.stop
    >
      <div class="header-search__input-wrap">
        <img :src="searchIcon" class="header-search__input-icon" alt="">
        <input
          ref="searchInput"
          v-model="keyword"
          class="header-search__input"
          type="text"
          placeholder="搜索"
          @input="onQuery"
          @keydown.esc.stop.prevent="close"
          @keydown.enter.prevent="onEnter"
        >
      </div>

      <div class="header-search__list">
        <div
          v-for="(item, index) in displayList"
          :key="`${item.path}-${index}`"
          class="header-search__item"
          @click="select(item)"
        >
          <div class="header-search__item-title">{{ itemTitle(item) }}</div>
          <div class="header-search__item-path">{{ itemPath(item) }}</div>
        </div>
        <div v-if="!displayList.length" class="header-search__empty">无匹配菜单</div>
      </div>
    </div>
  </div>
</template>

<script>
import Fuse from 'fuse.js/dist/fuse.min.js'
import searchIcon from '@/assets/images/search.svg'

export default {
  name: 'HeaderSearch',
  data() {
    return {
      searchIcon,
      keyword: '',
      displayList: [],
      searchPool: [],
      show: false,
      fuse: undefined,
      panelStyle: {},
      closeTimer: null
    }
  },
  computed: {
    routes() {
      const sidebar = this.$store.getters.sidebarRouters
      if (sidebar && sidebar.length) {
        return sidebar
      }
      return this.$store.getters.permission_routes || []
    }
  },
  watch: {
    routes: {
      deep: true,
      immediate: true,
      handler() {
        this.refreshPool()
      }
    }
  },
  beforeDestroy() {
    this.unbindOutside()
  },
  methods: {
    joinPath(basePath, routePath) {
      if (this.ishttp(routePath)) {
        return routePath
      }
      if (!routePath) {
        return basePath || '/'
      }
      if (routePath.startsWith('/')) {
        return routePath
      }
      const base = (basePath || '/').replace(/\/$/, '')
      return `${base}/${routePath}`.replace(/\/+/g, '/')
    },
    refreshPool() {
      try {
        this.searchPool = this.generateRoutes(this.routes)
        this.initFuse(this.searchPool)
        if (this.show && !(this.keyword || '').trim()) {
          this.displayList = this.searchPool.slice()
        }
      } catch (e) {
        console.error('[HeaderSearch] refreshPool failed', e)
        this.searchPool = []
      }
    },
    itemTitle(item) {
      const titles = item.title || []
      return titles.length ? titles[titles.length - 1] : ''
    },
    itemPath(item) {
      return (item.title || []).join(' / ')
    },
    toggle(e) {
      if (e) {
        e.stopPropagation()
        e.preventDefault()
      }
      if (this.show) {
        this.close()
        return
      }
      this.open()
    },
    open() {
      this.refreshPool()
      this.keyword = ''
      this.displayList = this.searchPool.slice()
      // 先写入定位，再显示，避免首帧无 fixed 导致偏右/错位
      this.updatePanelPosition()
      this.show = true
      this.$nextTick(() => {
        this.updatePanelPosition()
        if (this.$refs.searchInput) {
          this.$refs.searchInput.focus()
        }
        // 延后绑定，避免本次点击冒泡立刻关闭
        this.closeTimer = setTimeout(() => {
          document.addEventListener('click', this.handleOutside)
          window.addEventListener('resize', this.updatePanelPosition)
        }, 0)
      })
    },
    close() {
      this.show = false
      this.keyword = ''
      this.displayList = []
      this.unbindOutside()
    },
    unbindOutside() {
      if (this.closeTimer) {
        clearTimeout(this.closeTimer)
        this.closeTimer = null
      }
      document.removeEventListener('click', this.handleOutside)
      window.removeEventListener('resize', this.updatePanelPosition)
    },
    handleOutside(e) {
      const panel = this.$refs.panel
      const trigger = this.$refs.trigger
      if (panel && panel.contains(e.target)) {
        return
      }
      if (trigger && trigger.contains(e.target)) {
        return
      }
      this.close()
    },
    updatePanelPosition() {
      const trigger = this.$refs.trigger
      if (!trigger) {
        return
      }
      const rect = trigger.getBoundingClientRect()
      const panelWidth = 260
      // 以搜索图标中心为基准水平居中
      let left = rect.left + rect.width / 2 - panelWidth / 2
      if (left < 8) {
        left = 8
      }
      if (left + panelWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - panelWidth - 8)
      }
      this.panelStyle = {
        position: 'fixed',
        top: `${Math.round(rect.bottom + 8)}px`,
        left: `${Math.round(left)}px`,
        width: `${panelWidth}px`,
        zIndex: 4000
      }
    },
    onQuery() {
      const query = (this.keyword || '').trim()
      if (!query) {
        this.displayList = this.searchPool.slice()
        return
      }
      if (!this.fuse) {
        this.displayList = []
        return
      }
      this.displayList = this.fuse.search(query).map(r => r.item)
    },
    onEnter() {
      const query = (this.keyword || '').trim()
      if (!query) {
        this.displayList = this.searchPool.slice()
        return
      }
      if (this.displayList.length) {
        this.select(this.displayList[0])
      }
    },
    select(item) {
      if (!item || !item.path) {
        return
      }
      if (this.ishttp(item.path)) {
        const pindex = item.path.indexOf('http')
        window.open(item.path.substr(pindex), '_blank')
      } else if (item.query) {
        try {
          const query = typeof item.query === 'string' ? JSON.parse(item.query) : item.query
          this.$router.push({ path: item.path, query })
        } catch (e) {
          this.$router.push(item.path)
        }
      } else {
        this.$router.push(item.path)
      }
      this.close()
    },
    initFuse(list) {
      this.fuse = new Fuse(list || [], {
        shouldSort: true,
        threshold: 0.4,
        location: 0,
        distance: 100,
        minMatchCharLength: 1,
        keys: [
          { name: 'title', weight: 0.7 },
          { name: 'path', weight: 0.3 }
        ]
      })
    },
    generateRoutes(routes, basePath = '/', prefixTitle = []) {
      let res = []
      const list = routes || []

      for (let i = 0; i < list.length; i++) {
        const router = list[i]
        if (!router || router.hidden) {
          continue
        }

        const fullPath = this.joinPath(basePath, router.path || '')
        const data = {
          path: fullPath,
          title: prefixTitle.slice(),
          query: router.query
        }

        if (router.meta && router.meta.title) {
          data.title = data.title.concat(router.meta.title)
          const visibleChildren = (router.children || []).filter(c => c && !c.hidden)
          if (!visibleChildren.length && router.redirect !== 'noRedirect') {
            res.push(data)
          }
        }

        if (router.children && router.children.length) {
          const childBase = (router.meta && router.meta.title) ? fullPath : basePath
          const childPrefix = (router.meta && router.meta.title) ? data.title : prefixTitle
          const tempRoutes = this.generateRoutes(router.children, childBase, childPrefix)
          if (tempRoutes.length) {
            res = res.concat(tempRoutes)
          }
        }
      }
      return res
    },
    ishttp(url) {
      return typeof url === 'string' && (url.indexOf('http://') !== -1 || url.indexOf('https://') !== -1)
    }
  }
}
</script>

<style lang="scss" scoped>
.header-search {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 100%;
  width: auto;
}

.header-search__trigger {
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: block;
  flex-shrink: 0;
}

.header-search__panel {
  position: fixed;
  display: flex;
  flex-direction: column;
  max-height: 480px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.header-search__input-wrap {
  display: flex;
  align-items: center;
  margin: 12px 12px 8px;
  padding: 0 12px;
  height: 36px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.15s ease, border-width 0.15s ease;

  &:focus-within {
    border: 2px solid #0a59f7;
    padding: 0 11px;
  }
}

.header-search__input-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  flex-shrink: 0;
  opacity: 0.55;
}

.header-search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #000000d9;
  line-height: 36px;

  &::placeholder {
    color: #00000066;
  }
}

.header-search__list {
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px 0 8px;
}

.header-search__item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #f5f5f5;
  }
}

.header-search__item-title {
  font-size: 14px;
  line-height: 22px;
  color: #000000d9;
  font-weight: 500;
}

.header-search__item-path {
  margin-top: 2px;
  font-size: 12px;
  line-height: 18px;
  color: #00000066;
}

.header-search__empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: #00000066;
}
</style>
