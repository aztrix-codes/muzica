import React, { createContext, useState, useContext, useEffect } from 'react';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

const fontSizes = {
  s: Math.floor(screenWidth * 0.03),     
  m: Math.floor(screenWidth * 0.04),     
  l: Math.floor(screenWidth * 0.05),     
  xl: Math.floor(screenWidth * 0.06),    
  xxl: Math.floor(screenWidth * 0.07),   
  xxxl: Math.floor(screenWidth * 0.09),  
};

const yard = Math.floor(screenWidth * 0.03); 

const defaultCustomTheme = {
  id: '0',
  name: 'Custom',
  type: 'light',
  colors: {
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F5F5F5',
    tPrimary: '#000000',
    tSecondary: '#555555',
    accent: '#3498db',
  },
  fontSizes,
  yard,
};

const themes = {
  '0': defaultCustomTheme,
  light: {
    id: 'light',
    name: 'Light',
    type: 'light',
    colors: {
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F5F5F5',
      tPrimary: '#000000',
      tSecondary: '#555555',
      accent: '#3498db',
    },
    fontSizes,
    yard,
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    type: 'dark',
    colors: {
      bgPrimary: '#121212',
      bgSecondary: '#1E1E1E',
      tPrimary: '#FFFFFF',
      tSecondary: '#AAAAAA',
      accent: '#3498db',
    },
    fontSizes,
    yard,
  },
  amoled: {
    id: 'amoled',
    name: 'AMOLED',
    type: 'dark',
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#0F0F12',
      tPrimary: '#E1E1E6',
      tSecondary: '#A0A0A7',
      accent: '#5865F2',
    },
    fontSizes,
    yard,
  },
  tokyoNight: {
    id: 'tokyoNight',
    name: 'Tokyo Night',
    type: 'dark',
    colors: {
      bgPrimary: '#1A1B26',
      bgSecondary: '#24283B',
      tPrimary: '#A9B1D6',
      tSecondary: '#787C99',
      accent: '#7AA2F7',
    },
    fontSizes,
    yard,
  },
  amoledTokyoNight: {
    id: 'amoledTokyoNight',
    name: 'AMOLED Tokyo Night',
    type: 'dark',
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#13141F',
      tPrimary: '#A9B1D6',
      tSecondary: '#787C99',
      accent: '#7AA2F7',
    },
    fontSizes,
    yard,
  },
  neonDarkAmoled: {
    id: 'neonDarkAmoled',
    name: 'Neon Dark',
    type: 'dark',
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#0A0A0A',
      tPrimary: '#FFFFFF',
      tSecondary: '#BBBBBB',
      accent: '#00FFFF',
    },
    fontSizes,
    yard,
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
      bgPrimary: '#2E3440',
      bgSecondary: '#3B4252',
      tPrimary: '#D8DEE9',
      tSecondary: '#E5E9F0',
      accent: '#88C0D0',
    },
    fontSizes,
    yard,
  },
  solarizedLight: {
    id: 'solarizedLight',
    name: 'Solarized Light',
    type: 'light',
    colors: {
      bgPrimary: '#FDF6E3',
      bgSecondary: '#EEE8D5',
      tPrimary: '#586E75',
      tSecondary: '#657B83',
      accent: '#268BD2',
    },
    fontSizes,
    yard,
  },
  solarizedDark: {
    id: 'solarizedDark',
    name: 'Solarized Dark',
    type: 'dark',
    colors: {
      bgPrimary: '#002B36',
      bgSecondary: '#073642',
      tPrimary: '#839496',
      tSecondary: '#93A1A1',
      accent: '#268BD2',
    },
    fontSizes,
    yard,
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    type: 'dark',
    colors: {
      bgPrimary: '#282A36',
      bgSecondary: '#44475A',
      tPrimary: '#F8F8F2',
      tSecondary: '#BFBFBF',
      accent: '#BD93F9',
    },
    fontSizes,
    yard,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    type: 'light',
    colors: {
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F6F8FA',
      tPrimary: '#24292E',
      tSecondary: '#586069',
      accent: '#0366D6',
    },
    fontSizes,
    yard,
  },
  githubDark: {
    id: 'githubDark',
    name: 'GitHub Dark',
    type: 'dark',
    colors: {
      bgPrimary: '#0D1117',
      bgSecondary: '#161B22',
      tPrimary: '#C9D1D9',
      tSecondary: '#8B949E',
      accent: '#58A6FF',
    },
    fontSizes,
    yard,
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    type: 'dark',
    colors: {
      bgPrimary: '#272822',
      bgSecondary: '#3E3D32',
      tPrimary: '#F8F8F2',
      tSecondary: '#CFCFC2',
      accent: '#A6E22E',
    },
    fontSizes,
    yard,
  },
  materialOcean: {
    id: 'materialOcean',
    name: 'Material Ocean',
    type: 'dark',
    colors: {
      bgPrimary: '#0F111A',
      bgSecondary: '#181A1F',
      tPrimary: '#A6ACCD',
      tSecondary: '#8F93A2',
      accent: '#84FFFF',
    },
    fontSizes,
    yard,
  },
  gruvbox: {
    id: 'gruvbox',
    name: 'Gruvbox',
    type: 'dark',
    colors: {
      bgPrimary: '#282828',
      bgSecondary: '#3C3836',
      tPrimary: '#EBDBB2',
      tSecondary: '#D5C4A1',
      accent: '#B8BB26',
    },
    fontSizes,
    yard,
  },
  gruvboxLight: {
    id: 'gruvboxLight',
    name: 'Gruvbox Light',
    type: 'light',
    colors: {
      bgPrimary: '#FBF1C7',
      bgSecondary: '#EBDBB2',
      tPrimary: '#3C3836',
      tSecondary: '#504945',
      accent: '#98971A',
    },
    fontSizes,
    yard,
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin',
    type: 'dark',
    colors: {
      bgPrimary: '#1E1E2E',
      bgSecondary: '#302D41',
      tPrimary: '#D9E0EE',
      tSecondary: '#C3BAC6',
      accent: '#F5C2E7',
    },
    fontSizes,
    yard,
  },
  everforest: {
    id: 'everforest',
    name: 'Everforest',
    type: 'dark',
    colors: {
      bgPrimary: '#2B3339',
      bgSecondary: '#323C41',
      tPrimary: '#D3C6AA',
      tSecondary: '#A7C080',
      accent: '#7FBBB3',
    },
    fontSizes,
    yard,
  },
  rosePine: {
    id: 'rosePine',
    name: 'Rose Pine',
    type: 'dark',
    colors: {
      bgPrimary: '#191724',
      bgSecondary: '#1F1D2E',
      tPrimary: '#E0DEF4',
      tSecondary: '#908CAA',
      accent: '#EBBCBA',
    },
    fontSizes,
    yard,
  },
  oneDark: {
    id: 'oneDark',
    name: 'One Dark',
    type: 'dark',
    colors: {
      bgPrimary: '#282C34',
      bgSecondary: '#21252B',
      tPrimary: '#ABB2BF',
      tSecondary: '#828997',
      accent: '#98C379',
    },
    fontSizes,
    yard,
  },
  midnightBlurple: {
    id: 'midnightBlurple',
    name: 'Midnight Blurple',
    type: 'dark',
    colors: {
      bgPrimary: '#0A081F',
      bgSecondary: '#13102E',
      tPrimary: '#E8E6FF',
      tSecondary: '#B8B5E1',
      accent: '#7B78FF',
    },
    fontSizes,
    yard,
  },
  blurpleTwilight: {
    id: 'blurpleTwilight',
    name: 'Blurple Twilight',
    type: 'dark',
    colors: {
      bgPrimary: '#08081A',
      bgSecondary: '#141436',
      tPrimary: '#E0E1FF',
      tSecondary: '#B3B5E6',
      accent: '#9D9EFF',
    },
    fontSizes,
    yard,
  },
  cottonCandy: {
    id: 'cottonCandy',
    name: 'Cotton Candy',
    type: 'light',
    colors: {
      bgPrimary: '#FFEEFF',
      bgSecondary: '#FFD6F5',
      tPrimary: '#785E6A',
      tSecondary: '#A481A1',
      accent: '#FF8DC7',
    },
    fontSizes,
    yard,
  },
  rain: {
    id: 'rain',
    name: 'Rain',
    type: 'dark',
    colors: {
      bgPrimary: '#1A2733',
      bgSecondary: '#26353F',
      tPrimary: '#D8E1E9',
      tSecondary: '#A1B4C4',
      accent: '#6CBEEF',
    },
    fontSizes,
    yard,
  },
  matcha: {
    id: 'matcha',
    name: 'Matcha',
    type: 'light',
    colors: {
      bgPrimary: '#F2F7E6',
      bgSecondary: '#E8F0D6',
      tPrimary: '#4A593D',
      tSecondary: '#718159',
      accent: '#87B864',
    },
    fontSizes,
    yard,
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    type: 'dark',
    colors: {
      bgPrimary: '#2C1E2E',
      bgSecondary: '#422539',
      tPrimary: '#FFDDBB',
      tSecondary: '#FFC299',
      accent: '#FF7B54',
    },
    fontSizes,
    yard,
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender Fields',
    type: 'light',
    colors: {
      bgPrimary: '#F6EEFF',
      bgSecondary: '#EFE1FF',
      tPrimary: '#4F4366',
      tSecondary: '#786F94',
      accent: '#9D7FD9',
    },
    fontSizes,
    yard,
  },
  deepOcean: {
    id: 'deepOcean',
    name: 'Deep Ocean',
    type: 'dark',
    colors: {
      bgPrimary: '#0A192F',
      bgSecondary: '#112240',
      tPrimary: '#CCD6F6',
      tSecondary: '#8892B0',
      accent: '#64FFDA',
    },
    fontSizes,
    yard,
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    type: 'dark',
    colors: {
      bgPrimary: '#10002B',
      bgSecondary: '#240046',
      tPrimary: '#E0AAFF',
      tSecondary: '#C77DFF',
      accent: '#FF00A0',
    },
    fontSizes,
    yard,
  },
  caramel: {
    id: 'caramel',
    name: 'Caramel',
    type: 'light',
    colors: {
      bgPrimary: '#FFECD1',
      bgSecondary: '#FFD7A8',
      tPrimary: '#6E4C1E',
      tSecondary: '#9C7540',
      accent: '#D9894C',
    },
    fontSizes,
    yard,
  },
  moonlight: {
    id: 'moonlight',
    name: 'Moonlight',
    type: 'dark',
    colors: {
      bgPrimary: '#1F2028',
      bgSecondary: '#292B36',
      tPrimary: '#EAEAEA',
      tSecondary: '#BABBCA',
      accent: '#82AAF0',
    },
    fontSizes,
    yard,
  },
  pastelForest: {
    id: 'pastelForest',
    name: 'Pastel Forest',
    type: 'light',
    colors: {
      bgPrimary: '#EFF8E2',
      bgSecondary: '#DCE8C2',
      tPrimary: '#2C3639',
      tSecondary: '#3F4E4F',
      accent: '#7D9D61',
    },
    fontSizes,
    yard,
  },
  retroWave: {
    id: 'retroWave',
    name: 'Retro Wave',
    type: 'dark',
    colors: {
      bgPrimary: '#1A1A2E',
      bgSecondary: '#16213E',
      tPrimary: '#E0E0FE',
      tSecondary: '#B8B8DB',
      accent: '#FF2E63',
    },
    fontSizes,
    yard,
  },
  coral: {
    id: 'coral',
    name: 'Coral Reef',
    type: 'light',
    colors: {
      bgPrimary: '#FFFAF7',
      bgSecondary: '#FFEDE8',
      tPrimary: '#4A3636',
      tSecondary: '#6D5252',
      accent: '#FF7F5C',
    },
    fontSizes,
    yard,
  },
  midnightCity: {
    id: 'midnightCity',
    name: 'Midnight City',
    type: 'dark',
    colors: {
      bgPrimary: '#121420',
      bgSecondary: '#1B1E2B',
      tPrimary: '#E0E1E6',
      tSecondary: '#A2A5B9',
      accent: '#FF555D',
    },
    fontSizes,
    yard,
  },
  
  // New themes below
  mintChocolate: {
    id: 'mintChocolate',
    name: 'Mint Chocolate',
    type: 'dark',
    colors: {
      bgPrimary: '#25231E',
      bgSecondary: '#332F29',
      tPrimary: '#C4F0C2',
      tSecondary: '#9AC79A',
      accent: '#62D692',
    },
    fontSizes,
    yard,
  },
  serenity: {
    id: 'serenity',
    name: 'Serenity',
    type: 'light',
    colors: {
      bgPrimary: '#F9FAFF',
      bgSecondary: '#F0F2FA',
      tPrimary: '#35477D',
      tSecondary: '#697AA8',
      accent: '#92A8D1',
    },
    fontSizes,
    yard,
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn',
    type: 'light',
    colors: {
      bgPrimary: '#FFF8F0',
      bgSecondary: '#FFEAD7',
      tPrimary: '#603B2C',
      tSecondary: '#8B6553',
      accent: '#D8752C',
    },
    fontSizes,
    yard,
  },
  glacier: {
    id: 'glacier',
    name: 'Glacier',
    type: 'light',
    colors: {
      bgPrimary: '#F0F5FA',
      bgSecondary: '#E4EDF7',
      tPrimary: '#2D4A5D',
      tSecondary: '#5D7A8C',
      accent: '#38B2AC',
    },
    fontSizes,
    yard,
  },
  midnightPurple: {
    id: 'midnightPurple',
    name: 'Midnight Purple',
    type: 'dark',
    colors: {
      bgPrimary: '#13111C',
      bgSecondary: '#1C1829',
      tPrimary: '#E4D7FF',
      tSecondary: '#B8A7DB',
      accent: '#A45EE5',
    },
    fontSizes,
    yard,
  },
  emeraldNight: {
    id: 'emeraldNight',
    name: 'Emerald Night',
    type: 'dark',
    colors: {
      bgPrimary: '#0F1E1B',
      bgSecondary: '#172E2A',
      tPrimary: '#D2E5E0',
      tSecondary: '#A6C7BF',
      accent: '#2CDA9D',
    },
    fontSizes,
    yard,
  },
  coffee: {
    id: 'coffee',
    name: 'Coffee',
    type: 'dark',
    colors: {
      bgPrimary: '#20151B',
      bgSecondary: '#2C1F25',
      tPrimary: '#E6DCCD',
      tSecondary: '#BFB3A4',
      accent: '#C0976A',
    },
    fontSizes,
    yard,
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    type: 'light',
    colors: {
      bgPrimary: '#FFF4F8',
      bgSecondary: '#FFE9F0',
      tPrimary: '#644853',
      tSecondary: '#9E7B87',
      accent: '#FFACC7',
    },
    fontSizes,
    yard,
  },
  oliveDark: {
    id: 'oliveDark',
    name: 'Olive Dark',
    type: 'dark',
    colors: {
      bgPrimary: '#1E2418',
      bgSecondary: '#2A3223',
      tPrimary: '#D8E4C2',
      tSecondary: '#B3BD9D',
      accent: '#A5B85F',
    },
    fontSizes,
    yard,
  },
  pastelDream: {
    id: 'pastelDream',
    name: 'Pastel Dream',
    type: 'light',
    colors: {
      bgPrimary: '#FAFAFA',
      bgSecondary: '#F2F2F7',
      tPrimary: '#6B717E',
      tSecondary: '#9499A8',
      accent: '#B5C2E3',
    },
    fontSizes,
    yard,
  },
  oceanBreeze: {
    id: 'oceanBreeze',
    name: 'Ocean Breeze',
    type: 'light',
    colors: {
      bgPrimary: '#F0F7FA',
      bgSecondary: '#E0EFF7',
      tPrimary: '#36596A',
      tSecondary: '#5F8395',
      accent: '#4EAAC8',
    },
    fontSizes,
    yard,
  },
  cosmicPurple: {
    id: 'cosmicPurple',
    name: 'Cosmic Purple',
    type: 'dark',
    colors: {
      bgPrimary: '#0C0E1B',
      bgSecondary: '#13172A',
      tPrimary: '#DDD6FF',
      tSecondary: '#B8B0D9',
      accent: '#9F7FFF',
    },
    fontSizes,
    yard,
  },
  forestMint: {
    id: 'forestMint',
    name: 'Forest Mint',
    type: 'dark',
    colors: {
      bgPrimary: '#192A26',
      bgSecondary: '#243B35',
      tPrimary: '#D0F0E4',
      tSecondary: '#A5C7BB',
      accent: '#4FD8BE',
    },
    fontSizes,
    yard,
  },
  highContrast: {
    id: 'highContrast',
    name: 'High Contrast',
    type: 'dark',
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#121212',
      tPrimary: '#FFFFFF',
      tSecondary: '#D0D0D0',
      accent: '#FF9500',
    },
    fontSizes,
    yard,
  },
  warmSand: {
    id: 'warmSand',
    name: 'Warm Sand',
    type: 'light',
    colors: {
      bgPrimary: '#F8F3E7',
      bgSecondary: '#F1EAD7',
      tPrimary: '#5F4B32',
      tSecondary: '#8C7356',
      accent: '#D9A566',
    },
    fontSizes,
    yard,
  },
  raspberryDark: {
    id: 'raspberryDark',
    name: 'Raspberry Dark',
    type: 'dark',
    colors: {
      bgPrimary: '#1A121A',
      bgSecondary: '#271B26',
      tPrimary: '#FFDEE9',
      tSecondary: '#D9B3C0',
      accent: '#FF4081',
    },
    fontSizes,
    yard,
  },
  softBlue: {
    id: 'softBlue',
    name: 'Soft Blue',
    type: 'light',
    colors: {
      bgPrimary: '#F2F7FF',
      bgSecondary: '#E6F0FF',
      tPrimary: '#213B5C',
      tSecondary: '#4A6A94',
      accent: '#4D82D6',
    },
    fontSizes,
    yard,
  },
  paperWhite: {
    id: 'paperWhite',
    name: 'Paper White',
    type: 'light',
    colors: {
      bgPrimary: '#FDFDFD',
      bgSecondary: '#F7F7F7',
      tPrimary: '#333333',
      tSecondary: '#666666',
      accent: '#0088CC',
    },
    fontSizes,
    yard,
  },
  deepNavy: {
    id: 'deepNavy',
    name: 'Deep Navy',
    type: 'dark',
    colors: {
      bgPrimary: '#0A1930',
      bgSecondary: '#0F2447',
      tPrimary: '#E2EAF4',
      tSecondary: '#B0BFCF',
      accent: '#4D89FB',
    },
    fontSizes,
    yard,
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [allThemes, setAllThemes] = useState(themes);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('currentTheme');
        const savedCustomThemes = await AsyncStorage.getItem('customThemes');
        
        let mergedThemes = {...themes};
        
        if (savedCustomThemes) {
          const parsedCustomThemes = JSON.parse(savedCustomThemes);
          mergedThemes = {...mergedThemes, ...parsedCustomThemes};
          setAllThemes(mergedThemes);
        }
        
        if (savedTheme) {
          const parsedTheme = JSON.parse(savedTheme);
          if (mergedThemes[parsedTheme.id]) {
            setCurrentTheme(parsedTheme);
          } else {
            setCurrentTheme(mergedThemes[Object.keys(mergedThemes)[0]]);
          }
        } else {
          setCurrentTheme(mergedThemes[Object.keys(mergedThemes)[0]]);
        }
      } catch (error) {
        // console.error('Failed to load theme:', error);
        setCurrentTheme(themes[Object.keys(themes)[0]]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    const saveTheme = async () => {
      try {
        if (currentTheme) {
          await AsyncStorage.setItem('currentTheme', JSON.stringify(currentTheme));
        }
      } catch (error) {
        // console.error('Failed to save theme:', error);
      }
    };

    if (currentTheme) {
      saveTheme();
    }
  }, [currentTheme]);

  const saveCustomThemes = async (updatedThemes) => {
    try {
      const customThemesObj = {};
      Object.keys(updatedThemes).forEach(key => {
        if (!themes[key] || key === '0') {
          customThemesObj[key] = updatedThemes[key];
        }
      });
      
      await AsyncStorage.setItem('customThemes', JSON.stringify(customThemesObj));
    } catch (error) {
      // console.error('Failed to save custom themes:', error);
    }
  };

  const changeTheme = (themeId) => {
    if (allThemes[themeId]) {
      setCurrentTheme(allThemes[themeId]);
    }
  };

  const updateCustomTheme = (themeId, themeData) => {
    if (allThemes[themeId]) {
      const updatedTheme = {
        ...allThemes[themeId],
        ...themeData,
        colors: {
          ...allThemes[themeId].colors,
          ...themeData.colors,
        },
      };

      const updatedThemes = { ...allThemes, [themeId]: updatedTheme };
      setAllThemes(updatedThemes);
      
      if (currentTheme.id === themeId) {
        setCurrentTheme(updatedTheme);
      }
      
      saveCustomThemes(updatedThemes);
    }
  };

  const createCustomTheme = (themeData) => {
    const newTheme = {
      id: `custom-${Date.now()}`,
      name: themeData.name || `Custom ${Object.keys(allThemes).length - Object.keys(themes).length + 1}`,
      type: themeData.type || 'light',
      colors: {
        bgPrimary: themeData.bgPrimary || '#FFFFFF',
        bgSecondary: themeData.bgSecondary || '#F5F5F5',
        tPrimary: themeData.tPrimary || '#000000',
        tSecondary: themeData.tSecondary || '#555555',
        accent: themeData.accent || '#3498db',
      },
      fontSizes,
      yard,
    };

    const updatedThemes = { ...allThemes, [newTheme.id]: newTheme };
    setAllThemes(updatedThemes);
    setCurrentTheme(newTheme);
    
    saveCustomThemes(updatedThemes);
    
    return newTheme;
  };
  
  const deleteCustomTheme = (themeId) => {
    if (allThemes[themeId] && !themes[themeId]) {
      const updatedThemes = { ...allThemes };
      delete updatedThemes[themeId];
      
      setAllThemes(updatedThemes);
      
      if (currentTheme.id === themeId) {
        setCurrentTheme(themes.light);
      }
      
      saveCustomThemes(updatedThemes);
    }
  };

  const updateYard = () => {
    const newScreenWidth = Dimensions.get('window').width;
    const newYard = Math.floor(newScreenWidth * 0.03);
    
    const updatedThemes = {};
    Object.keys(allThemes).forEach(key => {
      updatedThemes[key] = {
        ...allThemes[key],
        yard: newYard,
      };
    });
    
    setAllThemes(updatedThemes);
    
    if (currentTheme) {
      setCurrentTheme({
        ...currentTheme,
        yard: newYard,
      });
    }
  };

  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', updateYard);
    
    return () => {
      dimensionsHandler.remove();
    };
  }, [allThemes, currentTheme]);

  if (isLoading || !currentTheme) {
    return null; 
  }

  const value = {
    theme: currentTheme,
    themes: allThemes,
    defaultThemes: themes,
    changeTheme,
    createCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    updateYard,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};