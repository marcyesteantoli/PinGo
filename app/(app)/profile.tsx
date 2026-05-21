import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Alert,
  Linking,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar } from '@components/ui/Avatar'
import { useCurrentUser } from '@features/auth/hooks/useCurrentUser'
import { useProfile } from '@features/auth/hooks/useProfile'
import { useSignOut } from '@features/auth/hooks/useSignOut'
import { useUpdateProfile } from '@features/auth/hooks/useUpdateProfile'
import { useTrips } from '@features/trips/hooks/useTrips'
import { colors } from '@lib/colors'
import { useTheme } from '@lib/theme'

function formatMonthYear(dateStr: string): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

export default function ProfileScreen() {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const { data: user } = useCurrentUser()
  const { data: profile } = useProfile(user?.id)
  const { data: trips = [] } = useTrips()
  const updateProfile = useUpdateProfile()
  const signOut = useSignOut()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  const displayName = profile?.name ?? user?.user_metadata?.name ?? '—'
  const email = user?.email ?? '—'
  const memberSince = user?.created_at ? formatMonthYear(user.created_at) : '—'
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  const uniqueCompanions = useMemo(() => {
    const ids = new Set<string>()
    for (const trip of trips) {
      for (const c of trip.collaborators) {
        if (c.user_id !== user?.id) ids.add(c.user_id)
      }
    }
    return ids.size
  }, [trips, user?.id])

  const startEditName = () => {
    setNameValue(displayName)
    setEditingName(true)
  }

  const saveName = async () => {
    if (!user?.id || !nameValue.trim()) return
    await updateProfile.mutateAsync({ userId: user.id, name: nameValue.trim() })
    setEditingName(false)
  }

  const cancelEditName = () => {
    setEditingName(false)
    setNameValue('')
  }

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0] && user?.id) {
      await updateProfile.mutateAsync({ userId: user.id, avatar_url: result.assets[0].uri })
    }
  }

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => signOut.mutate(),
      },
    ])
  }

  const iconColor = isDark ? colors.neutral[500] : colors.neutral[400]
  const rowBase = 'flex-row items-center px-4 py-[13px]'
  const labelBase = 'text-[17px] text-neutral-900 dark:text-neutral-50'
  const valueBase = 'text-[17px] text-neutral-500 dark:text-neutral-400'
  const sectionCard = 'rounded-2xl overflow-hidden bg-white dark:bg-surface-800 mx-4'
  const sectionLabel = 'text-[13px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mx-4 mb-2 mt-6'
  const divider = 'h-px bg-neutral-100 dark:bg-surface-700 ml-[52px]'

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top', 'bottom']}>
      {/* Nav bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-50">
          Perfil
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
        {/* Avatar hero */}
        <View className="items-center pt-6 pb-6">
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.75}>
            <View className="relative">
              <View className="items-center justify-center">
                <Avatar
                  uri={profile?.avatar_url}
                  name={displayName}
                  size="lg"
                />
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 items-center justify-center border-2 border-white dark:border-surface-900">
                <Ionicons name="camera" size={14} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text className="mt-3 text-[22px] font-bold text-neutral-900 dark:text-neutral-50">
            {displayName}
          </Text>
          <Text className="text-[15px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {email}
          </Text>
        </View>

        {/* Stats bar */}
        <View className="flex-row mx-4 mb-2 rounded-2xl overflow-hidden bg-white dark:bg-surface-800">
          <View className="flex-1 items-center py-4">
            <Text className="text-[24px] font-bold text-neutral-900 dark:text-neutral-50">
              {trips.length}
            </Text>
            <Text className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Viajes
            </Text>
          </View>
          <View className="w-px bg-neutral-100 dark:bg-surface-700 my-3" />
          <View className="flex-1 items-center py-4">
            <Text className="text-[24px] font-bold text-neutral-900 dark:text-neutral-50">
              {uniqueCompanions}
            </Text>
            <Text className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Compañeros
            </Text>
          </View>
        </View>

        {/* Sección: Cuenta */}
        <Text className={sectionLabel}>Cuenta</Text>
        <View className={sectionCard}>
          {/* Nombre */}
          <View className={rowBase}>
            <Ionicons name="person-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
            <Text className={`${labelBase} flex-1`}>Nombre</Text>
            {editingName ? (
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={nameValue}
                  onChangeText={setNameValue}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  className="text-[17px] text-neutral-900 dark:text-neutral-50 text-right min-w-[120px]"
                  style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                />
                <TouchableOpacity onPress={saveName} className="ml-1">
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEditName}>
                  <Ionicons name="close-circle" size={24} color={iconColor} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={startEditName}
                className="flex-row items-center gap-1"
              >
                <Text className={valueBase}>{displayName}</Text>
                <Ionicons name="chevron-forward" size={16} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>

          <View className={divider} />

          {/* Email */}
          <View className={rowBase}>
            <Ionicons name="mail-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
            <Text className={`${labelBase} flex-1`}>Email</Text>
            <Text className={valueBase}>{email}</Text>
          </View>

          <View className={divider} />

          {/* Miembro desde */}
          <View className={rowBase}>
            <Ionicons name="calendar-outline" size={20} color={iconColor} style={{ marginRight: 12 }} />
            <Text className={`${labelBase} flex-1`}>Miembro desde</Text>
            <Text className={valueBase} style={{ textTransform: 'capitalize' }}>{memberSince}</Text>
          </View>
        </View>

        {/* Sección: Apariencia */}
        <Text className={sectionLabel}>Apariencia</Text>
        <View className={sectionCard}>
          <View className={rowBase}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={isDark ? colors.primary[400] : colors.tertiary[400]}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>Modo oscuro</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
            />
          </View>
        </View>

        {/* Sección: App */}
        <Text className={sectionLabel}>App</Text>
        <View className={sectionCard}>
          <View className={rowBase}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={iconColor}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>Versión</Text>
            <Text className={valueBase}>{appVersion}</Text>
          </View>
          <View className={divider} />
          <TouchableOpacity
            // TODO (producción): crear términos de uso y actualizar esta URL antes de publicar en App Store / Play Store
            onPress={() => Linking.openURL('https://pingo.app/terminos')}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={iconColor}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>Términos de uso</Text>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>
          <View className={divider} />
          <TouchableOpacity
            // TODO (producción): crear política de privacidad y actualizar esta URL antes de publicar en App Store / Play Store
            onPress={() => Linking.openURL('https://pingo.app/privacidad')}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={iconColor}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>Privacidad</Text>
            <Ionicons name="chevron-forward" size={16} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* Sección: Sesión */}
        <Text className={sectionLabel}>Sesión</Text>
        <View className={sectionCard}>
          <TouchableOpacity
            onPress={handleSignOut}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={colors.error}
              style={{ marginRight: 12 }}
            />
            <Text className="text-[17px] text-error font-medium">
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
