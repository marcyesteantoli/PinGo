import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
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
import { useSavedExperiences } from '@features/saved/hooks/useSavedExperiences'
import { useTheme } from '@lib/theme'

export default function ProfileScreen() {
  const router = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const { data: user } = useCurrentUser()
  const { data: profile } = useProfile(user?.id)
  const updateProfile = useUpdateProfile()
  const signOut = useSignOut()
  const { data: saved = [] } = useSavedExperiences()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  const displayName = profile?.name ?? user?.user_metadata?.name ?? '—'
  const email = user?.email ?? '—'

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

  const rowBase = 'flex-row items-center px-4 py-[13px]'
  const labelBase = 'text-[17px] text-neutral-900 dark:text-neutral-50'
  const valueBase = 'text-[17px] text-neutral-400 dark:text-neutral-500'
  const sectionCard = 'rounded-2xl overflow-hidden bg-white dark:bg-surface-800 mx-4'
  const sectionLabel = 'text-[13px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mx-4 mb-2 mt-6'
  const divider = 'h-px bg-neutral-100 dark:bg-surface-700 ml-4'

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-surface-900" edges={['top', 'bottom']}>
      {/* Nav bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-50">
          Perfil
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-12">
        {/* Avatar hero */}
        <View className="items-center pt-6 pb-8">
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.75}>
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center overflow-hidden">
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
          <Text className="text-[15px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            {email}
          </Text>
        </View>

        {/* Sección: Cuenta */}
        <Text className={sectionLabel}>Cuenta</Text>
        <View className={sectionCard}>
          {/* Nombre */}
          <View className={rowBase}>
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
                  <Ionicons name="checkmark-circle" size={24} color="#06b6d4" />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelEditName}>
                  <Ionicons name="close-circle" size={24} color={isDark ? '#64748b' : '#94a3b8'} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={startEditName}
                className="flex-row items-center gap-1"
              >
                <Text className={valueBase}>{displayName}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? '#64748b' : '#94a3b8'}
                />
              </TouchableOpacity>
            )}
          </View>

          <View className={divider} />

          {/* Email */}
          <View className={rowBase}>
            <Text className={`${labelBase} flex-1`}>Email</Text>
            <Text className={valueBase}>{email}</Text>
          </View>
        </View>

        {/* Sección: Mis Joyas */}
        <Text className={sectionLabel}>Mis Joyas</Text>
        <View className={sectionCard}>
          <TouchableOpacity
            onPress={() => router.push('/saved-experiences')}
            className={rowBase}
            activeOpacity={0.7}
          >
            <Ionicons
              name="bookmark"
              size={20}
              color={isDark ? '#7b82f5' : '#0046de'}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>Mis Joyas</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {saved.length > 0 && (
                <Text className={valueBase}>{saved.length}</Text>
              )}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDark ? '#64748b' : '#94a3b8'}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sección: Apariencia */}
        <Text className={sectionLabel}>Apariencia</Text>
        <View className={sectionCard}>
          <View className={rowBase}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={isDark ? '#7b82f5' : '#f59e0b'}
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
              color={isDark ? '#64748b' : '#94a3b8'}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>Versión</Text>
            <Text className={valueBase}>1.0.0</Text>
          </View>
          <View className={divider} />
          <View className={rowBase}>
            <Ionicons
              name="school-outline"
              size={20}
              color={isDark ? '#64748b' : '#94a3b8'}
              style={{ marginRight: 12 }}
            />
            <Text className={`${labelBase} flex-1`}>PinGo</Text>
            <Text className={valueBase}>TFM 2026</Text>
          </View>
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
              color="#ef4444"
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
