import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheet } from '@components/ui/BottomSheet'
import { LocationPicker } from '@features/timeline/components/LocationPicker'
import { useAddWishlistItem } from '../hooks/useAddWishlistItem'
import { useUpdateWishlistItem } from '../hooks/useUpdateWishlistItem'
import { useTheme } from '@lib/theme'
import { colors } from '@lib/colors'
import type { WishlistItem, WishlistItemType } from '@/types/index'
import { TYPE_COLORS, WISHLIST_TYPES as TYPES } from '../constants'

interface PickedLocation {
  name: string
  lat: number
  lng: number
  city?: string
}

interface AddWishlistSheetProps {
  visible: boolean
  onClose: () => void
  editItem?: WishlistItem
}

function locationToPickedLocation(item: WishlistItem): PickedLocation | undefined {
  if (!item.location?.lat || !item.location?.lng) return undefined
  return {
    name: item.location.address ?? item.location.city ?? '',
    lat: item.location.lat,
    lng: item.location.lng,
    city: item.location.city,
  }
}

export function AddWishlistSheet({ visible, onClose, editItem }: AddWishlistSheetProps) {
  const { isDark } = useTheme()
  const addItem = useAddWishlistItem()
  const updateItem = useUpdateWishlistItem(editItem?.id ?? '')

  const isEdit = !!editItem

  const [name, setName] = useState('')
  const [type, setType] = useState<WishlistItemType>('city')
  const [location, setLocation] = useState<PickedLocation | undefined>()
  const [note, setNote] = useState('')

  useEffect(() => {
    if (visible && editItem) {
      setName(editItem.name)
      setType(editItem.type)
      setLocation(locationToPickedLocation(editItem))
      setNote(editItem.note ?? '')
    } else if (visible && !editItem) {
      reset()
    }
  }, [visible, editItem])

  function reset() {
    setName('')
    setType('city')
    setLocation(undefined)
    setNote('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Añade un nombre para el lugar.')
      return
    }

    const callbacks = {
      onSuccess: () => { reset(); onClose() },
      onError: () => {
        Alert.alert('Error', `No se pudo ${isEdit ? 'actualizar' : 'guardar'} el deseo. Inténtalo de nuevo.`)
      },
    }

    if (isEdit) {
      updateItem.mutate({ name, type, location: location ?? null, note }, callbacks)
    } else {
      addItem.mutate({ name, type, location, note }, callbacks)
    }
  }

  const isPending = addItem.isPending || updateItem.isPending

  const inputBg   = isDark ? colors.surface[700] : colors.neutral[100]
  const textColor = isDark ? colors.neutral[50]  : colors.neutral[900]
  const labelColor = isDark ? colors.neutral[400] : colors.neutral[500]
  const placeholderColor = isDark ? colors.neutral[600] : colors.neutral[400]
  const inactiveBorder = isDark ? colors.surface[600] : colors.neutral[200]
  const inactiveChipBg = isDark ? colors.surface[700] : colors.white
  const inactiveChipBorder = isDark ? colors.surface[600] : colors.neutral[200]

  const LABEL_STYLE = {
    fontSize: 13,
    fontWeight: '500' as const,
    color: labelColor,
    marginBottom: 6,
  }

  const SECTION_GAP = 20

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={isEdit ? 'Editar deseo' : 'Nuevo deseo'} scrollable>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>

        {/* Nombre */}
        <Text style={LABEL_STYLE}>Lugar</Text>
        <View
          style={{
            backgroundColor: inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: inactiveBorder,
            marginBottom: SECTION_GAP,
          }}
        >
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre del lugar..."
            placeholderTextColor={placeholderColor}
            style={{
              fontSize: 15,
              color: textColor,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
            returnKeyType="next"
          />
        </View>

        {/* Tipo */}
        <Text style={LABEL_STYLE}>Tipo</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ marginBottom: SECTION_GAP }}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {TYPES.map((t) => {
            const isActive = type === t.key
            const accent = TYPE_COLORS[t.key]
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: isActive ? accent : inactiveChipBorder,
                  backgroundColor: isActive ? accent : inactiveChipBg,
                }}
              >
                <Ionicons
                  name={t.icon}
                  size={15}
                  color={isActive ? colors.white : (isDark ? colors.neutral[300] : colors.neutral[500])}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: isActive ? colors.white : (isDark ? colors.neutral[300] : colors.neutral[600]),
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Ubicación */}
        <Text style={LABEL_STYLE}>Ubicación (opcional)</Text>
        <View style={{ marginBottom: SECTION_GAP }}>
          <LocationPicker
            value={location}
            onChange={(loc) => setLocation(loc ?? undefined)}
          />
        </View>

        {/* Nota */}
        <Text style={LABEL_STYLE}>Nota (opcional)</Text>
        <View
          style={{
            backgroundColor: inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: inactiveBorder,
            marginBottom: SECTION_GAP,
          }}
        >
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="¿Por qué quieres ir? ¿Quién te lo recomendó?"
            placeholderTextColor={placeholderColor}
            multiline
            style={{
              fontSize: 15,
              color: textColor,
              paddingVertical: 12,
              paddingHorizontal: 14,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isPending}
          style={{
            backgroundColor: isPending ? colors.primary[400] : colors.primary[500],
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 52,
          }}
        >
          {isPending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              {isEdit ? 'Guardar cambios' : 'Añadir a mis deseos'}
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </BottomSheet>
  )
}
