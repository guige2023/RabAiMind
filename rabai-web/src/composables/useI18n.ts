/**
 * useI18n - Multi-language support (zh/en/ja/ko)
 */
import { ref, computed } from 'vue'

export type Locale = 'zh' | 'en' | 'ja' | 'ko'

export interface LocaleOption {
  code: Locale
  name: string
  nativeName: string
}

export const LOCALES: LocaleOption[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' }
]

type TranslationKey = keyof typeof translations.zh

const translations = {
  zh: {
    // Nav
    'nav.home': '首页',
    'nav.create': '创建PPT',
    'nav.templates': '模板市场',
    'nav.media': '素材库',
    'nav.favorites': '收藏',
    'nav.history': '历史',
    // Actions
    'action.start': '立即开始创建',
    'action.cancel': '取消',
    'action.confirm': '确认',
    'action.save': '保存',
    'action.delete': '删除',
    'action.edit': '编辑',
    'action.close': '关闭',
    'action.search': '搜索',
    // Hero
    'hero.title': 'AI 智能 PPT 生成平台',
    'hero.subtitle': '输入需求，AI 自动生成专业演示文稿',
    // Stats
    'stat.generated': '已生成',
    'stat.slides': '幻灯片',
    // Accessibility
    'a11y.skipToContent': '跳转到主要内容',
    'a11y.language': '选择语言',
    'a11y.theme': '选择主题',
    'a11y.reduceMotion': '减少动画',
    'a11y.menu': '菜单',
    'a11y.help': '帮助',
    'a11y.viewMode': '视图模式',
    'a11y.feedback': '反馈',
    'a11y.search': '搜索',
    'a11y.searchHint': 'Ctrl+K',
    // Reduce motion
    'a11y.reduceMotionOn': '已开启减少动画',
    'a11y.reduceMotionOff': '已关闭减少动画',
    // Footer
    'footer.copyright': '© 2026 RabAi Mind · AI PPT 生成平台',
    'theme.light': '亮色模式',
    'theme.dark': '暗色模式',
    'theme.auto': '跟随系统',
    // Loading
    'loading': '加载中...',
  },
  en: {
    'nav.home': 'Home',
    'nav.create': 'Create PPT',
    'nav.templates': 'Templates',
    'nav.media': 'Media',
    'nav.favorites': 'Favorites',
    'nav.history': 'History',
    'action.start': 'Start Creating',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.save': 'Save',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.close': 'Close',
    'action.search': 'Search',
    'hero.title': 'AI-Powered PPT Generation Platform',
    'hero.subtitle': 'Describe your needs, AI generates professional presentations',
    'stat.generated': 'Generated',
    'stat.slides': 'Slides',
    'a11y.skipToContent': 'Skip to main content',
    'a11y.language': 'Select language',
    'a11y.theme': 'Select theme',
    'a11y.reduceMotion': 'Reduce motion',
    'a11y.menu': 'Menu',
    'a11y.help': 'Help',
    'a11y.viewMode': 'View mode',
    'a11y.feedback': 'Feedback',
    'a11y.search': 'Search',
    'a11y.searchHint': 'Ctrl+K',
    'a11y.reduceMotionOn': 'Reduce motion enabled',
    'a11y.reduceMotionOff': 'Reduce motion disabled',
    'footer.copyright': '© 2026 RabAi Mind · AI PPT Generation Platform',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'System',
    'loading': 'Loading...',
  },
  ja: {
    'nav.home': 'ホーム',
    'nav.create': 'PPT作成',
    'nav.templates': 'テンプレート',
    'nav.media': 'メディア',
    'nav.favorites': 'お気に入り',
    'nav.history': '履歴',
    'action.start': '作成を開始',
    'action.cancel': 'キャンセル',
    'action.confirm': '確認',
    'action.save': '保存',
    'action.delete': '削除',
    'action.edit': '編集',
    'action.close': '閉じる',
    'action.search': '検索',
    'hero.title': 'AI対応PPT作成プラットフォーム',
    'hero.subtitle': '必要事項を記入すると、AIが專業的なプレゼンテーションを自動生成',
    'stat.generated': '生成済み',
    'stat.slides': 'スライド',
    'a11y.skipToContent': 'メインコンテンツへスキップ',
    'a11y.language': '言語を選択',
    'a11y.theme': 'テーマを選択',
    'a11y.reduceMotion': 'モーション軽減',
    'a11y.menu': 'メニュー',
    'a11y.help': 'ヘルプ',
    'a11y.viewMode': 'ビューモード',
    'a11y.feedback': 'フィードバック',
    'a11y.search': '検索',
    'a11y.searchHint': 'Ctrl+K',
    'a11y.reduceMotionOn': 'モーション軽減有効',
    'a11y.reduceMotionOff': 'モーション軽減無効',
    'footer.copyright': '© 2026 RabAi Mind · AI PPT作成プラットフォーム',
    'theme.light': 'ライト',
    'theme.dark': 'ダーク',
    'theme.auto': 'システム',
    'loading': '読み込み中...',
  },
  ko: {
    'nav.home': '홈',
    'nav.create': 'PPT 만들기',
    'nav.templates': '템플릿',
    'nav.media': '미디어',
    'nav.favorites': '즐겨찾기',
    'nav.history': '기록',
    'action.start': '만들기 시작',
    'action.cancel': '취소',
    'action.confirm': '확인',
    'action.save': '저장',
    'action.delete': '삭제',
    'action.edit': '편집',
    'action.close': '닫기',
    'action.search': '검색',
    'hero.title': 'AI PPT 생성 플랫폼',
    'hero.subtitle': '요구를 입력하면 AI가 전문적인 프레젠테이션을 자동 생성',
    'stat.generated': '생성됨',
    'stat.slides': '슬라이드',
    'a11y.skipToContent': '본문으로 건너뛰기',
    'a11y.language': '언어 선택',
    'a11y.theme': '테마 선택',
    'a11y.reduceMotion': '모션 줄이기',
    'a11y.menu': '메뉴',
    'a11y.help': '도움말',
    'a11y.viewMode': '보기 모드',
    'a11y.feedback': '피드백',
    'a11y.search': '검색',
    'a11y.searchHint': 'Ctrl+K',
    'a11y.reduceMotionOn': '모션 줄이기 활성화됨',
    'a11y.reduceMotionOff': '모션 줄이기 비활성화됨',
    'footer.copyright': '© 2026 RabAi Mind · AI PPT 생성 플랫폼',
    'theme.light': '라이트',
    'theme.dark': '다크',
    'theme.auto': '시스템',
    'loading': '로딩 중...',
  }
} as const

// Singleton state
const currentLocale = ref<Locale>((localStorage.getItem('locale') as Locale) || 'zh')

export function useI18n() {
  const locale = computed(() => currentLocale.value)

  const t = (key: TranslationKey): string => {
    return (translations[currentLocale.value]?.[key] as string) ||
           (translations.zh[key] as string) ||
           key
  }

  const setLocale = (newLocale: Locale) => {
    currentLocale.value = newLocale
    localStorage.setItem('locale', newLocale)
    // Update lang attribute for screen readers
    document.documentElement.lang = newLocale
  }

  const localeName = computed(() => {
    return LOCALES.find(l => l.code === currentLocale.value)?.nativeName || '中文'
  })

  // Initialize on first call
  if (typeof window !== 'undefined') {
    document.documentElement.lang = currentLocale.value
  }

  return { locale, t, setLocale, localeName, LOCALES }
}
