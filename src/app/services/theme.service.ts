export type ThemeName = 'light' | 'dark';

export interface ThemeSettings {
  nodeFillColor: string;
  nodeStrokeColor: string;
  textKeyColor: string;
  textValueColor: string;
  textValueNullColor: string;
  connectorStrokeColor: string;
  expandIconColor: string;
  expandIconFillColor: string;
  expandIconBorder: string;
  backgroundColor: string;
  gridlinesColor: string;
  childCountColor: string;
  booleanColor: string;
  numericColor: string;
  popupKeyColor: string;
  popupValueColor: string;
  popupContentBGColor: string;
  highlightFillColor: string;
  highlightFocusColor: string;
  highlightStrokeColor: string;
}

const themes: Record<string, ThemeSettings> = {
  light: {
    nodeFillColor: 'rgb(255, 255, 255)',
    nodeStrokeColor: 'rgb(188, 190, 192)',
    textKeyColor: '#A020F0',
    textValueColor: 'rgb(83, 83, 83)',
    textValueNullColor: 'rgb(41, 41, 41)',
    connectorStrokeColor: 'rgb(188, 190, 192)',
    expandIconColor: 'rgb(46, 51, 56)',
    expandIconFillColor: '#e0dede',
    expandIconBorder: 'rgb(188, 190, 192)',
    backgroundColor: '#F8F9FA',
    gridlinesColor: '#EBE8E8',
    childCountColor: 'rgb(41, 41, 41)',
    booleanColor: 'rgb(74, 145, 67)',
    numericColor: 'rgb(182, 60, 30)',
    popupKeyColor: '#5C940D',
    popupValueColor: '#1864AB',
    popupContentBGColor: '#F8F9FA',
    highlightFillColor: 'rgba(27, 255, 0, 0.1)',
    highlightFocusColor: 'rgba(252, 255, 166, 0.57)',
    highlightStrokeColor: 'rgb(0, 135, 54)',
  },
  dark: {
    nodeFillColor: 'rgb(41, 41, 41)',
    nodeStrokeColor: 'rgb(66, 66, 66)',
    textKeyColor: '#4dabf7',
    textValueColor: 'rgb(207, 227, 225)',
    textValueNullColor: 'rgb(151, 150, 149)',
    connectorStrokeColor: 'rgb(66, 66, 66)',
    expandIconColor: 'rgb(220, 221, 222)',
    expandIconFillColor: '#1e1e1e',
    expandIconBorder: 'rgb(66, 66, 66)',
    backgroundColor: '#1e1e1e',
    gridlinesColor: 'rgb(45, 45, 45)',
    childCountColor: 'rgb(255, 255, 255)',
    booleanColor: 'rgb(61, 226, 49)',
    numericColor: 'rgb(232, 196, 121)',
    popupKeyColor: '#A5D8FF',
    popupValueColor: '#40C057',
    popupContentBGColor: '#1A1A1A',
    highlightFillColor: 'rgba(27, 255, 0, 0.1)',
    highlightFocusColor: 'rgba(82, 102, 0, 0.61)',
    highlightStrokeColor: 'rgb(0, 135, 54)',
  }
};
class ThemeService {
  private currentTheme: ThemeName = 'light';

  setTheme(theme: ThemeName) {
    this.currentTheme = theme;
    document.body.classList.toggle('dark-theme', theme === 'dark');
  }

  getTheme(): ThemeName {
    return this.currentTheme;
  }

  getCurrentThemeSettings(): ThemeSettings {
    return themes[this.currentTheme];
  }
}

const themeService = new ThemeService();
export default themeService;
