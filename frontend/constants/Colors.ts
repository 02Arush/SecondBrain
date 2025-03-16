const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';


const colorScheme: any = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,


    green: "#2f9e44",
    lime: "#94d82d",
    yellow: "#fab005",
    orange: "#f76707",
    red: "#e03131",
    blue: "#1c7ed6",
    purple: "#8455F3",


  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,

    green: "#2f9e44",
    lime: "#94d82d",
    yellow: "#fab005",
    orange: "#f76707",
    red: "#e03131",
    blue: "#1c7ed6",
    purple: "#8455F3"
  },
};


export const getColor = (theme: string | undefined | null = "light", color: string): string | null => {
  if (!(theme == "light" || theme == "dark")) return null;

  if (colorScheme[theme] && color in colorScheme[theme]) {
    return colorScheme[theme][color] || null;
  }

  return null;

}

export default colorScheme;