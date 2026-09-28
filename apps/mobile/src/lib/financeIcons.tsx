import { createElement, type ComponentType, type ReactElement } from 'react'
import type { IconProps } from 'phosphor-react-native'
import { AirplaneIcon } from 'phosphor-react-native/src/icons/Airplane'
import { BabyIcon } from 'phosphor-react-native/src/icons/Baby'
import { BankIcon } from 'phosphor-react-native/src/icons/Bank'
import { BarbellIcon } from 'phosphor-react-native/src/icons/Barbell'
import { BedIcon } from 'phosphor-react-native/src/icons/Bed'
import { BicycleIcon } from 'phosphor-react-native/src/icons/Bicycle'
import { BoatIcon } from 'phosphor-react-native/src/icons/Boat'
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen'
import { BowlFoodIcon } from 'phosphor-react-native/src/icons/BowlFood'
import { BriefcaseIcon } from 'phosphor-react-native/src/icons/Briefcase'
import { BuildingsIcon } from 'phosphor-react-native/src/icons/Buildings'
import { BusIcon } from 'phosphor-react-native/src/icons/Bus'
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera'
import { CarIcon } from 'phosphor-react-native/src/icons/Car'
import { CatIcon } from 'phosphor-react-native/src/icons/Cat'
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle'
import { CoffeeIcon } from 'phosphor-react-native/src/icons/Coffee'
import { CoinsIcon } from 'phosphor-react-native/src/icons/Coins'
import { CreditCardIcon } from 'phosphor-react-native/src/icons/CreditCard'
import { DeviceMobileIcon } from 'phosphor-react-native/src/icons/DeviceMobile'
import { DogIcon } from 'phosphor-react-native/src/icons/Dog'
import { DropIcon } from 'phosphor-react-native/src/icons/Drop'
import { FilmSlateIcon } from 'phosphor-react-native/src/icons/FilmSlate'
import { FlameIcon } from 'phosphor-react-native/src/icons/Flame'
import { FlowerIcon } from 'phosphor-react-native/src/icons/Flower'
import { ForkKnifeIcon } from 'phosphor-react-native/src/icons/ForkKnife'
import { GameControllerIcon } from 'phosphor-react-native/src/icons/GameController'
import { GasPumpIcon } from 'phosphor-react-native/src/icons/GasPump'
import { GiftIcon } from 'phosphor-react-native/src/icons/Gift'
import { GraduationCapIcon } from 'phosphor-react-native/src/icons/GraduationCap'
import { HammerIcon } from 'phosphor-react-native/src/icons/Hammer'
import { HeadphonesIcon } from 'phosphor-react-native/src/icons/Headphones'
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart'
import { HeartbeatIcon } from 'phosphor-react-native/src/icons/Heartbeat'
import { HouseIcon } from 'phosphor-react-native/src/icons/House'
import { IceCreamIcon } from 'phosphor-react-native/src/icons/IceCream'
import { LeafIcon } from 'phosphor-react-native/src/icons/Leaf'
import { LightningIcon } from 'phosphor-react-native/src/icons/Lightning'
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone'
import { MoneyIcon } from 'phosphor-react-native/src/icons/Money'
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon'
import { MountainsIcon } from 'phosphor-react-native/src/icons/Mountains'
import { MusicNotesIcon } from 'phosphor-react-native/src/icons/MusicNotes'
import { PaintBrushIcon } from 'phosphor-react-native/src/icons/PaintBrush'
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint'
import { PiggyBankIcon } from 'phosphor-react-native/src/icons/PiggyBank'
import { PillIcon } from 'phosphor-react-native/src/icons/Pill'
import { PizzaIcon } from 'phosphor-react-native/src/icons/Pizza'
import { PlugIcon } from 'phosphor-react-native/src/icons/Plug'
import { ReceiptIcon } from 'phosphor-react-native/src/icons/Receipt'
import { RepeatIcon } from 'phosphor-react-native/src/icons/Repeat'
import { ScissorsIcon } from 'phosphor-react-native/src/icons/Scissors'
import { ShoppingBagIcon } from 'phosphor-react-native/src/icons/ShoppingBag'
import { ShoppingCartIcon } from 'phosphor-react-native/src/icons/ShoppingCart'
import { SnowflakeIcon } from 'phosphor-react-native/src/icons/Snowflake'
import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle'
import { StarIcon } from 'phosphor-react-native/src/icons/Star'
import { StethoscopeIcon } from 'phosphor-react-native/src/icons/Stethoscope'
import { StorefrontIcon } from 'phosphor-react-native/src/icons/Storefront'
import { SunIcon } from 'phosphor-react-native/src/icons/Sun'
import { TShirtIcon } from 'phosphor-react-native/src/icons/TShirt'
import { TagIcon } from 'phosphor-react-native/src/icons/Tag'
import { TelevisionIcon } from 'phosphor-react-native/src/icons/Television'
import { TentIcon } from 'phosphor-react-native/src/icons/Tent'
import { TicketIcon } from 'phosphor-react-native/src/icons/Ticket'
import { TrainIcon } from 'phosphor-react-native/src/icons/Train'
import { TreePalmIcon } from 'phosphor-react-native/src/icons/TreePalm'
import { UmbrellaIcon } from 'phosphor-react-native/src/icons/Umbrella'
import { WalletIcon } from 'phosphor-react-native/src/icons/Wallet'
import { WifiHighIcon } from 'phosphor-react-native/src/icons/WifiHigh'
import { WineIcon } from 'phosphor-react-native/src/icons/Wine'
import { WrenchIcon } from 'phosphor-react-native/src/icons/Wrench'

export type FinanceIconName = keyof typeof FINANCE_ICONS

/**
 * Ícones das categorias de finanças. As chaves (nomes do antigo Lucide) ficam
 * como estão porque são salvas no banco; o desenho agora é Phosphor, como no resto do app.
 */
export const FINANCE_ICONS = {
  home: HouseIcon,
  utensils: ForkKnifeIcon,
  car: CarIcon,
  'shopping-cart': ShoppingCartIcon,
  'gamepad-2': GameControllerIcon,
  'heart-pulse': HeartbeatIcon,
  'graduation-cap': GraduationCapIcon,
  circle: CircleIcon,
  wallet: WalletIcon,
  'credit-card': CreditCardIcon,
  coffee: CoffeeIcon,
  plane: AirplaneIcon,
  dumbbell: BarbellIcon,
  'paw-print': PawPrintIcon,
  music: MusicNotesIcon,
  clapperboard: FilmSlateIcon,
  smartphone: DeviceMobileIcon,
  zap: LightningIcon,
  gift: GiftIcon,
  briefcase: BriefcaseIcon,
  wrench: WrenchIcon,
  leaf: LeafIcon,
  heart: HeartIcon,
  repeat: RepeatIcon,
  tag: TagIcon,
  baby: BabyIcon,
  bus: BusIcon,
  bike: BicycleIcon,
  fuel: GasPumpIcon,
  shirt: TShirtIcon,
  scissors: ScissorsIcon,
  sparkles: SparkleIcon,
  stethoscope: StethoscopeIcon,
  pill: PillIcon,
  'building-2': BuildingsIcon,
  landmark: BankIcon,
  wifi: WifiHighIcon,
  tv: TelevisionIcon,
  'book-open': BookOpenIcon,
  dog: DogIcon,
  cat: CatIcon,
  'flower-2': FlowerIcon,
  umbrella: UmbrellaIcon,
  ticket: TicketIcon,
  wine: WineIcon,
  pizza: PizzaIcon,
  salad: BowlFoodIcon,
  'ice-cream': IceCreamIcon,
  'shopping-bag': ShoppingBagIcon,
  store: StorefrontIcon,
  receipt: ReceiptIcon,
  'piggy-bank': PiggyBankIcon,
  coins: CoinsIcon,
  banknote: MoneyIcon,
  train: TrainIcon,
  ship: BoatIcon,
  hotel: BedIcon,
  tent: TentIcon,
  palmtree: TreePalmIcon,
  mountain: MountainsIcon,
  camera: CameraIcon,
  headphones: HeadphonesIcon,
  mic: MicrophoneIcon,
  paintbrush: PaintBrushIcon,
  hammer: HammerIcon,
  plug: PlugIcon,
  droplets: DropIcon,
  flame: FlameIcon,
  snowflake: SnowflakeIcon,
  sun: SunIcon,
  moon: MoonIcon,
  star: StarIcon,
} as const satisfies Record<string, ComponentType<IconProps>>

export const FINANCE_ICON_NAMES = Object.keys(FINANCE_ICONS) as FinanceIconName[]

const ION_TO_FINANCE: Record<string, FinanceIconName> = {
  'home-outline': 'home',
  'restaurant-outline': 'utensils',
  'car-outline': 'car',
  'cart-outline': 'shopping-cart',
  'game-controller-outline': 'gamepad-2',
  'medkit-outline': 'heart-pulse',
  'school-outline': 'graduation-cap',
  'ellipse-outline': 'circle',
  'wallet-outline': 'wallet',
  'card-outline': 'credit-card',
  'cafe-outline': 'coffee',
  'airplane-outline': 'plane',
  'fitness-outline': 'dumbbell',
  'paw-outline': 'paw-print',
  'musical-notes-outline': 'music',
  'film-outline': 'clapperboard',
  'phone-portrait-outline': 'smartphone',
  'flash-outline': 'zap',
  'gift-outline': 'gift',
  'briefcase-outline': 'briefcase',
  'construct-outline': 'wrench',
  'leaf-outline': 'leaf',
  'heart-outline': 'heart',
  'repeat-outline': 'repeat',
  'pricetag-outline': 'tag',
}

export function resolveFinanceIconName(raw: string | undefined): FinanceIconName
{
  if (raw && raw in FINANCE_ICONS) return raw as FinanceIconName
  if (raw && ION_TO_FINANCE[raw]) return ION_TO_FINANCE[raw]
  return 'circle'
}

export function FinanceIcon({
  name,
  size = 18,
  color,
}: {
  name: string
  size?: number
  color: string
}): ReactElement
{
  const Glyph = FINANCE_ICONS[resolveFinanceIconName(name)]
  return createElement(Glyph, { size, color, weight: 'regular' })
}
