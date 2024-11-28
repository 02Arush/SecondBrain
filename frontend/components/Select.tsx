import {
  StyleSheet,
  View,
  SafeAreaView,
  Pressable,
  ScrollView,
} from "react-native";
import {
  Button,
  Menu,
  Text,
  useTheme,
  Surface,
  Portal,
  TouchableRipple,
} from "react-native-paper";
import React from "react";

type props = {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  items: Array<string>;
  selectedItem: string;
  setSelectedItem: (item: string) => void;
  mode?: "text" | "button" | "button-box";
};

const Select = ({
  visible,
  setVisible,
  items,
  selectedItem,
  setSelectedItem,
  mode = "button",
}: props) => {
  const closeMenu = (selectedItem: string | null) => {
    if (selectedItem) {
      setSelectedItem(selectedItem);
    }
    setVisible(false);
  };

  const openMenu = () => {
    setVisible(true);
  };

  const theme = useTheme();

  const Anchor = ({ onPress }: any) => {
    if (mode === "text") {
      return (
        <Text
          style={{
            color: theme.colors.primary,
            textDecorationLine: "underline",
          }}
          onPress={openMenu}
        >
          {selectedItem}
        </Text>
      );
    } else if (mode === "button-box") {
      return (
        <Button
          mode="contained"
          style={{
            borderRadius: 4,
            marginHorizontal: 2,
          }}
          contentStyle={{
            height: 24,
          }}
          buttonColor={theme.colors.surfaceVariant}
          textColor={theme.colors.onSurfaceVariant}
          onPress={openMenu}
        >
          {selectedItem}
        </Button>
      );
    } else {
      return (
        <Button mode="text" compact onPress={openMenu}>
          {selectedItem}
        </Button>
      );
    }
  };

  const itemBorderRadius = 16;

  return (
    <SafeAreaView>
      <Anchor onPress={openMenu} />
      {visible && (
        <Portal>
          <Pressable
            onPress={() => {
              closeMenu(null);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              width: "100%",
              height: "100%",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "center",
              backgroundColor: theme.colors.backdrop,
            }}
          >
            <SafeAreaView
              style={{
                width: "100%",
                maxWidth: 700,
                maxHeight: "50%",
                borderRadius: itemBorderRadius,
                justifyContent: "flex-end",
                flexDirection: "column",
              }}
            >
              <ScrollView style={{}}>
                <View style={{}}>
                  <Surface
                    style={{ width: "100%", borderRadius: itemBorderRadius }}
                  >
                    {items.map((item, index) => {
                      return (
                        <TouchableRipple
                          key={index}
                          style={{
                            height: 40,
                          }}
                          onPress={() => {
                            closeMenu(item);
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: "rgba(0, 0, 0, 0)",
                              position: "relative",
                              padding: 10,
                              // Corner Border Radius to ensure the underlines don't glitch
                              borderBottomStartRadius:
                                index === items.length - 1
                                  ? itemBorderRadius
                                  : 0,
                              borderBottomEndRadius:
                                index === items.length - 1
                                  ? itemBorderRadius
                                  : 0,
                            }}
                            key={index}
                          >
                            <Text
                              style={{ height: "100%", textAlign: "center" }}
                            >
                              {item}
                            </Text>
                          </View>
                        </TouchableRipple>
                      );
                    })}
                  </Surface>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </Portal>
      )}
    </SafeAreaView>
  );
};

export default Select;

const styles = StyleSheet.create({});
