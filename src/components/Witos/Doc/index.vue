<template>
  <div>
    <img :src="questionIcon" class="ems-doc-icon" alt="文档" @click="goto">
  </div>
</template>

<script>
import questionIcon from '@/assets/images/question.svg'

export default {
  name: 'WitosDoc',
  data() {
    return {
      questionIcon,
      url: 'https://vpp-doc.huizhidata.com'
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
.ems-doc-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: block;
}
</style>
