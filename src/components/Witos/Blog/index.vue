<template>
  <div>
    <img :src="blogIcon" class="ems-icon" alt="个人博客" @click="goto">
  </div>
</template>

<script>
import blogIcon from '@/assets/images/blog.svg'

export default {
  name: 'WitosBlog',
  data() {
    return {
      blogIcon,
      url: 'http://www.huizhidata.com/'
    }
  },
  methods: {
    goto() {
      window.open(this.url)
    }
  }
}
</script>

<style scoped>
.ems-icon {
  width: 22px;
  height: 22px;
  cursor: pointer;
  display: block;
}
</style>
