import type { ComponentType } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { Ionicons } from '@expo/vector-icons'
import type { IconProps, IconWeight } from 'phosphor-react-native'
import { AirplaneIcon } from 'phosphor-react-native/src/icons/Airplane'
import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut'
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp'
import { ArrowsDownUpIcon } from 'phosphor-react-native/src/icons/ArrowsDownUp'
import { ArrowsLeftRightIcon } from 'phosphor-react-native/src/icons/ArrowsLeftRight'
import { AtIcon } from 'phosphor-react-native/src/icons/At'
import { BarbellIcon } from 'phosphor-react-native/src/icons/Barbell'
import { BarcodeIcon } from 'phosphor-react-native/src/icons/Barcode'
import { BellIcon } from 'phosphor-react-native/src/icons/Bell'
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen'
import { BriefcaseIcon } from 'phosphor-react-native/src/icons/Briefcase'
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank'
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck'
import { CarIcon } from 'phosphor-react-native/src/icons/Car'
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown'
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft'
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight'
import { CaretUpIcon } from 'phosphor-react-native/src/icons/CaretUp'
import { CarrotIcon } from 'phosphor-react-native/src/icons/Carrot'
import { ChartBarIcon } from 'phosphor-react-native/src/icons/ChartBar'
import { ChartLineIcon } from 'phosphor-react-native/src/icons/ChartLine'
import { CheckIcon } from 'phosphor-react-native/src/icons/Check'
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle'
import { CheckSquareIcon } from 'phosphor-react-native/src/icons/CheckSquare'
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle'
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock'
import { ClockCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ClockCounterClockwise'
import { ArrowBendDownRightIcon } from 'phosphor-react-native/src/icons/ArrowBendDownRight'
import { ExportIcon } from 'phosphor-react-native/src/icons/Export'
import { CloudIcon } from 'phosphor-react-native/src/icons/Cloud'
import { CloudLightningIcon } from 'phosphor-react-native/src/icons/CloudLightning'
import { CloudRainIcon } from 'phosphor-react-native/src/icons/CloudRain'
import { CloudSunIcon } from 'phosphor-react-native/src/icons/CloudSun'
import { CodeIcon } from 'phosphor-react-native/src/icons/Code'
import { CoffeeIcon } from 'phosphor-react-native/src/icons/Coffee'
import { CopyIcon } from 'phosphor-react-native/src/icons/Copy'
import { CpuIcon } from 'phosphor-react-native/src/icons/Cpu'
import { CreditCardIcon } from 'phosphor-react-native/src/icons/CreditCard'
import { DeviceMobileIcon } from 'phosphor-react-native/src/icons/DeviceMobile'
import { DotsThreeIcon } from 'phosphor-react-native/src/icons/DotsThree'
import { DownloadSimpleIcon } from 'phosphor-react-native/src/icons/DownloadSimple'
import { DropIcon } from 'phosphor-react-native/src/icons/Drop'
import { EnvelopeIcon } from 'phosphor-react-native/src/icons/Envelope'
import { ExclamationMarkIcon } from 'phosphor-react-native/src/icons/ExclamationMark'
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText'
import { FilmStripIcon } from 'phosphor-react-native/src/icons/FilmStrip'
import { FirstAidIcon } from 'phosphor-react-native/src/icons/FirstAid'
import { FirstAidKitIcon } from 'phosphor-react-native/src/icons/FirstAidKit'
import { FlagIcon } from 'phosphor-react-native/src/icons/Flag'
import { FlameIcon } from 'phosphor-react-native/src/icons/Flame'
import { FolderIcon } from 'phosphor-react-native/src/icons/Folder'
import { ForkKnifeIcon } from 'phosphor-react-native/src/icons/ForkKnife'
import { GameControllerIcon } from 'phosphor-react-native/src/icons/GameController'
import { GearIcon } from 'phosphor-react-native/src/icons/Gear'
import { GiftIcon } from 'phosphor-react-native/src/icons/Gift'
import { GitBranchIcon } from 'phosphor-react-native/src/icons/GitBranch'
import { GlobeIcon } from 'phosphor-react-native/src/icons/Globe'
import { GraduationCapIcon } from 'phosphor-react-native/src/icons/GraduationCap'
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart'
import { HeartbeatIcon } from 'phosphor-react-native/src/icons/Heartbeat'
import { HouseIcon } from 'phosphor-react-native/src/icons/House'
import { IceCreamIcon } from 'phosphor-react-native/src/icons/IceCream'
import { InfoIcon } from 'phosphor-react-native/src/icons/Info'
import { KeyIcon } from 'phosphor-react-native/src/icons/Key'
import { LeafIcon } from 'phosphor-react-native/src/icons/Leaf'
import { LightningIcon } from 'phosphor-react-native/src/icons/Lightning'
import { LinkIcon } from 'phosphor-react-native/src/icons/Link'
import { ListIcon } from 'phosphor-react-native/src/icons/List'
import { LockIcon } from 'phosphor-react-native/src/icons/Lock'
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass'
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin'
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal'
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus'
import { MoneyIcon } from 'phosphor-react-native/src/icons/Money'
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon'
import { MusicNotesIcon } from 'phosphor-react-native/src/icons/MusicNotes'
import { PaletteIcon } from 'phosphor-react-native/src/icons/Palette'
import { PaperPlaneRightIcon } from 'phosphor-react-native/src/icons/PaperPlaneRight'
import { PauseIcon } from 'phosphor-react-native/src/icons/Pause'
import { PauseCircleIcon } from 'phosphor-react-native/src/icons/PauseCircle'
import { PawPrintIcon } from 'phosphor-react-native/src/icons/PawPrint'
import { PencilIcon } from 'phosphor-react-native/src/icons/Pencil'
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple'
import { PersonIcon } from 'phosphor-react-native/src/icons/Person'
import { PersonArmsSpreadIcon } from 'phosphor-react-native/src/icons/PersonArmsSpread'
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone'
import { PlayIcon } from 'phosphor-react-native/src/icons/Play'
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus'
import { PulseIcon } from 'phosphor-react-native/src/icons/Pulse'
import { PushPinIcon } from 'phosphor-react-native/src/icons/PushPin'
import { QuestionIcon } from 'phosphor-react-native/src/icons/Question'
import { ReceiptIcon } from 'phosphor-react-native/src/icons/Receipt'
import { RepeatIcon } from 'phosphor-react-native/src/icons/Repeat'
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck'
import { ShoppingCartIcon } from 'phosphor-react-native/src/icons/ShoppingCart'
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal'
import { SmileyIcon } from 'phosphor-react-native/src/icons/Smiley'
import { SmileySadIcon } from 'phosphor-react-native/src/icons/SmileySad'
import { SnowflakeIcon } from 'phosphor-react-native/src/icons/Snowflake'
import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle'
import { SpeakerSlashIcon } from 'phosphor-react-native/src/icons/SpeakerSlash'
import { SquareIcon } from 'phosphor-react-native/src/icons/Square'
import { SquaresFourIcon } from 'phosphor-react-native/src/icons/SquaresFour'
import { StackIcon } from 'phosphor-react-native/src/icons/Stack'
import { StarIcon } from 'phosphor-react-native/src/icons/Star'
import { SunIcon } from 'phosphor-react-native/src/icons/Sun'
import { TagIcon } from 'phosphor-react-native/src/icons/Tag'
import { TimerIcon } from 'phosphor-react-native/src/icons/Timer'
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash'
import { TrendUpIcon } from 'phosphor-react-native/src/icons/TrendUp'
import { TrophyIcon } from 'phosphor-react-native/src/icons/Trophy'
import { UserIcon } from 'phosphor-react-native/src/icons/User'
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus'
import { UsersIcon } from 'phosphor-react-native/src/icons/Users'
import { WalletIcon } from 'phosphor-react-native/src/icons/Wallet'
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning'
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle'
import { WatchIcon } from 'phosphor-react-native/src/icons/Watch'
import { WrenchIcon } from 'phosphor-react-native/src/icons/Wrench'
import { XIcon } from 'phosphor-react-native/src/icons/X'
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle'
// coleções e avatares (packages/shared/src/chamaRewards.ts, unlocks.ts)
import { AlienIcon } from 'phosphor-react-native/src/icons/Alien'
import { AtomIcon } from 'phosphor-react-native/src/icons/Atom'
import { BrainIcon } from 'phosphor-react-native/src/icons/Brain'
import { BugBeetleIcon } from 'phosphor-react-native/src/icons/BugBeetle'
import { CampfireIcon } from 'phosphor-react-native/src/icons/Campfire'
import { CowIcon } from 'phosphor-react-native/src/icons/Cow'
import { DetectiveIcon } from 'phosphor-react-native/src/icons/Detective'
import { DiceFiveIcon } from 'phosphor-react-native/src/icons/DiceFive'
import { FlaskIcon } from 'phosphor-react-native/src/icons/Flask'
import { GhostIcon } from 'phosphor-react-native/src/icons/Ghost'
import { HamburgerIcon } from 'phosphor-react-native/src/icons/Hamburger'
import { JoystickIcon } from 'phosphor-react-native/src/icons/Joystick'
import { LightbulbIcon } from 'phosphor-react-native/src/icons/Lightbulb'
import { MagicWandIcon } from 'phosphor-react-native/src/icons/MagicWand'
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone'
import { MoonStarsIcon } from 'phosphor-react-native/src/icons/MoonStars'
import { PianoKeysIcon } from 'phosphor-react-native/src/icons/PianoKeys'
import { PopsicleIcon } from 'phosphor-react-native/src/icons/Popsicle'
import { RobotIcon } from 'phosphor-react-native/src/icons/Robot'
import { ShieldIcon } from 'phosphor-react-native/src/icons/Shield'
import { ShootingStarIcon } from 'phosphor-react-native/src/icons/ShootingStar'
import { ShrimpIcon } from 'phosphor-react-native/src/icons/Shrimp'
import { SmileyWinkIcon } from 'phosphor-react-native/src/icons/SmileyWink'
import { SunHorizonIcon } from 'phosphor-react-native/src/icons/SunHorizon'
import { SwordIcon } from 'phosphor-react-native/src/icons/Sword'
import { TennisBallIcon } from 'phosphor-react-native/src/icons/TennisBall'
import { TreePalmIcon } from 'phosphor-react-native/src/icons/TreePalm'
import { TreeEvergreenIcon } from 'phosphor-react-native/src/icons/TreeEvergreen'
import { UmbrellaIcon } from 'phosphor-react-native/src/icons/Umbrella'
import { VinylRecordIcon } from 'phosphor-react-native/src/icons/VinylRecord'
import { YinYangIcon } from 'phosphor-react-native/src/icons/YinYang'
import { BooksIcon } from 'phosphor-react-native/src/icons/Books'
import { StudentIcon } from 'phosphor-react-native/src/icons/Student'
import { FishIcon } from 'phosphor-react-native/src/icons/Fish'
import { TreeIcon } from 'phosphor-react-native/src/icons/Tree'
import { FlowerIcon } from 'phosphor-react-native/src/icons/Flower'
import { FlowerTulipIcon } from 'phosphor-react-native/src/icons/FlowerTulip'
import { FlowerLotusIcon } from 'phosphor-react-native/src/icons/FlowerLotus'
import { CatIcon } from 'phosphor-react-native/src/icons/Cat'
import { DogIcon } from 'phosphor-react-native/src/icons/Dog'
import { BirdIcon } from 'phosphor-react-native/src/icons/Bird'
import { ButterflyIcon } from 'phosphor-react-native/src/icons/Butterfly'
import { RabbitIcon } from 'phosphor-react-native/src/icons/Rabbit'
import { HorseIcon } from 'phosphor-react-native/src/icons/Horse'
import { BugIcon } from 'phosphor-react-native/src/icons/Bug'
import { MountainsIcon } from 'phosphor-react-native/src/icons/Mountains'
import { TentIcon } from 'phosphor-react-native/src/icons/Tent'
import { CompassIcon } from 'phosphor-react-native/src/icons/Compass'
import { BicycleIcon } from 'phosphor-react-native/src/icons/Bicycle'
import { PersonSimpleRunIcon } from 'phosphor-react-native/src/icons/PersonSimpleRun'
import { RocketIcon } from 'phosphor-react-native/src/icons/Rocket'
import { PlanetIcon } from 'phosphor-react-native/src/icons/Planet'
import { FireIcon } from 'phosphor-react-native/src/icons/Fire'
import { AnchorIcon } from 'phosphor-react-native/src/icons/Anchor'
import { SailboatIcon } from 'phosphor-react-native/src/icons/Sailboat'
import { LighthouseIcon } from 'phosphor-react-native/src/icons/Lighthouse'
import { IslandIcon } from 'phosphor-react-native/src/icons/Island'
import { WavesIcon } from 'phosphor-react-native/src/icons/Waves'
import { GuitarIcon } from 'phosphor-react-native/src/icons/Guitar'
import { HeadphonesIcon } from 'phosphor-react-native/src/icons/Headphones'
import { MusicNoteIcon } from 'phosphor-react-native/src/icons/MusicNote'
import { PaintBrushIcon } from 'phosphor-react-native/src/icons/PaintBrush'
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera'
import { CardsIcon } from 'phosphor-react-native/src/icons/Cards'
import { PuzzlePieceIcon } from 'phosphor-react-native/src/icons/PuzzlePiece'
import { CrownIcon } from 'phosphor-react-native/src/icons/Crown'
import { DiamondIcon } from 'phosphor-react-native/src/icons/Diamond'
import { SoccerBallIcon } from 'phosphor-react-native/src/icons/SoccerBall'
import { BasketballIcon } from 'phosphor-react-native/src/icons/Basketball'
import { EggIcon } from 'phosphor-react-native/src/icons/Egg'
import { BreadIcon } from 'phosphor-react-native/src/icons/Bread'
import { AvocadoIcon } from 'phosphor-react-native/src/icons/Avocado'
import { PepperIcon } from 'phosphor-react-native/src/icons/Pepper'
import { OrangeIcon } from 'phosphor-react-native/src/icons/Orange'
import { CherriesIcon } from 'phosphor-react-native/src/icons/Cherries'
import { PizzaIcon } from 'phosphor-react-native/src/icons/Pizza'
import { CakeIcon } from 'phosphor-react-native/src/icons/Cake'
import { CookieIcon } from 'phosphor-react-native/src/icons/Cookie'
import { PopcornIcon } from 'phosphor-react-native/src/icons/Popcorn'
import { PottedPlantIcon } from 'phosphor-react-native/src/icons/PottedPlant'
import { CactusIcon } from 'phosphor-react-native/src/icons/Cactus'
import { AcornIcon } from 'phosphor-react-native/src/icons/Acorn'
import { RainbowIcon } from 'phosphor-react-native/src/icons/Rainbow'
import { BalloonIcon } from 'phosphor-react-native/src/icons/Balloon'
import { ConfettiIcon } from 'phosphor-react-native/src/icons/Confetti'
import { FeatherIcon } from 'phosphor-react-native/src/icons/Feather'
import { BookBookmarkIcon } from 'phosphor-react-native/src/icons/BookBookmark'

/**
 * Ícone único do app (Phosphor). Aceita os nomes do Ionicons que o código já usa:
 * 'xxx-outline' desenha o traço regular; 'xxx' desenha o preenchido (aba ativa, estado ligado).
 * Import por arquivo: o Metro não descarta ícones sem uso, e a raiz do pacote traz os 1.500.
 * Os nomes seguem o Ionicons só como tipo; nada do Ionicons é desenhado.
 * Nome sem equivalente desenha um ponto de interrogação neutro e avisa em dev.
 */
const BY_NAME: Record<string, ComponentType<IconProps>> = {
  'col-alien': AlienIcon,
  'col-atom': AtomIcon,
  'col-brain': BrainIcon,
  'col-bug-beetle': BugBeetleIcon,
  'col-campfire': CampfireIcon,
  'col-cow': CowIcon,
  'col-detective': DetectiveIcon,
  'col-dice-five': DiceFiveIcon,
  'col-flask': FlaskIcon,
  'col-ghost': GhostIcon,
  'col-hamburger': HamburgerIcon,
  'col-joystick': JoystickIcon,
  'col-lightbulb': LightbulbIcon,
  'col-magic-wand': MagicWandIcon,
  'col-microphone': MicrophoneIcon,
  'col-moon-stars': MoonStarsIcon,
  'col-piano-keys': PianoKeysIcon,
  'col-popsicle': PopsicleIcon,
  'col-robot': RobotIcon,
  'col-shield': ShieldIcon,
  'col-shooting-star': ShootingStarIcon,
  'col-shrimp': ShrimpIcon,
  'col-smiley-wink': SmileyWinkIcon,
  'col-sun-horizon': SunHorizonIcon,
  'col-sword': SwordIcon,
  'col-tennis-ball': TennisBallIcon,
  'col-tree-palm': TreePalmIcon,
  'col-tree-evergreen': TreeEvergreenIcon,
  'col-umbrella': UmbrellaIcon,
  'col-vinyl-record': VinylRecordIcon,
  'col-yin-yang': YinYangIcon,
  'col-books': BooksIcon,
  'col-student': StudentIcon,
  'col-fish': FishIcon,
  'col-tree': TreeIcon,
  'col-flower': FlowerIcon,
  'col-flower-tulip': FlowerTulipIcon,
  'col-flower-lotus': FlowerLotusIcon,
  'col-cat': CatIcon,
  'col-dog': DogIcon,
  'col-bird': BirdIcon,
  'col-butterfly': ButterflyIcon,
  'col-rabbit': RabbitIcon,
  'col-horse': HorseIcon,
  'col-bug': BugIcon,
  'col-mountains': MountainsIcon,
  'col-tent': TentIcon,
  'col-compass': CompassIcon,
  'col-bicycle': BicycleIcon,
  'col-person-simple-run': PersonSimpleRunIcon,
  'col-rocket': RocketIcon,
  'col-planet': PlanetIcon,
  'col-fire': FireIcon,
  'col-anchor': AnchorIcon,
  'col-sailboat': SailboatIcon,
  'col-lighthouse': LighthouseIcon,
  'col-island': IslandIcon,
  'col-waves': WavesIcon,
  'col-guitar': GuitarIcon,
  'col-headphones': HeadphonesIcon,
  'col-music-note': MusicNoteIcon,
  'col-paint-brush': PaintBrushIcon,
  'col-camera': CameraIcon,
  'col-cards': CardsIcon,
  'col-puzzle-piece': PuzzlePieceIcon,
  'col-crown': CrownIcon,
  'col-diamond': DiamondIcon,
  'col-soccer-ball': SoccerBallIcon,
  'col-basketball': BasketballIcon,
  'col-egg': EggIcon,
  'col-bread': BreadIcon,
  'col-avocado': AvocadoIcon,
  'col-pepper': PepperIcon,
  'col-orange': OrangeIcon,
  'col-cherries': CherriesIcon,
  'col-pizza': PizzaIcon,
  'col-cake': CakeIcon,
  'col-cookie': CookieIcon,
  'col-popcorn': PopcornIcon,
  'col-potted-plant': PottedPlantIcon,
  'col-cactus': CactusIcon,
  'col-acorn': AcornIcon,
  'col-rainbow': RainbowIcon,
  'col-balloon': BalloonIcon,
  'col-confetti': ConfettiIcon,
  'col-feather': FeatherIcon,
  'col-book-bookmark': BookBookmarkIcon,
  accessibility: PersonArmsSpreadIcon,
  add: PlusIcon,
  airplane: AirplaneIcon,
  albums: StackIcon,
  alert: ExclamationMarkIcon,
  'alert-circle': WarningCircleIcon,
  analytics: ChartLineIcon,
  'arrow-up': ArrowUpIcon,
  at: AtIcon,
  'bar-chart': ChartBarIcon,
  barbell: BarbellIcon,
  barcode: BarcodeIcon,
  body: PersonIcon,
  book: BookOpenIcon,
  briefcase: BriefcaseIcon,
  cafe: CoffeeIcon,
  calendar: CalendarBlankIcon,
  call: PhoneIcon,
  car: CarIcon,
  card: CreditCardIcon,
  cart: ShoppingCartIcon,
  cash: MoneyIcon,
  checkbox: CheckSquareIcon,
  checkmark: CheckIcon,
  'checkmark-circle': CheckCircleIcon,
  'chevron-back': CaretLeftIcon,
  'chevron-down': CaretDownIcon,
  'chevron-forward': CaretRightIcon,
  'chevron-up': CaretUpIcon,
  close: XIcon,
  'close-circle': XCircleIcon,
  cloud: CloudIcon,
  cloudy: CloudIcon,
  code: CodeIcon,
  'color-palette': PaletteIcon,
  construct: WrenchIcon,
  create: PencilSimpleIcon,
  'document-text': FileTextIcon,
  download: DownloadSimpleIcon,
  duplicate: CopyIcon,
  ellipse: CircleIcon,
  'ellipsis-horizontal': DotsThreeIcon,
  film: FilmStripIcon,
  fitness: HeartbeatIcon,
  flag: FlagIcon,
  flame: FlameIcon,
  flash: LightningIcon,
  folder: FolderIcon,
  'game-controller': GameControllerIcon,
  gift: GiftIcon,
  'git-branch': GitBranchIcon,
  globe: GlobeIcon,
  grid: SquaresFourIcon,
  happy: SmileyIcon,
  'hardware-chip': CpuIcon,
  heart: HeartIcon,
  help: QuestionIcon,
  'help-circle': QuestionIcon,
  home: HouseIcon,
  'ice-cream': IceCreamIcon,
  'information-circle': InfoIcon,
  key: KeyIcon,
  leaf: LeafIcon,
  link: LinkIcon,
  list: ListIcon,
  location: MapPinIcon,
  'lock-closed': LockIcon,
  mail: EnvelopeIcon,
  medal: MedalIcon,
  medical: FirstAidIcon,
  medkit: FirstAidKitIcon,
  moon: MoonIcon,
  'musical-notes': MusicNotesIcon,
  notifications: BellIcon,
  nutrition: CarrotIcon,
  open: ArrowSquareOutIcon,
  options: SlidersHorizontalIcon,
  'partly-sunny': CloudSunIcon,
  pause: PauseIcon,
  'pause-circle': PauseCircleIcon,
  paw: PawPrintIcon,
  pencil: PencilIcon,
  people: UsersIcon,
  'person-add': UserPlusIcon,
  person: UserIcon,
  'phone-portrait': DeviceMobileIcon,
  play: PlayIcon,
  pricetag: TagIcon,
  pulse: PulseIcon,
  push: PushPinIcon,
  rainy: CloudRainIcon,
  receipt: ReceiptIcon,
  remove: MinusIcon,
  repeat: RepeatIcon,
  restaurant: ForkKnifeIcon,
  sad: SmileySadIcon,
  school: GraduationCapIcon,
  search: MagnifyingGlassIcon,
  send: PaperPlaneRightIcon,
  settings: GearIcon,
  'shield-checkmark': ShieldCheckIcon,
  snow: SnowflakeIcon,
  sparkles: SparkleIcon,
  square: SquareIcon,
  star: StarIcon,
  'stats-chart': ChartBarIcon,
  sunny: SunIcon,
  'swap-horizontal': ArrowsLeftRightIcon,
  'swap-vertical': ArrowsDownUpIcon,
  thunderstorm: CloudLightningIcon,
  time: ClockIcon,
  /** Histórico (relógio voltando): decisões, registros anteriores */
  reload: ClockCounterClockwiseIcon,
  /** Adiado, ficou para depois */
  'return-down-forward': ArrowBendDownRightIcon,
  /** Compartilhar ou exportar */
  share: ExportIcon,
  timer: TimerIcon,
  today: CalendarCheckIcon,
  trash: TrashIcon,
  'trending-up': TrendUpIcon,
  trophy: TrophyIcon,
  'volume-mute': SpeakerSlashIcon,
  wallet: WalletIcon,
  warning: WarningIcon,
  watch: WatchIcon,
  water: DropIcon,
}

/** Glifos que já são só traço (setas, x, +): o nome sem '-outline' não vira preenchido */
const STROKE_ONLY = new Set(['add', 'alert', 'arrow-up', 'at', 'checkmark', 'chevron-back', 'chevron-down', 'chevron-forward', 'chevron-up', 'close', 'code', 'ellipsis-horizontal', 'link', 'list', 'open', 'options', 'remove', 'repeat', 'search', 'swap-horizontal', 'swap-vertical', 'trending-up', 'pulse', 'analytics'])

export type IconName = keyof typeof Ionicons.glyphMap

type Props = {
  name: IconName
  size?: number
  color?: string
  /** Força um peso da Phosphor (ex.: 'duotone' em telas vazias e no Acalmar) */
  weight?: IconWeight
  style?: StyleProp<ViewStyle>
}

export function Icon({ name, size = 24, color, weight, style }: Props)
{
  const outline = name.endsWith('-outline')
  const base = outline ? name.slice(0, -'-outline'.length) : name
  const Glyph = BY_NAME[base]
  if (!Glyph)
  {
    if (__DEV__) console.warn(`[Icon] sem equivalente Phosphor para "${name}"`)
    return <QuestionIcon size={size} color={color} weight={weight ?? 'regular'} style={style} />
  }
  const w: IconWeight = weight ?? (outline || STROKE_ONLY.has(base) ? 'regular' : 'fill')
  return <Glyph size={size} color={color} weight={w} style={style} />
}

/**
 * Só para tipos: mantém 'keyof typeof Icon.glyphMap' funcionando nos mapas existentes
 * sem carregar a fonte do Ionicons. Não use em runtime (é um objeto vazio).
 */
Icon.glyphMap = {} as Readonly<Record<IconName, number>>
