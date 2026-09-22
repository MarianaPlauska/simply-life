import { Image, View } from 'react-native'

const STAGE = require('../../../assets/login-hero-stage.png')

/** Palco 3D: notebook, telefone e cards flutuantes (render). */
export function LoginProductPreview()
{
  return (
    <View style={{ height: 320, marginTop: 4 }} pointerEvents="none">
      <Image
        source={STAGE}
        resizeMode="contain"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  )
}
