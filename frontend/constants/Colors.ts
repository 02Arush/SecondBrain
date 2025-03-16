const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';


const globals = {
  purple: "#8455F3",
  green: "#24845c",
  lime: "#528823"
}

const colorScheme: any = {
  light: {
    text: '#000',
    background: '#fefefe',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,


    green: globals.green,
    lime: globals.lime,
    yellow: "#fab005",
    orange: "#f76707",
    red: "#ce4257",
    blue: "#1c7ed6",
    purple: globals.purple,


  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,

    green: globals.green,
    lime: globals.lime,
    yellow: "#fab005",
    orange: "#f76707",
    red: "#ce4257",
    blue: "#1c7ed6",
    purple: globals.purple,
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