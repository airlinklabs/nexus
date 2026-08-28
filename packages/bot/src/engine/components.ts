import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle as DjsButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
} from 'discord.js';
import type { BaseMessageOptions } from 'discord.js';
import type { UIDefinition, ButtonDef, SelectMenuDef, ComponentDef } from 'shared/ui-types';

const BUTTON_STYLE_MAP: Record<NonNullable<ButtonDef['style']>, DjsButtonStyle> = {
  primary: DjsButtonStyle.Primary,
  secondary: DjsButtonStyle.Secondary,
  success: DjsButtonStyle.Success,
  danger: DjsButtonStyle.Danger,
  link: DjsButtonStyle.Link,
};

function buildButton(def: ButtonDef): ButtonBuilder {
  const btn = new ButtonBuilder()
    .setLabel(def.label)
    .setStyle(BUTTON_STYLE_MAP[def.style]);

  if (def.style === 'link' && def.url !== undefined) {
    btn.setURL(def.url);
  } else {
    btn.setCustomId(def.id);
  }

  if (def.emoji !== undefined) btn.setEmoji(def.emoji);
  if (def.disabled === true) btn.setDisabled(true);

  return btn;
}

function buildSelect(def: SelectMenuDef): StringSelectMenuBuilder {
  const select = new StringSelectMenuBuilder()
    .setCustomId(def.id)
    .setPlaceholder(def.placeholder)
    .setMinValues(def.minValues ?? 1)
    .setMaxValues(def.maxValues ?? 1);

  const options = def.options.map((opt) => {
    const o = new StringSelectMenuOptionBuilder()
      .setValue(opt.value)
      .setLabel(opt.label);
    if (opt.description !== undefined) o.setDescription(opt.description);
    if (opt.emoji !== undefined) o.setEmoji(opt.emoji);
    if (opt.default === true) o.setDefault(true);
    return o;
  });

  select.addOptions(options);
  return select;
}

function buildComponent(def: ComponentDef): ButtonBuilder | StringSelectMenuBuilder {
  if (def.type === 'button') return buildButton(def);
  return buildSelect(def);
}

function buildRow(
  defs: ReadonlyArray<ComponentDef>,
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>();
  row.addComponents(defs.map(buildComponent));
  return row;
}

export function buildMessageOptions(definition: UIDefinition): BaseMessageOptions {
  const options: BaseMessageOptions = {};

  if (definition.embeds !== undefined && definition.embeds.length > 0) {
    options.embeds = definition.embeds.map((e) => new EmbedBuilder(e));
  }

  const rows = definition.components ?? [];
  if (rows.length > 0) {
    Object.assign(options, { components: rows.map(buildRow) });
  }

  return options;
}

export function buildPageOptions(
  definition: UIDefinition,
  pageIndex: number,
): BaseMessageOptions {
  const pages = definition.pages;
  if (pages === undefined || pages.length === 0) {
    throw new Error('buildPageOptions called on a definition with no pages');
  }

  const page = pages[pageIndex];
  if (page === undefined) {
    throw new Error(`Page index ${pageIndex} out of bounds (${pages.length} pages)`);
  }

  const pageDef: UIDefinition = {
    meta: definition.meta,
    embeds: [page.embed],
    ...(page.components !== undefined ? { components: page.components } : {}),
    ...(definition.initialState !== undefined ? { initialState: definition.initialState } : {}),
    ...(definition.handlers !== undefined ? { handlers: definition.handlers } : {}),
    ...(definition.modals !== undefined ? { modals: definition.modals } : {}),
  };

  return buildMessageOptions(pageDef);
}
