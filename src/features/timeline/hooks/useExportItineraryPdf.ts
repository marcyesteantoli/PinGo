import { useMutation } from '@tanstack/react-query'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

export function useExportItineraryPdf() {
  return useMutation<void, Error, string>({
    mutationFn: async (html) => {
      const { uri } = await Print.printToFileAsync({ html })

      const available = await Sharing.isAvailableAsync()
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' })
      }
    },
  })
}
