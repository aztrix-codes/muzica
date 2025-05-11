import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from './ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ColorPicker from 'react-native-wheel-color-picker';
import { BlurView } from '@react-native-community/blur';

const ThemeCard = ({ theme, isSelected, onPress }) => {
  const { theme: currentTheme } = useTheme();
  const { colors, yard } = currentTheme;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '47%',
        padding: yard,
        borderRadius: yard * 2,
        borderWidth: theme.id === '0' ? yard * 0.4 : yard * 0.2,
        elevation: 5,
        backgroundColor: theme.colors.bgPrimary,
        borderColor: isSelected ? theme.colors.accent : 'transparent',
        margin: '1.5%'
      }}>
      <View style={{ height: theme.id === '0' ? yard * 6 : yard * 8, borderRadius: yard, overflow: 'hidden' }}>
        <View style={{ 
          height: yard * 2.5,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: yard / 2,
          backgroundColor: theme.colors.bgSecondary,
        }}>
          <View style={{ 
            width: yard,
            height: yard,
            borderRadius: yard,
            backgroundColor: theme.colors.accent,
          }} />
          <View style={{ flex: 1, marginLeft: yard / 2 }}>
            <View style={{ 
              height: yard - 4,
              borderRadius: yard,
              marginVertical: theme.id === '0' ? yard / 2 : yard,
              backgroundColor: theme.colors.tPrimary,
              width: '50%',
            }} />
          </View>
        </View>
        <View style={{ 
          flex: 1,
          padding: yard / 2,
          justifyContent: 'center',
          backgroundColor: theme.colors.bgPrimary,
        }}>
          <View style={{ 
            height: yard - 5,
            borderRadius: yard,
            marginVertical: theme.id === '0' ? yard / 3 : yard,
            backgroundColor: theme.colors.tPrimary,
            width: '80%',
          }} />
          <View style={{ 
            height: yard - 5,
            borderRadius: yard,
            backgroundColor: theme.colors.tSecondary,
            width: '60%',
          }} />
        </View>
      </View>
      <View style={{ alignItems: 'center', marginTop: yard }}>
        <Text numberOfLines={1} style={{ 
          fontSize: theme.fontSizes.m - (theme.id === '0' ? 0 : 2),
          fontWeight: theme.id === '0' ? 'bold' : '500',
          textAlign: 'center',
          color: theme.colors.tPrimary,
        }}>
          {theme.name}
        </Text>
      </View>
      {isSelected && (
        <View style={{ 
          position: 'absolute',
          top: -10,
          right: -8,
          zIndex: 1,
        }}>
          <Ionicons
            name="checkmark-circle"
            size={theme.fontSizes.xl}
            color={theme.colors.accent}
            style={{ backgroundColor: 'white', borderRadius: yard }}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const ColorSection = ({ title, color, onPress }) => {
  const { theme } = useTheme();
  const { colors, fontSizes, yard } = theme;

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={{ marginBottom: yard }}
    >
      <View style={{ 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: yard / 2,
      }}>
        <Text style={{ 
          color: colors.tPrimary,
          fontSize: fontSizes.m,
        }}>
          {title}
        </Text>
        <View style={{ 
          width: yard * 2,
          height: yard * 2,
          borderRadius: yard,
          borderWidth: yard * 0.1,
          borderColor: '#E0E0E0',
          backgroundColor: color,
        }} />
      </View>
      <Text style={{ 
        color: colors.tSecondary,
        fontSize: fontSizes.s,
      }}>
        {color.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};

const Theme = () => {
  const {
    theme,
    themes,
    defaultThemes,
    changeTheme,
    deleteCustomTheme,
    updateCustomTheme,
  } = useTheme();
  const { colors, fontSizes, yard } = theme;

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentEditingColor, setCurrentEditingColor] = useState({
    type: '',
    value: '',
  });

  const [customThemeData, setCustomThemeData] = useState(themes['0']);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [colorInputValue, setColorInputValue] = useState('');
  

  const openColorPicker = (type, currentValue) => {
    setCurrentEditingColor({
      type,
      value: currentValue,
    });
    setColorInputValue(currentValue);
    setInputValue(currentValue); 
    setShowColorPicker(true);
  };

  const handleColorSelect = color => {
    setColorInputValue(color);
    setInputValue(color); 
  };

  const handleColorSubmit = () => {
    if (isValidHexColor(inputValue)) {
      setColorInputValue(inputValue);
      updateColorInTheme(inputValue);
    }
  };

  const handleInputChange = (field, value) => {
    setCustomThemeData({
      ...customThemeData,
      [field]: value,
    });
    setHasUnsavedChanges(true);
  };

  const isValidHexColor = (hex) => {
    return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
  };



  const updateColorInTheme = (color) => {
    const [section, key] = currentEditingColor.type.split('.');
    
    setCustomThemeData(prevData => {
      const newData = { ...prevData };
      
      if (!newData[section]) {
        newData[section] = {};
      }
      
      newData[section] = { 
        ...newData[section], 
        [key]: color 
      };
      
      return newData;
    });
    
    setHasUnsavedChanges(true);
  };

  const saveCustomTheme = () => {
    updateCustomTheme('0', customThemeData);
    setShowCustomModal(false);
    setHasUnsavedChanges(false);
    ToastAndroid.show('Custom theme saved!', ToastAndroid.SHORT);
  };

  const applyTheme = () => {
    changeTheme('0');
    ToastAndroid.show('Custom theme applied!', ToastAndroid.SHORT);
    setShowCustomModal(false)
  };

  const resetCustomTheme = () => {
    setCustomThemeData(themes['0']);
    setHasUnsavedChanges(false);
  };

  const renderThemeTiles = () => {
    return Object.values(themes).filter(t => t.id !== '0').map(themeItem => (
      <ThemeCard
        key={themeItem.id}
        theme={themeItem}
        isSelected={theme.id === themeItem.id}
        onPress={() => changeTheme(themeItem.id)}
      />
    ));
  };

  const isCustomTheme = !Object.keys(defaultThemes).includes(theme.id);

  const getNestedColorValue = (obj, path) => {
    if (!path) return '';
    const [section, key] = path.split('.');
    return obj && obj[section] && obj[section][key] ? obj[section][key] : '';
  };

  useEffect(() => {
    if (showColorPicker) {
      const currentColor = getNestedColorValue(customThemeData, currentEditingColor.type);
      setColorInputValue(currentColor);
    }
  }, [showColorPicker]);

  return (
    <View style={{ 
      flex: 1,
      padding: yard,
      backgroundColor: colors.bgPrimary,
    }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ 
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          <ThemeCard
            theme={themes['0']}
            isSelected={theme.id === '0'}
            onPress={() => {
              setCustomThemeData(themes['0']);
              setShowCustomModal(true);
            }}
          />
          {renderThemeTiles()}
        </View>

        {isCustomTheme && theme.id !== '0' && (
          <TouchableOpacity
            style={{ 
              flexDirection: 'row',
              alignItems: 'center',
              padding: yard * 1.5,
              borderRadius: yard,
              marginTop: yard,
              backgroundColor: colors.bgSecondary,
            }}
            onPress={() => {
              deleteCustomTheme(theme.id);
              ToastAndroid.show('Theme deleted', ToastAndroid.SHORT);
            }}>
            <MaterialCommunityIcons
              name="delete-outline"
              size={yard * 1.5}
              color="#FF5252"
            />
            <Text style={{ 
              color: colors.tPrimary,
              fontSize: fontSizes.m,
              marginLeft: yard / 2,
            }}>
              Delete Current Theme
            </Text>
          </TouchableOpacity>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={showCustomModal}
          onRequestClose={() => {
            if (hasUnsavedChanges) {
              ToastAndroid.show('You have unsaved changes', ToastAndroid.SHORT);
              return;
            }
            setShowCustomModal(false);
          }}>
            <BlurView
            style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
              blurType="dark"
              blurAmount={10}
            />
          <View style={{ 
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{ 
              width: '90%',
              maxHeight: '80%',
              borderRadius: yard * 2,
              padding: yard * 1.5,
              backgroundColor: colors.bgPrimary,
              elevation: 5,
            }}>
              <Text style={{ 
                color: colors.tPrimary,
                fontSize: fontSizes.l,
                fontWeight: 'bold',
                marginBottom: yard,
              }}>
                Edit Custom Theme
              </Text>

              <View style={{ marginBottom: yard * 1.5 }}>
                <Text style={{ 
                  color: colors.tPrimary,
                  fontSize: fontSizes.m,
                }}>
                  Theme Name
                </Text>
                <TextInput
                  style={{ 
                    borderRadius: yard / 2,
                    padding: yard,
                    marginTop: yard / 2,
                    backgroundColor: colors.bgSecondary,
                    color: colors.tPrimary,
                  }}
                  value={customThemeData.name}
                  onChangeText={text => handleInputChange('name', text)}
                  placeholderTextColor={colors.tSecondary}
                />
              </View>

              <View style={{ marginBottom: yard }}>
                <Text style={{ 
                  color: colors.tPrimary,
                  fontSize: fontSizes.m,
                }}>
                  Theme Type
                </Text>
                <View style={{ 
                  flexDirection: 'row',
                  marginTop: yard / 2,
                }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: yard,
                      borderRadius: yard / 2,
                      marginRight: yard / 2,
                      backgroundColor: customThemeData.type === 'light' ? colors.accent : colors.bgSecondary,
                    }}
                    onPress={() => handleInputChange('type', 'light')}>
                    <Text style={{ 
                      color: customThemeData.type === 'light' ? '#FFFFFF' : colors.tPrimary,
                      textAlign: 'center',
                      fontSize: fontSizes.m,
                    }}>
                      Light
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: yard,
                      borderRadius: yard / 2,
                      marginLeft: yard / 2,
                      backgroundColor: customThemeData.type === 'dark' ? colors.accent : colors.bgSecondary,
                    }}
                    onPress={() => handleInputChange('type', 'dark')}>
                    <Text style={{ 
                      color: customThemeData.type === 'dark' ? '#FFFFFF' : colors.tPrimary,
                      textAlign: 'center',
                      fontSize: fontSizes.m,
                    }}>
                      Dark
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ 
                color: colors.tPrimary,
                fontSize: fontSizes.m,
                fontWeight: 'bold',
                marginVertical: yard / 2,
              }}>
                Colors
              </Text>

              <ColorSection
                title="Background Primary"
                color={customThemeData.colors?.bgPrimary || ''}
                onPress={() =>
                  openColorPicker('colors.bgPrimary', customThemeData.colors?.bgPrimary || '')
                }
              />
              <ColorSection
                title="Background Secondary"
                color={customThemeData.colors?.bgSecondary || ''}
                onPress={() =>
                  openColorPicker('colors.bgSecondary', customThemeData.colors?.bgSecondary || '')
                }
              />
              <ColorSection
                title="Text Primary"
                color={customThemeData.colors?.tPrimary || ''}
                onPress={() =>
                  openColorPicker('colors.tPrimary', customThemeData.colors?.tPrimary || '')
                }
              />
              <ColorSection
                title="Text Secondary"
                color={customThemeData.colors?.tSecondary || ''}
                onPress={() =>
                  openColorPicker('colors.tSecondary', customThemeData.colors?.tSecondary || '')
                }
              />
              <ColorSection
                title="Accent Color"
                color={customThemeData.colors?.accent || ''}
                onPress={() =>
                  openColorPicker('colors.accent', customThemeData.colors?.accent || '')
                }
              />

              <View style={{ 
                flexDirection: 'row',
                marginTop: yard * 1.5,
                justifyContent: 'flex-end'
              }}>
                <TouchableOpacity
                  style={{ 
                    paddingVertical: yard,
                    paddingHorizontal: yard * 1.5,
                    borderRadius: yard ,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.bgSecondary,
                  }}
                  onPress={() => {
                    if (hasUnsavedChanges) {
                      resetCustomTheme();
                    }
                    setShowCustomModal(false);
                  }}>
                  <Text style={{ 
                    color: colors.tPrimary,
                    fontSize: fontSizes.m,
                  }}>
                    {hasUnsavedChanges ? 'Cancel' : 'Close'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{ 
                    paddingVertical: yard,
                    paddingHorizontal: yard * 1.5,
                    borderRadius: yard ,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accent,
                    opacity: hasUnsavedChanges ? 1 : 0.6,
                    marginHorizontal: yard
                  }}
                  onPress={saveCustomTheme}
                  disabled={!hasUnsavedChanges}>
                  <Text style={{ 
                    color: '#FFFFFF',
                    fontSize: fontSizes.m,
                    fontWeight: 'bold',
                  }}>
                    Save
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{ 
                    paddingVertical: yard,
                    paddingHorizontal: yard * 1.5,
                    borderRadius: yard ,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: hasUnsavedChanges ? colors.bgSecondary : colors.accent,
                    opacity: hasUnsavedChanges ? 0.6 : 1,
                  }}
                  onPress={applyTheme}
                  disabled={hasUnsavedChanges}>
                  <Text style={{ 
                    color: hasUnsavedChanges ? colors.tSecondary : '#FFFFFF',
                    fontSize: fontSizes.m,
                    fontWeight: 'bold',
                  }}>
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
            animationType="slide"
            transparent={true}
            visible={showColorPicker}
            onRequestClose={() => setShowColorPicker(false)}>
            <BlurView
              style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0 }}
              blurType="dark"
              blurAmount={10}
            />
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ 
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <View style={{ 
                    width: '90%',
                    borderRadius: yard * 2,
                    padding: yard * 2,
                    backgroundColor: colors.bgPrimary,
                    maxHeight: '80%',
                    elevation: 5,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: yard }}>
                      <Text style={{ 
                        color: colors.tPrimary,
                        fontSize: fontSizes.l,
                        fontWeight: 'bold',
                      }}>
                        Pick Color
                      </Text>
                      <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                        <Ionicons name="close" size={yard * 2} color={colors.tSecondary} />
                      </TouchableOpacity>
                    </View>

                    <View style={{ 
                      flexDirection: 'row', 
                      height: 200,
                      marginBottom: yard * 1.5,
                    }}>
                      <View style={{ flex: 1 }}>
                        <ColorPicker
                          color={colorInputValue}
                          onColorChange={handleColorSelect}
                          thumbSize={20}
                          sliderSize={25}
                          row={true}
                          swatches={false}
                        />
                      </View>
                    </View>

                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      backgroundColor: colors.bgSecondary,
                      borderRadius: yard,
                      paddingHorizontal: yard,
                      marginBottom: yard * 1.5,
                    }}>
                      <View style={{
                        width: yard * 2,
                        height: yard * 2,
                        borderRadius: yard / 2,
                        backgroundColor: colorInputValue,
                        marginRight: yard,
                        borderWidth: 1,
                        borderColor: colors.tSecondary + '30',
                      }}/>
                      <TextInput
                        style={{ 
                          flex: 1,
                          color: colors.tPrimary,
                          fontSize: fontSizes.m,
                          paddingVertical: yard,
                        }}
                        value={inputValue}
                        onChangeText={setInputValue}
                        onSubmitEditing={handleColorSubmit}
                        autoCapitalize="characters"
                        placeholder="#FFFFFF"
                        placeholderTextColor={colors.tSecondary}
                        selectTextOnFocus={true}
                      />
                      <TouchableOpacity
                        onPress={handleColorSubmit}
                        style={{
                          padding: yard / 2,
                          borderRadius: yard / 2,
                          backgroundColor: colors.accent,
                          opacity: isValidHexColor(inputValue) ? 1 : 0.5,
                        }}
                        disabled={!isValidHexColor(inputValue)}
                      >
                        <Ionicons
                          name="checkmark"
                          size={yard * 1.5}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={{ 
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}>
                      <TouchableOpacity
                        style={{ 
                          flex: 1,
                          padding: yard,
                          borderRadius: yard,
                          backgroundColor: colors.bgSecondary,
                          marginRight: yard / 2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => {
                          setShowColorPicker(false);
                        }}>
                        <Text style={{ 
                          color: colors.tPrimary,
                          fontSize: fontSizes.m,
                          fontWeight: '500',
                        }}>
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ 
                          flex: 1,
                          padding: yard,
                          borderRadius: yard,
                          backgroundColor: colors.accent,
                          marginLeft: yard / 2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => {
                          if (isValidHexColor(inputValue)) {
                            handleColorSubmit();
                          }
                          setShowColorPicker(false);
                        }}>
                        <Text style={{ 
                          color: '#FFFFFF',
                          fontSize: fontSizes.m,
                          fontWeight: 'bold',
                        }}>
                          Apply
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>
      </ScrollView>
    </View>
  );
};

export default Theme;