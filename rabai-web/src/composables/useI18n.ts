/**
 * useI18n - Multi-language support (zh/en/ja/ko/es/fr/ar/he with RTL)
 */
import { ref, computed, watch } from 'vue'

export type Locale = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'ar' | 'he'

export interface LocaleOption {
  code: Locale
  name: string
  nativeName: string
  dir: 'ltr' | 'rtl'
  fontFamily: string
}

export const LOCALES: LocaleOption[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif" },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif" },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif" },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', fontFamily: "'Noto Sans Arabic', 'Segoe UI', sans-serif" },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', fontFamily: "'Noto Sans Hebrew', 'Segoe UI', sans-serif" }
]

// RTL locales
export const RTL_LOCALES: Locale[] = ['ar', 'he']

export type TranslationKey = keyof typeof translations.zh

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
    'action.localize': '翻译演示',
    'action.detectLanguage': '检测语言',
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
    'a11y.reduceMotionOn': '已开启减少动画',
    'a11y.reduceMotionOff': '已关闭减少动画',
    'a11y.highContrastOn': '已开启高对比度模式',
    'a11y.highContrastOff': '已关闭高对比度模式',
    'a11y.highContrast': '高对比度模式',
    'a11y.fontSize': '字体大小',
    'a11y.fontSizeSmall': '小',
    'a11y.fontSizeMedium': '中',
    'a11y.fontSizeLarge': '大',
    // R155: Multi-language & Accessibility
    'a11y.dyslexiaFont': '阅读障碍友好字体',
    'a11y.dyslexiaFontOn': '已开启阅读障碍友好字体',
    'a11y.dyslexiaFontOff': '已关闭阅读障碍友好字体',
    'a11y.subtitles': '实时字幕',
    'a11y.subtitlesOn': '已开启实时字幕',
    'a11y.subtitlesOff': '已关闭实时字幕',
    'a11y.subtitleLanguage': '字幕语言',
    'a11y.signAvatar': '手语主播',
    'a11y.signAvatarOn': '已开启手语主播',
    'a11y.signAvatarOff': '已关闭手语主播',
    'a11y.pipNotes': '演讲者备注小窗',
    'a11y.pipNotesOn': '已开启备注小窗',
    'a11y.pipNotesOff': '已关闭备注小窗',
    // Footer
    'footer.copyright': '© 2026 RabAi Mind · AI PPT 生成平台',
    'theme.light': '亮色模式',
    'theme.dark': '暗色模式',
    'theme.auto': '跟随系统',
    // Loading
    'loading': '加载中...',
    // Localization
    'localize.title': '翻译演示文稿',
    'localize.selectLanguage': '选择目标语言',
    'localize.detecting': '正在检测语言...',
    'localize.detected': '检测到语言',
    'localize.translating': '正在翻译...',
    'localize.success': '翻译成功',
    'localize.error': '翻译失败',
    'localize.sourceLanguage': '源语言',
    'localize.targetLanguage': '目标语言',
    // Font
    'font.rendering': '字体渲染优化',
    'font.system': '系统字体',
    'font.custom': '自定义字体',
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
    'action.localize': 'Localize Presentation',
    'action.detectLanguage': 'Detect Language',
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
    'a11y.highContrastOn': 'High contrast mode enabled',
    'a11y.highContrastOff': 'High contrast mode disabled',
    'a11y.highContrast': 'High contrast mode',
    'a11y.fontSize': 'Font size',
    'a11y.fontSizeSmall': 'Small',
    'a11y.fontSizeMedium': 'Medium',
    'a11y.fontSizeLarge': 'Large',
    // R155: Multi-language & Accessibility
    'a11y.dyslexiaFont': 'Dyslexia-friendly font',
    'a11y.dyslexiaFontOn': 'Dyslexia font enabled',
    'a11y.dyslexiaFontOff': 'Dyslexia font disabled',
    'a11y.subtitles': 'Subtitles',
    'a11y.subtitlesOn': 'Subtitles enabled',
    'a11y.subtitlesOff': 'Subtitles disabled',
    'a11y.subtitleLanguage': 'Subtitle language',
    'a11y.signAvatar': 'Sign language avatar',
    'a11y.signAvatarOn': 'Sign avatar enabled',
    'a11y.signAvatarOff': 'Sign avatar disabled',
    'a11y.pipNotes': 'Picture-in-Picture notes',
    'a11y.pipNotesOn': 'PiP enabled',
    'a11y.pipNotesOff': 'PiP disabled',
    'footer.copyright': '© 2026 RabAi Mind · AI PPT Generation Platform',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'System',
    'loading': 'Loading...',
    'localize.title': 'Localize Presentation',
    'localize.selectLanguage': 'Select target language',
    'localize.detecting': 'Detecting language...',
    'localize.detected': 'Detected language',
    'localize.translating': 'Translating...',
    'localize.success': 'Translation successful',
    'localize.error': 'Translation failed',
    'localize.sourceLanguage': 'Source language',
    'localize.targetLanguage': 'Target language',
    'font.rendering': 'Font rendering optimization',
    'font.system': 'System font',
    'font.custom': 'Custom font',
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
    'action.localize': 'プレゼン翻訳',
    'action.detectLanguage': '言語を検出',
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
    'a11y.highContrastOn': 'ハイコントラストモード有効',
    'a11y.highContrastOff': 'ハイコントラストモード無効',
    'a11y.highContrast': 'ハイコントラストモード',
    'a11y.fontSize': 'フォントサイズ',
    'a11y.fontSizeSmall': '小',
    'a11y.fontSizeMedium': '中',
    'a11y.fontSizeLarge': '大',
    // R155
    'a11y.dyslexiaFont': '難読症向けフォント',
    'a11y.dyslexiaFontOn': '難読症向けフォント有効',
    'a11y.dyslexiaFontOff': '難読症向けフォント無効',
    'a11y.subtitles': '字幕',
    'a11y.subtitlesOn': '字幕有効',
    'a11y.subtitlesOff': '字幕無効',
    'a11y.subtitleLanguage': '字幕言語',
    'a11y.signAvatar': '手話アバター',
    'a11y.signAvatarOn': '手話アバター有効',
    'a11y.signAvatarOff': '手話アバター無効',
    'a11y.pipNotes': '備考ピクチャーインピクチャー',
    'a11y.pipNotesOn': 'PiP有効',
    'a11y.pipNotesOff': 'PiP無効',
    'footer.copyright': '© 2026 RabAi Mind · AI PPT作成プラットフォーム',
    'theme.light': 'ライト',
    'theme.dark': 'ダーク',
    'theme.auto': 'システム',
    'loading': '読み込み中...',
    'localize.title': 'プレゼンテーション翻訳',
    'localize.selectLanguage': '対象言語を選択',
    'localize.detecting': '言語を検出中...',
    'localize.detected': '検出された言語',
    'localize.translating': '翻訳中...',
    'localize.success': '翻訳成功',
    'localize.error': '翻訳失敗',
    'localize.sourceLanguage': '元の言語',
    'localize.targetLanguage': '対象言語',
    'font.rendering': 'フォントレンダリング最適化',
    'font.system': 'システムフォント',
    'font.custom': 'カスタムフォント',
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
    'action.localize': '프레젠테이션 번역',
    'action.detectLanguage': '언어 감지',
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
    'a11y.highContrastOn': '고대비 모드 활성화됨',
    'a11y.highContrastOff': '고대비 모드 비활성화됨',
    'a11y.highContrast': '고대비 모드',
    'a11y.fontSize': '글꼴 크기',
    'a11y.fontSizeSmall': '소',
    'a11y.fontSizeMedium': '중',
    'a11y.fontSizeLarge': '대',
    // R155
    'a11y.dyslexiaFont': '난독증 친화 서체',
    'a11y.dyslexiaFontOn': '난독증 서체 활성화됨',
    'a11y.dyslexiaFontOff': '난독증 서체 비활성화됨',
    'a11y.subtitles': '자막',
    'a11y.subtitlesOn': '자막 활성화됨',
    'a11y.subtitlesOff': '자막 비활성화됨',
    'a11y.subtitleLanguage': '자막 언어',
    'a11y.signAvatar': '수화 아바타',
    'a11y.signAvatarOn': '수화 아바타 활성화됨',
    'a11y.signAvatarOff': '수화 아바타 비활성화됨',
    'a11y.pipNotes': '발표자 메모 PiP',
    'a11y.pipNotesOn': 'PiP 활성화됨',
    'a11y.pipNotesOff': 'PiP 비활성화됨',
    'footer.copyright': '© 2026 RabAi Mind · AI PPT 생성 플랫폼',
    'theme.light': '라이트',
    'theme.dark': '다크',
    'theme.auto': '시스템',
    'loading': '로딩 중...',
    'localize.title': '프레젠테이션 번역',
    'localize.selectLanguage': '대상 언어 선택',
    'localize.detecting': '언어 감지 중...',
    'localize.detected': '감지된 언어',
    'localize.translating': '번역 중...',
    'localize.success': '번역 성공',
    'localize.error': '번역 실패',
    'localize.sourceLanguage': '원본 언어',
    'localize.targetLanguage': '대상 언어',
    'font.rendering': '글꼴 렌더링 최적화',
    'font.system': '시스템 글꼴',
    'font.custom': '사용자 글꼴',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.create': 'Crear PPT',
    'nav.templates': 'Plantillas',
    'nav.media': 'Medios',
    'nav.favorites': 'Favoritos',
    'nav.history': 'Historial',
    'action.start': 'Empezar a crear',
    'action.cancel': 'Cancelar',
    'action.confirm': 'Confirmar',
    'action.save': 'Guardar',
    'action.delete': 'Eliminar',
    'action.edit': 'Editar',
    'action.close': 'Cerrar',
    'action.search': 'Buscar',
    'action.localize': 'Localizar presentación',
    'action.detectLanguage': 'Detectar idioma',
    'hero.title': 'Plataforma de Generación de PPT con IA',
    'hero.subtitle': 'Describe tus necesidades, la IA genera presentaciones profesionales',
    'stat.generated': 'Generados',
    'stat.slides': 'Diapositivas',
    'a11y.skipToContent': 'Saltar al contenido principal',
    'a11y.language': 'Seleccionar idioma',
    'a11y.theme': 'Seleccionar tema',
    'a11y.reduceMotion': 'Reducir movimiento',
    'a11y.menu': 'Menú',
    'a11y.help': 'Ayuda',
    'a11y.viewMode': 'Modo de vista',
    'a11y.feedback': 'Comentarios',
    'a11y.search': 'Buscar',
    'a11y.searchHint': 'Ctrl+K',
    'a11y.reduceMotionOn': 'Reducción de movimiento activada',
    'a11y.reduceMotionOff': 'Reducción de movimiento desactivada',
    'a11y.highContrastOn': 'Modo de alto contraste activado',
    'a11y.highContrastOff': 'Modo de alto contraste desactivado',
    'a11y.highContrast': 'Modo de alto contraste',
    'a11y.fontSize': 'Tamaño de fuente',
    'a11y.fontSizeSmall': 'Pequeño',
    'a11y.fontSizeMedium': 'Mediano',
    'a11y.fontSizeLarge': 'Grande',
    // R155
    'a11y.dyslexiaFont': 'Fuente para dislexia',
    'a11y.dyslexiaFontOn': 'Fuente dislexia activada',
    'a11y.dyslexiaFontOff': 'Fuente dislexia desactivada',
    'a11y.subtitles': 'Subtítulos',
    'a11y.subtitlesOn': 'Subtítulos activados',
    'a11y.subtitlesOff': 'Subtítulos desactivados',
    'a11y.subtitleLanguage': 'Idioma de subtítulos',
    'a11y.signAvatar': 'Avatar de lengua de signos',
    'a11y.signAvatarOn': 'Avatar LS activado',
    'a11y.signAvatarOff': 'Avatar LS desactivado',
    'a11y.pipNotes': 'PiP notas del presentador',
    'a11y.pipNotesOn': 'PiP activado',
    'a11y.pipNotesOff': 'PiP desactivado',
    'footer.copyright': '© 2026 RabAi Mind · Plataforma de Generación de PPT con IA',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'theme.auto': 'Sistema',
    'loading': 'Cargando...',
    'localize.title': 'Localizar presentación',
    'localize.selectLanguage': 'Seleccionar idioma destino',
    'localize.detecting': 'Detectando idioma...',
    'localize.detected': 'Idioma detectado',
    'localize.translating': 'Traduciendo...',
    'localize.success': 'Traducción exitosa',
    'localize.error': 'Traducción fallida',
    'localize.sourceLanguage': 'Idioma de origen',
    'localize.targetLanguage': 'Idioma destino',
    'font.rendering': 'Optimización de renderizado de fuente',
    'font.system': 'Fuente del sistema',
    'font.custom': 'Fuente personalizada',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.create': 'Créer PPT',
    'nav.templates': 'Modèles',
    'nav.media': 'Médias',
    'nav.favorites': 'Favoris',
    'nav.history': 'Historique',
    'action.start': 'Commencer à créer',
    'action.cancel': 'Annuler',
    'action.confirm': 'Confirmer',
    'action.save': 'Enregistrer',
    'action.delete': 'Supprimer',
    'action.edit': 'Modifier',
    'action.close': 'Fermer',
    'action.search': 'Rechercher',
    'action.localize': 'Localiser la présentation',
    'action.detectLanguage': 'Détecter la langue',
    'hero.title': 'Plateforme de Génération PPT par IA',
    'hero.subtitle': 'Décrivez vos besoins, l\'IA génère des présentations professionnelles',
    'stat.generated': 'Générés',
    'stat.slides': 'Diapositives',
    'a11y.skipToContent': 'Passer au contenu principal',
    'a11y.language': 'Sélectionner la langue',
    'a11y.theme': 'Sélectionner le thème',
    'a11y.reduceMotion': 'Réduire le mouvement',
    'a11y.menu': 'Menu',
    'a11y.help': 'Aide',
    'a11y.viewMode': 'Mode d\'affichage',
    'a11y.feedback': 'Commentaires',
    'a11y.search': 'Rechercher',
    'a11y.searchHint': 'Ctrl+K',
    'a11y.reduceMotionOn': 'Réduction du mouvement activée',
    'a11y.reduceMotionOff': 'Réduction du mouvement désactivée',
    'a11y.highContrastOn': 'Mode contraste élevé activé',
    'a11y.highContrastOff': 'Mode contraste élevé désactivé',
    'a11y.highContrast': 'Mode contraste élevé',
    'a11y.fontSize': 'Taille de police',
    'a11y.fontSizeSmall': 'Petit',
    'a11y.fontSizeMedium': 'Moyen',
    'a11y.fontSizeLarge': 'Grand',
    // R155
    'a11y.dyslexiaFont': 'Police dyslexie',
    'a11y.dyslexiaFontOn': 'Police dyslexie activée',
    'a11y.dyslexiaFontOff': 'Police dyslexie désactivée',
    'a11y.subtitles': 'Sous-titres',
    'a11y.subtitlesOn': 'Sous-titres activés',
    'a11y.subtitlesOff': 'Sous-titres désactivés',
    'a11y.subtitleLanguage': 'Langue des sous-titres',
    'a11y.signAvatar': 'Avatar langue des signes',
    'a11y.signAvatarOn': 'Avatar LSF activé',
    'a11y.signAvatarOff': 'Avatar LSF désactivé',
    'a11y.pipNotes': 'PiP notes orateur',
    'a11y.pipNotesOn': 'PiP activé',
    'a11y.pipNotesOff': 'PiP désactivé',
    'footer.copyright': '© 2026 RabAi Mind · Plateforme de Génération PPT par IA',
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'theme.auto': 'Système',
    'loading': 'Chargement...',
    'localize.title': 'Localiser la présentation',
    'localize.selectLanguage': 'Sélectionner la langue cible',
    'localize.detecting': 'Détection de la langue...',
    'localize.detected': 'Langue détectée',
    'localize.translating': 'Traduction en cours...',
    'localize.success': 'Traduction réussie',
    'localize.error': 'Échec de la traduction',
    'localize.sourceLanguage': 'Langue source',
    'localize.targetLanguage': 'Langue cible',
    'font.rendering': 'Optimisation du rendu de police',
    'font.system': 'Police système',
    'font.custom': 'Police personnalisée',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.create': 'إنشاء عرض',
    'nav.templates': 'القوالب',
    'nav.media': 'الوسائط',
    'nav.favorites': 'المفضلة',
    'nav.history': 'السجل',
    'action.start': 'ابدأ الإنشاء',
    'action.cancel': 'إلغاء',
    'action.confirm': 'تأكيد',
    'action.save': 'حفظ',
    'action.delete': 'حذف',
    'action.edit': 'تعديل',
    'action.close': 'إغلاق',
    'action.search': 'بحث',
    'action.localize': 'ترجمة العرض',
    'action.detectLanguage': 'كشف اللغة',
    'hero.title': 'منصة إنشاء العروض بالذكاء الاصطناعي',
    'hero.subtitle': 'صِف احتياجاتك، والذكاء الاصطناعي يُنشئ عروضاً احترافية',
    'stat.generated': 'تم الإنشاء',
    'stat.slides': 'شرائح',
    'a11y.skipToContent': 'انتقل إلى المحتوى الرئيسي',
    'a11y.language': 'اختر اللغة',
    'a11y.theme': 'اختر السمة',
    'a11y.reduceMotion': 'تقليل الحركة',
    'a11y.menu': 'القائمة',
    'a11y.help': 'مساعدة',
    'a11y.viewMode': 'وضع العرض',
    'a11y.feedback': 'ملاحظات',
    'a11y.search': 'بحث',
    'a11y.searchHint': 'Ctrl+K',
    'a11y.reduceMotionOn': 'تم تفعيل تقليل الحركة',
    'a11y.reduceMotionOff': 'تم إلغاء تقليل الحركة',
    'a11y.highContrastOn': 'تم تفعيل وضع التباين العالي',
    'a11y.highContrastOff': 'تم إلغاء وضع التباين العالي',
    'a11y.highContrast': 'وضع التباين العالي',
    'a11y.fontSize': 'حجم الخط',
    'a11y.fontSizeSmall': 'صغير',
    'a11y.fontSizeMedium': 'متوسط',
    'a11y.fontSizeLarge': 'كبير',
    // R155
    'a11y.dyslexiaFont': 'خط友好的 للتمييز',
    'a11y.dyslexiaFontOn': 'خط التمييز مفعل',
    'a11y.dyslexiaFontOff': 'خط التمييز معطل',
    'a11y.subtitles': 'الترجمة المصاحبة',
    'a11y.subtitlesOn': 'الترجمة المصاحبة مفعلة',
    'a11y.subtitlesOff': 'الترجمة المصاحبة معطلة',
    'a11y.subtitleLanguage': 'لغة الترجمة المصاحبة',
    'a11y.signAvatar': 'أفاتار لغة الإشارة',
    'a11y.signAvatarOn': 'أفاتار لغة الإشارة مفعل',
    'a11y.signAvatarOff': 'أفاتار لغة الإشارة معطل',
    'a11y.pipNotes': 'صورة في صورة للملاحظات',
    'a11y.pipNotesOn': 'PiP مفعل',
    'a11y.pipNotesOff': 'PiP معطل',
    'footer.copyright': '© 2026 RabAi Mind · منصة إنشاء العروض بالذكاء الاصطناعي',
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.auto': 'النظام',
    'loading': 'جاري التحميل...',
    'localize.title': 'ترجمة العرض التقديمي',
    'localize.selectLanguage': 'اختر اللغة الهدف',
    'localize.detecting': 'جاري كشف اللغة...',
    'localize.detected': 'تم كشف اللغة',
    'localize.translating': 'جاري الترجمة...',
    'localize.success': 'تمت الترجمة بنجاح',
    'localize.error': 'فشلت الترجمة',
    'localize.sourceLanguage': 'اللغة المصدر',
    'localize.targetLanguage': 'اللغة الهدف',
    'font.rendering': 'تحسين عرض الخطوط',
    'font.system': 'خط النظام',
    'font.custom': 'خط مخصص',
  },
  he: {
    'nav.home': 'בית',
    'nav.create': 'צור מצגת',
    'nav.templates': 'תבניות',
    'nav.media': 'מדיה',
    'nav.favorites': 'מועדפים',
    'nav.history': 'היסטוריה',
    'action.start': 'התחל ליצור',
    'action.cancel': 'ביטול',
    'action.confirm': 'אישור',
    'action.save': 'שמור',
    'action.delete': 'מחק',
    'action.edit': 'ערוך',
    'action.close': 'סגור',
    'action.search': 'חפש',
    'action.localize': 'תרגם מצגת',
    'action.detectLanguage': 'זהה שפה',
    'hero.title': 'פלטמפורמת יצירת מצגות AI',
    'hero.subtitle': 'תאר את הצרכים שלך, AI יוצר מצגות מקצועיות',
    'stat.generated': 'נוצרו',
    'stat.slides': 'שקופיות',
    'a11y.skipToContent': 'דלג לתוכן העיקרי',
    'a11y.language': 'בחר שפה',
    'a11y.theme': 'בחר ערכת נושא',
    'a11y.reduceMotion': 'הפחת תנועה',
    'a11y.menu': 'תפריט',
    'a11y.help': 'עזרה',
    'a11y.viewMode': 'מצב תצוגה',
    'a11y.feedback': 'משוב',
    'a11y.search': 'חיפוש',
    'a11y.searchHint': 'Ctrl+K',
    'a11y.reduceMotionOn': 'הפחתת תנועה הופעלה',
    'a11y.reduceMotionOff': 'הפחתת תנועה הוסרה',
    'a11y.highContrastOn': 'מצב ניגודיות גבוהה הופעל',
    'a11y.highContrastOff': 'מצב ניגודיות גבוהה הוסר',
    'a11y.highContrast': 'מצב ניגודיות גבוהה',
    'a11y.fontSize': 'גודל גופן',
    'a11y.fontSizeSmall': 'קטן',
    'a11y.fontSizeMedium': 'בינוני',
    'a11y.fontSizeLarge': 'גדול',
    // R155
    'a11y.dyslexiaFont': 'גופן לקשת הקריאה',
    'a11y.dyslexiaFontOn': 'גופן לקשת הקריאה הופעל',
    'a11y.dyslexiaFontOff': 'גופן לקשת הקריאה הוסר',
    'a11y.subtitles': 'כתוביות',
    'a11y.subtitlesOn': 'כתוביות הופעלו',
    'a11y.subtitlesOff': 'כתוביות הוסרו',
    'a11y.subtitleLanguage': 'שפת כתוביות',
    'a11y.signAvatar': 'אוואטר שפת סימנים',
    'a11y.signAvatarOn': 'אוואטר שפת סימנים הופעל',
    'a11y.signAvatarOff': 'אוואטר שפת סימנים הוסר',
    'a11y.pipNotes': 'תמונה בתוך תמונה להערות',
    'a11y.pipNotesOn': 'PiP הופעל',
    'a11y.pipNotesOff': 'PiP הוסר',
    'footer.copyright': '© 2026 RabAi Mind · פלטמפורמת יצירת מצגות AI',
    'theme.light': 'בהיר',
    'theme.dark': 'כהה',
    'theme.auto': 'מערכת',
    'loading': 'טוען...',
    'localize.title': 'תרגום המצגת',
    'localize.selectLanguage': 'בחר שפת יעד',
    'localize.detecting': 'מזהה שפה...',
    'localize.detected': 'השפה זוהתה',
    'localize.translating': 'מתרגם...',
    'localize.success': 'התרגום הצליח',
    'localize.error': 'התרגום נכשל',
    'localize.sourceLanguage': 'שפת מקור',
    'localize.targetLanguage': 'שפת יעד',
    'font.rendering': 'אופטימיזציית עיבוד גופנים',
    'font.system': 'גופן מערכת',
    'font.custom': 'גופן מותאם',
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

  const isRTL = computed(() => RTL_LOCALES.includes(currentLocale.value))

  const setLocale = (newLocale: Locale) => {
    currentLocale.value = newLocale
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
    document.documentElement.dir = RTL_LOCALES.includes(newLocale) ? 'rtl' : 'ltr'
    applyFontForLocale(newLocale)
  }

  const localeName = computed(() => {
    return LOCALES.find(l => l.code === currentLocale.value)?.nativeName || '中文'
  })

  const currentLocaleOption = computed(() => {
    return LOCALES.find(l => l.code === currentLocale.value) || LOCALES[0]
  })

  // Apply font and direction on init and change
  const applyFontForLocale = (loc: Locale) => {
    const option = LOCALES.find(l => l.code === loc)
    if (option) {
      document.documentElement.style.setProperty('--font-family-i18n', option.fontFamily)
    }
  }

  // Initialize on first call
  if (typeof window !== 'undefined') {
    document.documentElement.lang = currentLocale.value
    document.documentElement.dir = RTL_LOCALES.includes(currentLocale.value) ? 'rtl' : 'ltr'
    applyFontForLocale(currentLocale.value)
  }

  // Watch for locale changes to update direction/font
  watch(currentLocale, (newLocale) => {
    document.documentElement.dir = RTL_LOCALES.includes(newLocale) ? 'rtl' : 'ltr'
    applyFontForLocale(newLocale)
  })

  return { locale, t, setLocale, localeName, LOCALES, isRTL, currentLocaleOption }
}

// Auto-detect content language using character analysis
export function detectLanguage(text: string): Locale {
  if (!text || text.trim().length === 0) return 'en'

  // Arabic ranges: \u0600-\u06FF
  if (/[\u0600-\u06FF]/.test(text)) return 'ar'
  // Hebrew ranges: \u0590-\u05FF
  if (/[\u0590-\u05FF]/.test(text)) return 'he'
  // Japanese: Hiragana \u3040-\u309F, Katakana \u30A0-\u30FF
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'
  // Korean: Hangul \uAC00-\uD7AF
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'
  // Chinese: CJK ranges
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'
  // Spanish common words
  if (/\b(el|la|los|las|un|una|de|que|es|en|con|para|por|está|son|tiene|este|esta|ese|esa)\b/i.test(text) && /[áéíóúñü¿¡]/.test(text)) return 'es'
  // French common words
  if (/\b(le|la|les|un|une|de|du|des|que|qui|est|et|en|avec|pour|dans|sur|ce| cette|ces|pas|plus|par|son|sa|ses)\b/i.test(text) && /[àâäéèêëïîôùûüÿçœæ]/i.test(text)) return 'fr'

  return 'en'
}
// R131: Localized number formatting
export function formatNumber(value: number, locale?: Locale): string {
  const loc = locale || currentLocale.value
  const localeMap: Record<Locale, string> = {
    'zh': 'zh-CN', 'en': 'en-US', 'ja': 'ja-JP', 'ko': 'ko-KR',
    'es': 'es-ES', 'fr': 'fr-FR', 'ar': 'ar-SA', 'he': 'he-IL'
  }
  return new Intl.NumberFormat(localeMap[loc]).format(value)
}

// R131: Localized date formatting
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions, locale?: Locale): string {
  const loc = locale || currentLocale.value
  const localeMap: Record<Locale, string> = {
    'zh': 'zh-CN', 'en': 'en-US', 'ja': 'ja-JP', 'ko': 'ko-KR',
    'es': 'es-ES', 'fr': 'fr-FR', 'ar': 'ar-SA', 'he': 'he-IL'
  }
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric', ...options
  }
  return new Intl.DateTimeFormat(localeMap[loc], defaultOptions).format(d)
}

// R131: Localized relative time (e.g. "2 hours ago")
export function formatRelativeTime(date: Date | string | number, locale?: Locale): string {
  const loc = locale || currentLocale.value
  const localeMap: Record<Locale, string> = {
    'zh': 'zh-CN', 'en': 'en-US', 'ja': 'ja-JP', 'ko': 'ko-KR',
    'es': 'es-ES', 'fr': 'fr-FR', 'ar': 'ar-SA', 'he': 'he-IL'
  }
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  const rtf = new Intl.RelativeTimeFormat(localeMap[loc], { numeric: 'auto' })
  if (diffDay !== 0) return rtf.format(-diffDay, 'day')
  if (diffHour !== 0) return rtf.format(-diffHour, 'hour')
  if (diffMin !== 0) return rtf.format(-diffMin, 'minute')
  return rtf.format(-diffSec, 'second')
}
