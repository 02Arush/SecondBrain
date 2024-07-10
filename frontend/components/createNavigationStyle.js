import { StyleSheet } from 'react-native'

export const createNavStyle = (theme) => {
    const styles = StyleSheet.create({
        bgColor: {
            backgroundColor: theme.colors.background
        },

        onBgColor: {
            color: theme.colors.onBackground
        }
    });

    return styles;
};
