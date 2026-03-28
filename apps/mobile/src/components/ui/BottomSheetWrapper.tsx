import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface Props extends Partial<BottomSheetProps> {
  title?: string;
  snapPoints?: (string | number)[];
  children: React.ReactNode;
  onClose?: () => void;
}

export const BottomSheetWrapper = forwardRef<BottomSheet, Props>(
  ({ title, snapPoints: sp, children, onClose, ...rest }, ref) => {
    const snapPoints = useMemo(() => sp || ['50%', '80%'], [sp]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bg}
        handleIndicatorStyle={styles.indicator}
        onClose={onClose}
        {...rest}
      >
        <BottomSheetView style={styles.content}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </Pressable>
            </View>
          )}
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  bg: {
    backgroundColor: COLORS.darkCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
  },
  indicator: { backgroundColor: COLORS.darkBorder, width: 40 },
  content: { flex: 1, paddingHorizontal: SPACING.base },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkBorder,
    marginBottom: SPACING.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
});
