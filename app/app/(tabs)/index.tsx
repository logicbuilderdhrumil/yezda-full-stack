/**
 * Tab index — redirects to the applications tab.
 * This ensures the "Applications" tab is the default landing page.
 */

import { Redirect } from 'expo-router';

export default function TabIndex() {
  return <Redirect href="/(tabs)/applications" />;
}
