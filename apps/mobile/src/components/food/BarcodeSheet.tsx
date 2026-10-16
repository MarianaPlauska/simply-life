import { useEffect, useRef, useState } from 'react'
import { Linking, Platform, Pressable, View } from 'react-native'
import { Modal } from '../../ui/Modal'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import {
  OFF_ATTRIBUTION,
  OFF_ATTRIBUTION_URL,
  OFF_SOURCE,
  formatGrams,
  formatKcal,
  type FoodItem,
  type OffProduct,
} from '@simply-life/shared'
import { Field, PrimaryButton, Text, CloseButton } from '../../ui'
import { Icon } from '../../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'
import { lookupBarcode } from '../../lib/openFoodFactsApi'

type Props = {
  visible: boolean
  showCalories: boolean
  onClose: () => void
  onAdd: (item: FoodItem) => void
}

const REASON_COPY = {
  codigo: 'Esse código não parece completo. Ele tem de 8 a 14 números.',
  nao_encontrado: 'Não achei esse produto no Open Food Facts. Você pode digitar o nome no texto da refeição.',
  rede: 'Sem conexão agora. Tente de novo em instantes.',
} as const

/** Lê o código de barras (câmera no app, digitado no navegador) e busca no Open Food Facts. */
export function BarcodeSheet({ visible, showCalories, onClose, onAdd }: Props)
{
  const { colors, space, radius } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [product, setProduct] = useState<OffProduct | null>(null)
  const lastScan = useRef<string | null>(null)
  const canScan = Platform.OS !== 'web'

  useEffect(() =>
  {
    if (!visible)
    {
      setCode('')
      setMsg(null)
      setProduct(null)
      setBusy(false)
      lastScan.current = null
    }
  }, [visible])

  const search = async (raw: string) =>
  {
    if (busy) return
    setBusy(true)
    setMsg(null)
    const res = await lookupBarcode(raw)
    setBusy(false)
    if (res.ok) setProduct(res.product)
    else
    {
      setProduct(null)
      setMsg(REASON_COPY[res.reason])
    }
  }

  const onScanned = (r: BarcodeScanningResult) =>
  {
    if (busy || product || lastScan.current === r.data) return
    lastScan.current = r.data
    setCode(r.data)
    void search(r.data)
  }

  const add = () =>
  {
    if (!product) return
    // porção da embalagem quando há kcal por porção; senão 100 g. Proteína e açúcar na mesma base.
    const byServing = product.kcalPorcao != null && Boolean(product.porcao)
    const kcal = byServing ? product.kcalPorcao : product.kcal100g
    const quantidade = byServing ? product.porcao : product.kcal100g != null ? '100 g' : product.porcao
    onAdd({
      key: product.key,
      nome: product.nome.toLowerCase(),
      quantidade: quantidade ?? null,
      kcal: kcal ?? null,
      proteina: byServing ? product.proteinaPorcao : product.proteina100g,
      acucar: byServing ? product.acucarPorcao : product.acucar100g,
      fonte: OFF_SOURCE,
      barcode: product.barcode,
    })
    onClose()
  }

  if (!visible) return null

  const kcalLine = product
    ? product.kcalPorcao != null && product.porcao
      ? `${formatKcal(product.kcalPorcao)} por porção (${product.porcao})`
      : product.kcal100g != null
        ? `${formatKcal(product.kcal100g)} em 100 g`
        : 'Sem caloria informada para este produto'
    : ''
  const byServing = Boolean(product && product.kcalPorcao != null && product.porcao)
  const protG = product ? (byServing ? product.proteinaPorcao : product.proteina100g) : null
  const acuG = product ? (byServing ? product.acucarPorcao : product.acucar100g) : null
  const nutrientLine = [
    protG != null ? `${formatGrams(protG)} de proteína` : null,
    acuG != null ? `${formatGrams(acuG)} de açúcar` : null,
  ].filter(Boolean).join(' · ')

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} accessibilityLabel="Fechar" />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          padding: space.lg,
          paddingBottom: space.xxl,
          gap: space.md,
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Icon name="barcode-outline" size={20} color={colors.brand} />
          <Text variant="section" style={{ flex: 1 }}>Código de barras</Text>
          <CloseButton onPress={onClose} size={36} />
        </View>

        {canScan && !product ? (
          permission?.granted ? (
            <View style={{ height: 220, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.canvas }}>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                onBarcodeScanned={busy ? undefined : onScanned}
              />
            </View>
          ) : (
            <View style={{ gap: space.sm }}>
              <Text variant="body" muted>
                Para ler o código, o app precisa usar a câmera. Se preferir, digite os números abaixo.
              </Text>
              {permission?.canAskAgain === false ? (
                <PrimaryButton label="Abrir ajustes" variant="secondary" size="sm" onPress={() => void Linking.openSettings()} />
              ) : (
                <PrimaryButton label="Usar a câmera" variant="secondary" size="sm" icon="barcode-outline" onPress={() => void requestPermission()} />
              )}
            </View>
          )
        ) : null}

        {!product ? (
          <View style={{ gap: space.sm }}>
            <Field
              label="Números do código"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="7891000100103"
              returnKeyType="search"
              onSubmitEditing={() => void search(code)}
            />
            <PrimaryButton label="Buscar produto" loading={busy} disabled={!code.trim()} onPress={() => void search(code)} />
          </View>
        ) : (
          <View style={{ gap: space.sm, padding: space.md, borderRadius: radius.control, backgroundColor: colors.brandMuted }}>
            <Text variant="bodyStrong">{product.nome}</Text>
            {product.marca ? <Text variant="caption" muted>{product.marca}</Text> : null}
            {showCalories ? <Text variant="body">{kcalLine}</Text> : null}
            {showCalories && nutrientLine ? <Text variant="caption" muted>{nutrientLine}</Text> : null}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Adicionar" onPress={add} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Ler outro"
                  variant="secondary"
                  onPress={() =>
                  {
                    setProduct(null)
                    setCode('')
                    lastScan.current = null
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {msg ? <Text variant="caption" muted>{msg}</Text> : null}

        <Pressable onPress={() => void Linking.openURL(OFF_ATTRIBUTION_URL)} accessibilityRole="link">
          <Text variant="micro" muted>{`${OFF_ATTRIBUTION} (licença ODbL)`}</Text>
        </Pressable>
      </View>
    </Modal>
  )
}
