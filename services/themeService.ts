/**
 * 主题管理服务 - 实现深色/浅色主题切换
 * 使用 localStorage 永久保存主题设置
 */

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'smartbill_theme';

export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: ThemeMode = 'dark';

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) ThemeService.instance = new ThemeService();
    return ThemeService.instance;
  }

  /**
   * 初始化主题 - 从存储加载并应用
   */
  public init(): ThemeMode {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    if (saved) {
      this.currentTheme = saved;
    } else {
      // 默认使用深色主题
      this.currentTheme = 'dark';
    }
    this.applyTheme();
    return this.currentTheme;
  }

  /**
   * 获取当前主题
   */
  public getTheme(): ThemeMode {
    return this.currentTheme;
  }

  /**
   * 切换主题
   */
  public toggleTheme(): ThemeMode {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, this.currentTheme);
    this.applyTheme();
    return this.currentTheme;
  }

  /**
   * 设置主题
   */
  public setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, this.currentTheme);
    this.applyTheme();
  }

  /**
   * 应用主题到 DOM
   */
  private applyTheme(): void {
    const root = document.documentElement;
    if (this.currentTheme === 'dark') {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    }
  }
}

export const themeService = ThemeService.getInstance();
