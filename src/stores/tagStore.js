import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTagStore = defineStore('tag', () => {
  // 所有竞赛标签数据
  const competitionTags = ref([
    // A类竞赛
    { name: '全国地质技能大赛', category: 'A', type: '地质资源类' },
    { name: '资源勘查设计赛', category: 'A', type: '地质资源类' },
    { name: '地球物理竞赛', category: 'A', type: '地质资源类' },
    { name: '地质灾害防治赛', category: 'A', type: '地质资源类' },
    { name: '节能减排大赛', category: 'A', type: '环境工程类' },
    { name: '环境友好科技赛', category: 'A', type: '环境工程类' },
    { name: '水科学竞赛', category: 'A', type: '环境工程类' },
    { name: '生态修复创新赛', category: 'A', type: '环境工程类' },
    { name: 'ACM程序设计', category: 'A', type: '信息技术类' },
    { name: '数学建模国赛', category: 'A', type: '信息技术类' },
    { name: '电子设计竞赛', category: 'A', type: '信息技术类' },
    { name: '智能汽车竞赛', category: 'A', type: '信息技术类' },
    // B类竞赛
    { name: '金相技能大赛', category: 'B', type: '材料科学类' },
    { name: '材料创新设计', category: 'B', type: '材料科学类' },
    { name: '高分子竞赛', category: 'B', type: '材料科学类' },
    { name: '纳米材料挑战赛', category: 'B', type: '材料科学类' },
    { name: '结构设计大赛', category: 'B', type: '土木建筑类' },
    { name: 'BIM技术应用', category: 'B', type: '土木建筑类' },
    { name: '岩土工程竞赛', category: 'B', type: '土木建筑类' },
    { name: '测绘技能大赛', category: 'B', type: '土木建筑类' },
    { name: '挑战杯创业赛', category: 'B', type: '经济管理类' },
    { name: '市场调查大赛', category: 'B', type: '经济管理类' },
    { name: '电子商务竞赛', category: 'B', type: '经济管理类' },
    { name: '企业模拟竞争', category: 'B', type: '经济管理类' },
    // C类竞赛
    { name: '英语演讲比赛', category: 'C', type: '外语文学类' },
    { name: '翻译大赛', category: 'C', type: '外语文学类' },
    { name: '写作竞赛', category: 'C', type: '外语文学类' },
    { name: '模拟联合国', category: 'C', type: '外语文学类' },
    { name: '广告艺术大赛', category: 'C', type: '艺术设计类' },
    { name: '工业设计赛', category: 'C', type: '艺术设计类' },
    { name: '数字媒体竞赛', category: 'C', type: '艺术设计类' },
    { name: '建筑手绘大赛', category: 'C', type: '艺术设计类' },
    { name: '定向越野赛', category: 'C', type: '体育竞技类' },
    { name: '攀岩挑战赛', category: 'C', type: '体育竞技类' },
    { name: '户外技能赛', category: 'C', type: '体育竞技类' },
    { name: '武术锦标赛', category: 'C', type: '体育竞技类' }
  ])

  // 科研立项标签数据
  const researchTags = ref([
    { name: '地质过程与矿产资源', college: '地球科学学院' },
    { name: '地球化学', college: '地球科学学院' },
    { name: '古生物学与地层学', college: '地球科学学院' },
    { name: '构造地质学', college: '地球科学学院' },
    { name: '矿产普查与勘探', college: '资源学院' },
    { name: '能源地质工程', college: '资源学院' },
    { name: '数学地质与遥感', college: '资源学院' },
    { name: '水文地质与环境', college: '环境学院' },
    { name: '环境科学与工程', college: '环境学院' },
    { name: '大气科学', college: '环境学院' },
    { name: '岩土工程', college: '工程学院' },
    { name: '地质工程', college: '工程学院' },
    { name: '土木工程', college: '工程学院' },
    { name: '地球探测与信息技术', college: '地球物理学院' },
    { name: '固体地球物理', college: '地球物理学院' },
    { name: '材料科学与工程', college: '材料与化学学院' },
    { name: '应用化学', college: '材料与化学学院' },
    { name: '计算机应用技术', college: '计算机学院' },
    { name: '软件工程', college: '计算机学院' },
    { name: '信息安全', college: '计算机学院' },
    { name: '管理科学与工程', college: '经济管理学院' },
    { name: '工商管理', college: '经济管理学院' }
  ])

  // 所有标签（竞赛+科研）
  const allTags = computed(() => {
    const compTags = competitionTags.value.map(t => ({
      ...t,
      source: 'competition',
      displayName: t.name
    }))
    const resTags = researchTags.value.map(t => ({
      ...t,
      source: 'research',
      displayName: t.name
    }))
    return [...compTags, ...resTags]
  })

  // 按分类获取竞赛标签
  const getCompetitionTagsByCategory = (category) => {
    return competitionTags.value.filter(t => t.category === category)
  }

  // 按学院获取科研标签
  const getResearchTagsByCollege = (college) => {
    return researchTags.value.filter(t => t.college === college)
  }

  // 搜索标签
  const searchTags = (keyword) => {
    if (!keyword) return allTags.value
    return allTags.value.filter(t => 
      t.displayName.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  // 当前选中的标签（用于搜索）
  const currentSearchTag = ref(null)

  const setSearchTag = (tag) => {
    currentSearchTag.value = tag
  }

  const clearSearchTag = () => {
    currentSearchTag.value = null
  }

  return {
    competitionTags,
    researchTags,
    allTags,
    currentSearchTag,
    getCompetitionTagsByCategory,
    getResearchTagsByCollege,
    searchTags,
    setSearchTag,
    clearSearchTag
  }
})