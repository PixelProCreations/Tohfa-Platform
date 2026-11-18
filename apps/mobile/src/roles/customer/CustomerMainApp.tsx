import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { ThemeProvider, buildThemeForRole, ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { RoleCode } from '@tohfa/shared-types';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../shell/api/queryClient';
import { onForegroundPush, onPushOpened, registerPushForSession } from '../../shell/notifications/push';
import { notificationTarget } from './api/notifications';
import { getLocale } from '../../i18n/customer';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { ProductGridScreen } from './screens/ProductGridScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import type { ProductSort, SellableGrade } from './api/catalog';
import { SearchScreen } from './screens/SearchScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { CustomerAddAddressScreen } from './screens/CustomerAddAddressScreen';
import { CustomerLoadingMarketScreen } from './screens/CustomerLoadingMarketScreen';
import { TopupScreen } from './screens/TopupScreen';
import { OrderTrackingScreen } from './screens/OrderTrackingScreen';
import { OrderHistoryScreen } from './screens/OrderHistoryScreen';
import { CustomerAccountScreen } from './screens/CustomerAccountScreen';
import { CustomerProfileScreen } from './screens/CustomerProfileScreen';
import { CustomerWalletScreen } from './screens/CustomerWalletScreen';
import { CustomerSendMoneyScreen } from './screens/CustomerSendMoneyScreen';
import { CustomerSupportScreen } from './screens/CustomerSupportScreen';
import { CustomerHelpScreen } from './screens/CustomerHelpScreen';
import { CustomerNotificationsScreen } from './screens/CustomerNotificationsScreen';
import { CustomerAccountSettingsScreen } from './screens/CustomerAccountSettingsScreen';
import { CustomerPrivacyPolicyScreen } from './screens/CustomerPrivacyPolicyScreen';
import { CustomerTermsScreen } from './screens/CustomerTermsScreen';
import { ContactSupportScreen } from './screens/ContactSupportScreen';
import { TrackSupportRequestScreen } from './screens/TrackSupportRequestScreen';
import { ReviewFeedbackScreen } from './screens/ReviewFeedbackScreen';
import { ReturnOrderScreen } from './screens/ReturnOrderScreen';
import { HomeScreen } from './screens/HomeScreen';
import type { RelatedCategory } from './components/contactSupportData';
import { WishlistScreen } from './screens/WishlistScreen';

/**
 * Customer's real post-login screens, mounted by the farmer app's shared
 * router (src/roles/farmer/App.tsx) once /auth/me resolves the signed-in
 * account as a customer. The single app's Splash/Welcome/Login/OTP screens
 * (farmer's, now shared by everyone) already handled sign-in before this
 * mounts -- this component owns ONLY what happens after that, which is why
 * customer's own former Splash/Onboarding/Register/Otp/Login/ForgotPassword/
 * ResetPassword screens (previously kept under src/roles/customer/screens/auth/
 * "for reference") were unreachable dead code and have been deleted, along
 * with the unreachable src/roles/customer/App.tsx that used to mount them
 * and the unused src/roles/customer/screens/home/HomeScreen.tsx duplicate.
 */

type ScreenName =
  | 'Home'
  | 'Categories'
  | 'ProductGrid'
  | 'ProductDetail'
  | 'Search'
  | 'Cart'
  | 'Wishlist'
  | 'Checkout'
  | 'CustomerAddAddress'
  | 'CustomerLoadingMarket'
  | 'Topup'
  | 'OrderTracking'
  | 'OrderHistory'
  | 'CustomerAccount'
  | 'CustomerProfile'
  | 'ContactSupport'
  | 'TrackSupportRequest'
  | 'ReviewFeedback'
  | 'ReturnOrder'
  | 'CustomerWallet'
  | 'CustomerSendMoney'
  | 'SendMoney'
  | 'CustomerSupport'
  | 'CustomerHelp'
  | 'CustomerNotifications'
  | 'CustomerAccountSettings'
  | 'CustomerPrivacyPolicy'
  | 'CustomerTerms';

interface NavigationParams {
  categoryId?: string | undefined;
  productId?: string | undefined;
  product?: any;
  shortfall?: string | undefined;
  orderId?: string | undefined;
  mode?: 'empty' | 'view' | 'edit' | undefined;
  isNewUser?: boolean | undefined;
  supportId?: string | undefined;
  orderNumber?: string | undefined;
  productName?: string | undefined;
  issueTypeLabel?: string | undefined;
  submittedOn?: string | undefined;
  initialTab?: RelatedCategory | undefined;
  addressSource?: string | undefined;
  [key: string]: any;
}

interface CustomerStackEntry {
  screen: ScreenName;
  params?: NavigationParams;
}

const theme = buildThemeForRole(RoleCode.CUSTOMER);

export function CustomerMainApp({ onSignOut }: { onSignOut: () => void }): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [navParams, setNavParams] = useState<NavigationParams>({});
  const [history, setHistory] = useState<CustomerStackEntry[]>([]);

  const navigate = useCallback(
    (screen: string, params?: NavigationParams) => {
      if (screen === 'SignOut') {
        onSignOut();
        return;
      }
      const targetScreen = (screen === 'CustomerMain' ? 'Home' : screen) as ScreenName;
      if (targetScreen === currentScreen) {
        if (params) setNavParams(params);
        return;
      }
      if (targetScreen === 'Home') {
        setHistory([]);
      } else if (targetScreen === 'CustomerAccount') {
        setHistory([{ screen: 'Home', params: {} }]);
      } else {
        setHistory((prev) => [...prev, { screen: currentScreen, params: navParams }]);
      }
      if (params) setNavParams(params);
      setCurrentScreen(targetScreen);
    },
    [currentScreen, navParams, onSignOut],
  );

  const goBack = useCallback(() => {
    if (currentScreen === 'CustomerAccount') {
      setHistory([]);
      setCurrentScreen('Home');
      setNavParams({});
      return;
    }
    if (history.length > 0) {
      setHistory((prev) => {
        const nextHistory = [...prev];
        const previous = nextHistory.pop();
        if (previous) {
          setCurrentScreen(previous.screen);
          setNavParams(previous.params || {});
        }
        return nextHistory;
      });
    } else if (currentScreen !== 'Home') {
      setCurrentScreen('Home');
      setNavParams({});
    }
  }, [history, currentScreen]);

  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'Home' && history.length === 0) {
        return false;
      }
      goBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentScreen, history, goBack]);

  // Push: register this device's FCM token for the signed-in customer. Never
  // prompts here (the Permissions screen asks); a no-op with a logged reason
  // when Firebase isn't configured. Revoked by logout() before tokens clear.
  useEffect(() => {
    void registerPushForSession({ app: 'customer-mobile', locale: getLocale() });
    return onForegroundPush(() => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  }, []);

  // Tapping a push (app in background/quit) deep-links via the payload's data.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  useEffect(
    () =>
      onPushOpened((message) => {
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        const target = notificationTarget(message.data);
        if (target) navigateRef.current(target.screen, target.params);
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.surface }]}>
          <ScreenStatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

          {currentScreen === 'Home' && (
            <HomeScreen onNavigate={(s, p) => navigate(s, p)} />
          )}
          {currentScreen === 'Categories' && (
            <CategoriesScreen onNavigate={(s, p) => navigate(s, p)} onBack={goBack} />
          )}

          {currentScreen === 'ProductGrid' && (
            <ProductGridScreen
              key={`${navParams.categoryId ?? ''}|${navParams.sort ?? ''}`}
              categoryId={navParams.categoryId}
              sort={navParams.sort as ProductSort | undefined}
              title={navParams.title as string | undefined}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'ProductDetail' && (
            <ProductDetailScreen
              key={`${navParams.productId ?? ''}`}
              productId={navParams.productId || ''}
              grade={navParams.grade as SellableGrade | undefined}
              onGoBack={goBack}
              onNavigate={(s, p) => navigate(s, p)}
            />
          )}

          {currentScreen === 'Search' && (
            <SearchScreen
              initialQuery={(navParams.query as string) || (navParams.initialQuery as string) || ''}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'Cart' && (
            <CartScreen onNavigate={(s, p) => navigate(s, p)} onGoBack={goBack} />
          )}

          {currentScreen === 'Wishlist' && (
            <WishlistScreen onNavigate={(s, p) => navigate(s, p)} onBack={goBack} />
          )}

          {currentScreen === 'Checkout' && (
            <CheckoutScreen onNavigate={(s, p) => navigate(s, p)} onGoBack={goBack} params={navParams} />
          )}

          {currentScreen === 'CustomerAddAddress' && (
            <CustomerAddAddressScreen
              initialSource={(navParams.addressSource as 'current' | 'manual') || 'current'}
              onNavigate={(screen) => {
                if (screen === 'CustomerLoadingMarket') {
                  navigate('CustomerLoadingMarket');
                } else if (screen === 'CustomerMain' || screen === 'CustomerPermissions') {
                  navigate('Home');
                } else {
                  goBack();
                }
              }}
            />
          )}

          {currentScreen === 'CustomerLoadingMarket' && (
            <CustomerLoadingMarketScreen
              onNavigate={() => {
                navigate('Home');
              }}
            />
          )}

          {currentScreen === 'Topup' && (
            <TopupScreen
              shortfall={navParams.shortfall}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'OrderTracking' && (
            <OrderTrackingScreen
              orderId={navParams.orderId}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'OrderHistory' && (
            <OrderHistoryScreen
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'CustomerAccount' && (
            <CustomerAccountScreen
              onNavigate={(s, p) => navigate(s, p)}
              onBack={() => {
                setHistory([]);
                setCurrentScreen('Home');
                setNavParams({});
              }}
              onSignOut={onSignOut}
            />
          )}

          {currentScreen === 'CustomerProfile' && (
            <CustomerProfileScreen
              initialMode={navParams.mode || (navParams.isNewUser ? 'empty' : 'view')}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'CustomerWallet' && (
            <CustomerWalletScreen onNavigate={(s, p) => navigate(s, p)} onBack={goBack} />
          )}

          {(currentScreen === 'CustomerSendMoney' || currentScreen === 'SendMoney') && (
            <CustomerSendMoneyScreen onNavigate={(s, p) => navigate(s, p)} onBack={goBack} />
          )}

          {currentScreen === 'CustomerSupport' && (
            <CustomerSupportScreen
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'CustomerHelp' && (
            <CustomerHelpScreen
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'CustomerNotifications' && (
            <CustomerNotificationsScreen
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'CustomerAccountSettings' && (
            <CustomerAccountSettingsScreen
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
              onAccountDeleted={onSignOut}
            />
          )}

          {currentScreen === 'CustomerPrivacyPolicy' && (
            <CustomerPrivacyPolicyScreen
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'CustomerTerms' && (
            <CustomerTermsScreen
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'ContactSupport' && (
            <ContactSupportScreen
              initialTab={navParams.initialTab}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'ReviewFeedback' && (
            <ReviewFeedbackScreen
              orderId={navParams.orderId}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'ReturnOrder' && (
            <ReturnOrderScreen
              initialOrderId={navParams.orderId}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}

          {currentScreen === 'TrackSupportRequest' && (
            <TrackSupportRequestScreen
              ticketId={navParams.ticketId}
              onNavigate={(s, p) => navigate(s, p)}
              onBack={goBack}
            />
          )}
        </SafeAreaView>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
