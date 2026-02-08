/**
 * NativeWind v4 type augmentation.
 * Adds `className` and `contentContainerClassName` to React Native components.
 * NativeWind v4 handles this via Babel transform at build time;
 * this file provides TypeScript awareness.
 */

import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface ImageProps {
    className?: string;
  }

  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }

  interface FlatListProps<ItemT> {
    className?: string;
    contentContainerClassName?: string;
  }

  interface TextInputProps {
    className?: string;
  }

  interface TouchableOpacityProps {
    className?: string;
  }

  interface PressableProps {
    className?: string;
  }

  interface SwitchProps {
    className?: string;
  }

  interface ModalProps {
    className?: string;
  }

  interface KeyboardAvoidingViewProps {
    className?: string;
  }

  interface SafeAreaViewProps {
    className?: string;
  }
}
