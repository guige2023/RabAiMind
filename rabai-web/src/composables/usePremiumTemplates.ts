// Premium Templates - 高端预设模板库
import { ref, computed } from 'vue'

export interface PremiumTemplate {
  id: string
  name: string
  nameEn: string
  category: string
  style: string
  slides: number
  tags: string[]
  popularity: number
  isPremium: boolean
  isNew: boolean
  color: string
}

export function usePremiumTemplates() {
  const templates = ref<PremiumTemplate[]>([
    // 新年主题
    { id: 'ny1', name: '新年庆祝', nameEn: 'New Year Celebration', category: 'holiday', style: 'festive', slides: 10, tags: ['新年', '庆祝', '祝福'], popularity: 95, isPremium: false, isNew: true, color: '#dc2626' },
    { id: 'ny2', name: '春节联欢', nameEn: 'Spring Festival Gala', category: 'holiday', style: 'traditional', slides: 15, tags: ['春节', '联欢', '晚会'], popularity: 92, isPremium: false, isNew: true, color: '#b91c1c' },
    { id: 'ny3', name: '元宵节', nameEn: 'Lantern Festival', category: 'holiday', style: 'elegant', slides: 8, tags: ['元宵', '灯笼', '团圆'], popularity: 88, isPremium: false, isNew: true, color: '#f59e0b' },

    // 生日主题
    { id: 'bd1', name: '生日派对', nameEn: 'Birthday Party', category: 'celebration', style: 'colorful', slides: 12, tags: ['生日', '派对', '祝福'], popularity: 94, isPremium: false, isNew: true, color: '#ec4899' },
    { id: 'bd2', name: '周岁宴', nameEn: 'First Birthday', category: 'celebration', style: 'cute', slides: 15, tags: ['周岁', '抓周', '纪念'], popularity: 90, isPremium: false, isNew: true, color: '#f472b6' },

    // 婚礼主题
    { id: 'w1', name: '婚礼请柬', nameEn: 'Wedding Invitation', category: 'wedding', style: 'romantic', slides: 8, tags: ['婚礼', '请柬', '喜宴'], popularity: 96, isPremium: true, isNew: true, color: '#f43f5e' },
    { id: 'w2', name: '婚纱照', nameEn: 'Wedding Album', category: 'wedding', style: 'elegant', slides: 20, tags: ['婚纱', '摄影', '爱情'], popularity: 93, isPremium: true, isNew: false, color: '#e11d48' },
    { id: 'w3', name: '婚宴流程', nameEn: 'Wedding Timeline', category: 'wedding', style: 'classic', slides: 10, tags: ['婚宴', '流程', '安排'], popularity: 89, isPremium: false, isNew: true, color: '#be185d' },

    // 毕业主题
    { id: 'gr1', name: '毕业典礼', nameEn: 'Graduation Ceremony', category: 'education', style: 'academic', slides: 15, tags: ['毕业', '典礼', '学位'], popularity: 95, isPremium: false, isNew: true, color: '#1d4ed8' },
    { id: 'gr2', name: '毕业照', nameEn: 'Graduation Album', category: 'education', style: 'memory', slides: 25, tags: ['毕业照', '回忆', '同学'], popularity: 91, isPremium: false, isNew: false, color: '#2563eb' },
    { id: 'gr3', name: '同学录', nameEn: 'Yearbook', category: 'education', style: 'nostalgic', slides: 30, tags: ['同学', '回忆', '纪念'], popularity: 87, isPremium: false, isNew: true, color: '#3b82f6' },

    // 儿童主题
    { id: 'k1', name: '儿童节', nameEn: "Children's Day", category: 'kids', style: 'playful', slides: 10, tags: ['儿童', '节日', '快乐'], popularity: 92, isPremium: false, isNew: true, color: '#f59e0b' },
    { id: 'k2', name: '亲子活动', nameEn: 'Parent-Child Event', category: 'kids', style: 'friendly', slides: 12, tags: ['亲子', '活动', '家庭'], popularity: 89, isPremium: false, isNew: true, color: '#d97706' },
    { id: 'k3', name: '儿童画展', nameEn: "Kids' Art Show", category: 'kids', style: 'creative', slides: 15, tags: ['画展', '儿童', '创意'], popularity: 85, isPremium: false, isNew: true, color: '#ca8a04' },

    // 节日促销
    { id: 'p1', name: '双十一', nameEn: 'Double 11 Sale', category: 'promotion', style: 'energetic', slides: 10, tags: ['双十一', '促销', '优惠'], popularity: 98, isPremium: true, isNew: true, color: '#ef4444' },
    { id: 'p2', name: '618大促', nameEn: '618 Sale', category: 'promotion', style: 'dynamic', slides: 10, tags: ['618', '促销', '活动'], popularity: 96, isPremium: true, isNew: true, color: '#dc2626' },
    { id: 'p3', name: '圣诞节', nameEn: 'Christmas', category: 'promotion', style: 'festive', slides: 8, tags: ['圣诞', '节日', '礼物'], popularity: 93, isPremium: false, isNew: true, color: '#166534' },
    { id: 'p4', name: '黑色星期五', nameEn: 'Black Friday', category: 'promotion', style: 'bold', slides: 10, tags: ['黑五', '折扣', '特惠'], popularity: 95, isPremium: true, isNew: true, color: '#000000' },

    // 电商运营
    { id: 'e1', name: '电商店铺', nameEn: 'E-commerce Shop', category: 'ecommerce', style: 'modern', slides: 12, tags: ['电商', '店铺', '运营'], popularity: 94, isPremium: true, isNew: false, color: '#7c3aed' },
    { id: 'e2', name: '爆款打造', nameEn: 'Hot Product', category: 'ecommerce', style: 'eye-catching', slides: 15, tags: ['爆款', '打造', '销量'], popularity: 91, isPremium: true, isNew: true, color: '#db2777' },
    { id: 'e3', name: '直播带货', nameEn: 'Live Streaming', category: 'ecommerce', style: 'energetic', slides: 10, tags: ['直播', '带货', '销售'], popularity: 97, isPremium: true, isNew: true, color: '#ea580c' },

    // 音乐节
    { id: 'mf1', name: '音乐节', nameEn: 'Music Festival', category: 'music', style: 'vibrant', slides: 15, tags: ['音乐', '节拍', '现场'], popularity: 90, isPremium: true, isNew: true, color: '#8b5cf6' },
    { id: 'mf2', name: '演唱会', nameEn: 'Concert', category: 'music', style: 'dynamic', slides: 20, tags: ['演唱', '现场', '明星'], popularity: 92, isPremium: true, isNew: false, color: '#7c3aed' },

    // 体育赛事
    { id: 'sp1', name: '马拉松', nameEn: 'Marathon', category: 'sports', style: 'energetic', slides: 12, tags: ['马拉松', '跑步', '健康'], popularity: 88, isPremium: false, isNew: true, color: '#059669' },
    { id: 'sp2', name: '足球赛', nameEn: 'Football Match', category: 'sports', style: 'dynamic', slides: 15, tags: ['足球', '比赛', '竞技'], popularity: 90, isPremium: false, isNew: true, color: '#16a34a' },
    { id: 'sp3', name: '篮球赛', nameEn: 'Basketball Match', category: 'sports', style: 'action', slides: 15, tags: ['篮球', '比赛', '团队'], popularity: 89, isPremium: false, isNew: true, color: '#ca8a04' },

    // 汽车
    { id: 'car1', name: '新车发布', nameEn: 'Car Launch', category: 'automotive', style: 'luxury', slides: 20, tags: ['汽车', '发布', '新车'], popularity: 94, isPremium: true, isNew: true, color: '#1e3a8a' },
    { id: 'car2', name: '车展介绍', nameEn: 'Auto Show', category: 'automotive', style: 'sleek', slides: 15, tags: ['车展', '介绍', '车型'], popularity: 91, isPremium: true, isNew: false, color: '#1e40af' },

    // 科技发布会
    { id: 'tc1', name: '手机发布会', nameEn: 'Phone Launch', category: 'tech', style: 'futuristic', slides: 18, tags: ['手机', '发布', '科技'], popularity: 97, isPremium: true, isNew: true, color: '#0f172a' },
    { id: 'tc2', name: '开发者大会', nameEn: 'Developer Conference', category: 'tech', style: 'tech', slides: 25, tags: ['开发', '技术', '大会'], popularity: 93, isPremium: true, isNew: true, color: '#1e293b' },

    // 公益
    { id: 'ch1', name: '慈善晚宴', nameEn: 'Charity Gala', category: 'charity', style: 'elegant', slides: 12, tags: ['慈善', '公益', '晚宴'], popularity: 86, isPremium: true, isNew: true, color: '#7f1d1d' },
    { id: 'ch2', name: '募捐活动', nameEn: 'Fundraiser', category: 'charity', style: 'warm', slides: 10, tags: ['募捐', '爱心', '帮助'], popularity: 84, isPremium: false, isNew: true, color: '#b91c1c' }
  ])

  const getByCategory = (cat: string) => templates.value.filter(t => t.category === cat)
  const getNew = () => templates.value.filter(t => t.isNew)
  const getPremium = () => templates.value.filter(t => t.isPremium)

  const stats = computed(() => ({
    total: templates.value.length,
    free: templates.value.filter(t => !t.isPremium).length,
    premium: templates.value.filter(t => t.isPremium).length,
    new: templates.value.filter(t => t.isNew).length,
    categories: [...new Set(templates.value.map(t => t.category))].length
  }))

  return { templates, getByCategory, getNew, getPremium, stats }
}

export default usePremiumTemplates
