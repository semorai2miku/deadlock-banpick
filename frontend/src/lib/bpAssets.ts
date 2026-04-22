const bpBackgroundUrl = new URL("../../../assets/Background/Bp-Background.png", import.meta.url).href;
const hiddenKingUrl = new URL("../../../assets/Background/HiddenKing.png", import.meta.url).href;
const archMotherUrl = new URL("../../../assets/Background/Arch Mother.png", import.meta.url).href;
const cardBackerUrl = new URL(
  "../../../assets/UiDownloads/BpBackgrounds/main_menu_pick_screen_card_backer_png.png",
  import.meta.url,
).href;
const cardBorderUrl = new URL(
  "../../../assets/UiDownloads/BpBackgrounds/main_menu_pick_screen_card_border_png.png",
  import.meta.url,
).href;

const heroIcons = {
  Abrams: new URL("../../../assets/HeroIcon/Abrams_icon.png", import.meta.url).href,
  Apollo: new URL("../../../assets/HeroIcon/Apollo_icon.png", import.meta.url).href,
  Bebop: new URL("../../../assets/HeroIcon/Bebop_icon.png", import.meta.url).href,
  Billy: new URL("../../../assets/HeroIcon/Billy_icon.png", import.meta.url).href,
  Calico: new URL("../../../assets/HeroIcon/Calico_icon.png", import.meta.url).href,
  Celeste: new URL("../../../assets/HeroIcon/Celeste_icon.png", import.meta.url).href,
  Drifter: new URL("../../../assets/HeroIcon/Drifter_icon.png", import.meta.url).href,
  Dynamo: new URL("../../../assets/HeroIcon/Dynamo_icon.png", import.meta.url).href,
  Graves: new URL("../../../assets/HeroIcon/Graves_icon.png", import.meta.url).href,
  Grey_Talon: new URL("../../../assets/HeroIcon/Grey_Talon_icon.png", import.meta.url).href,
  Haze: new URL("../../../assets/HeroIcon/Haze_icon.png", import.meta.url).href,
  Holliday: new URL("../../../assets/HeroIcon/Holliday_icon.png", import.meta.url).href,
  Infernus: new URL("../../../assets/HeroIcon/Infernus_icon.png", import.meta.url).href,
  Ivy: new URL("../../../assets/HeroIcon/Ivy_icon.png", import.meta.url).href,
  Kelvin: new URL("../../../assets/HeroIcon/Kelvin_icon.png", import.meta.url).href,
  Lady_Geist: new URL("../../../assets/HeroIcon/Lady_Geist_icon.png", import.meta.url).href,
  Lash: new URL("../../../assets/HeroIcon/Lash_icon.png", import.meta.url).href,
  McGinnis: new URL("../../../assets/HeroIcon/McGinnis_icon.png", import.meta.url).href,
  Mina: new URL("../../../assets/HeroIcon/Mina_icon.png", import.meta.url).href,
  Mirage: new URL("../../../assets/HeroIcon/Mirage_icon.png", import.meta.url).href,
  Mo_And_Krill: new URL("../../../assets/HeroIcon/Mo_&_Krill_icon.png", import.meta.url).href,
  Paige: new URL("../../../assets/HeroIcon/Paige_icon.png", import.meta.url).href,
  Paradox: new URL("../../../assets/HeroIcon/Paradox_icon.png", import.meta.url).href,
  Pocket: new URL("../../../assets/HeroIcon/Pocket_icon.png", import.meta.url).href,
  Rem: new URL("../../../assets/HeroIcon/Rem_icon.png", import.meta.url).href,
  Seven: new URL("../../../assets/HeroIcon/Seven_icon.png", import.meta.url).href,
  Shiv: new URL("../../../assets/HeroIcon/Shiv_icon.png", import.meta.url).href,
  Silver: new URL("../../../assets/HeroIcon/Silver_icon.png", import.meta.url).href,
  Sinclair: new URL("../../../assets/HeroIcon/Sinclair_icon.png", import.meta.url).href,
  The_Doorman: new URL("../../../assets/HeroIcon/The_Doorman_icon.png", import.meta.url).href,
  Venator: new URL("../../../assets/HeroIcon/Venator_icon.png", import.meta.url).href,
  Victor: new URL("../../../assets/HeroIcon/Victor_icon.png", import.meta.url).href,
  Vindicta: new URL("../../../assets/HeroIcon/Vindicta_icon.png", import.meta.url).href,
  Viscous: new URL("../../../assets/HeroIcon/Viscous_icon.png", import.meta.url).href,
  Vyper: new URL("../../../assets/HeroIcon/Vyper_icon.png", import.meta.url).href,
  Warden: new URL("../../../assets/HeroIcon/Warden_icon.png", import.meta.url).href,
  Wraith: new URL("../../../assets/HeroIcon/Wraith_icon.png", import.meta.url).href,
  Yamato: new URL("../../../assets/HeroIcon/Yamato_icon.png", import.meta.url).href,
} as const;

const heroRenders = {
  Abrams: new URL("../../../assets/HeroRender/Abrams_Render.png", import.meta.url).href,
  Apollo: new URL("../../../assets/HeroRender/Apollo_Render.png", import.meta.url).href,
  Bebop: new URL("../../../assets/HeroRender/Bebop_Render.png", import.meta.url).href,
  Billy: new URL("../../../assets/HeroRender/Billy_Render.png", import.meta.url).href,
  Calico: new URL("../../../assets/HeroRender/Calico_Render.png", import.meta.url).href,
  Celeste: new URL("../../../assets/HeroRender/Celeste_Render.png", import.meta.url).href,
  Drifter: new URL("../../../assets/HeroRender/Drifter_Render.png", import.meta.url).href,
  Dynamo: new URL("../../../assets/HeroRender/Dynamo_Render.png", import.meta.url).href,
  Graves: new URL("../../../assets/HeroRender/Graves_Render.png", import.meta.url).href,
  Grey_Talon: new URL("../../../assets/HeroRender/Grey_Talon_Render.png", import.meta.url).href,
  Haze: new URL("../../../assets/HeroRender/Haze_Render.png", import.meta.url).href,
  Holliday: new URL("../../../assets/HeroRender/Holliday_Render.png", import.meta.url).href,
  Infernus: new URL("../../../assets/HeroRender/Infernus_Render.png", import.meta.url).href,
  Ivy: new URL("../../../assets/HeroRender/Ivy_Render.png", import.meta.url).href,
  Kelvin: new URL("../../../assets/HeroRender/Kelvin_Render.png", import.meta.url).href,
  Lady_Geist: new URL("../../../assets/HeroRender/Lady_Geist_Render.png", import.meta.url).href,
  Lash: new URL("../../../assets/HeroRender/Lash_Render.png", import.meta.url).href,
  McGinnis: new URL("../../../assets/HeroRender/McGinnis_Render.png", import.meta.url).href,
  Mina: new URL("../../../assets/HeroRender/Mina_Render.png", import.meta.url).href,
  Mirage: new URL("../../../assets/HeroRender/Mirage_Render.png", import.meta.url).href,
  Mo_And_Krill: new URL("../../../assets/HeroRender/Mo_&_Krill_Render.png", import.meta.url).href,
  Paige: new URL("../../../assets/HeroRender/Paige_Render.png", import.meta.url).href,
  Paradox: new URL("../../../assets/HeroRender/Paradox_Render.png", import.meta.url).href,
  Pocket: new URL("../../../assets/HeroRender/Pocket_Render.png", import.meta.url).href,
  Rem: new URL("../../../assets/HeroRender/Rem_Render.png", import.meta.url).href,
  Seven: new URL("../../../assets/HeroRender/Seven_Render.png", import.meta.url).href,
  Shiv: new URL("../../../assets/HeroRender/Shiv_Render.png", import.meta.url).href,
  Silver: new URL("../../../assets/HeroRender/Silver_Render.png", import.meta.url).href,
  Sinclair: new URL("../../../assets/HeroRender/Sinclair_Render.png", import.meta.url).href,
  The_Doorman: new URL("../../../assets/HeroRender/The_Doorman_Render.png", import.meta.url).href,
  Venator: new URL("../../../assets/HeroRender/Venator_Render.png", import.meta.url).href,
  Victor: new URL("../../../assets/HeroRender/Victor_Render.png", import.meta.url).href,
  Vindicta: new URL("../../../assets/HeroRender/Vindicta_Render.png", import.meta.url).href,
  Viscous: new URL("../../../assets/HeroRender/Viscous_Render.png", import.meta.url).href,
  Vyper: new URL("../../../assets/HeroRender/Vyper_Render.png", import.meta.url).href,
  Warden: new URL("../../../assets/HeroRender/Warden_Render.png", import.meta.url).href,
  Wraith: new URL("../../../assets/HeroRender/Wraith_Render.png", import.meta.url).href,
  Yamato: new URL("../../../assets/HeroRender/Yamato_Render.png", import.meta.url).href,
} as const;

const heroNameImages = {
  Abrams: new URL("../../../assets/HeroName/Abrams_name.png", import.meta.url).href,
  Apollo: new URL("../../../assets/HeroName/Apollo_name.png", import.meta.url).href,
  Bebop: new URL("../../../assets/HeroName/Bebop_name.png", import.meta.url).href,
  Billy: new URL("../../../assets/HeroName/Billy_name.png", import.meta.url).href,
  Calico: new URL("../../../assets/HeroName/Calico_name.png", import.meta.url).href,
  Celeste: new URL("../../../assets/HeroName/Celeste_name.png", import.meta.url).href,
  Drifter: new URL("../../../assets/HeroName/Drifter_name.png", import.meta.url).href,
  Dynamo: new URL("../../../assets/HeroName/Dynamo_name.png", import.meta.url).href,
  Graves: new URL("../../../assets/HeroName/Graves_name.png", import.meta.url).href,
  Grey_Talon: new URL("../../../assets/HeroName/Grey_Talon_name.png", import.meta.url).href,
  Haze: new URL("../../../assets/HeroName/Haze_name.png", import.meta.url).href,
  Holliday: new URL("../../../assets/HeroName/Holliday_name.png", import.meta.url).href,
  Infernus: new URL("../../../assets/HeroName/Infernus_name.png", import.meta.url).href,
  Ivy: new URL("../../../assets/HeroName/Ivy_name.png", import.meta.url).href,
  Kelvin: new URL("../../../assets/HeroName/Kelvin_name.png", import.meta.url).href,
  Lady_Geist: new URL("../../../assets/HeroName/Lady_Geist_name.png", import.meta.url).href,
  Lash: new URL("../../../assets/HeroName/Lash_name.png", import.meta.url).href,
  McGinnis: new URL("../../../assets/HeroName/McGinnis_name.png", import.meta.url).href,
  Mina: new URL("../../../assets/HeroName/Mina_name.png", import.meta.url).href,
  Mirage: new URL("../../../assets/HeroName/Mirage_name.png", import.meta.url).href,
  Mo_And_Krill: new URL("../../../assets/HeroName/Mo_&_Krill_name.png", import.meta.url).href,
  Paige: new URL("../../../assets/HeroName/Paige_name.png", import.meta.url).href,
  Paradox: new URL("../../../assets/HeroName/Paradox_name.png", import.meta.url).href,
  Pocket: new URL("../../../assets/HeroName/Pocket_name.png", import.meta.url).href,
  Rem: new URL("../../../assets/HeroName/Rem_name.png", import.meta.url).href,
  Seven: new URL("../../../assets/HeroName/Seven_name.png", import.meta.url).href,
  Shiv: new URL("../../../assets/HeroName/Shiv_name.png", import.meta.url).href,
  Silver: new URL("../../../assets/HeroName/Silver_name.png", import.meta.url).href,
  Sinclair: new URL("../../../assets/HeroName/Sinclair_name.png", import.meta.url).href,
  The_Doorman: new URL("../../../assets/HeroName/The_Doorman_name.png", import.meta.url).href,
  Venator: new URL("../../../assets/HeroName/Venator_name.png", import.meta.url).href,
  Victor: new URL("../../../assets/HeroName/Victor_name.png", import.meta.url).href,
  Vindicta: new URL("../../../assets/HeroName/Vindicta_name.png", import.meta.url).href,
  Viscous: new URL("../../../assets/HeroName/Viscous_name.png", import.meta.url).href,
  Vyper: new URL("../../../assets/HeroName/Vyper_name.png", import.meta.url).href,
  Warden: new URL("../../../assets/HeroName/Warden_name.png", import.meta.url).href,
  Wraith: new URL("../../../assets/HeroName/Wraith_name.png", import.meta.url).href,
  Yamato: new URL("../../../assets/HeroName/Yamato_name.png", import.meta.url).href,
} as const;

const heroCards = {
  Abrams: new URL("../../../assets/HeroCard/Abrams_card.png", import.meta.url).href,
  Apollo: new URL("../../../assets/HeroCard/Apollo_card.png", import.meta.url).href,
  Bebop: new URL("../../../assets/HeroCard/Bebop_card.png", import.meta.url).href,
  Billy: new URL("../../../assets/HeroCard/Billy_card.png", import.meta.url).href,
  Calico: new URL("../../../assets/HeroCard/Calico_card.png", import.meta.url).href,
  Celeste: new URL("../../../assets/HeroCard/Celeste_card.png", import.meta.url).href,
  Drifter: new URL("../../../assets/HeroCard/Andarilho_card.png", import.meta.url).href,
  Dynamo: new URL("../../../assets/HeroCard/Dínamo_card.png", import.meta.url).href,
  Graves: new URL("../../../assets/HeroCard/Mortícia_card.png", import.meta.url).href,
  Grey_Talon: new URL("../../../assets/HeroCard/Garra_Cinza_card.png", import.meta.url).href,
  Haze: new URL("../../../assets/HeroCard/Bruma_card.png", import.meta.url).href,
  Holliday: new URL("../../../assets/HeroCard/Holliday_card.png", import.meta.url).href,
  Infernus: new URL("../../../assets/HeroCard/Inferno_card.png", import.meta.url).href,
  Ivy: new URL("../../../assets/HeroCard/Hera_card.png", import.meta.url).href,
  Kelvin: new URL("../../../assets/HeroCard/Kelvin_card.png", import.meta.url).href,
  Lady_Geist: new URL("../../../assets/HeroCard/Lady_Geist_card.png", import.meta.url).href,
  Lash: new URL("../../../assets/HeroCard/Chico_card.png", import.meta.url).href,
  McGinnis: new URL("../../../assets/HeroCard/McGinnis_card.png", import.meta.url).href,
  Mina: new URL("../../../assets/HeroCard/Mina_card.png", import.meta.url).href,
  Mirage: new URL("../../../assets/HeroCard/Miragem_card.png", import.meta.url).href,
  Mo_And_Krill: new URL("../../../assets/HeroCard/Mo_e_Krill_card.png", import.meta.url).href,
  Paige: new URL("../../../assets/HeroCard/Gina_card.png", import.meta.url).href,
  Paradox: new URL("../../../assets/HeroCard/Paradoxa_card.png", import.meta.url).href,
  Pocket: new URL("../../../assets/HeroCard/Mala_card.png", import.meta.url).href,
  Rem: new URL("../../../assets/HeroCard/Rem_card.png", import.meta.url).href,
  Seven: new URL("../../../assets/HeroCard/Sete_card.png", import.meta.url).href,
  Shiv: new URL("../../../assets/HeroCard/Adaga_card.png", import.meta.url).href,
  Silver: new URL("../../../assets/HeroCard/Prata_card.png", import.meta.url).href,
  Sinclair: new URL("../../../assets/HeroCard/Sinclair_card.png", import.meta.url).href,
  The_Doorman: new URL("../../../assets/HeroCard/Porteiro_card.png", import.meta.url).href,
  Venator: new URL("../../../assets/HeroCard/Venador_card.png", import.meta.url).href,
  Victor: new URL("../../../assets/HeroCard/Victor_card.png", import.meta.url).href,
  Vindicta: new URL("../../../assets/HeroCard/Vindicta_card.png", import.meta.url).href,
  Viscous: new URL("../../../assets/HeroCard/Viscoso_card.png", import.meta.url).href,
  Vyper: new URL("../../../assets/HeroCard/Víbora_card.png", import.meta.url).href,
  Warden: new URL("../../../assets/HeroCard/Guarda_card.png", import.meta.url).href,
  Wraith: new URL("../../../assets/HeroCard/Espectra_card.png", import.meta.url).href,
  Yamato: new URL("../../../assets/HeroCard/Yamato_card.png", import.meta.url).href,
} as const;

const aliasByHeroName: Record<string, keyof typeof heroIcons> = {
  Abrams: "Abrams",
  Apollo: "Apollo",
  Bebop: "Bebop",
  Billy: "Billy",
  Calico: "Calico",
  Celeste: "Celeste",
  Drifter: "Drifter",
  Dynamo: "Dynamo",
  Graves: "Graves",
  "Grey Talon": "Grey_Talon",
  Haze: "Haze",
  Holliday: "Holliday",
  Inferno: "Infernus",
  Infernus: "Infernus",
  Ivy: "Ivy",
  Kelvin: "Kelvin",
  "Lady Geist": "Lady_Geist",
  Lash: "Lash",
  McGinnis: "McGinnis",
  Mina: "Mina",
  Mirage: "Mirage",
  "Mo & Krill": "Mo_And_Krill",
  Paige: "Paige",
  Paradox: "Paradox",
  Pocket: "Pocket",
  Rem: "Rem",
  Seven: "Seven",
  Shiv: "Shiv",
  Silver: "Silver",
  Sinclair: "Sinclair",
  "The Doorman": "The_Doorman",
  Venator: "Venator",
  Victor: "Victor",
  Vindicta: "Vindicta",
  Viscous: "Viscous",
  Vyper: "Vyper",
  Warden: "Warden",
  Wraith: "Wraith",
  Yamato: "Yamato",
};

function getHeroKey(heroName: string) {
  return aliasByHeroName[heroName] ?? null;
}

export function getHeroIconUrl(heroName: string) {
  const key = getHeroKey(heroName);
  return key ? heroIcons[key] : "";
}

export function getHeroRenderUrl(heroName: string) {
  const key = getHeroKey(heroName);
  return key ? heroRenders[key] : "";
}

export function getHeroNameImageUrl(heroName: string) {
  const key = getHeroKey(heroName);
  return key ? heroNameImages[key] : "";
}

export function getHeroCardUrl(heroName: string) {
  const key = getHeroKey(heroName);
  return key ? heroCards[key] : "";
}

export {
  archMotherUrl,
  bpBackgroundUrl,
  cardBackerUrl,
  cardBorderUrl,
  hiddenKingUrl,
};
